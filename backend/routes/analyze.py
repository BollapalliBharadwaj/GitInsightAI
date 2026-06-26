from fastapi import APIRouter, HTTPException, status, Depends, Request
from loguru import logger

from core.exceptions import ValidationError, APIError
from models.schemas import APIResponse, GitHubRepoRequest, GitHubRepoData, AITestRequest
from services.github import GitHubService
from services.ai import AIService
from agents.graph import analysis_graph
from database.connection import get_database
from utils.rate_limit import rate_limiter

router = APIRouter()
github_service = GitHubService()
ai_service = AIService()

@router.post("/analyze", response_model=APIResponse, dependencies=[Depends(rate_limiter)])
async def analyze_repository(request: GitHubRepoRequest, db = Depends(get_database)):
    """
    Endpoint to trigger complete repository analysis.
    Fetches base metadata and executes the LangGraph multi-agent pipeline
    to generate Tech Stack, Architecture, Features, Security, Contributor Resume,
    Technical Q&A, and Consolidated Roadmap recommendations.
    """
    logger.info(f"Received multi-agent analysis request for: {request.url}")
    
    if not request.url or not request.url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Repository URL must be a non-empty string"
        )
        
    try:
        # Step 1: Fetch base repository metadata and file tree (uses TTL Cache check)
        logger.info("Fetching repository metadata and tree...")
        repo_data = await github_service.fetch_repo_data(request.url)
        
        # Parse contributor details to dictionary formats for state transport
        contributors_list = [
            {
                "login": c.login,
                "contributions": c.contributions,
                "avatar_url": c.avatar_url
            }
            for c in repo_data.contributors
        ]
        
        # Step 2: Initialize LangGraph Analysis State
        initial_state = {
            "repo_url": request.url,
            "owner": repo_data.owner,
            "repo_name": repo_data.repo,
            "default_branch": "main",  # Will fallback inside node if different
            "file_paths": [item.get("path", "") for item in repo_data.tree],
            "tree_raw": repo_data.tree,
            "languages": repo_data.languages,
            "contributors": contributors_list,
            "tech_stack_data": repo_data.tech_stack.model_dump(),
            "security_report": {},
            "architecture_report": None,
            "feature_report": None,
            "resume_report": None,
            "interview_report": None,
            "recommendation_report": None
        }
        
        # Step 3: Run the Compiled Graph Node Executors
        logger.info("Executing LangGraph analysis pipeline graph...")
        final_state = await analysis_graph.ainvoke(initial_state)
        logger.info("LangGraph pipeline successfully completed execution.")
        
        # Step 4: Populate results inside the schemas return payload
        repo_data.security_report = final_state.get("security_report")
        repo_data.architecture_report = final_state.get("architecture_report")
        repo_data.feature_report = final_state.get("feature_report")
        repo_data.resume_report = final_state.get("resume_report")
        repo_data.interview_report = final_state.get("interview_report")
        repo_data.recommendation_report = final_state.get("recommendation_report")
        
        # Step 5: Save to Database for History Tracking
        try:
            # 1. Insert/Update Repository
            primary_lang = "Unknown"
            if repo_data.languages:
                primary_lang = max(repo_data.languages, key=repo_data.languages.get)
                
            cursor = await db.cursor()
            await cursor.execute(
                """
                INSERT INTO repositories (full_name, owner, name, description, stars, forks, language, url, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(full_name) DO UPDATE SET
                    description=excluded.description,
                    stars=excluded.stars,
                    forks=excluded.forks,
                    language=excluded.language,
                    updated_at=CURRENT_TIMESTAMP
                """,
                (
                    f"{repo_data.owner}/{repo_data.repo}",
                    repo_data.owner,
                    repo_data.repo,
                    repo_data.description or "",
                    repo_data.stars,
                    repo_data.forks,
                    primary_lang,
                    request.url,
                )
            )
            
            # Get Repository ID
            await cursor.execute("SELECT id FROM repositories WHERE full_name = ?", (f"{repo_data.owner}/{repo_data.repo}",))
            row = await cursor.fetchone()
            repo_id = row["id"]
            
            # 2. Insert Analysis
            sec_summary = repo_data.security_report.get("security_summary", {}) if repo_data.security_report else {}
            overall_score = sec_summary.get("security_score", 90)
            
            summary_text = f"Analyzed repository {repo_data.owner}/{repo_data.repo}. Primary language: {primary_lang}. Score: {overall_score}."
            
            await cursor.execute(
                """
                INSERT INTO analyses (repository_id, status, overall_score, summary, completed_at)
                VALUES (?, 'success', ?, ?, CURRENT_TIMESTAMP)
                """,
                (repo_id, overall_score, summary_text)
            )
            analysis_id = cursor.lastrowid
            
            # 3. Insert Agent Results
            agents_to_save = [
                ("architecture", repo_data.architecture_report),
                ("feature", repo_data.feature_report),
                ("resume", repo_data.resume_report),
                ("interview", repo_data.interview_report),
                ("recommendation", repo_data.recommendation_report),
            ]
            
            for agent_name, report in agents_to_save:
                if report:
                    await cursor.execute(
                        """
                        INSERT INTO agent_results (analysis_id, agent_name, findings)
                        VALUES (?, ?, ?)
                        """,
                        (analysis_id, agent_name, report)
                    )
            await db.commit()
            logger.info(f"Analysis saved to database with id {analysis_id}")
        except Exception as db_err:
            logger.error(f"Failed to save analysis to database: {str(db_err)}")

        return APIResponse(
            success=True,
            message="Repository analyzed successfully using LangGraph pipeline",
            data=repo_data.model_dump()
        )
        
    except ValidationError as e:
        logger.warning(f"Validation error for URL '{request.url}': {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except APIError as e:
        logger.error(f"GitHub API Error occurred during analysis of {request.url}: {e.message}")
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception(f"Failed to execute multi-agent analysis for {request.url}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline error: {str(e)}"
        )

@router.post("/test-ai", response_model=APIResponse)
async def test_ai(request: AITestRequest):
    """
    Endpoint to test connection with local Ollama instance.
    """
    response_text = await ai_service.generate_response(
        prompt=request.prompt,
        system_prompt=request.system_prompt
    )
    return APIResponse(
        success=True,
        message="AI response generated successfully",
        data={"response": response_text}
    )

@router.get("/history", response_model=APIResponse)
async def get_history(db = Depends(get_database)):
    """
    Retrieves the list of previously analyzed repositories from the database.
    """
    try:
        cursor = await db.execute(
            """
            SELECT 
                r.id as repo_id,
                r.full_name,
                r.owner,
                r.name,
                r.description,
                r.stars,
                r.forks,
                r.language,
                r.url,
                a.id as analysis_id,
                a.overall_score,
                a.summary,
                a.completed_at
            FROM repositories r
            JOIN analyses a ON r.id = a.repository_id
            WHERE a.status = 'success'
            ORDER BY a.completed_at DESC
            """
        )
        rows = await cursor.fetchall()
        
        history_list = []
        for row in rows:
            history_list.append({
                "id": row["repo_id"],
                "name": row["full_name"],
                "owner": row["owner"],
                "repo": row["name"],
                "description": row["description"],
                "stars": row["stars"],
                "forks": row["forks"],
                "lang": row["language"],
                "url": row["url"],
                "analysis_id": row["analysis_id"],
                "score": row["overall_score"],
                "summary": row["summary"],
                "lastRun": row["completed_at"]
            })
            
        return APIResponse(
            success=True,
            message="History retrieved successfully",
            data=history_list
        )
    except Exception as e:
        logger.exception("Failed to retrieve analysis history")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve history: {str(e)}"
        )
