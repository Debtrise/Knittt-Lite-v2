import React, { useCallback, useEffect, useState, useRef } from 'react';
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
  ConnectionLineType,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Minus, ChevronRight, PlusCircle, Download, ZoomIn, ZoomOut, Trash2, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { JourneyStep, JourneyWithSteps } from '@/app/types/journey';
import StepNode from './StepNode';
import JourneyNodePalette from './JourneyNodePalette';
import { createJourneyStep, updateJourneyStep, deleteJourneyStep, getAutoEnrollmentStatus, updateJourneyAutoEnrollment, testAutoEnrollment } from '@/app/utils/api';
import toast from 'react-hot-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useToast } from '@/app/components/ui/use-toast';
import dagre from 'dagre';

// Add type declaration for dagre
declare module 'dagre' {
  interface Graph {
    setDefaultEdgeLabel(callback: () => any): void;
    setGraph(options: any): void;
    setNode(id: string, node: any): void;
    setEdge(source: string, target: string): void;
    node(id: string): { x: number; y: number };
  }

  function graphlib(): Graph;
  function layout(graph: Graph): void;
}

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
  // Improved positioning - centered flow with proper spacing
  const canvasWidth = 1200; // Better canvas width assumption
  const nodeWidth = 288; // StepNode width (w-72 = 288px)
  const baseX = (canvasWidth / 2) - (nodeWidth / 2); // Center horizontally
  const baseY = 80;
  const spacingY = 200; // Increased spacing for better clarity and reduced overlap
  
  // If we have existing nodes, position relative to them for better alignment
  if (existingNodes.length > 0) {
    // Find the lowest positioned node to stack properly
    const lowestNode = existingNodes.reduce((lowest, current) => 
      current.position.y > lowest.position.y ? current : lowest
    );
    
    return {
      x: baseX, // Keep consistent x position for perfect alignment
      y: lowestNode.position.y + spacingY
    };
  }
  
  // Calculate position based on index for clean vertical flow
  return { 
    x: baseX, // Perfect centering
    y: baseY + (index * spacingY) 
  };
};

const getEdgeType = (sourceStep: JourneyStep, targetStep: JourneyStep): { type: string, animated: boolean, style: any } => {
  // Default settings
  const defaultEdge = { 
    type: 'smoothstep' as const, 
    animated: true, 
    style: { stroke: '#94a3b8', strokeWidth: 3 },
    markerEnd: {
      type: 'arrowclosed',
      color: '#94a3b8',
      width: 20,
      height: 20
    }
  };
  
  // Check for conditional branches
  if (sourceStep.actionType === 'conditional_branch') {
    return {
      type: 'smoothstep' as const,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 3, strokeDasharray: '5,5' },
      markerEnd: {
        type: 'arrowclosed',
        color: '#6366f1',
        width: 20,
        height: 20
      }
    };
  }
  
  // If source is a wait node, use a different style
  if (sourceStep.actionType === 'wait_for_event') {
    return {
      type: 'smoothstep' as const,
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: {
        type: 'arrowclosed',
        color: '#10b981',
        width: 20,
        height: 20
      }
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
    const isStart = step.name === 'Start' || (isFirst && step.stepOrder <= 10);
    const isEnd = step.isExitPoint || step.name === 'End';
    
    // Use saved position if it exists, or existing node position, or calculate default position
    let position: XYPosition;
    if (step.position) {
      // Use saved position from database
      position = step.position;
    } else {
      // Find existing node position if it exists
      const existingNode = existingNodes.find(n => n.id === `step-${step.id}`);
      position = existingNode ? existingNode.position : getNodePosition(index, sortedSteps.length, existingNodes);
    }
    
    return {
      id: `step-${step.id}`,
      type: 'stepNode',
      position,
      data: {
        step: {
          ...step,
          // Ensure proper naming for start/end nodes
          name: isStart && step.name.startsWith('Step') ? 'Start' : 
                isEnd && step.name.startsWith('Step') ? 'End' : step.name
        },
        selected: selectedStepId === step.id,
        onEdit: () => {}, // Will be replaced in component
        displayIndex: isStart || isEnd ? undefined : index // Don't show numbers on start/end nodes
      },
      sourcePosition: 'right',
      targetPosition: 'left'
    };
  });
  
  // Create edges to automatically connect all nodes in sequence
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
        sourceHandle: 'right',
        targetHandle: 'left'
      });
    }
  }
  
  return { nodes, edges };
};

