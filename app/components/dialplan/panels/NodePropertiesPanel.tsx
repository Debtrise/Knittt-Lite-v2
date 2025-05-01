import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { NodeType } from '@/app/types/dialplan';
import { Button, Input, Label, Select, Textarea } from '@/app/components/ui';

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
  
  useEffect(() => {
    if (selectedNode && selectedNode.data.properties) {
      setProperties({...selectedNode.data.properties});
    } else {
      setProperties({});
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

  return (
    <div className="p-4 border rounded-md bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-4">
        Node Properties: {selectedNode.data.label}
      </h3>
      
      <div className="space-y-4">
        {nodeType && nodeType.properties && Object.entries(nodeType.properties).map(([key, schema]) => (
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
        ))}

        <div className="pt-2">
          <Button onClick={handleSave} variant="primary" size="sm">
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NodePropertiesPanel; 