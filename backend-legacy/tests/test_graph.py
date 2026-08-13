import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

def test_analyze_empty_url(client: TestClient):
    """Test that submitting an empty URL results in a 400 Bad Request."""
    response = client.post("/api/analyze", json={"url": ""})
    assert response.status_code == 400
    assert "Repository URL must be a non-empty string" in response.json()["detail"]

def test_analyze_invalid_github_url(client: TestClient):
    """Test that submitting an invalid URL results in a 400 Bad Request."""
    response = client.post("/api/analyze", json={"url": "https://invalid.com/some/repo"})
    assert response.status_code == 400
    assert "Invalid GitHub repository URL" in response.json()["detail"]

@patch("services.github.GitHubService.fetch_repo_data")
@patch("services.ai.AIService.generate_response")
@patch("services.security_ai.SecurityAIService.enrich_security_analysis")
def test_analyze_valid_repository_pipeline(mock_enrich_sec, mock_ai_response, mock_fetch_repo, client: TestClient):
    """
    Test the full multi-agent analysis pipeline using mocks for GitHub fetches,
    Ollama AI generation requests, and Security AI enrichment.
    """
    # Mocking GitHub API payload response
    from models.schemas import GitHubRepoData, TechStack, ContributorInfo
    
    mock_repo_data = GitHubRepoData(
        owner="test-owner",
        repo="test-repo",
        description="A test repository for multi-agent graph",
        stars=10,
        forks=2,
        languages={"Python": 1000},
        contributors=[
            ContributorInfo(login="tester", contributions=5, avatar_url="https://tester-avatar.com")
        ],
        readme_content="# Test Repo\nThis is a test readme.",
        tree=[
            {"path": "app/main.py", "type": "blob", "size": 100},
            {"path": "requirements.txt", "type": "blob", "size": 50}
        ],
        tech_stack=TechStack(
            frontend=[],
            backend=["FastAPI"],
            database=["SQLite"],
            deployment=[],
            testing=["pytest"],
            cicd=[]
        )
    )
    
    # Configure mock returns
    mock_fetch_repo.return_value = mock_repo_data
    mock_ai_response.return_value = "Mocked AI Agent Report content in Markdown."
    
    from models.security_models import SecurityAnalysisResponse, SecuritySummary
    mock_enriched_sec_report = SecurityAnalysisResponse(
        repository_name="test-owner/test-repo",
        security_summary=SecuritySummary(security_score=100, critical=0, high=0, medium=0, low=0),
        vulnerabilities=[],
        recommendations=[]
    )
    mock_enrich_sec.return_value = mock_enriched_sec_report

    response = client.post(
        "/api/analyze",
        json={"url": "https://github.com/test-owner/test-repo"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert "Repository analyzed successfully" in data["message"]
    
    repo_data = data["data"]
    assert repo_data["owner"] == "test-owner"
    assert repo_data["repo"] == "test-repo"
    assert repo_data["architecture_report"] == "Mocked AI Agent Report content in Markdown."
    assert repo_data["feature_report"] == "Mocked AI Agent Report content in Markdown."
    assert repo_data["resume_report"] == "Mocked AI Agent Report content in Markdown."
    assert repo_data["interview_report"] == "Mocked AI Agent Report content in Markdown."
    assert repo_data["recommendation_report"] == "Mocked AI Agent Report content in Markdown."
