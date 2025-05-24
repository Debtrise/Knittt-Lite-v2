import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  XYPosition,
  addEdge,
  Connection,
  NodeDragHandler,
  ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Minus, ChevronRight, PlusCircle, Download, ZoomIn, ZoomOut, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { JourneyStep, JourneyWithSteps } from '@/app/types/journey';
import StepNode from './StepNode';
import { createJourneyStep, updateJourneyStep, deleteJourneyStep } from '@/app/utils/api';
import toast from 'react-hot-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';

// Register custom node types
const nodeTypes = {
  stepNode: StepNode,
};

interface JourneyFlowProps {
  journey: JourneyWithSteps;
  onJourneyUpdated: () => void;
  onSelectStep: (step: JourneyStep | null) => void;
  selectedStep: JourneyStep | null;
}

const getNodePosition = (index: number, stepsCount: number, existingNodes: Node[] = []): XYPosition => {
  // If we have existing nodes, try to find a good position for the new node
  if (existingNodes.length > 0) {
    // Get the last node's position
    const lastNode = existingNodes[existingNodes.length - 1];
    const lastPosition = lastNode.position;
    
    // Position the new node below the last node with some spacing
    return {
      x: lastPosition.x,
      y: lastPosition.y + 150 // Add 150px spacing
    };
  }
  
  // Default positioning for initial nodes
  const baseYPos = 50;
  const spacingY = 150;
  
  if (stepsCount <= 1) {
    return { x: 250, y: baseYPos };
  }
  
  // For multiple steps, create a more structured layout
  const x = 250;
  const y = baseYPos + (index * spacingY);
  
  return { x, y };
};

const getEdgeType = (sourceStep: JourneyStep, targetStep: JourneyStep): { type: string, animated: boolean, style: any } => {
  // Default settings
  const defaultEdge = { 
    type: 'smoothstep' as const, 
    animated: true, 
    style: { stroke: '#999', strokeWidth: 2 } 
  };
  
  // Check for conditional branches
  if (sourceStep.actionType === 'conditional_branch') {
    return {
      type: 'smoothstep' as const,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5,5' }
    };
  }
  
  // If source is a wait node, use a different style
  if (sourceStep.actionType === 'wait_for_event') {
    return {
      type: 'smoothstep' as const,
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 2 }
    };
  }
  
  return defaultEdge;
};

