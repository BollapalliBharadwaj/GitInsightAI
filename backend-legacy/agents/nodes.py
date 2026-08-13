from typing import Dict, Any
import json
from loguru import logger

from services.github import GitHubService
from services.detector import TechStackDetector
from services.security_analyzer import SecurityAnalyzer
from services.security_ai import SecurityAIService
from services.ai import AIService

from core.exceptions import APIError
from agents.state import AnalysisState
from prompts.agent_prompts import (
    ARCHITECTURE_AGENT_PROMPT,
    FEATURE_AGENT_PROMPT,
    RESUME_AGENT_PROMPT,
    INTERVIEW_AGENT_PROMPT,
    RECOMMENDATION_AGENT_PROMPT
)

# Shared AI Client instance
ai_client = AIService()
# Set model to Llama 3.1
ai_client.model = "llama3.1"

async def repository_node(state: AnalysisState) -> Dict[str, Any]:
    """Node: Repository Agent. Fetches metadata and recursive file tree if not already provided."""
    logger.info("Running Repository Node...")
    
    # If tree is already parsed and present, skip network calls
    if state.get("tree_raw") and state.get("default_branch"):
        return state

    github_service = GitHubService()
    owner, repo = github_service.parse_url(state["repo_url"])
    
    # Simple sync wrapper fetch
    import httpx
    async with httpx.AsyncClient() as client:
        metadata = await github_service._get(client, f"/repos/{owner}/{repo}")
        default_branch = metadata.get("default_branch", "main")
        tree_data = await github_service._get(client, f"/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1")
        languages = await github_service._get(client, f"/repos/{owner}/{repo}/languages")
        contributors = await github_service._get(client, f"/repos/{owner}/{repo}/contributors?per_page=10")

    tree = tree_data.get("tree", [])
    file_paths = [item.get("path", "") for item in tree if item.get("type") == "blob"]
    
    return {
        "owner": owner,
        "repo_name": repo,
        "default_branch": default_branch,
        "tree_raw": tree,
        "file_paths": file_paths,
        "languages": languages,
        "contributors": contributors
    }

async def tech_stack_node(state: AnalysisState) -> Dict[str, Any]:
    """Node: Tech Stack Agent. Analyzes repository files to determine categories and frameworks."""
    logger.info("Running Tech Stack Node...")
    detector = TechStackDetector(state["owner"], state["repo_name"], state["default_branch"])
    tech_stack = await detector.detect(state["tree_raw"])
    return {
        "tech_stack_data": tech_stack.model_dump()
    }

async def security_node(state: AnalysisState) -> Dict[str, Any]:
    """Node: Security Agent. Performs static analysis scan and enriches reports with Llama 3.1."""
    logger.info("Running Security Node...")
    analyzer = SecurityAnalyzer(state["owner"], state["repo_name"], state["default_branch"])
    raw_report = await analyzer.analyze(state["tree_raw"])
    
    ai_security = SecurityAIService()
    enriched_report = await ai_security.enrich_security_analysis(raw_report)
    return {
        "security_report": enriched_report.model_dump()
    }

