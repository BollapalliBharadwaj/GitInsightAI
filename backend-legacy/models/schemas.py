"""
Shared Pydantic schemas used across multiple endpoints.
Provides consistent response structure for all API responses.
"""

from pydantic import BaseModel
from typing import Any, Optional


class APIResponse(BaseModel):
    """Standard API response wrapper — all endpoints use this shape."""
    success: bool
    message: str
    data: Optional[Any] = None


class HealthResponse(BaseModel):
    """Health check response with system status details."""
    status: str
    version: str
    database: str


class ErrorResponse(BaseModel):
    """Structured error response for client-friendly error handling."""
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Any] = None


class GitHubRepoRequest(BaseModel):
    """Request model for analyzing a GitHub repository."""
    url: str


class ContributorInfo(BaseModel):
    login: str
    contributions: int
    avatar_url: str


class TechStack(BaseModel):
    """Categorized tech stack extracted from repository."""
    frontend: list[str] = []
    backend: list[str] = []
    database: list[str] = []
    deployment: list[str] = []
    testing: list[str] = []
    cicd: list[str] = []


class GitHubRepoData(BaseModel):
    """Model representing fetched GitHub repository metadata."""
    owner: str
    repo: str
    description: Optional[str]
    stars: int
    forks: int
    languages: dict[str, int]
    contributors: list[ContributorInfo]
    readme_content: Optional[str]
    tree: list[dict[str, Any]]
    tech_stack: TechStack = TechStack()
    
    # Optional Agent Reports (Phase 14 Graph Pipeline)
    security_report: Optional[dict] = None
    architecture_report: Optional[str] = None
    feature_report: Optional[str] = None
    resume_report: Optional[str] = None
    interview_report: Optional[str] = None
    recommendation_report: Optional[str] = None


class AITestRequest(BaseModel):
    """Schema for testing the local AI service."""
    prompt: str
    system_prompt: Optional[str] = None


class AITestResponse(BaseModel):
    """Schema for the local AI service test response."""
    response: str

