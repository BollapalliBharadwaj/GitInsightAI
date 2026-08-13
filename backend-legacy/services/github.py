import re
import httpx
import base64
import asyncio
from typing import Tuple, Dict, Any
from core.config import get_settings
from core.exceptions import ValidationError, APIError
from models.schemas import GitHubRepoData, ContributorInfo
from services.detector import TechStackDetector

settings = get_settings()

class GitHubService:
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitInsight-AI"
        }
        if settings.github_token:
            self.headers["Authorization"] = f"token {settings.github_token}"

    def parse_url(self, url: str) -> Tuple[str, str]:
        """Extracts owner and repo name from a GitHub URL."""
        pattern = r"github\.com/([^/]+)/([^/]+?)(?:\.git|/)?$"
        match = re.search(pattern, url)
        if not match:
            raise ValidationError("Invalid GitHub repository URL")
        return match.group(1), match.group(2)

    async def _get(self, client: httpx.AsyncClient, endpoint: str) -> Any:
        """Helper to make GET requests to GitHub API."""
        url = f"{self.base_url}{endpoint}"
        response = await client.get(url, headers=self.headers)
        
        if response.status_code == 404:
            raise APIError(f"Resource not found: {endpoint}")
        elif response.status_code == 403 and "rate limit" in response.text.lower():
            raise APIError("GitHub API rate limit exceeded")
        
        response.raise_for_status()
        return response.json()

    async def fetch_repo_data(self, url: str) -> GitHubRepoData:
        """Fetches all required data for a GitHub repository concurrently, checking cached entries first."""
        from core.cache import repo_cache
        from loguru import logger

        # 0. Check cache
        cached_result = repo_cache.get(url)
        if cached_result is not None:
            logger.info(f"Cache hit: returning cached repository data for {url}")
            return cached_result

        owner, repo = self.parse_url(url)
        
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                # 1. Fetch basic metadata
                metadata = await self._get(client, f"/repos/{owner}/{repo}")
                default_branch = metadata.get("default_branch", "main")
                
                # 2. Prepare concurrent requests
                tasks = [
                    self._get(client, f"/repos/{owner}/{repo}/languages"),
                    self._get(client, f"/repos/{owner}/{repo}/contributors?per_page=10"),
                    self._get(client, f"/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"),
                    client.get(f"{self.base_url}/repos/{owner}/{repo}/readme", headers=self.headers)
                ]
                
                # Execute concurrently
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Handle results safely
                languages = results[0] if not isinstance(results[0], Exception) else {}
                contributors_data = results[1] if not isinstance(results[1], Exception) else []
                tree_data = results[2] if not isinstance(results[2], Exception) else {"tree": []}
                readme_resp = results[3]
                
                # Process Contributors
                contributors = [
                    ContributorInfo(
                        login=c.get("login", ""),
                        contributions=c.get("contributions", 0),
                        avatar_url=c.get("avatar_url", "")
                    )
                    for c in contributors_data if isinstance(c, dict)
                ]
                
                # Process README
                readme_content = None
                if not isinstance(readme_resp, Exception) and readme_resp.status_code == 200:
                    readme_json = readme_resp.json()
                    if "content" in readme_json:
                        try:
                            readme_content = base64.b64decode(readme_json["content"]).decode('utf-8')
                        except Exception:
                            pass
                
                # Detect Tech Stack
                detector = TechStackDetector(owner, repo, default_branch)
                tech_stack = await detector.detect(tree_data.get("tree", []))
                
                result_data = GitHubRepoData(
                    owner=owner,
                    repo=repo,
                    description=metadata.get("description"),
                    stars=metadata.get("stargazers_count", 0),
                    forks=metadata.get("forks_count", 0),
                    languages=languages,
                    contributors=contributors,
                    readme_content=readme_content,
                    tree=tree_data.get("tree", [])[:500],  # Limit to 500 items for safety
                    tech_stack=tech_stack
                )
                
                # Cache the successful result
                repo_cache.set(url, result_data)
                return result_data
            except httpx.HTTPStatusError as e:
                raise APIError(f"GitHub API Error: {e.response.status_code}")
            except Exception as e:
                if isinstance(e, APIError) or isinstance(e, ValidationError):
                    raise e
                raise APIError(f"Failed to fetch repository data: {str(e)}")
