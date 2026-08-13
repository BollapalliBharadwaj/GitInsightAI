import axios from 'axios';
import logger from '../utils/logger.js';

export class SecurityAnalyzer {
  constructor(owner, repo, defaultBranch) {
    this.owner = owner;
    this.repo = repo;
    this.branch = defaultBranch;
    this.rawBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/`;
  }

  async _fetchFileContent(path) {
    try {
      const url = `${this.rawBaseUrl}${path}`;
      const response = await axios.get(url, { timeout: 10000 });
      if (response.status === 200) {
        return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      }
    } catch (e) {
      logger.warn(`Failed to fetch content for ${path}: ${e.message}`);
    }
    return "";
  }

  _isPlaceholder(value) {
    const valLower = value.toLowerCase().replace(/['"]/g, '').trim();
    const placeholders = [
      "placeholder", "your_key", "your_token", "your-key", "enter_key", 
      "key-here", "example", "<", ">", "todo", "your_password", 
      "enter_password", "dummy", "test", "my_password", "my_pwd", 
      "your_api_key", "your-api-key", "enter-api-key", "secret-key",
      "db_password", "username_here", "password_here"
    ];
    return (
      placeholders.some(p => valLower.includes(p)) || 
      valLower.length < 6 ||
      valLower.startsWith("<") || 
      valLower.endsWith(">")
    );
  }

  detectExposedFiles(filePaths) {
    const issues = [];
    
    if (!filePaths.some(f => f.endsWith(".gitignore"))) {
      issues.push({
        title: "Missing .gitignore file",
        description: "The repository does not contain a .gitignore file, increasing the risk of accidentally committing sensitive files, credentials, build artifacts, or environment variables.",
        severity: "medium",
        category: "configuration",
        file_path: "Repository Root",
        line_number: null,
        recommendation: "Create a standard .gitignore file at the root of the repository to prevent untracked credentials and files from being committed."
      });
    }
        
    const envFiles = [".env", ".env.local", ".env.development", ".env.production", ".env.test", ".env.sample"];
    for (const path of filePaths) {
      const fileName = path.split("/").pop();
      if (envFiles.includes(fileName)) {
        const isSample = fileName.includes("example") || fileName.includes("sample") || fileName.includes("template");
        issues.push({
          title: isSample ? "Exposed Environment Configuration Template" : "Exposed .env Configuration File",
          description: `An environment configuration file/template (${fileName}) was detected in the repository path: ${path}`,
          severity: isSample ? "low" : "critical",
          category: "configuration",
          file_path: path,
          line_number: null,
          recommendation: isSample ? "Ensure no real/production credentials are left in your environment template file." : "Remove the .env file from git tracking immediately. Add it to .gitignore and rotate any committed secrets."
        });
      }
    }
        
    const sensitiveExtensions = [".pem", ".key", "id_rsa", ".pfx", ".pkcs12", ".cer", ".crt"];
    for (const path of filePaths) {
      const fileName = path.split("/").pop().toLowerCase();
      if (sensitiveExtensions.some(ext => fileName.endsWith(ext)) || fileName.includes("id_rsa")) {
        if (["package", "cargo", "poetry", "yarn"].some(x => fileName.includes(x))) {
          continue;
        }
        issues.push({
          title: "Exposed Cryptographic Key or Certificate",
          description: `A potentially sensitive key, certificate, or credential file was detected: ${path}`,
          severity: "critical",
          category: "configuration",
          file_path: path,
          line_number: null,
          recommendation: "Remove this file immediately from the repository history using git-filter-repo, revoke any exposed credentials, and update .gitignore."
        });
      }
    }
    return issues;
  }

  detectHardcodedSecrets(filePath, content) {
    const issues = [];
    const patterns = {
      "AWS Access Key / Secret Key": {
        regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
        severity: "critical",
        recommendation: "Remove AWS credentials from source code. Use AWS IAM roles or environment variables instead."
      },
      "GitHub Personal Access Token": {
        regex: /gh[opr]_[A-Za-z0-9_]{36,255}/g,
        severity: "critical",
        recommendation: "Revoke the GitHub token immediately and move it to environment configuration."
      },
      "OpenAI API Key": {
        regex: /sk-(?:proj-)?[a-zA-Z0-9-]{30,}/g,
        severity: "critical",
        recommendation: "Revoke the OpenAI key. Use environment variables to inject API keys dynamically."
      },
      "Google/Firebase API Key": {
        regex: /AIza[0-9A-Za-z-_]{35}/g,
        severity: "critical",
        recommendation: "Restrict the Google API key in the Google Cloud Console, and avoid committing it to public source code."
      },
      "JWT Secret Assignment": {
        regex: /(?:jwt_secret|jwtsecret|jwt_token_secret|jwt_sig_secret)\s*=\s*['"]([^'"]{8,})['"]/gi,
        severity: "critical",
        recommendation: "Store JWT signature secrets in secure environment variables, never in source files."
      },
      "Hardcoded Password": {
        regex: /(?:password|passwd|pwd)\s*=\s*['"]([^'"]{6,})['"]/gi,
        severity: "high",
        recommendation: "Avoid hardcoding passwords. Use dynamic configuration injection or secure credential stores."
      }
    };
    
    const lines = content.split('\n');
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      for (const [keyName, data] of Object.entries(patterns)) {
        let match;
        // Need to clone the regex because it's stateful with /g
        const regex = new RegExp(data.regex);
        while ((match = regex.exec(line)) !== null) {
          const secretVal = match[1] ? match[1] : match[0];
          if (this._isPlaceholder(secretVal)) continue;
          
          issues.push({
            title: `Hardcoded ${keyName}`,
            description: `A pattern matching a hardcoded secret (${keyName}) was detected: \`${line.trim()}\``,
            severity: data.severity,
            category: "secrets",
            file_path: filePath,
            line_number: idx + 1,
            recommendation: data.recommendation
          });
        }
      }
    }
    return issues;
  }

  detectInsecureExecution(filePath, content) {
    const issues = [];
    const patterns = {
      "eval()": {
        regex: /\beval\s*\(/,
        severity: "critical",
        recommendation: "Avoid dynamic code execution via eval(). Use parsing libraries (e.g. json.loads or ast.literal_eval) instead."
      },
      "exec()": {
        regex: /\bexec\s*\(/,
        severity: "high",
        recommendation: "Remove exec() usages. Refactor code to use explicit modules/functions or configuration files."
      },
      "os.system()": {
        regex: /\bos\.system\s*\(/,
        severity: "high",
        recommendation: "Avoid os.system(). Use the subprocess module with shell=False and pass arguments as a list."
      },
      "shell=True": {
        regex: /\bshell\s*=\s*True\b/,
        severity: "high",
        recommendation: "Set shell=False and pass command line arguments as a list of strings to avoid command injection."
      },
      "subprocess usage": {
        regex: /\bsubprocess\s*\.\s*(?:run|Popen|call|check_output|check_call)\s*\(/,
        severity: "medium",
        recommendation: "Ensure subprocess execution is strictly parametrized and does not expose input to system commands."
      }
    };
    
    const lines = content.split('\n');
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      for (const [execName, data] of Object.entries(patterns)) {
        if (data.regex.test(line)) {
          issues.push({
            title: `Insecure Execution: ${execName}`,
            description: `Potential insecure execution risk found: \`${line.trim()}\``,
            severity: data.severity,
            category: "insecure-execution",
            file_path: filePath,
            line_number: idx + 1,
            recommendation: data.recommendation
          });
        }
      }
    }
    return issues;
  }

  detectUnsafeSerialization(filePath, content) {
    const issues = [];
    const patterns = {
      "pickle.loads()": {
        regex: /\bpickle\.loads\s*\(/,
        severity: "high",
        recommendation: "Do not load pickle objects from untrusted sources. Use safe data formats like JSON or Protocol Buffers."
      },
      "yaml.load()": {
        regex: /\byaml\.load\s*\(/,
        severity: "high",
        recommendation: "Use yaml.safe_load() instead of yaml.load() to prevent arbitrary object instantiation and code execution."
      }
    };
    
    const lines = content.split('\n');
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      for (const [serialName, data] of Object.entries(patterns)) {
        if (data.regex.test(line)) {
          issues.push({
            title: `Unsafe Deserialization: ${serialName}`,
            description: `Potential unsafe deserialization found: \`${line.trim()}\``,
            severity: data.severity,
            category: "serialization",
            file_path: filePath,
            line_number: idx + 1,
            recommendation: data.recommendation
          });
        }
      }
    }
    return issues;
  }

  async analyze(tree) {
    const vulnerabilities = [];
    const filePaths = tree.filter(item => item.type === "blob").map(item => item.path);
    
    vulnerabilities.push(...this.detectExposedFiles(filePaths));
    
    const extensionsToScan = [".py", ".js", ".jsx", ".ts", ".tsx", ".json", ".yml", ".yaml", ".sh"];
    const ignoreKeywords = ["node_modules", "venv", "dist", "build", "static", "tests", "spec", "package-lock.json", "yarn.lock"];
    
    let scanTargets = [];
    for (const path of filePaths) {
      if (extensionsToScan.some(ext => path.endsWith(ext))) {
        if (!ignoreKeywords.some(k => path.toLowerCase().includes(k))) {
          scanTargets.push(path);
        }
      }
    }
    
    // Sort by shortest path and limit to 15
    scanTargets.sort((a, b) => a.length - b.length);
    scanTargets = scanTargets.slice(0, 15);
    
    const contents = await Promise.all(scanTargets.map(p => this._fetchFileContent(p)));
    
    for (let i = 0; i < scanTargets.length; i++) {
      const path = scanTargets[i];
      const content = contents[i];
      if (!content) continue;
      
      vulnerabilities.push(...this.detectHardcodedSecrets(path, content));
      vulnerabilities.push(...this.detectInsecureExecution(path, content));
      vulnerabilities.push(...this.detectUnsafeSerialization(path, content));
    }
    
    let score = 100;
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    
    for (const vuln of vulnerabilities) {
      const sev = (vuln.severity || "").toLowerCase();
      if (sev === "critical") { criticalCount++; score -= 15; }
      else if (sev === "high") { highCount++; score -= 10; }
      else if (sev === "medium") { mediumCount++; score -= 5; }
      else if (sev === "low") { lowCount++; score -= 2; }
    }
    
    score = Math.max(0, Math.min(100, score));
    
    const summary = {
      security_score: score,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      total_issues: vulnerabilities.length
    };
    
    const uniqueRecs = [];
    for (const vuln of vulnerabilities) {
      if (vuln.recommendation && !uniqueRecs.includes(vuln.recommendation)) {
        uniqueRecs.push(vuln.recommendation);
      }
    }
    if (uniqueRecs.length === 0) {
      uniqueRecs.push("No critical issues found. Maintain regular secret rotation policies.");
    }
    
    return {
      repository_name: `${this.owner}/${this.repo}`,
      security_summary: summary,
      vulnerabilities,
      recommendations: uniqueRecs,
      analyzed_at: new Date()
    };
  }
}
