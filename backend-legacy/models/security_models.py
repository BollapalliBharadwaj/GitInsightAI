from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ==========================================
# Legacy Models (Preserved for Compatibility)
# ==========================================

class Vulnerability(BaseModel):
    """Represents a specific detected security vulnerability or risk."""
    title: str = Field(..., description="Short title of the vulnerability")
    description: str = Field(..., description="Detailed description of the issue")
    file_path: str = Field(..., description="Path of the file containing the vulnerability")
    line_number: Optional[int] = Field(None, description="Line number where the risk was detected")
    severity: str = Field(..., description="Severity level: critical, high, medium, low")
    remediation: str = Field(..., description="Recommended action to fix the issue")

class SeverityCount(BaseModel):
    """Counters for different vulnerability severity levels."""
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0

class SecurityReport(BaseModel):
    """Unified security analysis report structure."""
    security_score: int = Field(..., description="Overall security score from 0 to 100")
    vulnerabilities: List[Vulnerability] = Field(default_factory=list, description="List of detected vulnerabilities")
    warnings: List[str] = Field(default_factory=list, description="Warnings regarding missing files or setups")
    recommendations: List[str] = Field(default_factory=list, description="Remediation recommendations and best practices")
    severity: SeverityCount = Field(default_factory=SeverityCount, description="Vulnerability distribution count")


# ==========================================
# Phase 14.1 AI Security Analyzer Models
# ==========================================

class SecurityIssue(BaseModel):
    """Represents a single security issue detected in the repository."""
    title: str = Field(..., description="A short, descriptive title of the security issue")
    description: str = Field(..., description="Detailed description of the security issue and its impact")
    severity: str = Field(..., description="Severity level of the issue (e.g., critical, high, medium, low)")
    category: str = Field(..., description="The category of the security issue (e.g., secrets, vulnerability, structure)")
    file_path: str = Field(..., description="The relative path to the file containing the issue")
    line_number: Optional[int] = Field(None, description="The line number where the issue was found, or None if not applicable")
    recommendation: str = Field(..., description="Actionable recommendation on how to resolve the security issue")
    ai_explanation: Optional[str] = Field(None, description="AI-generated explanation of the vulnerability and secure fix")


class SecuritySummary(BaseModel):
    """Summary statistics for the security analysis of a repository."""
    security_score: int = Field(..., ge=0, le=100, description="Overall security score of the repository from 0 to 100")
    critical: int = Field(0, ge=0, description="Total number of critical severity issues")
    high: int = Field(0, ge=0, description="Total number of high severity issues")
    medium: int = Field(0, ge=0, description="Total number of medium severity issues")
    low: int = Field(0, ge=0, description="Total number of low severity issues")
    total_issues: int = Field(0, ge=0, description="Total number of security issues detected")


class SecurityAnalysisResponse(BaseModel):
    """Response schema for the repository security analysis results."""
    repository_name: str = Field(..., description="The full name of the repository (e.g., owner/repo)")
    security_summary: SecuritySummary = Field(..., description="Aggregated summary of the security analysis")
    vulnerabilities: List[SecurityIssue] = Field(default_factory=list, description="List of detected security issues")
    recommendations: List[str] = Field(default_factory=list, description="List of high-level recommendations and best practices")
    analyzed_at: datetime = Field(default_factory=datetime.utcnow, description="The UTC timestamp when the analysis was performed")
