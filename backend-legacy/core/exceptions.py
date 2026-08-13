from fastapi import Request
from fastapi.responses import JSONResponse
from loguru import logger

class GitInsightError(Exception):
    """Base exception for GitInsight."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class NotFoundError(GitInsightError):
    """Resource not found exception."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)

class ValidationError(GitInsightError):
    """Validation error exception."""
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, status_code=400)

class APIError(GitInsightError):
    """External API error exception."""
    def __init__(self, message: str = "External API request failed"):
        super().__init__(message, status_code=502)

async def gitinsight_exception_handler(request: Request, exc: GitInsightError):
    """Global handler for GitInsight exceptions."""
    logger.error(f"GitInsightError: {exc.message} - Path: {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"message": exc.message}}
    )

async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions."""
    logger.exception(f"Unhandled exception on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": {"message": "Internal server error"}}
    )