def get_dynamic_metadata(state: AnalysisState) -> Dict[str, Any]:
    repo_name = state.get("repo_name", "the repository")
    owner = state.get("owner", "unknown-owner")
    
    # Languages list sorted by size
    languages_dict = state.get("languages") or {}
    sorted_langs = sorted(languages_dict.items(), key=lambda x: x[1], reverse=True)
    total_bytes = sum(languages_dict.values()) or 1
    lang_info = []
    for lang, bytes_cnt in sorted_langs[:5]:
        pct = (bytes_cnt / total_bytes) * 100
        lang_info.append(f"{lang} ({pct:.1f}%)")
    languages_str = ", ".join(lang_info) if lang_info else "Undetected Languages"
    primary_lang = sorted_langs[0][0] if sorted_langs else "Code"
    
    # Tech stack
    ts = state.get("tech_stack_data") or {}
    frontend = ts.get("frontend") or []
    backend = ts.get("backend") or []
    database = ts.get("database") or []
    deployment = ts.get("deployment") or []
    testing = ts.get("testing") or []
    cicd = ts.get("cicd") or []
    
    # Build readable strings
    frontend_str = ", ".join(frontend) if frontend else "HTML/JS (Native)"
    backend_str = ", ".join(backend) if backend else "Standard Library"
    db_str = ", ".join(database) if database else "Local files / No dedicated DB"
    deploy_str = ", ".join(deployment) if deployment else "Standard Host"
    test_str = ", ".join(testing) if testing else "Standard asserts"
    cicd_str = ", ".join(cicd) if cicd else "None configured"
    
    # Contributors
    contribs = state.get("contributors") or []
    contrib_list = []
    contrib_rows_list = []
    for c in contribs[:5]:
        login = c.get("login", "unknown")
        cnt = c.get("contributions", 0)
        contrib_list.append(f"@{login} ({cnt} commits)")
        contrib_rows_list.append(f"| @{login} | {cnt} commits | Active contributor contributing to {primary_lang} modules |")
    contribs_str = ", ".join(contrib_list) if contrib_list else "Unknown Contributors"
    contrib_rows = "\n".join(contrib_rows_list) if contrib_rows_list else "| @unknown | 0 commits | Default contributor profile |"
    
    # File paths highlights
    file_paths = state.get("file_paths") or []
    total_files = len(file_paths)
    
    # Group directories
    dirs = set()
    for path in file_paths:
        parts = path.split('/')
        if len(parts) > 1:
            dirs.add(parts[0])
    top_dirs = sorted(list(dirs))[:5]
    dirs_str = ", ".join([f"`/{d}`" for d in top_dirs]) if top_dirs else "Root Directory"
    dirs_list = "\n".join([f"* `/{d}`: Detected module directory containing repository files." for d in top_dirs]) if top_dirs else "* `/`: Root directory containing system source files."

    # Selected critical paths
    file_list_md = "\n".join([f"* `{path}`" for path in file_paths[:12]]) if file_paths else "* No source files detected."

    # Custom Mermaid diagram logic
    if frontend:
        mermaid_diagram = (
            "graph TD\n"
            f"  subgraph Client [Presentation Layer: Frontend]\n"
            f"    UI[\"Web UI ({frontend_str})\"] --> API[\"API Requests / Client Routing\"]\n"
            "  end\n"
            f"  subgraph Backend [Application Layer: Backend]\n"
            f"    API --> ROUTER[\"Routing & Handlers ({backend_str})\"]\n"
            f"    ROUTER --> logic[\"Business Logic ({primary_lang})\"]\n"
            "  end\n"
            f"  subgraph Persistence [Data Tier]\n"
            f"    logic --> DB[\"Database / Storage ({db_str})\"]\n"
            "  end"
        )
    else:
        mermaid_diagram = (
            "graph TD\n"
            f"  subgraph Interface [Interface Layer]\n"
            f"    CLI[\"CLI / Entrypoint ({backend_str})\"]\n"
            "  end\n"
            f"  subgraph Core [Logic Layer]\n"
            f"    CLI --> Controller[\"Orchestration ({primary_lang})\"]\n"
            "    Controller --> Engine[\"Processing Core / Main Logic\"]\n"
            "  end\n"
            f"  subgraph Data [Data Tier]\n"
            f"    Engine --> Storage[\"Storage & Config ({db_str})\"]\n"
            "  end"
        )

    return {
        "repo_name": repo_name,
        "owner": owner,
        "primary_lang": primary_lang,
        "languages_str": languages_str,
        "frontend_str": frontend_str,
        "backend_str": backend_str,
        "db_str": db_str,
        "deploy_str": deploy_str,
        "test_str": test_str,
        "cicd_str": cicd_str,
        "contribs_str": contribs_str,
        "contrib_rows": contrib_rows,
        "num_contributors": len(contribs),
        "total_files": total_files,
        "dirs_str": dirs_str,
        "dirs_list": dirs_list,
        "file_list_md": file_list_md,
        "mermaid_diagram": mermaid_diagram
    }

