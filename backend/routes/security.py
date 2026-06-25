import httpx
from fastapi import APIRouter, HTTPException, status
from loguru import logger

from core.exceptions import ValidationError, APIError
from models.schemas import GitHubRepoRequest
from models.security_models import SecurityAnalysisResponse
from services.github import GitHubService
from services.security_analyzer import SecurityAnalyzer

router = APIRouter()

@router.post("/security/analyze", response_model=SecurityAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_repository_security(request: GitHubRepoRequest):
    """
    Endpoint to trigger static code security analysis on a GitHub repository.
    
    Parses the repository URL, fetches the default branch and recursive file tree metadata, 
    and runs the SecurityAnalyzer to detect security risks.
    """
    logger.info(f"Received security analysis request for URL: {request.url}")

    if not request.url or not request.url.strip():
        logger.error("Security analysis request failed: URL is empty")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Repository URL must be a non-empty string"
        )

    github_service = GitHubService()

    try:
        # Step 1: Parse Owner & Repo Name from URL
        owner, repo = github_service.parse_url(request.url)
        logger.info(f"Successfully parsed owner: {owner}, repo: {repo} from request URL")

        # Step 2: Fetch Repository Metadata and File Tree
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                # Fetch basic repository metadata to extract the default branch
                metadata = await github_service._get(client, f"/repos/{owner}/{repo}")
                default_branch = metadata.get("default_branch", "main")
                logger.info(f"Fetched repo metadata. Default branch: {default_branch}")
            except APIError as e:
                logger.error(f"GitHub API Error when fetching metadata for {owner}/{repo}: {e.message}")
                raise HTTPException(
                    status_code=e.status_code, 
                    detail=f"Error accessing repository metadata: {e.message}"
                )

            try:
                # Fetch the recursive file tree for the default branch
                tree_data = await github_service._get(
                    client, 
                    f"/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
                )
                tree = tree_data.get("tree", [])
                logger.info(f"Fetched repository tree containing {len(tree)} files")
            except APIError as e:
                logger.error(f"GitHub API Error when fetching file tree for {owner}/{repo}: {e.message}")
                raise HTTPException(
                    status_code=e.status_code, 
                    detail=f"Error accessing repository file tree: {e.message}"
                )

        # Step 3: Run the Security Analyzer
        logger.info(f"Initializing SecurityAnalyzer for {owner}/{repo} ({default_branch})")
        analyzer = SecurityAnalyzer(owner=owner, repo=repo, default_branch=default_branch)
        analysis_result = await analyzer.analyze(tree)

        # Step 4: Enrich with AI explanations using Llama 3.1
        try:
            from services.security_ai import SecurityAIService
            logger.info("Enriching security report with AI explanations...")
            ai_service = SecurityAIService()
            analysis_result = await ai_service.enrich_security_analysis(analysis_result)
        except Exception as e:
            logger.warning(f"AI security explanation enrichment skipped due to error: {str(e)}")

        logger.info(
            f"Security analysis for {owner}/{repo} completed. "
            f"Score: {analysis_result.security_summary.security_score}, "
            f"Total issues: {analysis_result.security_summary.total_issues}"
        )
        return analysis_result

    except ValidationError as e:
        logger.warning(f"Validation error for URL '{request.url}': {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=e.message
        )
    except APIError as e:
        logger.error(f"GitHub API Error occurred during security analysis of {request.url}: {e.message}")
        raise HTTPException(
            status_code=e.status_code, 
            detail=e.message
        )
    except HTTPException as e:
        # Re-raise fastAPI HTTPExceptions directly
        raise e
    except Exception as e:
        logger.exception(f"Unexpected error during security analysis of {request.url}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"An unexpected server error occurred: {str(e)}"
        )