const buildNodesAndEdges = (
  steps: JourneyStep[], 
  selectedStepId: number | null,
  existingNodes: Node[] = []
): { nodes: Node[]; edges: Edge[] } => {
  // Sort steps by their order
  const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
  
  // Create nodes
  const nodes: Node[] = sortedSteps.map((step, index) => {
    const isFirst = index === 0;
    const isLast = index === sortedSteps.length - 1;
    
    // For the first node, set name to "Start" if it's not already set
    if (isFirst && step.name === `Step ${index + 1}`) {
      step.name = "Start";
    }
    
    // For the last node, set name to "End" and mark as exit point if it's not already set
    if (isLast && step.name === `Step ${index + 1}`) {
      step.name = "End";
      step.isExitPoint = true;
    }
    
    // Find existing node position if it exists
    const existingNode = existingNodes.find(n => n.id === `step-${step.id}`);
    const position = existingNode ? existingNode.position : getNodePosition(index, sortedSteps.length, existingNodes);
    
    return {
      id: `step-${step.id}`,
      type: 'stepNode',
      position,
      data: {
        step,
        selected: selectedStepId === step.id,
        onEdit: () => {}, // Will be replaced in component
        displayIndex: index // Add the display index (0-based)
      }
    };
  });
  
  // Create edges to connect nodes in sequence
  const edges: Edge[] = [];
  
  for (let i = 0; i < sortedSteps.length - 1; i++) {
    const currentStep = sortedSteps[i];
    const nextStep = sortedSteps[i + 1];
    
    // Don't connect if the current step is an exit point
    if (!currentStep.isExitPoint) {
      const edgeSettings = getEdgeType(currentStep, nextStep);
      
      edges.push({
        id: `edge-${currentStep.id}-${nextStep.id}`,
        source: `step-${currentStep.id}`,
        target: `step-${nextStep.id}`,
        ...edgeSettings,
        label: currentStep.actionType === 'conditional_branch' ? 'Default' : undefined,
      });
    }
  }
  
  // Add conditional branch edges (for future implementation)
  sortedSteps.forEach(step => {
    if (step.actionType === 'conditional_branch' && step.actionConfig?.branches) {
      // Example of how conditional branches would be implemented
      // We would need to enhance the data model to support this properly
      const branches = Array.isArray(step.actionConfig.branches) 
        ? step.actionConfig.branches 
        : [];
      
      branches.forEach((branch: any, index: number) => {
        if (branch.nextStepId) {
          const targetStepId = branch.nextStepId;
          edges.push({
            id: `edge-${step.id}-branch-${index}-${targetStepId}`,
            source: `step-${step.id}`,
            target: `step-${targetStepId}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 1.5 },
            label: branch.name || `Condition ${index + 1}`,
          });
        }
      });
    }
  });
  
  return { nodes, edges };
};

const JourneyFlow: React.FC<JourneyFlowProps> = ({ 
  journey, 
  onJourneyUpdated,
  onSelectStep,
  selectedStep
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  // Initialize flow with journey steps
  useEffect(() => {
    if (journey && journey.steps) {
      const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(
        journey.steps,
        selectedStep?.id || null,
        nodes
      );
      
      // Set the onEdit function for each node
      const nodesWithHandlers = newNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onEdit: (step: JourneyStep) => onSelectStep(step)
        }
      }));
      
      setNodes(nodesWithHandlers);
      setEdges(newEdges);
    }
  }, [journey, selectedStep, setNodes, setEdges, onSelectStep]);
  
  const onConnect = useCallback(
    (connection: Connection) => {
      // In the future, we could implement logic here to track connections
      // and update the step order or create branch conditions
      setEdges(eds => addEdge({
        ...connection,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#999', strokeWidth: 2 }
      }, eds));
    },
    [setEdges]
  );
  
  const onNodeDragStop: NodeDragHandler = useCallback(
    async (event, node) => {
      // When a node is dragged, you might want to persist its position
      // For now, we'll just log it, but you could implement an API call here
      console.log(`Node ${node.id} position updated:`, node.position);
      
      // Extract the step ID from the node ID
      const stepId = node.id.replace('step-', '');
      const step = journey.steps.find(s => s.id === parseInt(stepId, 10));
      
      if (step) {
        // In the future, you might want to update the position in the database
        // await updateJourneyStep(journey.id, parseInt(stepId, 10), {
        //   position: node.position
        // });
      }
    },
    [journey]
  );
  
  const handleAddStep = async () => {
    try {
      setIsAddingStep(true);
      
      // Ensure steps array exists and calculate next step order
      const steps = journey.steps || [];
      const maxOrder = steps.length > 0 
        ? Math.max(...steps.map(step => step.stepOrder)) 
        : 0;
      const nextOrder = maxOrder + 10;
      
      // Create default new step
      const newStepData = {
        name: `Step ${steps.length + 1}`,
        description: '',
        stepOrder: nextOrder,
        actionType: 'call',
        actionConfig: {},
        delayType: 'immediate',
        delayConfig: {},
        conditions: {},
        isActive: true,
        isExitPoint: false
      };
      
      await createJourneyStep(journey.id, newStepData);
      toast.success('Step added successfully');
      onJourneyUpdated();
    } catch (error) {
      console.error('Error adding step:', error);
      toast.error('Failed to add step');
    } finally {
      setIsAddingStep(false);
    }
  };
  
  const handleExportFlow = useCallback(() => {
    const flowData = {
      journeyId: journey.id,
      name: journey.name,
      steps: journey.steps
    };
    
    // Create a blob and download it
    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journey-${journey.id}-flow.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [journey]);
  
  const handleZoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  };
  
  const handleZoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  };
  
  const handleFitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
    }
  };
  
  return (
    <div className="h-[600px] w-full border border-gray-200 rounded-lg bg-white shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 2 }
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2 }}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        onInit={setReactFlowInstance}
      >
        <Background color="#f8fafc" gap={24} size={1} />
        <Controls 
          showInteractive={false}
          className="bg-white rounded-lg shadow-md border border-gray-200"
        />
        <MiniMap 
          nodeColor={(node) => {
            const step = journey.steps.find(s => `step-${s.id}` === node.id);
            if (!step) return '#cbd5e1';
            
            switch(step.actionType) {
              case 'call': return '#3b82f6'; // blue
              case 'sms': return '#10b981'; // green
              case 'email': return '#f59e0b'; // amber
              case 'tag_update': return '#8b5cf6'; // purple
              case 'status_change': return '#ec4899'; // pink
              case 'webhook': return '#6b7280'; // gray
              case 'wait_for_event': return '#14b8a6'; // teal
              case 'conditional_branch': return '#6366f1'; // indigo
              default: return '#cbd5e1';
            }
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
          className="bg-white rounded-lg shadow-md border border-gray-200"
        />
        
        <Panel position="top-right" className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
          <div className="flex flex-col space-y-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddStep}
                    disabled={isAddingStep}
                    className="flex items-center gap-2 hover:bg-gray-50"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Step
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a new step to the journey</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleZoomIn} className="hover:bg-gray-50">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom in</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleZoomOut} className="hover:bg-gray-50">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleFitView} className="hover:bg-gray-50">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fit view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportFlow}
                    className="flex items-center gap-2 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export journey as JSON</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default JourneyFlow; 