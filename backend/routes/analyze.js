import express from 'express';
import logger from '../utils/logger.js';
import { GitHubService } from '../services/github.js';
import { AIService } from '../services/ai.js';
import { analysisGraph } from '../agents/graph.js';
import { getDB } from '../config/db.js';
import { apiLimiter } from '../middleware/rateLimit.js';
import { ValidationError, APIError } from '../middleware/errorHandler.js';

const router = express.Router();
const githubService = new GitHubService();
const aiService = new AIService();

router.post('/analyze', apiLimiter, async (req, res, next) => {
  try {
    const { url } = req.body;
    logger.info(`Received multi-agent analysis request for: ${url}`);
    
    if (!url || typeof url !== 'string' || !url.trim()) {
      throw new ValidationError("Repository URL must be a non-empty string");
    }

    logger.info("Fetching repository metadata and tree...");
    const repoData = await githubService.fetchRepoData(url);
    
    const initialState = {
      repo_url: url,
      owner: repoData.owner,
      repo_name: repoData.repo,
      default_branch: "main",
      file_paths: repoData.tree.filter(item => item.type === "blob").map(item => item.path),
      tree_raw: repoData.tree,
      languages: repoData.languages,
      contributors: repoData.contributors,
      tech_stack_data: repoData.tech_stack,
      security_report: {},
      architecture_report: null,
      feature_report: null,
      resume_report: null,
      interview_report: null,
      recommendation_report: null
    };

    logger.info("Executing LangGraph analysis pipeline graph...");
    const finalState = await analysisGraph.invoke(initialState);
    logger.info("LangGraph pipeline successfully completed execution.");
    
    repoData.security_report = finalState.security_report;
    repoData.architecture_report = finalState.architecture_report;
    repoData.feature_report = finalState.feature_report;
    repoData.resume_report = finalState.resume_report;
    repoData.interview_report = finalState.interview_report;
    repoData.recommendation_report = finalState.recommendation_report;
    
    try {
      const db = getDB();
      const primaryLang = repoData.languages && Object.keys(repoData.languages).length > 0
        ? Object.entries(repoData.languages).sort((a, b) => b[1] - a[1])[0][0]
        : "Unknown";
        
      const fullName = `${repoData.owner}/${repoData.repo}`;
      
      // UPSERT Repository
      let repoRow = await db.get(`SELECT id FROM repositories WHERE fullName = ?`, [fullName]);
      let repoId;
      if (repoRow) {
        repoId = repoRow.id;
        await db.run(
          `UPDATE repositories SET owner = ?, name = ?, description = ?, stars = ?, forks = ?, language = ?, url = ? WHERE id = ?`,
          [repoData.owner, repoData.repo, repoData.description || "", repoData.stars, repoData.forks, primaryLang, url, repoId]
        );
      } else {
        const result = await db.run(
          `INSERT INTO repositories (fullName, owner, name, description, stars, forks, language, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [fullName, repoData.owner, repoData.repo, repoData.description || "", repoData.stars, repoData.forks, primaryLang, url]
        );
        repoId = result.lastID;
      }
      
      // INSERT Analysis
      const secSummary = repoData.security_report?.security_summary || {};
      const overallScore = secSummary.security_score ?? 90;
      const summaryText = `Analyzed repository ${fullName}. Primary language: ${primaryLang}. Score: ${overallScore}.`;
      
      const analysisResult = await db.run(
        `INSERT INTO analyses (repositoryId, status, overallScore, summary) VALUES (?, ?, ?, ?)`,
        [repoId, 'success', overallScore, summaryText]
      );
      const analysisId = analysisResult.lastID;
      
      // INSERT Agent Results
      const agentsToSave = [
        { name: "architecture", findings: repoData.architecture_report },
        { name: "feature", findings: repoData.feature_report },
        { name: "resume", findings: repoData.resume_report },
        { name: "interview", findings: repoData.interview_report },
        { name: "recommendation", findings: repoData.recommendation_report }
      ];
      
      for (const agent of agentsToSave) {
        if (agent.findings) {
          await db.run(
            `INSERT INTO agent_results (analysisId, agentName, findings) VALUES (?, ?, ?)`,
            [analysisId, agent.name, typeof agent.findings === 'string' ? agent.findings : JSON.stringify(agent.findings)]
          );
        }
      }
      logger.info(`Analysis saved to database with id ${analysisId}`);
    } catch (dbErr) {
      logger.error(`Failed to save analysis to database: ${dbErr.message}`);
    }

    return res.json({
      success: true,
      message: "Repository analyzed successfully using LangGraph pipeline",
      data: repoData
    });
    
  } catch (error) {
    if (!(error instanceof APIError)) {
      logger.error(`Failed to execute multi-agent analysis: ${error.message}`);
    }
    next(error);
  }
});

router.post('/test-ai', async (req, res, next) => {
  try {
    const { prompt, system_prompt } = req.body;
    const responseText = await aiService.generateResponse(prompt, system_prompt);
    return res.json({
      success: true,
      message: "AI response generated successfully",
      data: { response: responseText }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const db = getDB();
    const records = await db.all(`
      SELECT 
        a.id as analysis_id, a.overallScore as score, a.summary, a.completedAt as lastRun,
        r.id as repo_id, r.fullName as name, r.owner, r.name as repo, r.description, 
        r.stars, r.forks, r.language as lang, r.url
      FROM analyses a
      JOIN repositories r ON a.repositoryId = r.id
      WHERE a.status = 'success'
      ORDER BY a.completedAt DESC
    `);
    
    const historyList = records.map(row => ({
      id: row.repo_id,
      name: row.name,
      owner: row.owner,
      repo: row.repo,
      description: row.description,
      stars: row.stars,
      forks: row.forks,
      lang: row.lang,
      url: row.url,
      analysis_id: row.analysis_id,
      score: row.score,
      summary: row.summary,
      lastRun: row.lastRun
    }));
    
    return res.json({
      success: true,
      message: "History retrieved successfully",
      data: historyList
    });
  } catch (error) {
    logger.error("Failed to retrieve analysis history", error);
    next(new APIError("Failed to retrieve history", 500));
  }
});

export default router;
