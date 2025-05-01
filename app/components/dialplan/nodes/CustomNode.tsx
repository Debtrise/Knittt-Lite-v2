import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FiPhone, FiCommand, FiFileText, FiArrowRight, FiX, FiSettings } from 'react-icons/fi';
import { NodeType } from '@/app/types/dialplan';

// Function to get node color based on category
export const getNodeColor = (category: string): string => {
  switch (category) {
    case 'extension':
      return '#3b82f6'; // blue-500
    case 'application':
      return '#10b981'; // green-500
    case 'flowcontrol':
      return '#8b5cf6'; // purple-500
    case 'action':
      return '#f97316'; // orange-500
    case 'terminal':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
};

// Function to get node icon based on category
export const getNodeIcon = (category: string): React.ReactNode => {
  switch (category) {
    case 'extension':
      return <FiPhone className="text-white" />;
    case 'application':
      return <FiCommand className="text-white" />;
    case 'flowcontrol':
      return <FiArrowRight className="text-white" />;
    case 'action':
      return <FiFileText className="text-white" />;
    case 'terminal':
      return <FiX className="text-white" />;
    default:
      return <FiCommand className="text-white" />;
  }
};

interface CustomNodeData {
  label: string;
  nodeType: NodeType;
  properties?: Record<string, any>;
  isTemp?: boolean;
  isEntry?: boolean;
  isExit?: boolean;
}

const CustomNode = ({ id, data, selected }: NodeProps<CustomNodeData>) => {
  const { label, nodeType, properties = {} } = data;
  const color = getNodeColor(nodeType?.category || 'application');
  
  // Determine if the node should have input and output handles
  const hasInputHandle = nodeType?.inputHandles === undefined || nodeType?.inputHandles > 0;
  const hasOutputHandle = nodeType?.outputHandles === undefined || nodeType?.outputHandles > 0;
  
  // Special case for entry nodes (no input handle)
  const isEntry = data.isEntry || nodeType?.category === 'extension' || 
                 (nodeType?.name?.toLowerCase() || '').includes('entry');
                 
  // Special case for exit nodes (no output handle)
  const isExit = data.isExit || nodeType?.category === 'terminal' || 
                (nodeType?.name?.toLowerCase() || '').includes('exit') ||
                (nodeType?.name?.toLowerCase() || '').includes('hangup');
  
  // Check if any properties are configured
  const hasProperties = Object.keys(properties).length > 0;
  
  // Show a different styling for temporary nodes
  const isTemp = data.isTemp === true;
  
  // Function to display a summary of properties
  const renderPropertySummary = () => {
    if (!hasProperties) return null;
    
    return (
      <div className="text-xs text-gray-600 mt-1 truncate">
        {Object.entries(properties).map(([key, value]) => {
          // For simplicity, only show string/number/boolean properties in summary
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return (
              <div key={key} className="truncate">
                {key}: {String(value)}
              </div>
            );
          }
          return null;
        }).filter(Boolean).slice(0, 2) /* Only show first 2 properties */}
        {Object.keys(properties).length > 2 && (
          <div>...</div>
        )}
      </div>
    );
  };
  
  // Modified styling for entry/exit nodes
  const getNodeBorderStyle = () => {
    if (selected) return 'border-blue-500 bg-blue-50';
    if (isTemp) return 'border-dashed border-gray-400 bg-gray-50';
    if (isEntry) return 'border-green-500 bg-green-50';
    if (isExit) return 'border-red-500 bg-red-50';
    return 'border-gray-300 bg-white';
  };
  
  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md border-2 w-48 ${getNodeBorderStyle()}`}
    >
      {/* Input handle at TOP */}
      {hasInputHandle && !isEntry && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 rounded-full bg-blue-500"
        />
      )}
      
      {/* Node contents */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div
            className="h-3 w-3 rounded-full mb-2"
            style={{ backgroundColor: color }}
          />
          {isTemp && (
            <div className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded-sm mb-1">
              New
            </div>
          )}
          {isEntry && (
            <div className="text-xs bg-green-200 text-green-800 px-1 rounded-sm mb-1">
              Entry
            </div>
          )}
          {isExit && (
            <div className="text-xs bg-red-200 text-red-800 px-1 rounded-sm mb-1">
              Exit
            </div>
          )}
          {hasProperties && !isTemp && (
            <div className="text-xs flex items-center text-blue-600 mb-1">
              <FiSettings size={12} className="mr-1" />
              Config
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <div className="text-sm font-bold truncate" title={label}>
            {label}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          Type: {nodeType?.name || 'Unknown'}
        </div>
        
        {/* Show property summary if available */}
        {renderPropertySummary()}
      </div>
      
      {/* Output handle at BOTTOM */}
      {hasOutputHandle && !isExit && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 rounded-full bg-blue-500"
        />
      )}
    </div>
  );
};

export default memo(CustomNode); 