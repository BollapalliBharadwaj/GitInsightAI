"""
GitInsight AI — FastAPI Application Entry Point.

Creates and configures the FastAPI app instance with:
- CORS middleware
- Database lifecycle (startup/shutdown)
- API route registration
- Structured logging
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from core.config import get_settings
from database.connection import init_database, close_database
from core.exceptions import GitInsightError, gitinsight_exception_handler, global_exception_handler
from routes.health import router as health_router
from routes.analyze import router as analyze_router
from routes.security import router as security_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages startup and shutdown events.
    - Startup: initializes database, logs config
    - Shutdown: closes database connections gracefully
    """
    settings = get_settings()
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Debug mode: {settings.debug}")

    # Initialize database on startup
    await init_database()
    logger.info("Database initialized")

    yield  # App runs here

    # Cleanup on shutdown
    await close_database()
    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    """
    Factory function that creates and configures the FastAPI application.
    Keeps app creation testable and reusable.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="AI-powered GitHub Repository Analyzer",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # -- CORS Middleware --
    # Allows frontend (Vite dev server or deployed app) to make API calls safely.
    # Supports comma-separated list of origins or wildcard '*'
    origins = []
    if settings.frontend_url:
        origins = [o.strip() for o in settings.frontend_url.split(",") if o.strip()]
    
    allow_all = "*" in origins or not origins
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if allow_all else origins,
        allow_credentials=not allow_all,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -- Exception Handlers --
    app.add_exception_handler(GitInsightError, gitinsight_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)

    # -- Register Routes --
    app.include_router(health_router, prefix="/api", tags=["System"])
    app.include_router(analyze_router, prefix="/api", tags=["Analysis"])
    app.include_router(security_router, prefix="/api", tags=["Security"])

    return app


# Create the app instance — used by uvicorn
app = create_app()
