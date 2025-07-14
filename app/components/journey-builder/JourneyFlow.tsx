import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  XYPosition,
  NodeDragHandler,
  ConnectionLineType,
  useReactFlow,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Minus, ChevronRight, PlusCircle, Download, ZoomIn, ZoomOut, Trash2, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { JourneyWithSteps, JourneyStep } from '@/app/types/journey';
import StepNode from './StepNode';
import JourneyNodePalette from './JourneyNodePalette';
import { createJourneyStep, updateJourneyStep, deleteJourneyStep, getAutoEnrollmentStatus, updateJourneyAutoEnrollment, testAutoEnrollment, updateJourney } from '@/app/utils/api';
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

// Utility function to ensure stepOrder is always an integer and prevent floating point errors
const ensureIntegerStepOrder = (value: number | string): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Math.floor(isNaN(num) ? 0 : num);
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

// Helper function to get the day number from a step
const getStepDay = (step: JourneyStep): number => {
  // Try to extract day from leadAgeDays condition
  if (step.conditions?.leadAgeDays?.min !== undefined && step.conditions?.leadAgeDays?.max !== undefined) {
    if (step.conditions.leadAgeDays.min === step.conditions.leadAgeDays.max) {
      return step.conditions.leadAgeDays.min + 1; // Convert 0-based to 1-based
    }
  }
  
  // Fallback: try to parse from step name
  const dayMatch = step.name.match(/day\s*(\d+)/i);
  if (dayMatch) {
    return parseInt(dayMatch[1], 10);
  }
  
  // Default to day 1
  return 1;
};

// Helper function to organize steps by days
const organizeStepsByDays = (steps: JourneyStep[]): Record<number, JourneyStep[]> => {
  const dayGroups: Record<number, JourneyStep[]> = {};
  
  steps.forEach(step => {
    const day = getStepDay(step);
    if (!dayGroups[day]) {
      dayGroups[day] = [];
    }
    dayGroups[day].push(step);
  });
  
  // Sort steps within each day by stepOrder
  Object.keys(dayGroups).forEach(day => {
    dayGroups[parseInt(day)].sort((a, b) => a.stepOrder - b.stepOrder);
  });
  
  return dayGroups;
};

// Helper function to validate and auto-pair day boundaries
const validateDayBoundaries = (steps: JourneyStep[]) => {
  const dayGroups = organizeStepsByDays(steps);
  const issues: string[] = [];
  const autoFixNeeded: Array<{ day: number; needsStart: boolean; needsEnd: boolean }> = [];

  Object.entries(dayGroups).forEach(([dayStr, daySteps]) => {
    const day = parseInt(dayStr, 10);
    const hasStart = daySteps.some(step => step.isDayStart);
    const hasEnd = daySteps.some(step => step.isDayEnd);

    if (daySteps.length > 0) {
      if (!hasStart && !hasEnd) {
        // Regular day, no issues
      } else if (hasStart && !hasEnd) {
        issues.push(`Day ${day} has a start but no end`);
        autoFixNeeded.push({ day, needsStart: false, needsEnd: true });
      } else if (!hasStart && hasEnd) {
        issues.push(`Day ${day} has an end but no start`);
        autoFixNeeded.push({ day, needsStart: true, needsEnd: false });
      }
    }
  });

  return { issues, autoFixNeeded };
};

// Helper function to get day boundary connections
const getDayBoundaryConnections = (steps: JourneyStep[]) => {
  // Day boundaries should NOT automatically connect to each other
  // Each day should be independent - day end stops the flow, day start begins fresh
  // Return empty array to prevent automatic cross-day connections
  return [];
};

