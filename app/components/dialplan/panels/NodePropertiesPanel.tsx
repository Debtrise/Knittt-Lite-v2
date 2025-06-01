import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { NodeType, ParamDefinition } from '@/app/types/dialplan';
import { Button, Input, Label, Select, Textarea } from '@/app/components/ui';
import { updateNode } from '@/app/utils/dialplanApi';
import toast from 'react-hot-toast';

interface NodePropertiesPanelProps {
  selectedNode: Node | null;
  nodeTypes: NodeType[];
  onUpdateNodeProperties: (nodeId: string, properties: Record<string, any>) => void;
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  selectedNode,
  nodeTypes,
  onUpdateNodeProperties,
}) => {
  const [properties, setProperties] = useState<Record<string, any>>({});
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType | null>(null);
  const [isUpdatingNodeType, setIsUpdatingNodeType] = useState(false);
  
  // Initialize properties and selected node type when node selection changes
  useEffect(() => {
    if (selectedNode && selectedNode.data.properties) {
      setProperties({...selectedNode.data.properties});
      setSelectedNodeType(selectedNode.data.nodeType || null);
    } else {
      setProperties({});
      setSelectedNodeType(null);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="p-4 border rounded-md bg-white shadow-sm">
        <p className="text-gray-500 text-sm">Select a node to edit its properties</p>
      </div>
    );
  }

  const nodeType = selectedNode.data.nodeType;
  
  const handlePropertyChange = (key: string, value: any) => {
    const newProperties = { ...properties, [key]: value };
    setProperties(newProperties);
  };
  
  const handleSave = () => {
    if (selectedNode) {
      onUpdateNodeProperties(selectedNode.id, properties);
    }
  };

  // Handle changing the node type
  const handleNodeTypeChange = async (nodeTypeId: number) => {
    if (!selectedNode || !nodeTypeId) return;
    
    try {
      setIsUpdatingNodeType(true);
      
      // Find the new node type
      const newNodeType = nodeTypes.find(nt => nt.id === Number(nodeTypeId));
      if (!newNodeType) {
        throw new Error('Selected node type not found');
      }
      
      // Reset properties based on new node type's parameter definitions
      const newProperties: Record<string, any> = {};
      
      // Add default values from parameter definitions
      if (newNodeType.paramDefs && Array.isArray(newNodeType.paramDefs)) {
        newNodeType.paramDefs.forEach((param: ParamDefinition) => {
          if (param.default !== undefined) {
            newProperties[param.id] = param.default;
          } else if (param.required) {
            // Set default values for required fields based on type
            if (param.type === 'string') newProperties[param.id] = '';
            else if (param.type === 'number') newProperties[param.id] = 0;
            else if (param.type === 'boolean') newProperties[param.id] = false;
            else if (param.type === 'select' && param.options && param.options.length > 0) {
              newProperties[param.id] = param.options[0];
            }
          }
        });
      } else if (newNodeType.properties && typeof newNodeType.properties === 'object') {
        // Handle properties that use the schema format
        Object.entries(newNodeType.properties).forEach(([key, schema]) => {
          if (schema.default !== undefined) {
            newProperties[key] = schema.default;
          } else if (schema.required) {
            if (schema.type === 'string') newProperties[key] = '';
            else if (schema.type === 'integer' || schema.type === 'number') newProperties[key] = 0;
            else if (schema.type === 'boolean') newProperties[key] = false;
          }
        });
      }
      
      // Update the node in the backend
      const dialplanNodeId = selectedNode.data.dialplanNode?.id;
      if (dialplanNodeId) {
        await updateNode(dialplanNodeId, {
          nodeTypeId: newNodeType.id, // Add this to update the node type
          properties: newProperties,
          // Also update name and label to reflect new node type
          name: `${newNodeType.name}`,
          label: `${newNodeType.name}`
        });
        
        // Update local state
        setSelectedNodeType(newNodeType);
        setProperties(newProperties);
        
        // Force refresh of the full dialplan editor to reflect the node type change
        toast.success(`Node type changed to ${newNodeType.name}. Refreshing...`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating node type:', error);
      toast.error('Failed to update node type');
    } finally {
      setIsUpdatingNodeType(false);
    }
  };
  
  const renderParamInputs = () => {
    if (!nodeType) return null;
    
    // Handle paramDefs format
    if (nodeType.paramDefs && Array.isArray(nodeType.paramDefs)) {
      return nodeType.paramDefs.map((param: ParamDefinition) => {
        const value = properties[param.id] !== undefined ? properties[param.id] : (param.default || '');
        
        return (
          <div key={param.id} className="space-y-1">
            <Label htmlFor={`param-${param.id}`}>
              {param.name}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div id={`param-${param.id}`}>
              {renderInputByType(param.id, param.type, value, param)}
            </div>
            {param.description && (
              <p className="text-xs text-gray-500">{param.description}</p>
            )}
          </div>
        );
      });
    }
    
    // Handle properties schema format
    if (nodeType.properties && typeof nodeType.properties === 'object') {
      return Object.entries(nodeType.properties).map(([key, schema]) => (
        <div key={key} className="space-y-1">
          <Label htmlFor={`property-${key}`}>
            {schema.title || key}
            {schema.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div id={`property-${key}`}>
            {renderPropertyInput(key, schema)}
          </div>
          {schema.description && (
            <p className="text-xs text-gray-500">{schema.description}</p>
          )}
        </div>
      ));
    }
    
    return (
      <div className="text-sm text-gray-500">
        No configurable properties available for this node type.
      </div>
    );
  };
  
  const renderInputByType = (id: string, type: string, value: any, param: ParamDefinition) => {
    switch (type) {
      case 'string':
        if (param.options && param.options.length > 0) {
          return (
            <Select 
              value={value}
              onChange={(e) => handlePropertyChange(id, e.target.value)}
            >
              <option value="">Select...</option>
              {param.options.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          );
        } else {
          return (
            <Input
              type="text"
              value={value}
              onChange={(e) => handlePropertyChange(id, e.target.value)}
              placeholder={param.description || id}
            />
          );
        }
      
      case 'select':
        return (
          <Select 
            value={value}
            onChange={(e) => handlePropertyChange(id, e.target.value)}
          >
            <option value="">Select...</option>
            {param.options && param.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        );
        
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handlePropertyChange(id, Number(e.target.value))}
            placeholder={param.description || id}
          />
        );
        
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handlePropertyChange(id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">{param.description || id}</span>
          </div>
        );
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handlePropertyChange(id, e.target.value)}
            placeholder={param.description || id}
          />
        );
    }
  };
  
  const renderPropertyInput = (key: string, schema: any) => {
    const value = properties[key] || '';
    
    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return (
            <Select 
              value={value}
              onChange={(e) => handlePropertyChange(key, e.target.value)}
            >
              <option value="">Select...</option>
              {schema.enum.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          );
        } else if (schema.format === 'multi-line') {
          return (
            <Textarea
              value={value}
              onChange={(e) => handlePropertyChange(key, e.target.value)}
              rows={3}
            />
          );
        } else {
          return (
            <Input
              type="text"
              value={value}
              onChange={(e) => handlePropertyChange(key, e.target.value)}
              placeholder={schema.description || key}
            />
          );
        }
      
      case 'integer':
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handlePropertyChange(key, Number(e.target.value))}
            placeholder={schema.description || key}
          />
        );
        
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handlePropertyChange(key, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">{schema.description || key}</span>
          </div>
        );
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            placeholder={schema.description || key}
          />
        );
    }
  };

  // Group node types by category for a better organized dropdown
  const nodeTypesByCategory = nodeTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, NodeType[]>);

  const categoryLabels: Record<string, string> = {
    extension: 'Extensions',
    application: 'Applications',
    flowcontrol: 'Flow Control',
    action: 'Actions',
    terminal: 'Terminal'
  };

  return (
    <div className="p-4 border rounded-md bg-white shadow-sm h-full overflow-y-auto">
      <h3 className="text-lg font-medium mb-4">
        Node Properties: {selectedNode.data.label}
      </h3>
      
      <div className="space-y-4">
        {/* Node Type Selector */}
        <div className="space-y-1">
          <Label htmlFor="node-type">Node Type</Label>
          <Select 
            id="node-type"
            value={selectedNodeType?.id || ''}
            onChange={(e) => handleNodeTypeChange(Number(e.target.value))}
            disabled={isUpdatingNodeType}
          >
            <option value="">Select a node type...</option>
            {Object.entries(nodeTypesByCategory).map(([category, types]) => (
              <optgroup key={category} label={categoryLabels[category] || category}>
                {types.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          {isUpdatingNodeType && (
            <div className="text-xs text-blue-500">
              Updating node type... This will refresh the page.
            </div>
          )}
        </div>

        {/* Node Description */}
        {selectedNodeType && (
          <div className="p-2 bg-gray-50 rounded text-sm">
            <p className="text-gray-600">{selectedNodeType.description}</p>
          </div>
        )}
        
        {/* Dynamic Properties based on node type - using the new rendering method */}
        <div className="space-y-4">
          {renderParamInputs()}
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} variant="brand" size="sm" disabled={isUpdatingNodeType}>
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NodePropertiesPanel; 