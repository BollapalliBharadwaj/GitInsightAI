from typing import TypedDict, List, Dict, Any, Optional

class AnalysisState(TypedDict):
    """
    TypedDict schema representing the shared state dictionary passed 
    between LangGraph nodes during repository multi-agent analysis.
    """
    repo_url: str
    owner: str
    repo_name: str
    default_branch: str
    file_paths: List[str]
    tree_raw: List[Dict[str, Any]]
    languages: Dict[str, int]
    contributors: List[Dict[str, Any]]
    tech_stack_data: Dict[str, Any]
    security_report: Dict[str, Any]
    
    # Outputs filled dynamically by agent nodes
    architecture_report: Optional[str]
    feature_report: Optional[str]
    resume_report: Optional[str]
    interview_report: Optional[str]
    recommendation_report: Optional[str]
