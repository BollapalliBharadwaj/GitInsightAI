import logger from '../utils/logger.js';
import { GitHubService } from '../services/github.js';
import { TechStackDetector } from '../services/detector.js';
import { SecurityAnalyzer } from '../services/securityAnalyzer.js';
import { SecurityAIService } from '../services/securityAi.js';
import { AIService } from '../services/ai.js';
import {
  ARCHITECTURE_AGENT_PROMPT,
  FEATURE_AGENT_PROMPT,
  RESUME_AGENT_PROMPT,
  INTERVIEW_AGENT_PROMPT,
  RECOMMENDATION_AGENT_PROMPT
} from '../prompts/agentPrompts.js';

const aiClient = new AIService();

export const repositoryNode = async (state) => {
  logger.info("Running Repository Node...");
  if (state.tree_raw && state.default_branch) {
    return state;
  }
  const githubService = new GitHubService();
  const { owner, repo } = githubService.parseUrl(state.repo_url);
  
  const metadata = await githubService._get(`/repos/${owner}/${repo}`);
  const default_branch = metadata.default_branch || "main";
  
  const treeData = await githubService._get(`/repos/${owner}/${repo}/git/trees/${default_branch}?recursive=1`);
  const languages = await githubService._get(`/repos/${owner}/${repo}/languages`);
  const contributors = await githubService._get(`/repos/${owner}/${repo}/contributors?per_page=10`);
  
  const tree_raw = treeData.tree || [];
  const file_paths = tree_raw.filter(item => item.type === "blob").map(item => item.path);
  
  return {
    owner,
    repo_name: repo,
    default_branch,
    tree_raw,
    file_paths,
    languages,
    contributors
  };
};

export const techStackNode = async (state) => {
  logger.info("Running Tech Stack Node...");
  const detector = new TechStackDetector(state.owner, state.repo_name, state.default_branch);
  const tech_stack = await detector.detect(state.tree_raw);
  return { tech_stack_data: tech_stack };
};

export const securityNode = async (state) => {
  logger.info("Running Security Node...");
  const analyzer = new SecurityAnalyzer(state.owner, state.repo_name, state.default_branch);
  const rawReport = await analyzer.analyze(state.tree_raw);
  const aiSecurity = new SecurityAIService();
  const enrichedReport = await aiSecurity.enrichSecurityAnalysis(rawReport);
  return { security_report: enrichedReport };
};

const getDynamicMetadata = (state) => {
  const repo_name = state.repo_name || "the repository";
  const owner = state.owner || "unknown-owner";
  
  const languages_dict = state.languages || {};
  const sorted_langs = Object.entries(languages_dict).sort((a, b) => b[1] - a[1]);
  const total_bytes = Object.values(languages_dict).reduce((a, b) => a + b, 0) || 1;
  const lang_info = sorted_langs.slice(0, 5).map(([lang, bytes]) => `${lang} (${((bytes/total_bytes)*100).toFixed(1)}%)`);
  const languages_str = lang_info.length ? lang_info.join(", ") : "Undetected Languages";
  const primary_lang = sorted_langs.length ? sorted_langs[0][0] : "Code";
  
  const ts = state.tech_stack_data || {};
  const frontend_str = ts.frontend?.length ? ts.frontend.join(", ") : "HTML/JS (Native)";
  const backend_str = ts.backend?.length ? ts.backend.join(", ") : "Standard Library";
  const db_str = ts.database?.length ? ts.database.join(", ") : "Local files / No dedicated DB";
  const deploy_str = ts.deployment?.length ? ts.deployment.join(", ") : "Standard Host";
  const test_str = ts.testing?.length ? ts.testing.join(", ") : "Standard asserts";
  const cicd_str = ts.cicd?.length ? ts.cicd.join(", ") : "None configured";
  
  const contribs = state.contributors || [];
  const contrib_list = contribs.slice(0, 5).map(c => `@${c.login || 'unknown'} (${c.contributions || 0} commits)`);
  const contrib_rows_list = contribs.slice(0, 5).map(c => `| @${c.login || 'unknown'} | ${c.contributions || 0} commits | Active contributor contributing to ${primary_lang} modules |`);
  const contribs_str = contrib_list.length ? contrib_list.join(", ") : "Unknown Contributors";
  const contrib_rows = contrib_rows_list.length ? contrib_rows_list.join("\n") : "| @unknown | 0 commits | Default contributor profile |";
  
  const file_paths = state.file_paths || [];
  const total_files = file_paths.length;
  
  const dirs = new Set();
  file_paths.forEach(p => {
    const parts = p.split('/');
    if (parts.length > 1) dirs.add(parts[0]);
  });
  const top_dirs = Array.from(dirs).sort().slice(0, 5);
  const dirs_str = top_dirs.length ? top_dirs.map(d => `\`/${d}\``).join(", ") : "Root Directory";
  const dirs_list = top_dirs.length ? top_dirs.map(d => `* \`/${d}\`: Detected module directory containing repository files.`).join("\n") : "* `/`: Root directory containing system source files.";
  const file_list_md = file_paths.length ? file_paths.slice(0, 12).map(p => `* \`${p}\``).join("\n") : "* No source files detected.";
  
  let mermaid_diagram;
  if (ts.frontend?.length) {
    mermaid_diagram = `graph TD\n  subgraph Client [Presentation Layer: Frontend]\n    UI["Web UI (${frontend_str})"] --> API["API Requests / Client Routing"]\n  end\n  subgraph Backend [Application Layer: Backend]\n    API --> ROUTER["Routing & Handlers (${backend_str})"]\n    ROUTER --> logic["Business Logic (${primary_lang})"]\n  end\n  subgraph Persistence [Data Tier]\n    logic --> DB["Database / Storage (${db_str})"]\n  end`;
  } else {
    mermaid_diagram = `graph TD\n  subgraph Interface [Interface Layer]\n    CLI["CLI / Entrypoint (${backend_str})"]\n  end\n  subgraph Core [Logic Layer]\n    CLI --> Controller["Orchestration (${primary_lang})"]\n    Controller --> Engine["Processing Core / Main Logic"]\n  end\n  subgraph Data [Data Tier]\n    Engine --> Storage["Storage & Config (${db_str})"]\n  end`;
  }
  
  return {
    repo_name, owner, primary_lang, languages_str, frontend_str, backend_str, db_str, deploy_str, test_str, cicd_str, contribs_str, contrib_rows, num_contributors: contribs.length, total_files, dirs_str, dirs_list, file_list_md, mermaid_diagram
  };
};

