import React from 'react';
import { NodeType } from '@/app/types/dialplan';
import { getNodeColor, getNodeIcon } from '@/app/components/dialplan/nodes/CustomNode';

interface NodeCategoriesPanelProps {
  nodeTypes: NodeType[];
  onDragStart: (event: React.DragEvent<HTMLDivElement>, nodeType: NodeType) => void;
}

const NODE_CATEGORIES = [
  { id: 'extension', label: 'Extensions' },
  { id: 'application', label: 'Applications' },
  { id: 'flowcontrol', label: 'Flow Control' },
  { id: 'action', label: 'Actions' },
  { id: 'terminal', label: 'Terminal' },
];

const NodeCategoriesPanel: React.FC<NodeCategoriesPanelProps> = ({ nodeTypes, onDragStart }) => {
  // Group node types by category
  const nodeTypesByCategory = NODE_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = nodeTypes.filter(type => type.category === category.id);
    return acc;
  }, {} as Record<string, NodeType[]>);

  return (
    <div className="bg-white border rounded-md shadow-sm">
      <div className="p-3 border-b">
        <h3 className="font-medium">Dialplan Nodes</h3>
      </div>
      
      <div className="p-2">
        <div className="space-y-4">
          {NODE_CATEGORIES.map(category => {
            const types = nodeTypesByCategory[category.id] || [];
            
            if (types.length === 0) return null;
            
            return (
              <div key={category.id} className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold px-2">
                  {category.label}
                </h4>
                
                <div className="space-y-1">
                  {types.map(nodeType => (
                    <div
                      key={nodeType.type}
                      className="flex items-center p-2 rounded-md cursor-move hover:bg-gray-50 border border-transparent hover:border-gray-200"
                      onDragStart={(e) => onDragStart(e, nodeType)}
                      draggable
                    >
                      <div 
                        className="w-8 h-8 flex items-center justify-center rounded-md mr-2"
                        style={{ backgroundColor: getNodeColor(nodeType.category) }}
                      >
                        {getNodeIcon(nodeType.category)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{nodeType.name}</p>
                        {nodeType.description && (
                          <p className="text-xs text-gray-500 truncate max-w-[180px]">
                            {nodeType.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NodeCategoriesPanel; 