'use client';

import React from 'react';

interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  elements: string[];
  label?: string;
}

interface SnapGuidesProps {
  guides: SnapGuide[];
  canvasSize: { width: number; height: number };
  zoom: number;
}

export function SnapGuides({ guides, canvasSize, zoom }: SnapGuidesProps) {
  if (!guides.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {guides.map((guide, index) => {
        const isCenter = guide.elements.includes('canvas-center');
        const isEdge = guide.elements.includes('canvas-edge');
        
        if (guide.type === 'vertical') {
          return (
            <div key={`v-${index}`} className="absolute">
              {/* Main snap line */}
              <div
                className={`absolute bg-blue-500 ${
                  isCenter ? 'bg-green-500' : isEdge ? 'bg-purple-500' : 'bg-blue-500'
                }`}
                style={{
                  left: `${guide.position}px`,
                  top: '0px',
                  width: '1px',
                  height: `${canvasSize.height}px`,
                  boxShadow: `0 0 4px ${
                    isCenter ? 'rgba(34, 197, 94, 0.6)' : 
                    isEdge ? 'rgba(168, 85, 247, 0.6)' : 
                    'rgba(59, 130, 246, 0.6)'
                  }`
                }}
              />
              
              {/* Label */}
              {guide.label && (
                <div
                  className={`absolute text-xs font-medium px-2 py-1 rounded shadow-lg ${
                    isCenter ? 'bg-green-500 text-white' : 
                    isEdge ? 'bg-purple-500 text-white' : 
                    'bg-blue-500 text-white'
                  }`}
                  style={{
                    left: `${guide.position + 8}px`,
                    top: '8px',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {guide.label}
                </div>
              )}
              
              {/* Snap indicators at intersections */}
              <div
                className={`absolute w-2 h-2 rounded-full ${
                  isCenter ? 'bg-green-500' : isEdge ? 'bg-purple-500' : 'bg-blue-500'
                }`}
                style={{
                  left: `${guide.position - 4}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  boxShadow: `0 0 8px ${
                    isCenter ? 'rgba(34, 197, 94, 0.8)' : 
                    isEdge ? 'rgba(168, 85, 247, 0.8)' : 
                    'rgba(59, 130, 246, 0.8)'
                  }`
                }}
              />
            </div>
          );
        } else {
          return (
            <div key={`h-${index}`} className="absolute">
              {/* Main snap line */}
              <div
                className={`absolute ${
                  isCenter ? 'bg-green-500' : isEdge ? 'bg-purple-500' : 'bg-blue-500'
                }`}
                style={{
                  left: '0px',
                  top: `${guide.position}px`,
                  width: `${canvasSize.width}px`,
                  height: '1px',
                  boxShadow: `0 0 4px ${
                    isCenter ? 'rgba(34, 197, 94, 0.6)' : 
                    isEdge ? 'rgba(168, 85, 247, 0.6)' : 
                    'rgba(59, 130, 246, 0.6)'
                  }`
                }}
              />
              
              {/* Label */}
              {guide.label && (
                <div
                  className={`absolute text-xs font-medium px-2 py-1 rounded shadow-lg ${
                    isCenter ? 'bg-green-500 text-white' : 
                    isEdge ? 'bg-purple-500 text-white' : 
                    'bg-blue-500 text-white'
                  }`}
                  style={{
                    left: '8px',
                    top: `${guide.position + 8}px`,
                    transform: 'translateY(-50%)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {guide.label}
                </div>
              )}
              
              {/* Snap indicators at intersections */}
              <div
                className={`absolute w-2 h-2 rounded-full ${
                  isCenter ? 'bg-green-500' : isEdge ? 'bg-purple-500' : 'bg-blue-500'
                }`}
                style={{
                  left: '50%',
                  top: `${guide.position - 4}px`,
                  transform: 'translateX(-50%)',
                  boxShadow: `0 0 8px ${
                    isCenter ? 'rgba(34, 197, 94, 0.8)' : 
                    isEdge ? 'rgba(168, 85, 247, 0.8)' : 
                    'rgba(59, 130, 246, 0.8)'
                  }`
                }}
              />
            </div>
          );
        }
      })}
      
      {/* Distance indicators for element spacing */}
      {guides.length >= 2 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          Snap guides: {guides.length}
        </div>
      )}
    </div>
  );
} 