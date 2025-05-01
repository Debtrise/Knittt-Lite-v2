import React from 'react';
import { EdgeProps, BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';

interface CustomEdgeData {
  condition?: string | null;
  priority?: number;
  isTemp?: boolean;
}

const CustomEdge: React.FC<EdgeProps<CustomEdgeData>> = ({ 
  id, 
  source, 
  target, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition, 
  style = {}, 
  data, 
  markerEnd,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Extract condition and priority from data if available
  const condition = data?.condition;
  const priority = data?.priority ?? 1;
  const isTemp = data?.isTemp === true;

  // Determine edge styling based on state
  const getEdgeStyle = () => {
    const baseStyle = {
      ...style,
      strokeWidth: 2,
    };

    if (selected) {
      return {
        ...baseStyle,
        stroke: '#3b82f6', // blue-500
        strokeWidth: 3,
      };
    }

    if (isTemp) {
      return {
        ...baseStyle,
        stroke: '#f59e0b', // amber-500
        strokeDasharray: '5,5', // dashed line for temporary
      };
    }

    return {
      ...baseStyle,
      stroke: '#64748b', // slate-500
    };
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={getEdgeStyle()}
      />
      
      {/* Only render label if condition exists or priority > 1 */}
      {(condition || priority > 1) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className={`px-2 py-1 rounded border shadow-sm ${
              isTemp 
                ? 'bg-amber-50 border-amber-200' 
                : 'bg-white border-gray-200'
            }`}
          >
            {condition && <span className="font-medium">{condition}</span>}
            {condition && priority > 1 && <span className="mx-1">|</span>}
            {priority > 1 && <span className="text-gray-500">Priority: {priority}</span>}
            {isTemp && <span className="text-amber-500 ml-1 text-xs">(not saved)</span>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge; 