import json
from typing import Dict, Any, List
from loguru import logger

from core.exceptions import APIError
from core.config import get_settings
from services.ai import AIService
from models.security_models import SecurityAnalysisResponse, SecurityIssue

settings = get_settings()

SECURITY_EXPLANATION_SYSTEM_PROMPT = (
    "You are an expert Application Security Engineer (AppSec). "
    "Your objective is to review code-level vulnerabilities, secret leaks, and configurations, "
    "and explain them to software developers in simple, accessible, and actionable English. "
    "Always structure your response using the exact five headers requested, and output clean markdown."
)

SECURITY_EXPLANATION_PROMPT_TEMPLATE = """
Please explain the following security issue detected in our codebase:

- Title: {title}
- Category: {category}
- Severity: {severity}
- File Path: {file_path}
- Line Number: {line_number}
- Description: {description}
- Standard Mitigation: {recommendation}

Generate the explanation in simple English following this exact layout:

### 1. What is the issue?
[Explain the issue clearly]

### 2. Why is it dangerous?
[Explain the risk/how it can be exploited]

### 3. Real-world impact
[Explain the business or system impact if exploited, e.g. breach, RCE, data theft]

### 4. How to fix it
[Explain the remediation steps clearly]

### 5. Example secure code
[Provide a clean code snippet illustrating the secure replacement]
"""

class SecurityAIService:
    """
    AI Security Explanation Engine using Ollama (Llama 3.1)
    to enrich rule-based security scans with developer-friendly explanations,
    security context, and secure code snippets.
    """

    def __init__(self):
        self.ai_service = AIService()
        # Override the Ollama model specifically to Llama 3.1
        self.ai_service.model = "llama3.1"

    async def explain_vulnerability(self, issue: SecurityIssue) -> str:
        """
        Calls Llama 3.1 via Ollama to generate a structured explanation for a single vulnerability.
        """
        prompt = SECURITY_EXPLANATION_PROMPT_TEMPLATE.format(
            title=issue.title,
            category=issue.category,
            severity=issue.severity,
            file_path=issue.file_path,
            line_number=issue.line_number if issue.line_number is not None else "N/A",
            description=issue.description,
            recommendation=issue.recommendation
        )
        
        logger.info(f"Generating AI explanation for issue: {issue.title} using Llama 3.1")
        try:
            explanation = await self.ai_service.generate_response(
                prompt=prompt,
                system_prompt=SECURITY_EXPLANATION_SYSTEM_PROMPT
            )
            return explanation.strip()
        except APIError as e:
            logger.error(f"Failed to generate AI explanation for '{issue.title}': {e.message}")
            # Return a warning placeholder if Ollama call fails rather than breaking the scan
            return (
                f"### 1. What is the issue?\n"
                f"Rule-based detection matched: {issue.title}.\n\n"
                f"### 2. Why is it dangerous?\n"
                f"Details: {issue.description}.\n\n"
                f"### 3. Real-world impact\n"
                f"Risk of potential security policy violations or code vulnerability execution.\n\n"
                f"### 4. How to fix it\n"
                f"{issue.recommendation}\n\n"
                f"### 5. Example secure code\n"
                f"```\n# AI Service offline. Please follow rule recommendation:\n# {issue.recommendation}\n```"
            )

    async def enrich_security_analysis(self, analysis_result: SecurityAnalysisResponse) -> SecurityAnalysisResponse:
        """
        Enriches a SecurityAnalysisResponse object by generating AI explanations 
        for all detected vulnerabilities.
        """
        logger.info(f"Enriching security analysis for repo: {analysis_result.repository_name} with AI explanations")
        
        enriched_vulnerabilities: List[SecurityIssue] = []
        for issue in analysis_result.vulnerabilities:
            # Generate explanation asynchronously for each issue
            explanation = await self.explain_vulnerability(issue)
            
            # Create a new SecurityIssue instance with the AI explanation field populated
            enriched_issue = SecurityIssue(
                title=issue.title,
                description=issue.description,
                severity=issue.severity,
                category=issue.category,
                file_path=issue.file_path,
                line_number=issue.line_number,
                recommendation=issue.recommendation,
                ai_explanation=explanation
            )
            enriched_vulnerabilities.append(enriched_issue)
            
        # Return a new response object with the enriched list of issues
        return SecurityAnalysisResponse(
            repository_name=analysis_result.repository_name,
            security_summary=analysis_result.security_summary,
            vulnerabilities=enriched_vulnerabilities,
            recommendations=analysis_result.recommendations,
            analyzed_at=analysis_result.analyzed_at
        )

    async def enrich_analysis_json(self, analysis_json_str: str) -> str:
        """
        Input: Security analysis JSON.
        Output: Enriched security analysis JSON containing AI explanations.
        """
        try:
            data = json.loads(analysis_json_str)
            # Validate dict using Pydantic model
            analysis_obj = SecurityAnalysisResponse.model_validate(data)
            # Enrich
            enriched_obj = await self.enrich_security_analysis(analysis_obj)
            # Return JSON
            return enriched_obj.model_dump_json()
        except Exception as e:
            logger.exception("Failed to parse or enrich security analysis JSON string")
            raise ValueError(f"Invalid security analysis JSON format: {str(e)}")
