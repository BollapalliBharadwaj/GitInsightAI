import json
import httpx
import asyncio
from typing import List, Dict, Any, Set
from models.schemas import TechStack

class TechStackDetector:
    def __init__(self, owner: str, repo: str, default_branch: str):
        self.owner = owner
        self.repo = repo
        self.branch = default_branch
        self.raw_base_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/"

    async def _fetch_file(self, client: httpx.AsyncClient, path: str) -> str:
        """Fetches raw file content from GitHub."""
        try:
            response = await client.get(f"{self.raw_base_url}{path}")
            if response.status_code == 200:
                return response.text
        except Exception:
            pass
        return ""

    def _detect_from_package_json(self, content: str, stack: TechStack):
        try:
            data = json.loads(content)
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            
            # Frontend
            if "react" in deps: stack.frontend.append("React")
            if "vue" in deps: stack.frontend.append("Vue")
            if "svelte" in deps: stack.frontend.append("Svelte")
            if "next" in deps: stack.frontend.append("Next.js")
            if "nuxt" in deps: stack.frontend.append("Nuxt")
            if "@angular/core" in deps: stack.frontend.append("Angular")
            if "tailwindcss" in deps: stack.frontend.append("Tailwind CSS")
            if "vite" in deps: stack.frontend.append("Vite")
            if "webpack" in deps: stack.frontend.append("Webpack")

            # Backend
            if "express" in deps: stack.backend.append("Express.js")
            if "fastify" in deps: stack.backend.append("Fastify")
            if "@nestjs/core" in deps: stack.backend.append("NestJS")
            if "mongoose" in deps or "prisma" in deps or "pg" in deps: stack.backend.append("Node.js (Backend)")

            # Database
            if "mongoose" in deps: stack.database.append("MongoDB")
            if "prisma" in deps: stack.database.append("Prisma")
            if "pg" in deps: stack.database.append("PostgreSQL")
            if "mysql" in deps or "mysql2" in deps: stack.database.append("MySQL")
            if "redis" in deps or "ioredis" in deps: stack.database.append("Redis")

            # Testing
            if "jest" in deps: stack.testing.append("Jest")
            if "cypress" in deps: stack.testing.append("Cypress")
            if "vitest" in deps: stack.testing.append("Vitest")
            
        except json.JSONDecodeError:
            pass

    def _detect_from_requirements_txt(self, content: str, stack: TechStack):
        deps = [line.split("==")[0].lower().strip() for line in content.splitlines() if line]
        
        # Backend
        if "fastapi" in deps: stack.backend.append("FastAPI")
        if "django" in deps: stack.backend.append("Django")
        if "flask" in deps: stack.backend.append("Flask")
        if "celery" in deps: stack.backend.append("Celery")

        # Database
        if "sqlalchemy" in deps: stack.database.append("SQLAlchemy")
        if "psycopg2" in deps or "psycopg" in deps: stack.database.append("PostgreSQL")
        if "pymongo" in deps: stack.database.append("MongoDB")
        if "redis" in deps: stack.database.append("Redis")

        # Testing
        if "pytest" in deps: stack.testing.append("PyTest")

    async def detect(self, tree: List[Dict[str, Any]]) -> TechStack:
        stack = TechStack()
        
        # Quick file presence detection
        files = {node["path"] for node in tree if node["type"] == "blob"}
        
        if "Dockerfile" in files: stack.deployment.append("Docker")
        if "docker-compose.yml" in files: stack.deployment.append("Docker Compose")
        if "vercel.json" in files: stack.deployment.append("Vercel")
        if "netlify.toml" in files: stack.deployment.append("Netlify")
        if "fly.toml" in files: stack.deployment.append("Fly.io")
        
        if any(f.startswith(".github/workflows/") for f in files): stack.cicd.append("GitHub Actions")
        if ".gitlab-ci.yml" in files: stack.cicd.append("GitLab CI")
        if ".travis.yml" in files: stack.cicd.append("Travis CI")

        # Files to deep analyze
        to_fetch = []
        if "package.json" in files: to_fetch.append("package.json")
        if "requirements.txt" in files: to_fetch.append("requirements.txt")
        
        if to_fetch:
            async with httpx.AsyncClient() as client:
                contents = await asyncio.gather(*(self._fetch_file(client, p) for p in to_fetch))
                for path, content in zip(to_fetch, contents):
                    if path == "package.json":
                        self._detect_from_package_json(content, stack)
                    elif path == "requirements.txt":
                        self._detect_from_requirements_txt(content, stack)
        
        # Deduplicate
        stack.frontend = list(set(stack.frontend))
        stack.backend = list(set(stack.backend))
        stack.database = list(set(stack.database))
        stack.deployment = list(set(stack.deployment))
        stack.testing = list(set(stack.testing))
        stack.cicd = list(set(stack.cicd))

        return stack
