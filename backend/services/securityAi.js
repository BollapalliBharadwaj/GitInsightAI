import { AIService } from './ai.js';
import logger from '../utils/logger.js';

export class SecurityAIService {
  constructor() {
    this.ai = new AIService();
  }

  async enrichSecurityAnalysis(rawReport) {
    logger.info("Enriching security report with AI explanations...");
    for (const vuln of rawReport.vulnerabilities) {
      if (vuln.severity === "critical" || vuln.severity === "high") {
        const prompt = `
Explain the following security vulnerability found in a codebase, and provide a concrete example of how to fix it securely.

Vulnerability: ${vuln.title}
Description: ${vuln.description}
Current Recommendation: ${vuln.recommendation}
        `;
        try {
          const aiResponse = await this.ai.generateResponse(prompt, "You are an expert Application Security Engineer.");
          vuln.recommendation = `${vuln.recommendation}\n\n**AI Security Explanation:**\n${aiResponse}`;
        } catch (e) {
          logger.warn(`Failed to enrich vulnerability ${vuln.title}: ${e.message}`);
        }
      }
    }
    return rawReport;
  }
}