const JourneyFlow: React.FC<JourneyFlowProps> = ({ 
  journey, 
  onJourneyUpdated,
  onSelectStep,
  selectedStep
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [autoEnrollStatus, setAutoEnrollStatus] = useState<boolean>(journey.triggerCriteria.autoEnroll || false);
  const [isTogglingAutoEnroll, setIsTogglingAutoEnroll] = useState(false);
  const [isTestingAutoEnroll, setIsTestingAutoEnroll] = useState(false);
  const [showNodePalette, setShowNodePalette] = useState(false);
  
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
    // Update auto-enroll status from journey data
    setAutoEnrollStatus(journey.triggerCriteria.autoEnroll || false);
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
      // When a node is dragged, persist its position
      console.log(`Node ${node.id} position updated:`, node.position);
      
      // Extract the step ID from the node ID
      const stepId = node.id.replace('step-', '');
      const step = journey.steps.find(s => s.id === parseInt(stepId, 10));
      
      if (step) {
        try {
          // Update the position in the database
          await updateJourneyStep(journey.id, parseInt(stepId, 10), {
            position: node.position
          });
          // Remove the success toast to avoid spam
          console.log('Step position updated successfully');
        } catch (error) {
          console.error('Error updating step position:', error);
          toast.error('Failed to update step position');
        }
      }
    },
    [journey]
  );

  // Handle drag over for node creation
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop to create new nodes
  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      
      if (!reactFlowInstance) return;
      
      try {
        const stepTypeData = event.dataTransfer.getData('application/reactflow');
        if (!stepTypeData) return;
        
        const stepType = JSON.parse(stepTypeData);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        
        const steps = journey.steps || [];
        const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
        
        // Generate temporary IDs for immediate UI updates
        const tempId1 = `temp-${Date.now()}`;
        const tempId2 = `temp-${Date.now() + 1}`;
        
        if (steps.length === 0) {
          // First node: Create Start node
          const tempStartNode = {
            id: tempId1,
            type: 'stepNode',
            position: position,
            data: {
              step: {
                id: -1,
                name: 'Start',
                description: 'Journey starting point',
                journeyId: journey.id,
                stepOrder: 10,
                actionType: stepType.actionType || 'call',
                actionConfig: {},
                delayType: 'immediate',
                delayConfig: {},
                conditions: {},
                isActive: true,
                isExitPoint: false,
                position: position
              },
              selected: false,
              onEdit: (step: any) => onSelectStep(step)
            }
          };
          
          // Add temporary node to UI immediately
          setNodes(nds => [...nds, tempStartNode]);
          
          const startStepData = {
            name: 'Start',
            description: 'Journey starting point',
            stepOrder: 10,
            actionType: stepType.actionType || 'call',
            actionConfig: {},
            delayType: 'immediate',
            delayConfig: {},
            conditions: {},
            isActive: true,
            isExitPoint: false,
            position: position
          };
          
          // Create the actual step in the background
          createJourneyStep(journey.id, startStepData).then(() => {
            toast.success('Start node created! Drag a second step to auto-generate the end node.');
            onJourneyUpdated(); // This will replace temp nodes with real ones
          }).catch((error) => {
            console.error('Error creating start step:', error);
            toast.error('Failed to create start step');
            // Remove temp node on error
            setNodes(nds => nds.filter(n => n.id !== tempId1));
          });
          
        } else if (steps.length === 1) {
          // Second node: Create regular step and auto-generate End node
          const maxOrder = Math.max(...steps.map(step => step.stepOrder));
          
          const tempStepNode = {
            id: tempId1,
            type: 'stepNode',
            position: position,
            data: {
              step: {
                id: -1,
                name: stepType.name || `Step 2`,
                description: stepType.description || '',
                journeyId: journey.id,
                stepOrder: maxOrder + 10,
                actionType: stepType.actionType || 'call',
                actionConfig: {},
                delayType: 'immediate',
                delayConfig: {},
                conditions: {},
                isActive: true,
                isExitPoint: false,
                position: position
              },
              selected: false,
              onEdit: (step: any) => onSelectStep(step)
            }
          };
          
          const tempEndNode = {
            id: tempId2,
            type: 'stepNode',
            position: { x: position.x, y: position.y + 200 },
            data: {
              step: {
                id: -2,
                name: 'End',
                description: 'Journey completion point',
                journeyId: journey.id,
                stepOrder: maxOrder + 20,
                actionType: 'delay',
                actionConfig: {},
                delayType: 'immediate',
                delayConfig: {},
                conditions: {},
                isActive: true,
                isExitPoint: true,
                position: { x: position.x, y: position.y + 200 }
              },
              selected: false,
              onEdit: (step: any) => onSelectStep(step)
            }
          };
          
          // Add temporary nodes to UI immediately
          setNodes(nds => [...nds, tempStepNode, tempEndNode]);
          
          const newStepData = {
            name: stepType.name || `Step 2`,
            description: stepType.description || '',
            stepOrder: maxOrder + 10,
            actionType: stepType.actionType || 'call',
            actionConfig: {},
            delayType: 'immediate',
            delayConfig: {},
            conditions: {},
            isActive: true,
            isExitPoint: false,
            position: position
          };
          
          // Create both steps in the background
          Promise.all([
            createJourneyStep(journey.id, newStepData),
            createJourneyStep(journey.id, {
              name: 'End',
              description: 'Journey completion point',
              stepOrder: maxOrder + 20,
              actionType: 'delay',
              actionConfig: {},
              delayType: 'immediate',
              delayConfig: {},
              conditions: {},
              isActive: true,
              isExitPoint: true,
              position: { x: position.x, y: position.y + 200 }
            })
          ]).then(() => {
            toast.success('Step added and End node generated');
            onJourneyUpdated(); // This will replace temp nodes with real ones
          }).catch((error) => {
            console.error('Error creating steps:', error);
            toast.error('Failed to create steps');
            // Remove temp nodes on error
            setNodes(nds => nds.filter(n => n.id !== tempId1 && n.id !== tempId2));
          });
          
        } else {
          // Subsequent nodes: Insert before end node
          const endNode = sortedSteps.find(step => step.isExitPoint);
          
          if (endNode) {
            const secondToLastOrder = sortedSteps.length > 1 
              ? sortedSteps[sortedSteps.length - 2].stepOrder 
              : 10;
            const newOrder = secondToLastOrder + ((endNode.stepOrder - secondToLastOrder) / 2);
            
            const tempStepNode = {
              id: tempId1,
              type: 'stepNode',
              position: position,
              data: {
                step: {
                  id: -1,
                  name: stepType.name || `Step ${steps.length}`,
                  description: stepType.description || '',
                  journeyId: journey.id,
                  stepOrder: newOrder,
                  actionType: stepType.actionType || 'call',
                  actionConfig: {},
                  delayType: 'immediate',
                  delayConfig: {},
                  conditions: {},
                  isActive: true,
                  isExitPoint: false,
                  position: position
                },
                selected: false,
                onEdit: (step: any) => onSelectStep(step)
              }
            };
            
            // Add temporary node to UI immediately
            setNodes(nds => [...nds, tempStepNode]);
            
            const newStepData = {
              name: stepType.name || `Step ${steps.length}`,
              description: stepType.description || '',
              stepOrder: newOrder,
              actionType: stepType.actionType || 'call',
              actionConfig: {},
              delayType: 'immediate',
              delayConfig: {},
              conditions: {},
              isActive: true,
              isExitPoint: false,
              position: position
            };
            
            // Create the step in the background
            createJourneyStep(journey.id, newStepData).then(() => {
              toast.success('Step inserted before End node');
              onJourneyUpdated(); // This will replace temp nodes with real ones
            }).catch((error) => {
              console.error('Error creating step:', error);
              toast.error('Failed to create step');
              // Remove temp node on error
              setNodes(nds => nds.filter(n => n.id !== tempId1));
            });
          }
        }
        
      } catch (error) {
        console.error('Error creating step:', error);
        toast.error('Failed to create step');
      }
    },
    [journey, reactFlowInstance, screenToFlowPosition, onJourneyUpdated, onSelectStep, setNodes]
  );

  const handleAddStep = async () => {
    try {
      setIsAddingStep(true);
      
      const steps = journey.steps || [];
      
      if (steps.length === 0) {
        // First step: Create Start node
        const startStepData = {
          name: 'Start',
          description: 'Journey starting point',
          stepOrder: 10,
          actionType: 'call',
          actionConfig: {},
          delayType: 'immediate',
          delayConfig: {},
          conditions: {},
          isActive: true,
          isExitPoint: false,
          position: { x: 456, y: 80 } // Use the calculated center position
        };
        
        await createJourneyStep(journey.id, startStepData);
        
        // Automatically create End node
        const endStepData = {
          name: 'End',
          description: 'Journey completion point',
          stepOrder: 20,
          actionType: 'delay', // End nodes are typically delay/wait actions
          actionConfig: {},
          delayType: 'immediate',
          delayConfig: {},
          conditions: {},
          isActive: true,
          isExitPoint: true,
          position: { x: 456, y: 280 }
        };
        
        await createJourneyStep(journey.id, endStepData);
        toast.success('Start and End nodes created');
      } else {
        // Find the current end node
        const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
        const endNode = sortedSteps.find(step => step.isExitPoint);
        
        if (endNode) {
          // Insert new step before the end node
          const secondToLastOrder = sortedSteps.length > 1 
            ? sortedSteps[sortedSteps.length - 2].stepOrder 
            : 10;
          const newOrder = secondToLastOrder + ((endNode.stepOrder - secondToLastOrder) / 2);
          
          const newStepData = {
            name: `Step ${steps.length}`, // Don't count the end node
            description: '',
            stepOrder: newOrder,
            actionType: 'call',
            actionConfig: {},
            delayType: 'immediate',
            delayConfig: {},
            conditions: {},
            isActive: true,
            isExitPoint: false,
            // Position the new node between the previous node and end node
            position: { 
              x: 456, 
              y: 80 + ((steps.length - 1) * 200) // Use improved spacing
            }
          };
          
          await createJourneyStep(journey.id, newStepData);
          toast.success('Step inserted before End node');
        } else {
          // No end node exists, create a regular step and an end node
          const maxOrder = Math.max(...steps.map(step => step.stepOrder));
          
          const newStepData = {
            name: `Step ${steps.length + 1}`,
            description: '',
            stepOrder: maxOrder + 10,
            actionType: 'call',
            actionConfig: {},
            delayType: 'immediate',
            delayConfig: {},
            conditions: {},
            isActive: true,
            isExitPoint: false,
            position: { x: 456, y: 80 + (steps.length * 200) }
          };
          
          await createJourneyStep(journey.id, newStepData);
          
          // Create end node
          const endStepData = {
            name: 'End',
            description: 'Journey completion point',
            stepOrder: maxOrder + 20,
            actionType: 'delay',
            actionConfig: {},
            delayType: 'immediate',
            delayConfig: {},
            conditions: {},
            isActive: true,
            isExitPoint: true,
            position: { x: 456, y: 80 + ((steps.length + 1) * 200) }
          };
          
          await createJourneyStep(journey.id, endStepData);
          toast.success('Step and End node added');
        }
      }
      
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
  
  const handleToggleAutoEnroll = async () => {
    try {
      setIsTogglingAutoEnroll(true);
      const newStatus = !autoEnrollStatus;
      await updateJourneyAutoEnrollment(journey.id, { autoEnroll: newStatus });
      setAutoEnrollStatus(newStatus);
      toast.success(`Auto-enrollment ${newStatus ? 'enabled' : 'disabled'} successfully`);
      onJourneyUpdated();
    } catch (error) {
      console.error('Error toggling auto-enrollment:', error);
      toast.error('Failed to toggle auto-enrollment');
    } finally {
      setIsTogglingAutoEnroll(false);
    }
  };
  
  const handleTestAutoEnroll = async () => {
    try {
      setIsTestingAutoEnroll(true);
      const response = await testAutoEnrollment(journey.id, { dryRun: true, sampleSize: 10 });
      toast.success(`Auto-enrollment test completed: ${response.message || 'Success'}`);
      console.log('Auto-enrollment test results:', response);
    } catch (error) {
      console.error('Error testing auto-enrollment:', error);
      toast.error('Failed to test auto-enrollment');
    } finally {
      setIsTestingAutoEnroll(false);
    }
  };
  
  // Apply auto-layout when needed
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const hasCustomPositions = journey.steps.some(step => 
      step.position && 
      (step.position.x !== 250 || step.position.y !== 50 + ((step.stepOrder / 10 - 1) * 150))
    );
    
    // Only apply auto-layout on initial load or when step count changes
    if (!hasCustomPositions && nodes.length > 2) {
      const graph = new dagre.graphlib.Graph();
      graph.setDefaultEdgeLabel(() => ({}));
      graph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 50 });

      // Create a copy of nodes and edges to avoid state updates
      const currentNodes = [...nodes];
      const currentEdges = [...edges];

      currentNodes.forEach((node) => {
        graph.setNode(node.id, { width: 280, height: 120 });
      });

      currentEdges.forEach((edge) => {
        graph.setEdge(edge.source, edge.target);
      });

      dagre.layout(graph);

      const layoutedNodes = currentNodes.map((node) => {
        const nodeWithPosition = graph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - 140,
            y: nodeWithPosition.y - 60,
          },
        };
      });

      // Batch the state update
      setNodes(layoutedNodes);
    }
  }, [journey.steps.length]); // Only depend on step count changes
  
  return (
    <div className="h-[600px] w-full border border-gray-200 rounded-lg bg-white shadow-sm" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 3 },
          animated: true,
          markerEnd: {
            type: 'arrowclosed',
            color: '#94a3b8',
            width: 20,
            height: 20
          }
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 3 }}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        onInit={setReactFlowInstance}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        snapToGrid={true}
        snapGrid={[15, 15]}
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
              case 'sms_twilio': return '#8b5cf6'; // purple
              case 'sms_meera': return '#f97316'; // orange
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
        
        {/* Node Palette Panel */}
        {showNodePalette && (
          <Panel position="top-left" className="max-h-[500px] overflow-auto bg-white p-2 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Add Journey Steps</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNodePalette(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <JourneyNodePalette />
          </Panel>
        )}

        <Panel position="top-right" className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
          <div className="flex flex-col space-y-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showNodePalette ? "default" : "outline"}
                    size="sm" 
                    onClick={() => setShowNodePalette(!showNodePalette)}
                    className="flex items-center gap-2 hover:bg-gray-50"
                  >
                    {showNodePalette ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showNodePalette ? 'Close Palette' : 'Add Steps'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showNodePalette ? 'Close step palette' : 'Open step palette to drag and drop'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
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
                    Quick Add
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quickly add a step to the journey</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={autoEnrollStatus ? "default" : "outline"} 
                    size="sm" 
                    onClick={handleToggleAutoEnroll}
                    disabled={isTogglingAutoEnroll}
                    className="flex items-center gap-2 hover:bg-gray-50"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {autoEnrollStatus ? 'Auto-Enroll On' : 'Auto-Enroll Off'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle auto-enrollment for this journey</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Commented out until backend supports test auto-enroll endpoint
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleTestAutoEnroll}
                    disabled={isTestingAutoEnroll}
                    className="flex items-center gap-2 hover:bg-gray-50"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Test Auto-Enroll
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Test auto-enrollment for this journey</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            */}
            
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