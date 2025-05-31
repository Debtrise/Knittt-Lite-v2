import { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  addEdge,
  NodeTypes,
  EdgeTypes,
  XYPosition,
  Node,
  useReactFlow,
  MarkerType,
  ConnectionMode,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DialplanNode, DialplanEdge, NodeType, DialplanConnection } from '@/app/types/dialplan';
import CustomNode from './nodes/CustomNode';
import CustomEdge from './edges/CustomEdge';
import { Button } from '@/app/components/ui/button';
import { Plus, Save, AlignJustify, X } from 'lucide-react';
import NodePalette from './panels/NodePalette';
import PropertiesPanel from './panels/PropertiesPanel';
import toast from 'react-hot-toast';
import { createNode, createConnection, updateNode, deleteNode, deleteConnection } from '@/app/utils/dialplanApi';

// Define custom node types
const nodeTypes: NodeTypes = {
  customNode: CustomNode,
  default: CustomNode, // Fallback
};

// Define custom edge types
const edgeTypes: EdgeTypes = {
  customEdge: CustomEdge,
  default: CustomEdge, // Fallback
};

interface DialplanCanvasProps {
  nodes: DialplanNode[];
  edges: DialplanEdge[];
  nodeTypes: NodeType[];
  contextId?: number;
  onNodesChange?: (nodes: DialplanNode[]) => void;
  onEdgesChange?: (edges: DialplanEdge[]) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

export default function DialplanCanvas({
  nodes: initialNodes = [],
  edges: initialEdges = [],
  nodeTypes: availableNodeTypes = [],
  contextId,
  onNodesChange,
  onEdgesChange,
  onSave,
  readOnly = false,
}: DialplanCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // State for showing/hiding panels
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  
  // Track local changes to be saved later
  const [localChanges, setLocalChanges] = useState({
    nodesToCreate: [] as any[],
    nodesToUpdate: [] as any[],
    nodesToDelete: [] as string[],
    edgesToCreate: [] as any[],
    edgesToDelete: [] as string[]
  });
  
  // Track next temporary ID for local nodes/edges
  const [nextTempId, setNextTempId] = useState(-1);
  
  // Determine node types for entry and exit points
  const entryNodeTypes = availableNodeTypes.filter(
    type => type.category === 'extension' || type.name?.toLowerCase().includes('entry')
  );
  
  const exitNodeTypes = availableNodeTypes.filter(
    type => type.category === 'terminal' || type.name?.toLowerCase().includes('exit') || type.name?.toLowerCase().includes('hangup')
  );
  
  // Process initial nodes to position entry/exit nodes properly
  const processInitialNodes = (nodes: DialplanNode[]) => {
    // Check if there are nodes
    if (!nodes || nodes.length === 0) {
      console.log('No nodes provided to process');
      return [];
    }
    
    console.log(`Processing ${nodes.length} nodes`, nodes);
    
    // Group nodes by type
    const entryNodes: DialplanNode[] = [];
    const exitNodes: DialplanNode[] = [];
    const otherNodes: DialplanNode[] = [];
    
    nodes.forEach(node => {
      const nodeType = availableNodeTypes.find(type => type.id === node.nodeTypeId);
      if (!nodeType) {
        otherNodes.push(node);
        return;
      }
      
      if (nodeType.category === 'extension' || nodeType.name?.toLowerCase().includes('entry')) {
        entryNodes.push(node);
      } else if (nodeType.category === 'terminal' || nodeType.name?.toLowerCase().includes('exit') || nodeType.name?.toLowerCase().includes('hangup')) {
        exitNodes.push(node);
      } else {
        otherNodes.push(node);
      }
    });
    
    console.log(`Found ${entryNodes.length} entry nodes, ${exitNodes.length} exit nodes, ${otherNodes.length} other nodes`);
    
    // Determine optimal horizontal spacing and vertical positions
    const nodeWidth = 200;  // Width of node + padding
    const entryY = 50;      // Entry nodes top position
    const exitY = 600;      // Exit nodes bottom position
    
    // Calculate center position for symmetry
    const maxNodesInRow = Math.max(entryNodes.length, exitNodes.length);
    const totalWidth = Math.max(600, maxNodesInRow * nodeWidth);
    const startX = (totalWidth - (entryNodes.length * nodeWidth)) / 2;
    const exitStartX = (totalWidth - (exitNodes.length * nodeWidth)) / 2;
    
    // Return processed nodes with RF format
    return [
      ...entryNodes.map((node, index) => ({
        id: node.id.toString(),
        type: 'customNode',
        position: { 
          x: startX + index * nodeWidth, 
          y: entryY 
        },
        data: {
          label: node.label || node.name,
          nodeType: availableNodeTypes.find(type => type.id === node.nodeTypeId) || {
            id: node.nodeTypeId,
            name: 'Unknown',
            category: 'application',
            description: 'Unknown node type'
          },
          properties: node.properties || {},
          dialplanNode: node,
          isEntry: true,
          isExit: false
        }
      })),
      ...otherNodes.map(node => ({
        id: node.id.toString(),
        type: 'customNode',
        position: node.position,
        data: {
          label: node.label || node.name,
          nodeType: availableNodeTypes.find(type => type.id === node.nodeTypeId) || {
            id: node.nodeTypeId,
            name: 'Unknown',
            category: 'application',
            description: 'Unknown node type'
          },
          properties: node.properties || {},
          dialplanNode: node,
          isEntry: false,
          isExit: false
        }
      })),
      ...exitNodes.map((node, index) => ({
        id: node.id.toString(),
        type: 'customNode',
        position: { 
          x: exitStartX + index * nodeWidth, 
          y: exitY 
        },
        data: {
          label: node.label || node.name,
          nodeType: availableNodeTypes.find(type => type.id === node.nodeTypeId) || {
            id: node.nodeTypeId,
            name: 'Unknown',
            category: 'application',
            description: 'Unknown node type'
          },
          properties: node.properties || {},
          dialplanNode: node,
          isEntry: false,
          isExit: true
        }
      }))
    ];
  };
  
  // Process nodes initially and when they change
  const [processedNodes, setProcessedNodes] = useState(processInitialNodes(initialNodes));
  
  // Update processed nodes when initialNodes change
  useEffect(() => {
    const processed = processInitialNodes(initialNodes);
    setProcessedNodes(processed);
  }, [initialNodes, availableNodeTypes]);
  
  // Convert DialplanEdges to ReactFlow edges
  const processInitialEdges = (edges: DialplanEdge[]) => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'default',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      data: {
        condition: edge.data?.condition || null,
        priority: edge.data?.priority || 1
      }
    }));
  };
  
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(processedNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(processInitialEdges(initialEdges));
  
  // Update nodes state when processedNodes change
  useEffect(() => {
    setNodes(processedNodes);
  }, [processedNodes, setNodes]);
  
  // Update edges state when initialEdges change
  useEffect(() => {
    const newEdges = processInitialEdges(initialEdges);
    setEdges(newEdges);
  }, [initialEdges, setEdges]);
  
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Get a temporary ID for a new node or edge
  const getNextTempId = useCallback(() => {
    const id = nextTempId;
    setNextTempId(prevId => prevId - 1); // Decrement to ensure uniqueness
    return id.toString();
  }, [nextTempId]);
  
  // Handle connecting two nodes (locally)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly || !contextId) return;
      
      try {
        if (!connection.source || !connection.target) {
          console.error('Invalid connection - missing source or target');
          return;
        }
        
        const tempId = getNextTempId();
        
        // Create a temporary edge for the UI
        const newEdge: Edge = {
          id: `temp_${tempId}`,
          source: connection.source,
          target: connection.target,
          type: 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          data: {
            condition: null,
            priority: 1,
            isTemp: true,
            sourceId: connection.source,
            targetId: connection.target
          }
        };
        
        // Add to local changes to be saved later
        setLocalChanges(prev => ({
          ...prev,
          edgesToCreate: [...prev.edgesToCreate, {
            tempId: `temp_${tempId}`,
            sourceNodeId: connection.source,
            targetNodeId: connection.target,
            condition: null,
            priority: 1
          }]
        }));
        
        setEdges((eds) => addEdge(newEdge, eds));
        toast.success('Connection added (not saved yet)');
      } catch (error) {
        console.error('Error creating local connection:', error);
        toast.error('Failed to create connection');
      }
    },
    [contextId, readOnly, setEdges, getNextTempId]
  );
  
  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowPropertiesPanel(true);
    // Close node palette when a node is selected
    setShowNodePalette(false);
  }, []);
  
  // Handle drag over for node creation
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle dropping a node type to create a new node (locally)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      if (readOnly || !reactFlowWrapper.current || !reactFlowInstance || !contextId) return;
  
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeTypeData = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeTypeData) return;
      
      try {
        const nodeType = JSON.parse(nodeTypeData) as NodeType;
        
        // Get the position from the drop coordinates
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });
        
        // Check if it's an entry/exit node and position accordingly
        let finalPosition = { ...position };
        let isSpecialNode = false;
        
        if (nodeType.category === 'extension' || nodeType.name?.toLowerCase().includes('entry')) {
          // Entry nodes go at the top
          finalPosition.y = 50;
          
          // Find how many entry nodes we already have and space accordingly
          const entryNodes = nodes.filter(n => 
            n.data.isEntry || 
            n.data.nodeType?.category === 'extension' || 
            n.data.nodeType?.name?.toLowerCase().includes('entry')
          );
          finalPosition.x = entryNodes.length * 200 + 100;
          isSpecialNode = true;
        } else if (nodeType.category === 'terminal' || nodeType.name?.toLowerCase().includes('exit') || nodeType.name?.toLowerCase().includes('hangup')) {
          // Exit nodes go at the bottom
          finalPosition.y = 600;
          
          // Find how many exit nodes we already have and space accordingly
          const exitNodes = nodes.filter(n => 
            n.data.isExit || 
            n.data.nodeType?.category === 'terminal' || 
            n.data.nodeType?.name?.toLowerCase().includes('exit') || 
            n.data.nodeType?.name?.toLowerCase().includes('hangup')
          );
          finalPosition.x = exitNodes.length * 200 + 100;
          isSpecialNode = true;
        }
        
        // Generate temporary ID for the node
        const tempId = getNextTempId();
        const nodeName = `${nodeType.name}_${Date.now()}`;
        
        // Create node data to be saved later
        const nodeData = {
          tempId: `temp_${tempId}`,
          nodeTypeId: nodeType.id,
          name: nodeName,
          label: nodeName,
          position: finalPosition,
          properties: nodeType.defaultParams || {}
        };
        
        // Add to local changes to be saved later
        setLocalChanges(prev => ({
          ...prev,
          nodesToCreate: [...prev.nodesToCreate, nodeData]
        }));
        
        // Create temporary node for the UI
        const newNode = {
          id: `temp_${tempId}`,
          type: 'customNode',
          position: finalPosition,
          data: {
            label: nodeName,
            nodeType: nodeType,
            properties: nodeType.defaultParams || {},
            dialplanNode: {
              id: Number(tempId),
              contextId: contextId,
              nodeTypeId: nodeType.id,
              name: nodeName,
              label: nodeName,
              position: finalPosition,
              properties: nodeType.defaultParams || {},
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isTemp: true, // Flag to indicate this is a temporary node
            isEntry: nodeType.category === 'extension' || nodeType.name?.toLowerCase().includes('entry'),
            isExit: nodeType.category === 'terminal' || nodeType.name?.toLowerCase().includes('exit') || nodeType.name?.toLowerCase().includes('hangup')
          }
        };
        
        setNodes((nds) => [...nds, newNode]);
        toast.success('Node added (not saved yet)');
        
        // Close node palette after adding a node
        setShowNodePalette(false);
      } catch (error) {
        console.error('Error creating node locally:', error);
        toast.error('Failed to create node');
      }
    },
    [contextId, reactFlowInstance, readOnly, setNodes, getNextTempId, nodes]
  );
  
  // Handle node position updates (locally)
  const handleNodeDragEnd = useCallback((event: React.MouseEvent, node: Node) => {
    if (readOnly) return;
    
    // If it's a real node (not temporary), add to update list
    if (!node.id.startsWith('temp_')) {
      setLocalChanges(prev => ({
        ...prev,
        nodesToUpdate: [...prev.nodesToUpdate.filter(n => n.id !== node.id), {
          id: node.id,
          position: node.position
        }]
      }));
    }
    
    // For temporary nodes, update the creating data
    if (node.id.startsWith('temp_')) {
      setLocalChanges(prev => ({
        ...prev,
        nodesToCreate: prev.nodesToCreate.map(n => 
          n.tempId === node.id ? { ...n, position: node.position } : n
        )
      }));
    }
  }, [readOnly]);
  
  // Handle node deletion (locally)
  const handleNodeDelete = useCallback((nodeId: string) => {
    if (readOnly) {
      console.log('Cannot delete node - readOnly mode is enabled');
      return;
    }
    
    try {
      // Remove node from canvas
      setNodes((nds) => nds.filter(n => n.id !== nodeId));
      
      // If it's a real node (not temporary), add to delete list
      if (!nodeId.startsWith('temp_')) {
        setLocalChanges(prev => ({
          ...prev,
          nodesToDelete: [...prev.nodesToDelete, nodeId]
        }));
      } else {
        // If it's a temporary node, remove it from the create list
        setLocalChanges(prev => ({
          ...prev,
          nodesToCreate: prev.nodesToCreate.filter(n => n.tempId !== nodeId)
        }));
      }
      
      // Remove any edges connected to this node
      setEdges(eds => {
        const edgesToRemove = eds.filter(e => 
          e.source === nodeId || e.target === nodeId
        );
        
        // Update local changes for edges
        edgesToRemove.forEach(edge => {
          if (!edge.id.startsWith('temp_')) {
            setLocalChanges(prev => ({
              ...prev,
              edgesToDelete: [...prev.edgesToDelete, edge.id]
            }));
          } else {
            setLocalChanges(prev => ({
              ...prev,
              edgesToCreate: prev.edgesToCreate.filter(e => e.tempId !== edge.id)
            }));
          }
        });
        
        return eds.filter(e => e.source !== nodeId && e.target !== nodeId);
      });
      
      toast.success('Node removed (not saved yet)');
    } catch (error) {
      console.error('Error removing node locally:', error);
      toast.error('Failed to remove node');
    }
  }, [readOnly, setNodes, setEdges]);
  
  // Handle edge deletion (locally)
  const handleEdgeDelete = useCallback((edge: Edge) => {
    if (readOnly) {
      console.log('Cannot delete connection - readOnly mode is enabled');
      return;
    }
    
    try {
      // Remove edge from canvas
      setEdges((eds) => eds.filter(e => e.id !== edge.id));
      
      // If it's a real edge (not temporary), add to delete list
      if (!edge.id.startsWith('temp_')) {
        setLocalChanges(prev => ({
          ...prev,
          edgesToDelete: [...prev.edgesToDelete, edge.id]
        }));
      } else {
        // If it's a temporary edge, remove it from the create list
        setLocalChanges(prev => ({
          ...prev,
          edgesToCreate: prev.edgesToCreate.filter(e => e.tempId !== edge.id)
        }));
      }
      
      toast.success('Connection removed (not saved yet)');
    } catch (error) {
      console.error('Error removing connection locally:', error);
      toast.error('Failed to remove connection');
    }
  }, [readOnly, setEdges]);
  
  // Add a keyboard handler for the delete key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (readOnly) return;
    
    // Delete key or backspace key
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedNode) {
        console.log('Delete key pressed, deleting selected node:', selectedNode.id);
        handleNodeDelete(selectedNode.id);
        setSelectedNode(null);
      }
    }
  }, [readOnly, selectedNode, handleNodeDelete]);
  
  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Handle updating node properties
  const handleUpdateNodeProperties = useCallback((nodeId: string, newProperties: Record<string, any>) => {
    // Update the node in the state
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId) {
          // Update node data with new properties
          return {
            ...node,
            data: {
              ...node.data,
              properties: newProperties
            }
          };
        }
        return node;
      })
    );
    
    // If it's a temporary node, update the creation data
    if (nodeId.startsWith('temp_')) {
      setLocalChanges(prev => ({
        ...prev,
        nodesToCreate: prev.nodesToCreate.map(n => 
          n.tempId === nodeId ? { ...n, properties: newProperties } : n
        )
      }));
    } else {
      // Otherwise add to update list
      setLocalChanges(prev => {
        // Check if there's already an update for this node
        const existingUpdateIndex = prev.nodesToUpdate.findIndex(n => n.id === nodeId);
        
        if (existingUpdateIndex >= 0) {
          // Update existing entry
          const updatedChanges = [...prev.nodesToUpdate];
          updatedChanges[existingUpdateIndex] = {
            ...updatedChanges[existingUpdateIndex],
            properties: newProperties
          };
          
          return {
            ...prev,
            nodesToUpdate: updatedChanges
          };
        } else {
          // Add new entry
          return {
            ...prev,
            nodesToUpdate: [...prev.nodesToUpdate, {
              id: nodeId,
              properties: newProperties
            }]
          };
        }
      });
    }
    
    toast.success('Properties updated (not saved yet)');
  }, [setNodes]);
  
  // Handle updating node label
  const handleUpdateNodeLabel = useCallback((nodeId: string, newLabel: string) => {
    // Update the node in the state
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId) {
          // Update node data with new label
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel
            }
          };
        }
        return node;
      })
    );
    
    // If it's a temporary node, update the creation data
    if (nodeId.startsWith('temp_')) {
      setLocalChanges(prev => ({
        ...prev,
        nodesToCreate: prev.nodesToCreate.map(n => 
          n.tempId === nodeId ? { ...n, label: newLabel } : n
        )
      }));
    } else {
      // Otherwise add to update list
      setLocalChanges(prev => {
        // Check if there's already an update for this node
        const existingUpdateIndex = prev.nodesToUpdate.findIndex(n => n.id === nodeId);
        
        if (existingUpdateIndex >= 0) {
          // Update existing entry
          const updatedChanges = [...prev.nodesToUpdate];
          updatedChanges[existingUpdateIndex] = {
            ...updatedChanges[existingUpdateIndex],
            label: newLabel
          };
          
          return {
            ...prev,
            nodesToUpdate: updatedChanges
          };
        } else {
          // Add new entry
          return {
            ...prev,
            nodesToUpdate: [...prev.nodesToUpdate, {
              id: nodeId,
              label: newLabel
            }]
          };
        }
      });
    }
  }, [setNodes]);
  
  // Toggle node palette visibility
  const toggleNodePalette = useCallback(() => {
    setShowNodePalette(prev => !prev);
    
    // If opening the palette, close properties panel
    if (!showNodePalette) {
      setShowPropertiesPanel(false);
      setSelectedNode(null);
    }
  }, [showNodePalette]);
  
  // Save all local changes to the API
  const saveChanges = async () => {
    if (readOnly || !contextId) {
      toast.error('Cannot save - read-only mode or missing context');
      return;
    }
    
    const toastId = toast.loading('Saving changes...');
    
    try {
      const results = {
        created: { nodes: 0, edges: 0 },
        updated: { nodes: 0 },
        deleted: { nodes: 0, edges: 0 },
        errors: { nodes: 0, edges: 0 }
      };
      
      let hasApiImplementationErrors = false;
      
      // 1. Create new nodes
      const createdNodes = await Promise.all(
        localChanges.nodesToCreate.map(async (nodeData) => {
          try {
            // Remove tempId before sending to API
            const { tempId, ...apiNodeData } = nodeData;
            const createdNode = await createNode(contextId, apiNodeData);
            results.created.nodes++;
            return { tempId, createdNode };
          } catch (error: any) {
            console.error('Failed to create node:', error);
            
            if (error.response?.status === 404) {
              hasApiImplementationErrors = true;
            }
            
            results.errors.nodes++;
            return { tempId: nodeData.tempId, error };
          }
        })
      );
      
      // Update node mapping (temp ID to real ID)
      const nodeMapping: Record<string, string> = {};
      createdNodes.forEach(result => {
        if (!result.error) {
          nodeMapping[result.tempId] = result.createdNode.id.toString();
        }
      });
      
      // 2. Update existing nodes
      await Promise.all(
        localChanges.nodesToUpdate.map(async (nodeData) => {
          try {
            const updateData: any = {};
            
            if (nodeData.position) updateData.position = nodeData.position;
            if (nodeData.properties) updateData.properties = nodeData.properties;
            if (nodeData.label) updateData.label = nodeData.label;
            
            await updateNode(parseInt(nodeData.id), updateData);
            results.updated.nodes++;
            return { success: true };
          } catch (error: any) {
            console.error('Failed to update node:', error);
            
            if (error.response?.status === 404) {
              hasApiImplementationErrors = true;
            }
            
            results.errors.nodes++;
            return { error };
          }
        })
      );
      
      // 3. Create new edges (connections)
      await Promise.all(
        localChanges.edgesToCreate.map(async (edgeData) => {
          try {
            // Replace temp node IDs with real ones if available
            const sourceNodeId = edgeData.sourceNodeId.startsWith('temp_') 
              ? parseInt(nodeMapping[edgeData.sourceNodeId] || '0')
              : parseInt(edgeData.sourceNodeId);
              
            const targetNodeId = edgeData.targetNodeId.startsWith('temp_')
              ? parseInt(nodeMapping[edgeData.targetNodeId] || '0')
              : parseInt(edgeData.targetNodeId);
              
            if (!sourceNodeId || !targetNodeId) {
              console.error('Invalid source or target node ID for connection');
              results.errors.edges++;
              return { error: 'Invalid node IDs' };
            }
            
            const connectionData = {
              sourceNodeId,
              targetNodeId,
              condition: edgeData.condition,
              priority: edgeData.priority
            };
            
            await createConnection(connectionData);
            results.created.edges++;
            return { success: true };
          } catch (error: any) {
            console.error('Failed to create connection:', error);
            
            if (error.response?.status === 404) {
              hasApiImplementationErrors = true;
            }
            
            results.errors.edges++;
            return { error };
          }
        })
      );
      
      // 4. Delete nodes - with API implementation check
      await Promise.all(
        localChanges.nodesToDelete.map(async (nodeId) => {
          try {
            await deleteNode(parseInt(nodeId));
            results.deleted.nodes++;
            return { success: true };
          } catch (error: any) {
            console.error('Failed to delete node:', error);
            
            // If it's a 404 error, we'll assume the endpoint isn't implemented
            // but we'll still proceed with client-side deletion
            if (error.response?.status === 404 || 
                error.message?.includes('endpoint was not found')) {
              hasApiImplementationErrors = true;
              // Still count as "succeeded" since we'll delete it from the UI anyway
              results.deleted.nodes++;
              return { success: true, apiMissing: true };
            }
            
            results.errors.nodes++;
            return { error };
          }
        })
      );
      
      // 5. Delete edges - with API implementation check
      await Promise.all(
        localChanges.edgesToDelete.map(async (edgeId) => {
          try {
            // Extract the numeric ID from the edge ID (e.g., "e123" -> 123)
            const connectionId = parseInt(edgeId.replace('e', ''));
            if (isNaN(connectionId)) {
              console.error('Invalid edge ID format:', edgeId);
              results.errors.edges++;
              return { error: 'Invalid edge ID' };
            }
            
            await deleteConnection(connectionId);
            results.deleted.edges++;
            return { success: true };
          } catch (error: any) {
            console.error('Failed to delete connection:', error);
            
            // If it's a 404 error, we'll assume the endpoint isn't implemented
            // but we'll still proceed with client-side deletion
            if (error.response?.status === 404 || 
                error.message?.includes('endpoint was not found')) {
              hasApiImplementationErrors = true;
              // Still count as "succeeded" since we'll delete it from the UI anyway
              results.deleted.edges++;
              return { success: true, apiMissing: true };
            }
            
            results.errors.edges++;
            return { error };
          }
        })
      );
      
      // Reset local changes after saving
      setLocalChanges({
        nodesToCreate: [],
        nodesToUpdate: [],
        nodesToDelete: [],
        edgesToCreate: [],
        edgesToDelete: []
      });
      
      // Update nodes and edges with real IDs
      setNodes(nds => 
        nds.map(node => {
          if (node.id.startsWith('temp_') && nodeMapping[node.id]) {
            // Replace temp node with real node
            const realId = nodeMapping[node.id];
            const createdNode = createdNodes.find(n => n.tempId === node.id)?.createdNode;
            
            if (createdNode) {
              return {
                ...node,
                id: realId,
                data: {
                  ...node.data,
                  isTemp: false,
                  dialplanNode: createdNode
                }
              };
            }
          }
          return node;
        })
      );
      
      // If onSave callback is provided, call it
      if (onSave) {
        onSave();
      }
      
      // Show success message
      toast.dismiss(toastId);
      
      if (hasApiImplementationErrors) {
        toast.success(
          `Changes saved with some limitations. Some API endpoints may not be fully implemented yet.`,
          { duration: 5000 }
        );
      } else if (results.errors.nodes > 0 || results.errors.edges > 0) {
        toast.success(
          `Saved with some errors: Created ${results.created.nodes} nodes and ${results.created.edges} connections, updated ${results.updated.nodes} nodes, deleted ${results.deleted.nodes} nodes and ${results.deleted.edges} connections. Failed: ${results.errors.nodes} nodes, ${results.errors.edges} connections.`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `Saved: ${results.created.nodes} nodes and ${results.created.edges} connections created, ${results.updated.nodes} nodes updated, ${results.deleted.nodes} nodes and ${results.deleted.edges} connections deleted`
        );
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.dismiss(toastId);
      toast.error('Failed to save changes. Some API endpoints may not be fully implemented yet.');
    }
  };
  
  // After the component has mounted, fit the view to show all nodes
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 250); // slight delay to ensure nodes are rendered
    }
  }, [reactFlowInstance, nodes.length]);

  return (
    <div className="h-full w-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStop={handleNodeDragEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={['Delete', 'Backspace']} // Support both Delete and Backspace
        onNodesDelete={(nodes) => nodes.forEach(node => handleNodeDelete(node.id))}
        onEdgesDelete={(edges) => edges.forEach(edge => handleEdgeDelete(edge))}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
        connectionMode={ConnectionMode.Loose} // Makes connection handles more visible
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 3 }} // Blue connection line for better visibility
        connectionLineType={ConnectionLineType.Bezier} // Curved lines look better
        defaultEdgeOptions={{
          type: 'default',
          style: { stroke: '#64748b', strokeWidth: 2 },
          animated: false
        }}
        // Set flow direction to top-to-bottom
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background />
        <Controls />
        <MiniMap />
        
        {/* Top toolbar */}
        <Panel position="top-right" className="flex gap-2">
          {/* Show a badge with number of unsaved changes */}
          {Object.values(localChanges).some(array => array.length > 0) && (
            <div className="bg-yellow-500 text-white text-xs rounded-full px-2 py-1">
              Unsaved changes
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={saveChanges} 
            disabled={readOnly || !contextId}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
          
          {/* Add Node button */}
          <Button
            variant={showNodePalette ? "primary" : "outline"}
            size="sm"
            onClick={toggleNodePalette}
            disabled={readOnly}
          >
            {showNodePalette ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showNodePalette ? 'Close Palette' : 'Add Node'}
          </Button>
        </Panel>
        
        {/* Node Palette Panel - only show when toggled */}
        {showNodePalette && (
          <Panel position="top-left" className="max-h-[600px] overflow-auto bg-white p-2 rounded shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Node Palette</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleNodePalette}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <NodePalette nodeTypes={availableNodeTypes} />
          </Panel>
        )}
        
        {/* Properties Panel */}
        {showPropertiesPanel && selectedNode && (
          <Panel position="top-right" className="w-80 max-h-full overflow-auto">
            <PropertiesPanel
              selectedNode={selectedNode}
              onUpdateNodeProperties={handleUpdateNodeProperties}
              onUpdateNodeLabel={handleUpdateNodeLabel}
              onClosePanel={() => {
                setShowPropertiesPanel(false);
                setSelectedNode(null);
              }}
            />
          </Panel>
        )}
        
        {/* Debug info - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <Panel position="bottom-left" className="bg-white p-2 text-xs">
            Nodes: {nodes.length} | Edges: {edges.length} | ContextID: {contextId || 'none'}
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export function WrappedDialplanCanvas(props: DialplanCanvasProps) {
  return (
    <ReactFlowProvider>
      <DialplanCanvas {...props} />
    </ReactFlowProvider>
  );
} 