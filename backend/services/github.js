import axios from 'axios';
import { config } from '../config/env.js';
import { ValidationError, APIError } from '../middleware/errorHandler.js';
import { repoCache } from '../utils/cache.js';
import { TechStackDetector } from './detector.js'; 
import logger from '../utils/logger.js';

export class GitHubService {
  constructor() {
    this.baseUrl = "https://api.github.com";
    this.headers = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "GitInsight-AI"
    };
    if (config.github.token) {
      this.headers["Authorization"] = `token ${config.github.token}`;
    }
  }

  parseUrl(url) {
    const pattern = /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git|\/)?$/;
    const match = url.match(pattern);
    if (!match) {
      throw new ValidationError("Invalid GitHub repository URL");
    }
    return { owner: match[1], repo: match[2] };
  }

  async _get(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new APIError(`Resource not found: ${endpoint}`, 404);
        } else if (error.response.status === 403 && (error.response.data.message || '').toLowerCase().includes('rate limit')) {
          throw new APIError("GitHub API rate limit exceeded", 403);
        }
        throw new APIError(`GitHub API Error: ${error.response.status}`, error.response.status);
      }
      throw new APIError(`GitHub API Error: ${error.message}`);
    }
  }

  async fetchRepoData(url) {
    const cachedResult = repoCache.get(url);
    if (cachedResult) {
      logger.info(`Cache hit: returning cached repository data for ${url}`);
      return cachedResult;
    }

    const { owner, repo } = this.parseUrl(url);

    try {
      const metadata = await this._get(`/repos/${owner}/${repo}`);
      const defaultBranch = metadata.default_branch || "main";

      const [languages, contributorsData, treeData, readmeResp] = await Promise.allSettled([
        this._get(`/repos/${owner}/${repo}/languages`),
        this._get(`/repos/${owner}/${repo}/contributors?per_page=10`),
        this._get(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`),
        axios.get(`${this.baseUrl}/repos/${owner}/${repo}/readme`, { headers: this.headers, validateStatus: () => true })
      ]);

      const getFulfilled = (promise, defaultVal) => promise.status === 'fulfilled' ? promise.value : defaultVal;

      const langs = getFulfilled(languages, {});
      const contribs = getFulfilled(contributorsData, []);
      const tree = getFulfilled(treeData, { tree: [] });
      const readme = readmeResp.status === 'fulfilled' && readmeResp.value.status === 200 ? readmeResp.value.data : null;

      const contributors = contribs.map(c => ({
        login: c.login || "",
        contributions: c.contributions || 0,
        avatar_url: c.avatar_url || ""
      }));

      let readmeContent = null;
      if (readme && readme.content) {
        try {
          readmeContent = Buffer.from(readme.content, 'base64').toString('utf-8');
        } catch (e) { }
      }

      const detector = new TechStackDetector(owner, repo, defaultBranch);
      const techStack = await detector.detect(tree.tree || []);

      const resultData = {
        owner,
        repo,
        description: metadata.description,
        stars: metadata.stargazers_count || 0,
        forks: metadata.forks_count || 0,
        languages: langs,
        contributors,
        readme_content: readmeContent,
        tree: (tree.tree || []).slice(0, 500),
        tech_stack: techStack
      };

      repoCache.set(url, resultData);
      return resultData;

    } catch (error) {
      if (error instanceof APIError || error instanceof ValidationError) {
        throw error;
      }
      throw new APIError(`Failed to fetch repository data: ${error.message}`);
    }
  }
}
