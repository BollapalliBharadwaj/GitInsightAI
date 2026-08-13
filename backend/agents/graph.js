import { END, StateGraph } from '@langchain/langgraph';
import { analysisStateChannels } from './state.js';
import {
  repositoryNode,
  techStackNode,
  securityNode,
  architectureNode,
  featureNode,
  resumeNode,
  interviewNode,
  recommendationNode
} from './nodes.js';

export const createAnalysisGraph = () => {
  const workflow = new StateGraph({ channels: analysisStateChannels });
  
  // 1. Register all specialized agent nodes
  workflow.addNode("repository", repositoryNode);
  workflow.addNode("tech_stack", techStackNode);
  workflow.addNode("security", securityNode);
  workflow.addNode("architecture", architectureNode);
  workflow.addNode("feature", featureNode);
  workflow.addNode("resume", resumeNode);
  workflow.addNode("interview", interviewNode);
  workflow.addNode("recommendation", recommendationNode);
  
  // 2. Build execution path connections
  workflow.addEdge("repository", "tech_stack");
  workflow.addEdge("tech_stack", "security");
  workflow.addEdge("security", "architecture");
  workflow.addEdge("architecture", "feature");
  workflow.addEdge("feature", "resume");
  workflow.addEdge("resume", "interview");
  workflow.addEdge("interview", "recommendation");
  workflow.addEdge("recommendation", END);
  
  // 3. Set pipeline entrance point
  workflow.setEntryPoint("repository");
  
  // 4. Compile the graph
  return workflow.compile();
};

export const analysisGraph = createAnalysisGraph();