async def architecture_node(state: AnalysisState) -> Dict[str, Any]:
    """Node: Architecture Agent. Maps file structure to design pattern templates."""
    logger.info("Running Architecture Node...")
    
    snippet = "\n".join(state["file_paths"][:40])
    prompt = ARCHITECTURE_AGENT_PROMPT.format(
        repo_name=state["repo_name"],
        tech_stack=json.dumps(state["tech_stack_data"]),
        file_tree=snippet
    )
    
    try:
        response = await ai_client.generate_response(prompt)
        return {"architecture_report": response.strip()}
    except Exception as e:
        logger.warning(f"Architecture agent LLM call failed: {str(e)}")
        meta = get_dynamic_metadata(state)
        return {"architecture_report": (
            f"# Software Architecture Report: {meta['repo_name']}\n\n"
            f"## 1. Architectural Style & Design Patterns\n"
            f"This project implements a codebase pattern primarily structured in **{meta['primary_lang']}**. "
            f"It organizes frontend resources using `{meta['frontend_str']}` and backend components with `{meta['backend_str']}`. "
            f"The application separates client-facing interfaces, processing handlers, and data integration boundaries.\n\n"
            f"## 2. Directory Breakdown\n"
            f"The repository contains **{meta['total_files']}** files. The core structure is categorized under the following directories:\n"
            f"{meta['dirs_list']}\n\n"
            f"Selected path highlights:\n"
            f"{meta['file_list_md']}\n\n"
            f"## 3. Visual Architecture Diagram\n"
            f"```mermaid\n"
            f"{meta['mermaid_diagram']}\n"
            f"```\n\n"
            f"## 4. Request Lifecycle & Data Flow\n"
            f"1. **Execution Request**: The operation starts via the main repository entry points.\n"
            f"2. **Routing & Dispatch**: Requests are resolved by routing layers constructed using `{meta['backend_str']}`.\n"
            f"3. **Logic Invocation**: Processing routines execute core logic modules implemented in `{meta['primary_lang']}`.\n"
            f"4. **State Persistence**: Operation outputs are logged or stored via `{meta['db_str']}`.\n\n"
            f"## 5. Architectural Strengths & Risks\n"
            f"### Strengths:\n"
            f"* **Cohesive Technology Profile**: Strong reliance on `{meta['primary_lang']}` creates high readability.\n"
            f"* **Modern Delivery Framework**: Compatible with automated pipeline triggers using `{meta['cicd_str']}`.\n\n"
            f"### Risks & Mitigation Roadmap:\n"
            f"* **Modular Coupling**: Complex folders like `{meta['dirs_str']}` should maintain strict namespace isolation to avoid circular dependencies."
        )}

async def feature_node(state: AnalysisState) -> Dict[str, Any]:
    """Node: Feature Agent. Summarizes repository functional modules."""
    logger.info("Running Feature Node...")
    
    snippet = "\n".join(state["file_paths"][:40])
    prompt = FEATURE_AGENT_PROMPT.format(
        repo_name=state["repo_name"],
        tech_stack=json.dumps(state["tech_stack_data"]),
        file_tree=snippet
    )
    
    try:
        response = await ai_client.generate_response(prompt)
        return {"feature_report": response.strip()}
    except Exception as e:
        logger.warning(f"Feature agent LLM call failed: {str(e)}")
        meta = get_dynamic_metadata(state)
        return {"feature_report": (
            f"# Codebase Feature Catalog: {meta['repo_name']}\n\n"
            f"## 1. Primary Functional Capabilities\n"
            f"This repository offers five core functional capabilities derived from its codebase metadata:\n"
            f"1. **Core Service Engine**: Processing algorithms and operations written in `{meta['primary_lang']}`.\n"
            f"2. **Backend Integrations**: Application servers, scripting routines, or route definitions handled by `{meta['backend_str']}`.\n"
            f"3. **Client UI Layout**: Standard front-end interface layouts and styling utilizing `{meta['frontend_str']}`.\n"
            f"4. **Data Management & Configuration**: State values, schemas, and configurations persisted via `{meta['db_str']}`.\n"
            f"5. **DevOps & Continuous Integration**: Deployment automation configuration using `{meta['deploy_str']}` and automated testing pipeline scripts in `{meta['cicd_str']}`.\n\n"
            f"## 2. Capability to Source File Mapping\n\n"
            f"| Feature | Primary Stacks & Technologies | Responsibility |\n"
            f"| :--- | :--- | :--- |\n"
            f"| **Logic & Services** | `{meta['primary_lang']}` | Core execution logic modules inside `{meta['dirs_str']}` |\n"
            f"| **Backend / APIs** | `{meta['backend_str']}` | Network APIs or service entrypoints |\n"
            f"| **UI Elements** | `{meta['frontend_str']}` | Interactivity, views, and stylesheet presentation rules |\n"
            f"| **Storage & Persistence** | `{meta['db_str']}` | DB structures, configuration schemas, or files |\n"
            f"| **Infrastructure** | `{meta['deploy_str']}` / `{meta['cicd_str']}` | Build files, Docker configurations, and automated pipeline scripts |\n\n"
            f"## 3. Gaps & Missing Capabilities\n"
            f"* **Vulnerability Protection**: Ensure configurations are securely externalized rather than hardcoded in source modules.\n"
            f"* **Unit Test Coverage**: The project lists `{meta['test_str']}` setup. Ensure comprehensive coverage is maintained for newly added functions."
        )}

