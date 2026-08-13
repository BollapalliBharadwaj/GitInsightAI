import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

def test_analyze_empty_url(client: TestClient):
    """Test that submitting an empty URL results in a 400 Bad Request validation error."""
    response = client.post("/api/security/analyze", json={"url": ""})
    assert response.status_code == 400
    assert "Repository URL must be a non-empty string" in response.json()["detail"]

def test_analyze_invalid_github_url(client: TestClient):
    """Test that submitting an invalid GitHub URL format results in a 400 Bad Request."""
    response = client.post("/api/security/analyze", json={"url": "https://invalid-url.com/some/repo"})
    assert response.status_code == 400
    assert "Invalid GitHub repository URL" in response.json()["detail"]

@patch("services.github.GitHubService._get")
def test_analyze_valid_repository_mocked(mock_get, client: TestClient):
    """
    Test a successful repository scan by mocking the GitHub API requests
    to fetch metadata and recursive file tree records.
    """
    # Define custom async mock for GitHubService._get helper calls
    async def mock_get_side_effect(client_obj, endpoint):
        if "git/trees" in endpoint:
            # Return recursive file tree blobs
            return {"tree": [
                {"path": ".env", "type": "blob"},
                {"path": "id_rsa", "type": "blob"},
                {"path": "src/main.py", "type": "blob"},
                {"path": "package.json", "type": "blob"}
            ]}
        else:
            # Return repository metadata
            return {"default_branch": "main"}

    mock_get.side_effect = mock_get_side_effect

    response = client.post(
        "/api/security/analyze", 
        json={"url": "https://github.com/test-owner/test-repo"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Assert return format and calculations match SecurityAnalysisResponse schema
    assert data["repository_name"] == "test-owner/test-repo"
    assert "security_summary" in data
    assert data["security_summary"]["critical"] == 2
    assert data["security_summary"]["medium"] == 1  # Missing .gitignore
    assert len(data["vulnerabilities"]) == 3
    assert len(data["recommendations"]) == 3
