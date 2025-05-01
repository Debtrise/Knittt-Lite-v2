import React from 'react';
import { NodeType } from '@/app/types/dialplan';

const categoryColors = {
  extension: 'bg-blue-100 border-blue-500 text-blue-700',
  application: 'bg-green-100 border-green-500 text-green-700',
  flowcontrol: 'bg-purple-100 border-purple-500 text-purple-700',
  action: 'bg-orange-100 border-orange-500 text-orange-700',
  terminal: 'bg-red-100 border-red-500 text-red-700',
};

const categoryIcons = {
  extension: '📞',
  application: '🔧',
  flowcontrol: '🔄',
  action: '⚡',
  terminal: '🛑',
};

interface NodePaletteProps {
  nodeTypes: NodeType[];
}

export default function NodePalette({ nodeTypes }: NodePaletteProps) {
  const categoryGroups = nodeTypes.reduce((acc, nodeType) => {
    const category = nodeType.category || 'application';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(nodeType);
    return acc;
  }, {} as Record<string, NodeType[]>);

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };

  const sortedCategories = Object.keys(categoryGroups).sort((a, b) => {
    // Custom sort order
    const order = ['extension', 'application', 'flowcontrol', 'action', 'terminal'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="w-64">
      <h3 className="text-sm font-medium mb-2 px-2">Node Types</h3>
      {nodeTypes.length === 0 ? (
        <div className="text-sm text-gray-500 p-2">
          No node types available. Please check API configuration.
        </div>
      ) : (
        sortedCategories.map(category => (
          <div key={category} className="mb-4">
            <h4 className="text-xs font-semibold uppercase text-gray-600 mb-1 px-2">
              {categoryIcons[category as keyof typeof categoryIcons]} {category}
            </h4>
            <div className="flex flex-col gap-1">
              {categoryGroups[category].map(nodeType => (
                <div
                  key={nodeType.id}
                  className={`border px-3 py-2 rounded text-sm cursor-grab ${
                    categoryColors[nodeType.category as keyof typeof categoryColors] || 'bg-gray-100 border-gray-300'
                  }`}
                  draggable
                  onDragStart={(event) => onDragStart(event, nodeType)}
                  title={nodeType.description}
                >
                  {nodeType.name}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded border border-gray-200">
        Drag nodes onto the canvas to create your dial plan.
      </div>
    </div>
  );
} 