async def resume_node(state: AnalysisState) -> Dict[str, Any]:
    """Node: Resume Agent. Profiles developer contributions and stack matches."""
    logger.info("Running Resume Node...")
    
    prompt = RESUME_AGENT_PROMPT.format(
        repo_name=state["repo_name"],
        languages=json.dumps(state.get("languages", {})),
        contributors=json.dumps(state.get("contributors", []))
    )
    
    try:
        response = await ai_client.generate_response(prompt)
        return {"resume_report": response.strip()}
    except Exception as e:
        logger.warning(f"Resume agent LLM call failed: {str(e)}")
        meta = get_dynamic_metadata(state)
        return {"resume_report": (
            f"# Contributor Profiling & Talent Assessment: {meta['repo_name']}\n\n"
            f"## 1. Developer Profile & Summary\n"
            f"Based on version control telemetry, **{meta['num_contributors']}** contributors have checked changes into this project. "
            f"The codebase showcases specialized focus areas aligning with the core development stack: `{meta['primary_lang']}`, `{meta['frontend_str']}`, and `{meta['backend_str']}`.\n\n"
            f"## 2. Talent Competency Matrix\n"
            f"Here is a profiling of active repository developers according to their commit footprints:\n\n"
            f"| Developer Username | Contribution Volume | Estimated Focus Areas & Tech Alignment |\n"
            f"| :--- | :--- | :--- |\n"
            f"{meta['contrib_rows']}\n\n"
            f"## 3. Onboarding & Collaboration Guide\n"
            f"* **Backend Onboarding**: Target understanding the design patterns in `{meta['backend_str']}` and database layouts in `{meta['db_str']}`.\n"
            f"* **Frontend Onboarding**: Familiarize with React/HTML/JS modules, layouts, and styles configured under `{meta['frontend_str']}`.\n"
            f"* **Verification Steps**: Developers should run initial setups using guidelines from `{meta['deploy_str']}` and run existing tests via `{meta['test_str']}`."
        )}