const buildNodesAndEdges = (
  steps: JourneyStep[], 
  selectedStepId: number | null,
  existingNodes: Node[] = [],
  dayViewMode: boolean = false
): { nodes: Node[]; edges: Edge[] } => {
  if (dayViewMode) {
    // Day-based layout
    const dayGroups = organizeStepsByDays(steps);
    const days = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);
    const nodes: Node[] = [];
    
    days.forEach((day, dayIndex) => {
      const stepsInDay = dayGroups[day];
      
      // Add day header node
      nodes.push({
        id: `day-header-${day}`,
        type: 'default',
        position: { x: dayIndex * 400, y: 0 },
        data: { 
          label: `Day ${day}`,
          day: day,
          stepCount: stepsInDay.length,
          isDayStart: stepsInDay.some(s => s.isDayStart),
          isDayEnd: stepsInDay.some(s => s.isDayEnd),
          dayStartTime: stepsInDay.find(s => s.isDayStart)?.dayStartTime,
          dayEndTime: stepsInDay.find(s => s.isDayEnd)?.dayEndTime,
          onEdit: () => {}, // Placeholder for edit action
          onDelete: () => {} // Placeholder for delete action
        },
        style: {
          background: '#e3f2fd',
          border: '2px solid #2196f3',
          borderRadius: '8px',
          fontWeight: 'bold',
          width: '300px',
          textAlign: 'center'
        },
        draggable: false
      });
      
      // Add steps for this day
      stepsInDay.forEach((step, stepIndex) => {
        const position = { 
          x: dayIndex * 400, 
          y: 100 + (stepIndex * 200) 
        };
        
        nodes.push({
          id: `step-${step.id}`,
          type: 'stepNode',
          position,
          data: {
            step,
            selected: selectedStepId === step.id,
            onEdit: () => {},
            displayIndex: stepIndex
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left
        });
      });
    });
    
    // Create edges between steps within each day only (no cross-day connections)
    const edges: Edge[] = [];
    
    Object.values(dayGroups).forEach(daySteps => {
      const sortedDaySteps = daySteps.sort((a, b) => a.stepOrder - b.stepOrder);
      
      for (let i = 0; i < sortedDaySteps.length - 1; i++) {
        const currentStep = sortedDaySteps[i];
        const nextStep = sortedDaySteps[i + 1];
        
        // Don't connect if:
        // 1. Current step is an exit point
        // 2. Current step is a day end step 
        // 3. Next step is a day start step
        const shouldConnect = !currentStep.isExitPoint && 
                             !currentStep.isDayEnd && 
                             !nextStep.isDayStart;
        
        if (shouldConnect) {
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
    });
    
    return { nodes, edges };
  }
  
  // Original linear layout
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
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    };
  });
  
  // Create edges to connect nodes in sequence, respecting day boundaries
  const edges: Edge[] = [];
  
  for (let i = 0; i < sortedSteps.length - 1; i++) {
    const currentStep = sortedSteps[i];
    const nextStep = sortedSteps[i + 1];
    
    const currentStepDay = getStepDay(currentStep);
    const nextStepDay = getStepDay(nextStep);
    
    // Don't connect if:
    // 1. Current step is an exit point
    // 2. Current step is a day end step 
    // 3. Next step is a day start step
    // 4. Steps are from different days
    const shouldConnect = !currentStep.isExitPoint && 
                         !currentStep.isDayEnd && 
                         !nextStep.isDayStart && 
                         currentStepDay === nextStepDay;
    
    if (shouldConnect) {
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

// Helper function to auto-fix day boundary issues
const autoFixDayBoundaries = async (journeyId: number, autoFixNeeded: Array<{ day: number; needsStart: boolean; needsEnd: boolean }>) => {
  const fixPromises = autoFixNeeded.map(async (fix) => {
    const daySteps = journey.steps.filter(s => getStepDay(s) === fix.day);
    const maxStepOrder = Math.max(...daySteps.map(s => ensureIntegerStepOrder(s.stepOrder)));
    const minStepOrder = Math.min(...daySteps.map(s => ensureIntegerStepOrder(s.stepOrder)));

    if (fix.needsStart) {
      // Create day start step at the beginning of the day
      const newStep: Partial<JourneyStep> = {
        name: `Day ${fix.day} Start`,
        actionType: 'wait',
        stepOrder: minStepOrder - 1,
        isDayStart: true,
        dayStartTime: '09:00',
        conditions: {
          leadAgeDays: {
            min: fix.day - 1,
            max: fix.day - 1
          }
        },
        actionDetails: {
          waitDuration: 1,
          waitUnit: 'minutes'
        }
      };
      
      try {
        await createJourneyStep(journeyId, newStep);
        console.log(`Auto-created day start step for Day ${fix.day}`);
      } catch (error) {
        console.error(`Failed to auto-create day start for Day ${fix.day}:`, error);
      }
    }

    if (fix.needsEnd) {
      // Create day end step at the end of the day
      const newStep: Partial<JourneyStep> = {
        name: `Day ${fix.day} End`,
        actionType: 'wait',
        stepOrder: maxStepOrder + 1,
        isDayEnd: true,
        dayEndTime: '17:00',
        conditions: {
          leadAgeDays: {
            min: fix.day - 1,
            max: fix.day - 1
          }
        },
        actionDetails: {
          waitDuration: 1,
          waitUnit: 'minutes'
        }
      };
      
      try {
        await createJourneyStep(journeyId, newStep);
        console.log(`Auto-created day end step for Day ${fix.day}`);
      } catch (error) {
        console.error(`Failed to auto-create day end for Day ${fix.day}:`, error);
      }
    }
  });

  await Promise.all(fixPromises);
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
  const [dayViewMode, setDayViewMode] = useState(false);
  
  // Initialize flow with journey steps
  useEffect(() => {
    if (journey && journey.steps) {
      const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(
        journey.steps,
        selectedStep?.id || null,
        nodes,
        dayViewMode
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
  }, [journey, selectedStep, setNodes, setEdges, onSelectStep, dayViewMode]);
  
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
          // Ensure integer calculations to avoid floating point errors
          const maxOrder = Math.max(...steps.map(step => ensureIntegerStepOrder(step.stepOrder)));
          
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
              ? ensureIntegerStepOrder(sortedSteps[sortedSteps.length - 2].stepOrder)
              : 10;
            // Ensure integer stepOrder values to avoid floating point errors
            const endNodeOrder = ensureIntegerStepOrder(endNode.stepOrder);
            const lastOrder = ensureIntegerStepOrder(secondToLastOrder);
            const gap = Math.floor((endNodeOrder - lastOrder) / 2);
            const newOrder = gap > 0 ? lastOrder + gap : lastOrder + 5;
            
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
            ? ensureIntegerStepOrder(sortedSteps[sortedSteps.length - 2].stepOrder)
            : 10;
          // Ensure integer stepOrder values to avoid floating point errors
          const endNodeOrder = ensureIntegerStepOrder(endNode.stepOrder);
          const lastOrder = ensureIntegerStepOrder(secondToLastOrder);
          const gap = Math.floor((endNodeOrder - lastOrder) / 2);
          const newOrder = gap > 0 ? lastOrder + gap : lastOrder + 5;
          
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
          // Ensure integer calculations to avoid floating point errors
          const maxOrder = Math.max(...steps.map(step => ensureIntegerStepOrder(step.stepOrder)));
          
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
  
  const CustomNode = ({ data }: { data: any }) => {
    const stepDay = getStepDay(data);
    const isDayBoundary = data.isDayStart || data.isDayEnd;
    
    // Check if this step has day boundary issues
    const dayIssues = [];
    if (data.isDayStart && journey?.steps) {
      const daySteps = journey.steps.filter(s => getStepDay(s) === stepDay);
      const hasEnd = daySteps.some(s => s.isDayEnd);
      if (!hasEnd) {
        dayIssues.push('Missing day end step');
      }
    }
    if (data.isDayEnd && journey?.steps) {
      const daySteps = journey.steps.filter(s => getStepDay(s) === stepDay);
      const hasStart = daySteps.some(s => s.isDayStart);
      if (!hasStart) {
        dayIssues.push('Missing day start step');
      }
    }

    if (data.type === 'day-header') {
      return (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg shadow-lg min-w-[280px] border-2 border-blue-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{data.label}</h3>
            <div className="flex items-center space-x-2">
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                {data.stepCount} steps
              </span>
            </div>
          </div>
          <div className="text-blue-100 text-sm mt-1">
            Lead journey for day {data.day}
          </div>
        </div>
      );
    }

    return (
      <div className={`relative bg-white border-2 rounded-lg shadow-lg p-4 min-w-[250px] max-w-[300px] ${
        data.selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
      } hover:border-blue-400 transition-colors`}>
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
        
        {/* Day Boundary Indicators */}
        {isDayBoundary && (
          <div className="absolute -top-2 -right-2 flex space-x-1">
            {data.isDayStart && (
              <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                <span>🌅</span>
                <span>Start</span>
              </div>
            )}
            {data.isDayEnd && (
              <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                <span>🌆</span>
                <span>End</span>
              </div>
            )}
          </div>
        )}

        {/* Validation Warning */}
        {dayIssues.length > 0 && (
          <div className="absolute -top-3 -left-2">
            <div className="bg-red-500 text-white p-1 rounded-full" title={dayIssues.join(', ')}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 truncate pr-2">
              {data.name || `${data.actionType?.replace('_', ' ') || 'Unknown'} Step`}
            </h3>
            <div className="flex space-x-1 flex-shrink-0">
              <button
                onClick={data.onEdit}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit step"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={data.onDelete}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete step"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Action Type Badge */}
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              data.actionType === 'call' ? 'bg-green-100 text-green-800' :
              data.actionType === 'sms' ? 'bg-blue-100 text-blue-800' :
              data.actionType === 'email' ? 'bg-purple-100 text-purple-800' :
              data.actionType === 'wait' ? 'bg-yellow-100 text-yellow-800' :
              data.actionType === 'conditional_branch' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {data.actionType?.replace('_', ' ') || 'Unknown'}
            </span>
            
            {stepDay !== 1 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                📅 Day {stepDay} leads
              </span>
            )}
          </div>

          {/* Day Boundary Time Info */}
          {isDayBoundary && (
            <div className="space-y-1">
              {data.isDayStart && data.dayStartTime && (
                <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                  🌅 Starts at {data.dayStartTime}
                </div>
              )}
              {data.isDayEnd && data.dayEndTime && (
                <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                  🌆 Ends at {data.dayEndTime}
                </div>
              )}
            </div>
          )}

          {/* Step Details */}
          <div className="text-sm text-gray-600">
            <div>Order: {ensureIntegerStepOrder(data.stepOrder)}</div>
            {data.conditions?.leadAgeDays && (
              <div className="text-xs text-purple-600">
                Lead age: {data.conditions.leadAgeDays.min === data.conditions.leadAgeDays.max 
                  ? `${data.conditions.leadAgeDays.min} days`
                  : `${data.conditions.leadAgeDays.min}-${data.conditions.leadAgeDays.max} days`}
              </div>
            )}
          </div>

          {/* Validation Issues */}
          {dayIssues.length > 0 && (
            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
              ⚠️ {dayIssues.join(', ')}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-full w-full flex flex-col bg-white" ref={reactFlowWrapper}>
      {/* Journey Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="repeatDays" className="font-medium text-gray-700">Repeat Days:</label>
            <input
              id="repeatDays"
              type="number"
              min={1}
              max={365}
              step={1}
              value={journey.repeatDays || 1}
              onChange={async (e) => {
                const rawValue = e.target.value;
                // Validate and sanitize the input
                const numericValue = parseFloat(rawValue);
                
                // Only process if it's a valid positive integer
                if (!isNaN(numericValue) && numericValue > 0 && Number.isInteger(numericValue)) {
                  const value = Math.max(1, Math.min(365, Math.floor(numericValue)));
                  try {
                    await updateJourney(journey.id, { repeatDays: value });
                    onJourneyUpdated();
                  } catch (error) {
                    console.error('Error updating repeat days:', error);
                  }
                }
              }}
              onBlur={(e) => {
                // Ensure the field always has a valid value on blur
                const value = parseInt(e.target.value, 10);
                if (isNaN(value) || value < 1) {
                  e.target.value = '1';
                }
              }}
              className="w-20 px-2 py-1 border rounded text-sm"
            />
            <span className="text-xs text-gray-500">How many days to repeat the journey steps</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">View Mode:</label>
            <div className="flex bg-white border rounded-lg p-1">
              <button
                onClick={() => setDayViewMode(false)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  !dayViewMode 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Linear Flow
              </button>
              <button
                onClick={() => setDayViewMode(true)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  dayViewMode 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Day View
              </button>
            </div>
          </div>
          
          {dayViewMode && (
            <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border">
              📅 Steps organized by lead age days
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 relative">
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
    </div>
  );
};

export default JourneyFlow; 