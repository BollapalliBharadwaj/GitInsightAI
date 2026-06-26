from fastapi import APIRouter
from core.config import get_settings
from models.schemas import APIResponse, HealthResponse

router = APIRouter()
settings = get_settings()

@router.get("/health", response_model=APIResponse)
async def health_check():
    """
    Returns API health status.
    In future, this will check database connectivity.
    """
    health_data = HealthResponse(
        status="ok",
        version=settings.app_version,
        database="connected"  # Mock status for now
    )
    return APIResponse(
        success=True,
        message="Service is healthy",
        data=health_data
    )

@router.get("/version", response_model=APIResponse)
async def get_version():
    """Returns just the application version."""
    return APIResponse(
        success=True,
        message="Version retrieved",
        data={"version": settings.app_version}
    )

@router.get("/health/test-keys")
async def test_keys():
    """Diagnostic endpoint to test GitHub rate limits and Gemini API keys."""
    import httpx
    
    # 1. Test GitHub
    github_ok = False
    github_limit = "Unknown"
    github_error = None
    try:
        async with httpx.AsyncClient() as client:
            headers = {"User-Agent": "GitInsight-AI"}
            if settings.github_token:
                headers["Authorization"] = f"token {settings.github_token}"
            resp = await client.get("https://api.github.com/rate_limit", headers=headers)
            if resp.status_code == 200:
                github_ok = True
                github_limit = resp.json().get("resources", {}).get("core", {})
            else:
                github_error = f"Status code {resp.status_code}: {resp.text}"
    except Exception as e:
        github_error = str(e)
        
    # 2. Test Gemini
    gemini_ok = False
    gemini_error = None
    if settings.gemini_api_key:
        try:
            from services.ai import AIService
            ai = AIService()
            res = await ai.generate_response(prompt="Hello, return just 'ok'", system_prompt="Test connection")
            if res:
                gemini_ok = True
            else:
                gemini_error = "Returned empty response"
        except Exception as e:
            gemini_error = str(e)
    else:
        gemini_error = "No GEMINI_API_KEY configured"
        
    return {
        "github": {"ok": github_ok, "limit": github_limit, "error": github_error},
        "gemini": {"ok": gemini_ok, "error": gemini_error}
    }