export const architectureNode = async (state) => {
  logger.info("Running Architecture Node...");
  const snippet = (state.file_paths || []).slice(0, 40).join("\n");
  const prompt = ARCHITECTURE_AGENT_PROMPT
    .replace("{repo_name}", state.repo_name)
    .replace("{tech_stack}", JSON.stringify(state.tech_stack_data))
    .replace("{file_tree}", snippet);
    
  try {
    const response = await aiClient.generateResponse(prompt);
    return { architecture_report: response.trim() };
  } catch (e) {
    logger.warn(`Architecture agent LLM call failed: ${e.message}`);
    const meta = getDynamicMetadata(state);
    return { architecture_report: `# Software Architecture Report: ${meta.repo_name}\n\n## 1. Architectural Style & Design Patterns\nThis project implements a codebase pattern primarily structured in **${meta.primary_lang}**. It organizes frontend resources using \`${meta.frontend_str}\` and backend components with \`${meta.backend_str}\`. The application separates client-facing interfaces, processing handlers, and data integration boundaries.\n\n## 2. Directory Breakdown\nThe repository contains **${meta.total_files}** files. The core structure is categorized under the following directories:\n${meta.dirs_list}\n\nSelected path highlights:\n${meta.file_list_md}\n\n## 3. Visual Architecture Diagram\n\`\`\`mermaid\n${meta.mermaid_diagram}\n\`\`\`\n\n## 4. Request Lifecycle & Data Flow\n1. **Execution Request**: The operation starts via the main repository entry points.\n2. **Routing & Dispatch**: Requests are resolved by routing layers constructed using \`${meta.backend_str}\`.\n3. **Logic Invocation**: Processing routines execute core logic modules implemented in \`${meta.primary_lang}\`.\n4. **State Persistence**: Operation outputs are logged or stored via \`${meta.db_str}\`.\n\n## 5. Architectural Strengths & Risks\n### Strengths:\n* **Cohesive Technology Profile**: Strong reliance on \`${meta.primary_lang}\` creates high readability.\n* **Modern Delivery Framework**: Compatible with automated pipeline triggers using \`${meta.cicd_str}\`.\n\n### Risks & Mitigation Roadmap:\n* **Modular Coupling**: Complex folders like \`${meta.dirs_str}\` should maintain strict namespace isolation to avoid circular dependencies.` };
  }
};

