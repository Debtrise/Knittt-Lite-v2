import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
  Node,
  Edge,
  Connection,
  MarkerType,
  useReactFlow,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import toast from 'react-hot-toast';
import { 
  createNode, 
  updateNode, 
  deleteNode, 
  createConnection, 
  updateConnection, 
  deleteConnection 
} from '@/app/utils/dialplanApi';
import { DialplanNode, DialplanConnection, Position, NodeType } from '@/app/types/dialplan';
import NodePropertiesPanel from './NodePropertiesPanel';
import CustomNode from './nodes/CustomNode';
import CustomEdge from './edges/CustomEdge';

// Define custom node types
const nodeTypes: NodeTypes = {
  extension: CustomNode,
  application: CustomNode,
  flowControl: CustomNode,
  action: CustomNode,
  terminal: CustomNode,
};

// Define custom edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

type FlowEditorProps = {
  contextId: number;
  initialNodes: DialplanNode[];
  initialConnections: DialplanConnection[];
  nodeTypes: NodeType[];
  readOnly?: boolean;
  onSaveSuccess?: () => void;
};

const FlowEditor: React.FC<FlowEditorProps> = ({
  contextId,
  initialNodes,
  initialConnections,
  nodeTypes: availableNodeTypes,
  readOnly = false,
  onSaveSuccess,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert initialNodes to React Flow nodes
  useEffect(() => {
    const reactFlowNodes = initialNodes.map((node) => {
      const nodeType = availableNodeTypes.find(type => type.id === node.nodeTypeId);
      
      return {
        id: node.id.toString(),
        type: nodeType?.category.toLowerCase() || 'extension',
        position: node.position,
        data: {
          label: node.name,
          nodeType: nodeType,
          properties: node.properties,
          dialplanNode: node
        },
      };
    });

    setNodes(reactFlowNodes);
  }, [initialNodes, availableNodeTypes]);

  // Convert initialConnections to React Flow edges
  useEffect(() => {
    const reactFlowEdges = initialConnections.map((connection) => ({
      id: connection.id.toString(),
      source: connection.sourceNodeId.toString(),
      target: connection.targetNodeId.toString(),
      label: connection.condition || undefined,
      type: 'custom',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      data: {
        condition: connection.condition,
        priority: connection.priority,
        dialplanConnection: connection
      }
    }));

    setEdges(reactFlowEdges);
  }, [initialConnections]);

  const onNodesChange = useCallback(async (changes) => {
    // Handle node deletion
    for (const change of changes) {
      if (change.type === 'remove' && !readOnly) {
        try {
          // Get the node ID (converting from string back to number for the API)
          const nodeId = parseInt(change.id, 10);
          await deleteNode(nodeId);
          toast.success('Node deleted successfully');
          if (onSaveSuccess) onSaveSuccess();
        } catch (error) {
          console.error('Error deleting node:', error);
          toast.error('Failed to delete node');
          // If there's an error, we might want to prevent the node from being removed from the UI
          return;
        }
      }
    }
    
    setNodes((nds) => applyNodeChanges(changes, nds));
    
    // Deselect node if it was deleted
    if (selectedNode && changes.some(change => change.type === 'remove' && change.id === selectedNode.id)) {
      setSelectedNode(null);
    }
  }, [selectedNode, readOnly, onSaveSuccess]);

  const onEdgesChange = useCallback(async (changes) => {
    // Handle edge deletion
    for (const change of changes) {
      if (change.type === 'remove' && !readOnly) {
        try {
          // Get the edge/connection ID (converting from string back to number for the API)
          const connectionId = parseInt(change.id, 10);
          await deleteConnection(connectionId);
          toast.success('Connection deleted successfully');
          if (onSaveSuccess) onSaveSuccess();
        } catch (error) {
          console.error('Error deleting connection:', error);
          toast.error('Failed to delete connection');
          return;
        }
      }
    }
    
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [readOnly, onSaveSuccess]);

  const onConnect = useCallback(async (params: Connection) => {
    if (readOnly) return;
    
    try {
      // Create connection in the backend
      const result = await createConnection({
        sourceNodeId: parseInt(params.source as string, 10),
        targetNodeId: parseInt(params.target as string, 10),
        priority: 1, // Default priority
      });
      
      // Create a new edge with the returned ID and data
      const newEdge: Edge = {
        id: result.id.toString(),
        source: params.source || '',
        target: params.target || '',
        type: 'custom',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: {
          condition: null,
          priority: 1,
          dialplanConnection: result
        }
      };
      
      setEdges((eds) => [...eds, newEdge]);
      toast.success('Connection created successfully');
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error('Error creating connection:', error);
      toast.error('Failed to create connection');
    }
  }, [readOnly, onSaveSuccess]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      
      if (readOnly) return;

      if (reactFlowWrapper.current && reactFlowInstance) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const nodeTypeData = event.dataTransfer.getData('application/json');
        
        if (!nodeTypeData) return;
        
        const nodeType = JSON.parse(nodeTypeData) as NodeType;
        
        // Get the position from the drop coordinates
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });
        
        try {
          // Create default properties based on node type
          const defaultProperties: Record<string, any> = {};
          nodeType.properties.forEach(prop => {
            if (prop.default !== undefined) {
              defaultProperties[prop.name] = prop.default;
            } else if (prop.required) {
              // For required props, set some reasonable defaults based on type
              if (prop.type === 'string') defaultProperties[prop.name] = '';
              else if (prop.type === 'number') defaultProperties[prop.name] = 0;
              else if (prop.type === 'boolean') defaultProperties[prop.name] = false;
            }
          });
          
          // Create node in the backend
          const result = await createNode(contextId, {
            nodeTypeId: nodeType.id,
            name: `New ${nodeType.name}`,
            label: `New ${nodeType.name}`,
            position,
            properties: defaultProperties,
          });
          
          // Create a new React Flow node with the returned data
          const newNode: Node = {
            id: result.id.toString(),
            type: nodeType.category.toLowerCase(),
            position: result.position,
            data: {
              label: result.name,
              nodeType: nodeType,
              properties: result.properties,
              dialplanNode: result
            },
          };
          
          setNodes((nds) => [...nds, newNode]);
          toast.success('Node created successfully');
          if (onSaveSuccess) onSaveSuccess();
        } catch (error) {
          console.error('Error creating node:', error);
          toast.error('Failed to create node');
        }
      }
    },
    [reactFlowInstance, contextId, readOnly, onSaveSuccess]
  );

  const onNodeDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onNodeDragStop = useCallback(async (event: React.MouseEvent, node: Node) => {
    setIsDragging(false);
    
    if (readOnly) return;
    
    try {
      // Update node position in the backend
      await updateNode(parseInt(node.id, 10), {
        position: node.position,
      });
    } catch (error) {
      console.error('Error updating node position:', error);
      toast.error('Failed to update node position');
    }
  }, [readOnly]);

  const handleNodeUpdate = async (nodeId: string, data: { name?: string; properties?: Record<string, any> }) => {
    if (readOnly) return;
    
    try {
      // Update node in the backend
      const updatedData = await updateNode(parseInt(nodeId, 10), {
        name: data.name,
        properties: data.properties,
      });
      
      // Update node in the UI
      setNodes(nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: data.name || node.data.label,
              properties: data.properties || node.data.properties,
              dialplanNode: {
                ...node.data.dialplanNode,
                name: data.name || node.data.dialplanNode.name,
                properties: data.properties || node.data.dialplanNode.properties,
              }
            }
          };
        }
        return node;
      }));
      
      toast.success('Node updated successfully');
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error('Error updating node:', error);
      toast.error('Failed to update node');
    }
  };

  const handleConnectionUpdate = async (connectionId: string, data: { condition?: string; priority?: number }) => {
    if (readOnly) return;
    
    try {
      // Update connection in the backend
      const updatedData = await updateConnection(parseInt(connectionId, 10), data);
      
      // Update edge in the UI
      setEdges(edges.map(edge => {
        if (edge.id === connectionId) {
          return {
            ...edge,
            label: data.condition || undefined,
            data: {
              ...edge.data,
              condition: data.condition,
              priority: data.priority !== undefined ? data.priority : edge.data.priority,
              dialplanConnection: {
                ...edge.data.dialplanConnection,
                condition: data.condition,
                priority: data.priority !== undefined ? data.priority : edge.data.dialplanConnection.priority,
              }
            }
          };
        }
        return edge;
      }));
      
      toast.success('Connection updated successfully');
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error('Error updating connection:', error);
      toast.error('Failed to update connection');
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
      
      {selectedNode && !isDragging && (
        <NodePropertiesPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={handleNodeUpdate}
          onConnectionUpdate={handleConnectionUpdate}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};

export default function WrappedFlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditor {...props} />
    </ReactFlowProvider>
  );
} 