from langgraph.graph import StateGraph, END
from agents.state import AnalysisState
from agents.nodes import (
    repository_node,
    tech_stack_node,
    security_node,
    architecture_node,
    feature_node,
    resume_node,
    interview_node,
    recommendation_node
)

def create_analysis_graph():
    """
    Assembles and compiles the multi-agent analysis pipeline graph.
    Flows sequentially: repository -> tech_stack -> security -> architecture -> feature -> resume -> interview -> recommendation -> END
    """
    workflow = StateGraph(AnalysisState)
    
    # 1. Register all specialized agent nodes
    workflow.add_node("repository", repository_node)
    workflow.add_node("tech_stack", tech_stack_node)
    workflow.add_node("security", security_node)
    workflow.add_node("architecture", architecture_node)
    workflow.add_node("feature", feature_node)
    workflow.add_node("resume", resume_node)
    workflow.add_node("interview", interview_node)
    workflow.add_node("recommendation", recommendation_node)
    
    # 2. Build execution path connections
    workflow.add_edge("repository", "tech_stack")
    workflow.add_edge("tech_stack", "security")
    workflow.add_edge("security", "architecture")
    workflow.add_edge("architecture", "feature")
    workflow.add_edge("feature", "resume")
    workflow.add_edge("resume", "interview")
    workflow.add_edge("interview", "recommendation")
    workflow.add_edge("recommendation", END)
    
    # 3. Set pipeline entrance point
    workflow.set_entry_point("repository")
    
    # 4. Compile the graph
    return workflow.compile()

# Global compiled agent pipeline reference
analysis_graph = create_analysis_graph()