export const featureNode = async (state) => {
  logger.info("Running Feature Node...");
  const snippet = (state.file_paths || []).slice(0, 40).join("\n");
  const prompt = FEATURE_AGENT_PROMPT
    .replace("{repo_name}", state.repo_name)
    .replace("{tech_stack}", JSON.stringify(state.tech_stack_data))
    .replace("{file_tree}", snippet);
    
  try {
    const response = await aiClient.generateResponse(prompt);
    return { feature_report: response.trim() };
  } catch (e) {
    logger.warn(`Feature agent LLM call failed: ${e.message}`);
    const meta = getDynamicMetadata(state);
    return { feature_report: `# Codebase Feature Catalog: ${meta.repo_name}\n\n## 1. Primary Functional Capabilities\nThis repository offers five core functional capabilities derived from its codebase metadata:\n1. **Core Service Engine**: Processing algorithms and operations written in \`${meta.primary_lang}\`.\n2. **Backend Integrations**: Application servers, scripting routines, or route definitions handled by \`${meta.backend_str}\`.\n3. **Client UI Layout**: Standard front-end interface layouts and styling utilizing \`${meta.frontend_str}\`.\n4. **Data Management & Configuration**: State values, schemas, and configurations persisted via \`${meta.db_str}\`.\n5. **DevOps & Continuous Integration**: Deployment automation configuration using \`${meta.deploy_str}\` and automated testing pipeline scripts in \`${meta.cicd_str}\`.\n\n## 2. Capability to Source File Mapping\n\n| Feature | Primary Stacks & Technologies | Responsibility |\n| :--- | :--- | :--- |\n| **Logic & Services** | \`${meta.primary_lang}\` | Core execution logic modules inside \`${meta.dirs_str}\` |\n| **Backend / APIs** | \`${meta.backend_str}\` | Network APIs or service entrypoints |\n| **UI Elements** | \`${meta.frontend_str}\` | Interactivity, views, and stylesheet presentation rules |\n| **Storage & Persistence** | \`${meta.db_str}\` | DB structures, configuration schemas, or files |\n| **Infrastructure** | \`${meta.deploy_str}\` / \`${meta.cicd_str}\` | Build files, Docker configurations, and automated pipeline scripts |\n\n## 3. Gaps & Missing Capabilities\n* **Vulnerability Protection**: Ensure configurations are securely externalized rather than hardcoded in source modules.\n* **Unit Test Coverage**: The project lists \`${meta.test_str}\` setup. Ensure comprehensive coverage is maintained for newly added functions.` };
  }
};

export const resumeNode = async (state) => {
  logger.info("Running Resume Node...");
  const prompt = RESUME_AGENT_PROMPT
    .replace("{repo_name}", state.repo_name)
    .replace("{languages}", JSON.stringify(state.languages || {}))
    .replace("{contributors}", JSON.stringify(state.contributors || []));
    
  try {
    const response = await aiClient.generateResponse(prompt);
    return { resume_report: response.trim() };
  } catch (e) {
    logger.warn(`Resume agent LLM call failed: ${e.message}`);
    const meta = getDynamicMetadata(state);
    return { resume_report: `# Contributor Profiling & Talent Assessment: ${meta.repo_name}\n\n## 1. Developer Profile & Summary\nBased on version control telemetry, **${meta.num_contributors}** contributors have checked changes into this project. The codebase showcases specialized focus areas aligning with the core development stack: \`${meta.primary_lang}\`, \`${meta.frontend_str}\`, and \`${meta.backend_str}\`.\n\n## 2. Talent Competency Matrix\nHere is a profiling of active repository developers according to their commit footprints:\n\n| Developer Username | Contribution Volume | Estimated Focus Areas & Tech Alignment |\n| :--- | :--- | :--- |\n${meta.contrib_rows}\n\n## 3. Onboarding & Collaboration Guide\n* **Backend Onboarding**: Target understanding the design patterns in \`${meta.backend_str}\` and database layouts in \`${meta.db_str}\`.\n* **Frontend Onboarding**: Familiarize with React/HTML/JS modules, layouts, and styles configured under \`${meta.frontend_str}\`.\n* **Verification Steps**: Developers should run initial setups using guidelines from \`${meta.deploy_str}\` and run existing tests via \`${meta.test_str}\`.` };
  }
};