async def interview_node(state: AnalysisState) -> Dict[str, Any]:
    """Node: Interview Agent. Generates specialized developer onboarding Q&A lists."""
    logger.info("Running Interview Node...")
    
    sec_summary = state["security_report"].get("security_summary", {})
    prompt = INTERVIEW_AGENT_PROMPT.format(
        repo_name=state["repo_name"],
        tech_stack=json.dumps(state["tech_stack_data"]),
        critical=sec_summary.get("critical", 0),
        high=sec_summary.get("high", 0),
        medium=sec_summary.get("medium", 0),
        low=sec_summary.get("low", 0)
    )
    
    try:
        response = await ai_client.generate_response(prompt)
        return {"interview_report": response.strip()}
    except Exception as e:
        logger.warning(f"Interview agent LLM call failed: {str(e)}")
        meta = get_dynamic_metadata(state)
        return {"interview_report": (
            f"# Technical Onboarding Q&A & Interview Guide: {meta['repo_name']}\n\n"
            f"### Question 1: What is the primary architecture of the `{meta['repo_name']}` repository, and how should a new developer navigate it?\n"
            f"* **Relevance**: Crucial for onboarding developers to avoid layout errors.\n"
            f"* **Ideal Answer**: The application is structured around **{meta['primary_lang']}**. UI elements utilize `{meta['frontend_str']}`, "
            f"the server runs on `{meta['backend_str']}`, and persistence/configuration is governed by `{meta['db_str']}`. Key folders "
            f"to explore are: `{meta['dirs_str']}`.\n\n"
            f"### Question 2: How can we run local verification and deploy our updates safely?\n"
            f"* **Relevance**: Essential for automated verification and pipeline consistency.\n"
            f"* **Ideal Answer**: Developers check build parameters configured via `{meta['deploy_str']}`. Quality validation is conducted by "
            f"running `{meta['test_str']}` scripts. Pipelines are compiled via continuous integration triggers defined in `{meta['cicd_str']}`.\n\n"
            f"### Question 3: How should settings and secret integrations be structured in this repository?\n"
            f"* **Relevance**: Crucial for static analysis vulnerability scanning.\n"
            f"* **Ideal Answer**: Hardcoded values in `{meta['primary_lang']}` source files should be refactored. We externalize variable settings into configuration environments "
            f"which are parsed at runtime, ensuring `.env` files are kept in `.gitignore`.\n\n"
            f"* **Secure Code Reference Sample**:\n"
            f"  * *Vulnerable code pattern*:\n"
            f"    ```python\n"
            f"    # API connection strings or keys stored directly in code\n"
            f"    API_KEY = \"abcd_secret_token_12345\"\n"
            f"    DATABASE_URL = \"sqlite:///production.db\"\n"
            f"    ```\n"
            f"  * *Secure code pattern*:\n"
            f"    ```python\n"
            f"    # Loaded from OS environments dynamically\n"
            f"    import os\n"
            f"    API_KEY = os.getenv(\"SERVICE_API_KEY\", \"\")\n"
            f"    DATABASE_URL = os.getenv(\"DATABASE_URL\", \"sqlite:///:memory:\")\n"
            f"    ```"
        )}

async def recommendation_node(state: AnalysisState) -> Dict[str, Any]:
    """Node: Recommendation Agent. Synthesizes consolidation roadmap items."""
    logger.info("Running Recommendation Node...")
    
    sec_summary = state["security_report"].get("security_summary", {})
    prompt = RECOMMENDATION_AGENT_PROMPT.format(
        repo_name=state["repo_name"],
        tech_stack=json.dumps(state["tech_stack_data"]),
        critical=sec_summary.get("critical", 0),
        high=sec_summary.get("high", 0),
        medium=sec_summary.get("medium", 0),
        low=sec_summary.get("low", 0)
    )
    
    try:
        response = await ai_client.generate_response(prompt)
        return {"recommendation_report": response.strip()}
    except Exception as e:
        logger.warning(f"Recommendation agent LLM call failed: {str(e)}")
        meta = get_dynamic_metadata(state)
        return {"recommendation_report": (
            f"# Strategic Engineering Roadmap & Recommendations: {meta['repo_name']}\n\n"
            f"## 1. Actionable Refactoring Phases\n\n"
            f"### Phase 1: Security & Quality Audit (Immediate - 24 to 48 Hours)\n"
            f"* **Actions**: Review raw configs to ensure all access keys and secrets are excluded from Git. Audit code patterns in `{meta['dirs_str']}` for common injections or deserialization flaws.\n\n"
            f"### Phase 2: Tech Stack Integration (Short-Term - Next Sprint)\n"
            f"* **Actions**: Transition backend components utilizing `{meta['backend_str']}` to structured models. Improve error interceptor wrappers on `{meta['frontend_str']}` client channels.\n\n"
            f"### Phase 3: Infrastructure Scale & CI/CD (Mid-to-Long Term)\n"
            f"* **Actions**: Refactor database execution commands targeting `{meta['db_str']}`. Setup clean testing matrices using `{meta['test_str']}` and automate runs under `{meta['cicd_str']}`.\n\n"
            f"## 2. Roadmap Summary Matrix\n\n"
            f"| Recommendation Item | Priority | Complexity / Effort | Action Area |\n"
            f"| :--- | :--- | :--- | :--- |\n"
            f"| Secure credentials & rotate old keys | High | Low (1-2 Hours) | Security |\n"
            f"| Standardize modular structure inside `{meta['dirs_str']}` | Medium | Medium (2-3 Days) | Architecture |\n"
            f"| Expand test suites utilizing `{meta['test_str']}` | Medium | Low (4-6 Hours) | Quality Assurance |\n"
            f"| Containerize application configurations via `{meta['deploy_str']}` | Low | Low (2-3 Hours) | DevOps / Deployment |"
        )}

