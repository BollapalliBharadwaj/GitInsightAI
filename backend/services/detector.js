import axios from 'axios';

export class TechStackDetector {
  constructor(owner, repo, defaultBranch) {
    this.owner = owner;
    this.repo = repo;
    this.branch = defaultBranch;
    this.rawBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/`;
  }

  async _fetchFile(path) {
    try {
      const response = await axios.get(`${this.rawBaseUrl}${path}`);
      if (response.status === 200) {
        return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      }
    } catch (error) {
      // ignore
    }
    return "";
  }

  _detectFromPackageJson(content, stack) {
    try {
      const data = typeof content === 'string' ? JSON.parse(content) : content;
      const deps = { ...(data.dependencies || {}), ...(data.devDependencies || {}) };
      
      // Frontend
      if (deps["react"]) stack.frontend.push("React");
      if (deps["vue"]) stack.frontend.push("Vue");
      if (deps["svelte"]) stack.frontend.push("Svelte");
      if (deps["next"]) stack.frontend.push("Next.js");
      if (deps["nuxt"]) stack.frontend.push("Nuxt");
      if (deps["@angular/core"]) stack.frontend.push("Angular");
      if (deps["tailwindcss"]) stack.frontend.push("Tailwind CSS");
      if (deps["vite"]) stack.frontend.push("Vite");
      if (deps["webpack"]) stack.frontend.push("Webpack");

      // Backend
      if (deps["express"]) stack.backend.push("Express.js");
      if (deps["fastify"]) stack.backend.push("Fastify");
      if (deps["@nestjs/core"]) stack.backend.push("NestJS");
      if (deps["mongoose"] || deps["prisma"] || deps["pg"]) stack.backend.push("Node.js (Backend)");

      // Database
      if (deps["mongoose"]) stack.database.push("MongoDB");
      if (deps["prisma"]) stack.database.push("Prisma");
      if (deps["pg"]) stack.database.push("PostgreSQL");
      if (deps["mysql"] || deps["mysql2"]) stack.database.push("MySQL");
      if (deps["redis"] || deps["ioredis"]) stack.database.push("Redis");

      // Testing
      if (deps["jest"]) stack.testing.push("Jest");
      if (deps["cypress"]) stack.testing.push("Cypress");
      if (deps["vitest"]) stack.testing.push("Vitest");
    } catch (e) {
      // ignore
    }
  }

  _detectFromRequirementsTxt(content, stack) {
    const lines = content.split('\n');
    const deps = lines.map(line => line.split('==')[0].toLowerCase().trim()).filter(Boolean);
    
    // Backend
    if (deps.includes("fastapi")) stack.backend.push("FastAPI");
    if (deps.includes("django")) stack.backend.push("Django");
    if (deps.includes("flask")) stack.backend.push("Flask");
    if (deps.includes("celery")) stack.backend.push("Celery");

    // Database
    if (deps.includes("sqlalchemy")) stack.database.push("SQLAlchemy");
    if (deps.includes("psycopg2") || deps.includes("psycopg")) stack.database.push("PostgreSQL");
    if (deps.includes("pymongo")) stack.database.push("MongoDB");
    if (deps.includes("redis")) stack.database.push("Redis");

    // Testing
    if (deps.includes("pytest")) stack.testing.push("PyTest");
  }

  async detect(tree) {
    const stack = {
      frontend: [], backend: [], database: [], deployment: [], testing: [], cicd: []
    };
    
    const files = new Set(tree.filter(node => node.type === "blob").map(node => node.path));
    
    if (files.has("Dockerfile")) stack.deployment.push("Docker");
    if (files.has("docker-compose.yml")) stack.deployment.push("Docker Compose");
    if (files.has("vercel.json")) stack.deployment.push("Vercel");
    if (files.has("netlify.toml")) stack.deployment.push("Netlify");
    if (files.has("fly.toml")) stack.deployment.push("Fly.io");
    
    for (const f of files) {
      if (f.startsWith(".github/workflows/")) stack.cicd.push("GitHub Actions");
    }
    if (files.has(".gitlab-ci.yml")) stack.cicd.push("GitLab CI");
    if (files.has(".travis.yml")) stack.cicd.push("Travis CI");

    const toFetch = [];
    if (files.has("package.json")) toFetch.push("package.json");
    if (files.has("requirements.txt")) toFetch.push("requirements.txt");
    
    if (toFetch.length > 0) {
      const contents = await Promise.all(toFetch.map(p => this._fetchFile(p)));
      toFetch.forEach((path, i) => {
        const content = contents[i];
        if (path === "package.json") this._detectFromPackageJson(content, stack);
        else if (path === "requirements.txt") this._detectFromRequirementsTxt(content, stack);
      });
    }

    // Deduplicate
    stack.frontend = [...new Set(stack.frontend)];
    stack.backend = [...new Set(stack.backend)];
    stack.database = [...new Set(stack.database)];
    stack.deployment = [...new Set(stack.deployment)];
    stack.testing = [...new Set(stack.testing)];
    stack.cicd = [...new Set(stack.cicd)];

    return stack;
  }
}