export const interviewNode = async (state) => {
  logger.info("Running Interview Node...");
  const sec = state.security_report?.security_summary || {};
  const prompt = INTERVIEW_AGENT_PROMPT
    .replace("{repo_name}", state.repo_name)
    .replace("{tech_stack}", JSON.stringify(state.tech_stack_data))
    .replace("{critical}", sec.critical || 0)
    .replace("{high}", sec.high || 0)
    .replace("{medium}", sec.medium || 0)
    .replace("{low}", sec.low || 0);
    
  try {
    const response = await aiClient.generateResponse(prompt);
    return { interview_report: response.trim() };
  } catch (e) {
    logger.warn(`Interview agent LLM call failed: ${e.message}`);
    const meta = getDynamicMetadata(state);
    return { interview_report: `# Technical Onboarding Q&A & Interview Guide: ${meta.repo_name}\n\n### Question 1: What is the primary architecture of the \`${meta.repo_name}\` repository, and how should a new developer navigate it?\n* **Relevance**: Crucial for onboarding developers to avoid layout errors.\n* **Ideal Answer**: The application is structured around **${meta.primary_lang}**. UI elements utilize \`${meta.frontend_str}\`, the server runs on \`${meta.backend_str}\`, and persistence/configuration is governed by \`${meta.db_str}\`. Key folders to explore are: \`${meta.dirs_str}\`.\n\n### Question 2: How can we run local verification and deploy our updates safely?\n* **Relevance**: Essential for automated verification and pipeline consistency.\n* **Ideal Answer**: Developers check build parameters configured via \`${meta.deploy_str}\`. Quality validation is conducted by running \`${meta.test_str}\` scripts. Pipelines are compiled via continuous integration triggers defined in \`${meta.cicd_str}\`.\n\n### Question 3: How should settings and secret integrations be structured in this repository?\n* **Relevance**: Crucial for static analysis vulnerability scanning.\n* **Ideal Answer**: Hardcoded values in \`${meta.primary_lang}\` source files should be refactored. We externalize variable settings into configuration environments which are parsed at runtime, ensuring \`.env\` files are kept in \`.gitignore\`.\n\n* **Secure Code Reference Sample**:\n  * *Vulnerable code pattern*:\n    \`\`\`python\n    # API connection strings or keys stored directly in code\n    API_KEY = "abcd_secret_token_12345"\n    DATABASE_URL = "production.db"\n    \`\`\`\n  * *Secure code pattern*:\n    \`\`\`python\n    # Loaded from OS environments dynamically\n    import os\n    API_KEY = os.getenv("SERVICE_API_KEY", "")\n    DATABASE_URL = os.getenv("DATABASE_URL", ":memory:")\n    \`\`\`` };
  }
};

export const recommendationNode = async (state) => {
  logger.info("Running Recommendation Node...");
  const sec = state.security_report?.security_summary || {};
  const prompt = RECOMMENDATION_AGENT_PROMPT
    .replace("{repo_name}", state.repo_name)
    .replace("{tech_stack}", JSON.stringify(state.tech_stack_data))
    .replace("{critical}", sec.critical || 0)
    .replace("{high}", sec.high || 0)
    .replace("{medium}", sec.medium || 0)
    .replace("{low}", sec.low || 0);
    
  try {
    const response = await aiClient.generateResponse(prompt);
    return { recommendation_report: response.trim() };
  } catch (e) {
    logger.warn(`Recommendation agent LLM call failed: ${e.message}`);
    const meta = getDynamicMetadata(state);
    return { recommendation_report: `# Strategic Engineering Roadmap & Recommendations: ${meta.repo_name}\n\n## 1. Actionable Refactoring Phases\n\n### Phase 1: Security & Quality Audit (Immediate - 24 to 48 Hours)\n* **Actions**: Review raw configs to ensure all access keys and secrets are excluded from Git. Audit code patterns in \`${meta.dirs_str}\` for common injections or deserialization flaws.\n\n### Phase 2: Tech Stack Integration (Short-Term - Next Sprint)\n* **Actions**: Transition backend components utilizing \`${meta.backend_str}\` to structured models. Improve error interceptor wrappers on \`${meta.frontend_str}\` client channels.\n\n### Phase 3: Infrastructure Scale & CI/CD (Mid-to-Long Term)\n* **Actions**: Refactor database execution commands targeting \`${meta.db_str}\`. Setup clean testing matrices using \`${meta.test_str}\` and automate runs under \`${meta.cicd_str}\`.\n\n## 2. Roadmap Summary Matrix\n\n| Recommendation Item | Priority | Complexity / Effort | Action Area |\n| :--- | :--- | :--- | :--- |\n| Secure credentials & rotate old keys | High | Low (1-2 Hours) | Security |\n| Standardize modular structure inside \`${meta.dirs_str}\` | Medium | Medium (2-3 Days) | Architecture |\n| Expand test suites utilizing \`${meta.test_str}\` | Medium | Low (4-6 Hours) | Quality Assurance |\n| Containerize application configurations via \`${meta.deploy_str}\` | Low | Low (2-3 Hours) | DevOps / Deployment |` };
  }
};
