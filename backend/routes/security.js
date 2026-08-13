import express from 'express';
import logger from '../utils/logger.js';
import { GitHubService } from '../services/github.js';
import { SecurityAnalyzer } from '../services/securityAnalyzer.js';
import { SecurityAIService } from '../services/securityAi.js';
import { apiLimiter } from '../middleware/rateLimit.js';
import { ValidationError, APIError } from '../middleware/errorHandler.js';

const router = express.Router();

router.post('/security/analyze', apiLimiter, async (req, res, next) => {
  try {
    const { url } = req.body;
    logger.info(`Received security analysis request for URL: ${url}`);
    
    if (!url || typeof url !== 'string' || !url.trim()) {
      throw new ValidationError("Repository URL must be a non-empty string");
    }

    const githubService = new GitHubService();
    
    // Step 1: Parse Owner & Repo
    const { owner, repo } = githubService.parseUrl(url);
    logger.info(`Successfully parsed owner: ${owner}, repo: ${repo}`);
    
    // Step 2: Fetch metadata and file tree
    let defaultBranch = "main";
    try {
      const metadata = await githubService._get(`/repos/${owner}/${repo}`);
      defaultBranch = metadata.default_branch || "main";
    } catch (e) {
      throw new APIError(`Error accessing repository metadata: ${e.message}`, e.statusCode || 500);
    }
    
    let tree = [];
    try {
      const treeData = await githubService._get(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
      tree = treeData.tree || [];
    } catch (e) {
      throw new APIError(`Error accessing repository file tree: ${e.message}`, e.statusCode || 500);
    }
    
    // Step 3: Run the Security Analyzer
    logger.info(`Initializing SecurityAnalyzer for ${owner}/${repo} (${defaultBranch})`);
    const analyzer = new SecurityAnalyzer(owner, repo, defaultBranch);
    let analysisResult = await analyzer.analyze(tree);
    
    // Step 4: Enrich with AI explanations
    try {
      logger.info("Enriching security report with AI explanations...");
      const aiService = new SecurityAIService();
      analysisResult = await aiService.enrichSecurityAnalysis(analysisResult);
    } catch (e) {
      logger.warn(`AI security explanation enrichment skipped due to error: ${e.message}`);
    }
    
    logger.info(`Security analysis for ${owner}/${repo} completed. Score: ${analysisResult.security_summary.security_score}, Total issues: ${analysisResult.security_summary.total_issues}`);
    
    return res.status(200).json(analysisResult);
  } catch (error) {
    if (!(error instanceof APIError)) {
      logger.error(`Unexpected error during security analysis: ${error.message}`);
    }
    next(error);
  }
});

export default router;
