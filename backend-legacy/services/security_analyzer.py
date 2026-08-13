import re
import json
import httpx
import asyncio
from typing import List, Dict, Any, Tuple
from loguru import logger
from datetime import datetime

# Import both legacy and new security models for backwards compatibility
from models.security_models import (
    SecurityAnalysisResponse,
    SecuritySummary,
    SecurityIssue,
    SecurityReport,
    Vulnerability,
    SeverityCount
)

class SecurityAnalyzer:
    """
    Rule-based Security Analyzer for scanning repository file structure
    and source code contents for common security vulnerabilities, configuration leaks,
    insecure execution blocks, and unsafe serialization patterns.
    """

    def __init__(self, owner: str, repo: str, default_branch: str):
        self.owner = owner
        self.repo = repo
        self.branch = default_branch
        self.raw_base_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/"

    async def _fetch_file_content(self, client: httpx.AsyncClient, path: str) -> str:
        """Fetch raw content of a specific file from GitHub."""
        try:
            url = f"{self.raw_base_url}{path}"
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                return response.text
        except Exception as e:
            logger.warning(f"Failed to fetch content for {path}: {str(e)}")
        return ""

    def _is_placeholder(self, value: str) -> bool:
        """Helper to check if a matched key or credential value is a generic placeholder."""
        val_lower = value.lower().strip("\"'")
        placeholders = {
            "placeholder", "your_key", "your_token", "your-key", "enter_key", 
            "key-here", "example", "<", ">", "todo", "your_password", 
            "enter_password", "dummy", "test", "my_password", "my_pwd", 
            "your_api_key", "your-api-key", "enter-api-key", "secret-key",
            "db_password", "username_here", "password_here"
        }
        return (
            any(p in val_lower for p in placeholders) or 
            len(val_lower) < 6 or
            val_lower.startswith("<") or 
            val_lower.endswith(">")
        )

    def detect_exposed_files(self, file_paths: List[str]) -> List[SecurityIssue]:
        """
        Category: configuration
        Analyzes repository file paths to detect committed sensitive files, 
        such as environment (.env) files, credentials, and cryptographic keys.
        """
        issues: List[SecurityIssue] = []
        
        # Check for missing .gitignore
        if not any(f.endswith(".gitignore") for f in file_paths):
            issues.append(SecurityIssue(
                title="Missing .gitignore file",
                description="The repository does not contain a .gitignore file, increasing the risk of accidentally committing sensitive files, credentials, build artifacts, or environment variables.",
                severity="medium",
                category="configuration",
                file_path="Repository Root",
                line_number=None,
                recommendation="Create a standard .gitignore file at the root of the repository to prevent untracked credentials and files from being committed."
            ))
            
        # Check for exposed environment files (.env)
        env_files = {".env", ".env.local", ".env.development", ".env.production", ".env.test", ".env.sample"}
        for path in file_paths:
            file_name = path.split("/")[-1]
            if file_name in env_files:
                # Flag env.example/env.sample as low-severity warning if it somehow has credentials,
                # but standard practice is .env is critical.
                is_sample = "example" in file_name or "sample" in file_name or "template" in file_name
                issues.append(SecurityIssue(
                    title="Exposed .env Configuration File" if not is_sample else "Exposed Environment Configuration Template",
                    description=f"An environment configuration file/template ({file_name}) was detected in the repository path: {path}",
                    severity="low" if is_sample else "critical",
                    category="configuration",
                    file_path=path,
                    line_number=None,
                    recommendation="Remove the .env file from git tracking immediately. Add it to .gitignore and rotate any committed secrets." if not is_sample else "Ensure no real/production credentials are left in your environment template file."
                ))
                
        # Check for exposed private keys, certificates, or SSH keys
        sensitive_extensions = [".pem", ".key", "id_rsa", ".pfx", ".pkcs12", ".cer", ".crt"]
        for path in file_paths:
            file_name = path.split("/")[-1].lower()
            if any(file_name.endswith(ext) for ext in sensitive_extensions) or "id_rsa" in file_name:
                # Exclude package-lock or setup files that happen to contain matching strings
                if any(x in file_name for x in ["package", "cargo", "poetry", "yarn"]):
                    continue
                issues.append(SecurityIssue(
                    title="Exposed Cryptographic Key or Certificate",
                    description=f"A potentially sensitive key, certificate, or credential file was detected: {path}",
                    severity="critical",
                    category="configuration",
                    file_path=path,
                    line_number=None,
                    recommendation="Remove this file immediately from the repository history using git-filter-repo, revoke any exposed credentials, and update .gitignore."
                ))
                
        return issues

    def detect_hardcoded_secrets(self, file_path: str, content: str) -> List[SecurityIssue]:
        """
        Category: secrets
        Scans code file content line-by-line using regex to identify hardcoded API keys,
        tokens, credentials, and passwords.
        """
        issues: List[SecurityIssue] = []
        
        patterns = {
            "AWS Access Key / Secret Key": (
                r"(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}",
                "critical",
                "Remove AWS credentials from source code. Use AWS IAM roles or environment variables instead."
            ),
            "GitHub Personal Access Token": (
                r"gh[opr]_[A-Za-z0-9_]{36,255}",
                "critical",
                "Revoke the GitHub token immediately and move it to environment configuration."
            ),
            "OpenAI API Key": (
                r"sk-(?:proj-)?[a-zA-Z0-9-]{30,}",
                "critical",
                "Revoke the OpenAI key. Use environment variables to inject API keys dynamically."
            ),
            "Google/Firebase API Key": (
                r"AIza[0-9A-Za-z-_]{35}",
                "critical",
                "Restrict the Google API key in the Google Cloud Console, and avoid committing it to public source code."
            ),
            "JWT Secret Assignment": (
                r"(?i)(?:jwt_secret|jwtsecret|jwt_token_secret|jwt_sig_secret)\s*=\s*['\"]([^'\"]{8,})['\"]",
                "critical",
                "Store JWT signature secrets in secure environment variables, never in source files."
            ),
            "Hardcoded Password": (
                r"(?i)(?:password|passwd|pwd)\s*=\s*['\"]([^'\"]{6,})['\"]",
                "high",
                "Avoid hardcoding passwords. Use dynamic configuration injection or secure credential stores."
            )
        }
        
        lines = content.splitlines()
        for idx, line in enumerate(lines, 1):
            for key_name, (pattern, severity, recommendation) in patterns.items():
                matches = re.finditer(pattern, line)
                for match in matches:
                    # If assignment captures the secret value, validate group 1; otherwise match group 0
                    secret_val = match.group(1) if len(match.groups()) > 0 else match.group(0)
                    
                    if self._is_placeholder(secret_val):
                        continue
                        
                    issues.append(SecurityIssue(
                        title=f"Hardcoded {key_name}",
                        description=f"A pattern matching a hardcoded secret ({key_name}) was detected: `{line.strip()}`",
                        severity=severity,
                        category="secrets",
                        file_path=file_path,
                        line_number=idx,
                        recommendation=recommendation
                    ))
                    
        return issues

    def detect_insecure_execution(self, file_path: str, content: str) -> List[SecurityIssue]:
        """
        Category: insecure-execution
        Scans code file content line-by-line to identify dangerous execution calls:
        eval(), exec(), os.system(), subprocess, and shell=True execution.
        """
        issues: List[SecurityIssue] = []
        
        patterns = {
            "eval()": (
                r"\beval\s*\(",
                "critical",
                "Avoid dynamic code execution via eval(). Use parsing libraries (e.g. json.loads or ast.literal_eval) instead."
            ),
            "exec()": (
                r"\bexec\s*\(",
                "high",
                "Remove exec() usages. Refactor code to use explicit modules/functions or configuration files."
            ),
            "os.system()": (
                r"\bos\.system\s*\(",
                "high",
                "Avoid os.system(). Use the subprocess module with shell=False and pass arguments as a list."
            ),
            "shell=True": (
                r"\bshell\s*=\s*True\b",
                "high",
                "Set shell=False and pass command line arguments as a list of strings to avoid command injection."
            ),
            "subprocess usage": (
                r"\bsubprocess\s*\.\s*(?:run|Popen|call|check_output|check_call)\s*\(",
                "medium",
                "Ensure subprocess execution is strictly parametrized and does not expose input to system commands."
            )
        }
        
        lines = content.splitlines()
        for idx, line in enumerate(lines, 1):
            for exec_name, (pattern, severity, recommendation) in patterns.items():
                if re.search(pattern, line):
                    issues.append(SecurityIssue(
                        title=f"Insecure Execution: {exec_name}",
                        description=f"Potential insecure execution risk found: `{line.strip()}`",
                        severity=severity,
                        category="insecure-execution",
                        file_path=file_path,
                        line_number=idx,
                        recommendation=recommendation
                    ))
                    
        return issues

    def detect_unsafe_serialization(self, file_path: str, content: str) -> List[SecurityIssue]:
        """
        Category: serialization
        Scans code file content line-by-line to identify unsafe object deserialization:
        pickle.loads() and yaml.load().
        """
        issues: List[SecurityIssue] = []
        
        patterns = {
            "pickle.loads()": (
                r"\bpickle\.loads\s*\(",
                "high",
                "Do not load pickle objects from untrusted sources. Use safe data formats like JSON or Protocol Buffers."
            ),
            "yaml.load()": (
                r"\byaml\.load\s*\(",
                "high",
                "Use yaml.safe_load() instead of yaml.load() to prevent arbitrary object instantiation and code execution."
            )
        }
        
        lines = content.splitlines()
        for idx, line in enumerate(lines, 1):
            for serial_name, (pattern, severity, recommendation) in patterns.items():
                if re.search(pattern, line):
                    issues.append(SecurityIssue(
                        title=f"Unsafe Deserialization: {serial_name}",
                        description=f"Potential unsafe deserialization found: `{line.strip()}`",
                        severity=severity,
                        category="serialization",
                        file_path=file_path,
                        line_number=idx,
                        recommendation=recommendation
                    ))
                    
        return issues

    async def analyze(self, tree: List[Dict[str, Any]]) -> SecurityAnalysisResponse:
        """
        Analyze repository file structure and source code files.
        Runs all modular detectors and calculates the summary statistics and security score.
        """
        vulnerabilities: List[SecurityIssue] = []
        
        # Extract file paths from tree blobs
        file_paths = [item.get("path", "") for item in tree if item.get("type") == "blob"]
        
        # 1. Structural Checks
        vulnerabilities.extend(self.detect_exposed_files(file_paths))
        
        # 2. Select Source Files for Static Scanning
        scan_targets = []
        extensions_to_scan = (".py", ".js", ".jsx", ".ts", ".tsx", ".json", ".yml", ".yaml", ".sh")
        ignore_keywords = ("node_modules", "venv", "dist", "build", "static", "tests", "spec", "package-lock.json", "yarn.lock")
        
        for path in file_paths:
            if path.endswith(extensions_to_scan):
                if not any(k in path.lower() for k in ignore_keywords):
                    scan_targets.append(path)
                    
        # Limit concurrent file scans to prevent rate limits / heavy request queues
        scan_targets = sorted(scan_targets, key=len)[:15]
        
        # Scan files concurrently
        async with httpx.AsyncClient() as client:
            tasks = [self._fetch_file_content(client, path) for path in scan_targets]
            contents = await asyncio.gather(*tasks)
            
        # 3. Code Content Scanning
        for path, content in zip(scan_targets, contents):
            if not content:
                continue
            vulnerabilities.extend(self.detect_hardcoded_secrets(path, content))
            vulnerabilities.extend(self.detect_insecure_execution(path, content))
            vulnerabilities.extend(self.detect_unsafe_serialization(path, content))
            
        # 4. Calculate Statistics
        score = 100
        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = 0
        
        for vuln in vulnerabilities:
            sev = vuln.severity.lower()
            if sev == "critical":
                critical_count += 1
                score -= 15
            elif sev == "high":
                high_count += 1
                score -= 10
            elif sev == "medium":
                medium_count += 1
                score -= 5
            elif sev == "low":
                low_count += 1
                score -= 2
                
        # Clamp score between 0 and 100
        score = max(0, min(100, score))
        
        summary = SecuritySummary(
            security_score=score,
            critical=critical_count,
            high=high_count,
            medium=medium_count,
            low=low_count,
            total_issues=len(vulnerabilities)
        )
        
        # Extract unique recommendations
        unique_recs = []
        for vuln in vulnerabilities:
            if vuln.recommendation and vuln.recommendation not in unique_recs:
                unique_recs.append(vuln.recommendation)
                
        if not unique_recs:
            unique_recs.append("No critical issues found. Maintain regular secret rotation policies.")
            
        return SecurityAnalysisResponse(
            repository_name=f"{self.owner}/{self.repo}",
            security_summary=summary,
            vulnerabilities=vulnerabilities,
            recommendations=unique_recs,
            analyzed_at=datetime.utcnow()
        )
