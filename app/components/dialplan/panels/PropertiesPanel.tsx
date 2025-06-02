import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { NodeType, ParamDefinition } from '@/app/types/dialplan';
import { Input } from '@/app/components/ui/Input';
import Button from '@/app/components/ui/button';
import { XCircle } from 'lucide-react';

// Simple Label component
interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
}
const Label = ({ htmlFor, children }: LabelProps) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
    {children}
  </label>
);

// Simple Textarea component
interface TextareaProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}
const Textarea = ({ id, value, onChange, placeholder, className, rows = 3 }: TextareaProps) => (
  <textarea
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`px-3 py-2 bg-white text-black border border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 w-full ${className || ''}`}
    rows={rows}
  />
);

// Simple Switch component
interface SwitchProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}
const Switch = ({ id, checked, onCheckedChange }: SwitchProps) => (
  <div className="flex items-center">
    <button
      id={id}
      type="button"
      className={`w-10 h-6 rounded-full focus:outline-none transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  </div>
);

// Simple Select component
interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}
const Select = ({ value, onValueChange, children }: SelectProps) => (
  <select 
    value={value}
    onChange={e => onValueChange(e.target.value)}
    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
  >
    {children}
  </select>
);

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}
const SelectItem = ({ value, children }: SelectItemProps) => (
  <option value={value}>{children}</option>
);

interface SelectTriggerProps {
  children: React.ReactNode;
}
const SelectTrigger = ({ children }: SelectTriggerProps) => children;

interface SelectValueProps {
  placeholder: string;
}
const SelectValue = ({ placeholder }: SelectValueProps) => <span>{placeholder}</span>;

interface SelectContentProps {
  children: React.ReactNode;
}
const SelectContent = ({ children }: SelectContentProps) => children;

// Default parameter definitions for different node types
const getDefaultParamDefs = (nodeType: NodeType): ParamDefinition[] => {
  const { name, category } = nodeType;
  
  // Common parameters for all node types
  const commonParams: ParamDefinition[] = [
    {
      id: 'priority',
      name: 'Priority',
      type: 'number',
      required: false,
      default: 1,
      description: 'Execution priority for this node'
    }
  ];
  
  // Parameters based on node category
  switch (category) {
    case 'extension':
      return [
        {
          id: 'exten',
          name: 'Extension',
          type: 'string',
          required: true,
          default: 's',
          description: 'The extension pattern to match'
        },
        {
          id: 'matchPattern',
          name: 'Match Pattern',
          type: 'select',
          required: false,
          default: 'exact',
          options: ['exact', 'pattern', 'regex'],
          description: 'How to match the extension'
        },
        ...commonParams
      ];
      
    case 'application':
      if (name?.toLowerCase().includes('dial')) {
        return [
          {
            id: 'technology',
            name: 'Technology',
            type: 'select',
            required: true,
            default: 'SIP',
            options: ['SIP', 'PJSIP', 'IAX2', 'DAHDI', 'Local'],
            description: 'The technology to use for dialing'
          },
          {
            id: 'destination',
            name: 'Destination',
            type: 'string',
            required: true,
            default: '',
            description: 'The destination to dial (e.g., extension or phone number)'
          },
          {
            id: 'timeout',
            name: 'Timeout',
            type: 'number',
            required: false,
            default: 30,
            description: 'Timeout in seconds'
          },
          {
            id: 'options',
            name: 'Dial Options',
            type: 'string',
            required: false,
            default: '',
            description: 'Additional dial options (e.g., "m" for music on hold)'
          },
          ...commonParams
        ];
      } else if (name?.toLowerCase().includes('playback')) {
        return [
          {
            id: 'filename',
            name: 'Filename',
            type: 'string',
            required: true,
            default: '',
            description: 'Sound file to play (without extension)'
          },
          {
            id: 'skip',
            name: 'Skip if busy',
            type: 'boolean',
            required: false,
            default: false,
            description: 'Skip playback if channel is busy'
          },
          ...commonParams
        ];
      } else if (name?.toLowerCase().includes('queue')) {
        return [
          {
            id: 'queueName',
            name: 'Queue Name',
            type: 'string',
            required: true,
            default: '',
            description: 'Name of the queue'
          },
          {
            id: 'options',
            name: 'Queue Options',
            type: 'string',
            required: false,
            default: '',
            description: 'Queue options'
          },
          {
            id: 'timeout',
            name: 'Timeout',
            type: 'number',
            required: false,
            default: 0,
            description: 'Maximum wait time in seconds (0 for unlimited)'
          },
          ...commonParams
        ];
      }
      return [
        {
          id: 'app',
          name: 'Application',
          type: 'string',
          required: true,
          default: '',
          description: 'The application name'
        },
        {
          id: 'args',
          name: 'Arguments',
          type: 'string',
          required: false,
          default: '',
          description: 'Application arguments'
        },
        ...commonParams
      ];
      
    case 'flowcontrol':
      if (name?.toLowerCase().includes('goto')) {
        return [
          {
            id: 'context',
            name: 'Context',
            type: 'string',
            required: false,
            default: '',
            description: 'Destination context (blank for same context)'
          },
          {
            id: 'exten',
            name: 'Extension',
            type: 'string',
            required: true,
            default: 's',
            description: 'Destination extension'
          },
          {
            id: 'priority',
            name: 'Priority',
            type: 'string',
            required: true,
            default: '1',
            description: 'Destination priority'
          },
          ...commonParams
        ];
      } else if (name?.toLowerCase().includes('if') || name?.toLowerCase().includes('condition')) {
        return [
          {
            id: 'expression',
            name: 'Condition',
            type: 'string',
            required: true,
            default: '',
            description: 'Expression to evaluate (e.g., ${CALLERID(num)} = 1234)'
          },
          ...commonParams
        ];
      }
      return [
        {
          id: 'action',
          name: 'Action',
          type: 'string',
          required: true,
          default: '',
          description: 'Flow control action'
        },
        {
          id: 'data',
          name: 'Data',
          type: 'string',
          required: false,
          default: '',
          description: 'Additional data for the action'
        },
        ...commonParams
      ];
      
    case 'terminal':
      if (name?.toLowerCase().includes('hangup')) {
        return [
          {
            id: 'cause',
            name: 'Hangup Cause',
            type: 'select',
            required: false,
            default: 'normal',
            options: ['normal', 'busy', 'congestion', 'no_answer', 'decline', 'canceled'],
            description: 'The reason for hanging up'
          },
          ...commonParams
        ];
      }
      return [
        {
          id: 'action',
          name: 'Action',
          type: 'string',
          required: true,
          default: 'Hangup',
          description: 'Terminal action'
        },
        ...commonParams
      ];
      
    default:
      return [
        {
          id: 'custom',
          name: 'Custom Value',
          type: 'string',
          required: false,
          default: '',
          description: 'Custom configuration value'
        },
        {
          id: 'enabled',
          name: 'Enabled',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Enable/disable this node'
        },
        ...commonParams
      ];
  }
};

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onUpdateNodeProperties: (nodeId: string, properties: Record<string, any>) => void;
  onUpdateNodeLabel: (nodeId: string, label: string) => void;
  onClosePanel: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onUpdateNodeProperties,
  onUpdateNodeLabel,
  onClosePanel
}) => {
  const [properties, setProperties] = useState<Record<string, any>>({});
  const [label, setLabel] = useState('');
  
  // Initialize properties when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setProperties(selectedNode.data.properties || {});
      setLabel(selectedNode.data.label || '');
    }
  }, [selectedNode]);
  
  if (!selectedNode) {
    return null;
  }
  
  const nodeType: NodeType = selectedNode.data.nodeType;
  
  // Use default parameter definitions if none provided
  const paramDefs = nodeType.paramDefs && nodeType.paramDefs.length > 0 
    ? nodeType.paramDefs 
    : getDefaultParamDefs(nodeType);
  
  const handlePropertyChange = (paramId: string, value: any) => {
    setProperties(prev => ({
      ...prev,
      [paramId]: value
    }));
  };
  
  const handleSave = () => {
    if (selectedNode) {
      onUpdateNodeProperties(selectedNode.id, properties);
      if (label !== selectedNode.data.label) {
        onUpdateNodeLabel(selectedNode.id, label);
      }
    }
  };
  
  const renderParamInput = (param: ParamDefinition) => {
    const value = properties[param.id] !== undefined ? properties[param.id] : param.default;
    
    switch (param.type) {
      case 'string':
        return (
          <Input
            id={param.id}
            value={value || ''}
            onChange={(e) => handlePropertyChange(param.id, e.target.value)}
            placeholder={param.description || ''}
            className="w-full"
          />
        );
      
      case 'number':
        return (
          <Input
            id={param.id}
            type="number"
            value={value || 0}
            onChange={(e) => handlePropertyChange(param.id, parseFloat(e.target.value))}
            placeholder={param.description || ''}
            className="w-full"
          />
        );
      
      case 'boolean':
        return (
          <Switch
            id={param.id}
            checked={!!value}
            onCheckedChange={(checked) => handlePropertyChange(param.id, checked)}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(value) => handlePropertyChange(param.id, value)}
          >
            {param.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </Select>
        );
      
      default:
        return (
          <Input
            id={param.id}
            value={value || ''}
            onChange={(e) => handlePropertyChange(param.id, e.target.value)}
            placeholder={param.description || ''}
            className="w-full"
          />
        );
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-md shadow-md w-full max-h-full overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Node Properties</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onClosePanel}
        >
          <XCircle className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* Node info section */}
        <div className="p-2 bg-gray-50 rounded-md">
          <div className="text-sm font-semibold">{nodeType.name}</div>
          <div className="text-xs text-gray-500">{nodeType.description}</div>
          <div className="text-xs mt-1 bg-gray-200 inline-block px-2 py-0.5 rounded-full">
            {nodeType.category}
          </div>
        </div>
        
        {/* Node label */}
        <div className="space-y-2">
          <Label htmlFor="node-label">Label</Label>
          <Input
            id="node-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Node label"
            className="w-full"
          />
        </div>
        
        {/* Parameters section */}
        {paramDefs.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Parameters</h4>
            
            {paramDefs.map((param) => (
              <div key={param.id} className="space-y-2">
                <Label htmlFor={param.id}>
                  {param.name} {param.required && <span className="text-red-500">*</span>}
                </Label>
                {param.description && (
                  <p className="text-xs text-gray-500">{param.description}</p>
                )}
                {renderParamInput(param)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No configurable parameters</div>
        )}
        
        {/* Custom properties */}
        <div className="space-y-2">
          <Label htmlFor="custom-properties">Custom Properties (JSON)</Label>
          <Textarea
            id="custom-properties"
            value={JSON.stringify(properties, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setProperties(parsed);
              } catch (error) {
                // Invalid JSON, don't update
              }
            }}
            placeholder="Custom properties in JSON format"
            className="font-mono text-xs"
            rows={5}
          />
        </div>
        
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSave}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
};

export default PropertiesPanel; 