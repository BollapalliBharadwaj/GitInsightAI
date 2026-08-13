export const analysisStateChannels = {
  repo_url: { value: (x, y) => (y !== undefined ? y : x), default: () => null },
  owner: { value: (x, y) => (y !== undefined ? y : x), default: () => null },
  repo_name: { value: (x, y) => (y !== undefined ? y : x), default: () => null },
  default_branch: { value: (x, y) => (y !== undefined ? y : x), default: () => null },
  file_paths: { value: (x, y) => (y !== undefined ? y : x), default: () => [] },
  tree_raw: { value: (x, y) => (y !== undefined ? y : x), default: () => [] },
  languages: { value: (x, y) => (y !== undefined ? y : x), default: () => ({}) },
  contributors: { value: (x, y) => (y !== undefined ? y : x), default: () => [] },
  tech_stack_data: { value: (x, y) => (y !== undefined ? y : x), default: () => ({}) },
  security_report: { value: (x, y) => (y !== undefined ? y : x), default: () => ({}) },
  
  architecture_report: { value: (x, y) => (y !== undefined ? y : x), default: () => null },
  feature_report: { value: (x, y) => (y !== undefined ? y : x), default: () => null },
  resume_report: { value: (x, y) => (y !== undefined ? y : x), default: () => null },
  interview_report: { value: (x, y) => (y !== undefined ? y : x), default: () => null },
  recommendation_report: { value: (x, y) => (y !== undefined ? y : x), default: () => null },
};
