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
