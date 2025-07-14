'use client';

import React from 'react';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  zoom: number;
  offset: number;
  size: number;
}

export function Ruler({ orientation, zoom, offset, size }: RulerProps) {
  const isHorizontal = orientation === 'horizontal';
  const tickSpacing = 50; // pixels
  const maxTicks = Math.ceil((isHorizontal ? 2000 : 1200) / tickSpacing) + 10;

  return (
    <div
      className={`absolute bg-gray-100 border-gray-300 text-xs text-gray-600 z-10 ${
        isHorizontal 
          ? 'top-0 left-8 right-0 h-8 border-b' 
          : 'left-0 top-8 bottom-0 w-8 border-r'
      }`}
    >
      <div 
        className="relative w-full h-full"
      style={{
        transform: isHorizontal 
          ? `translateX(${offset}px)` 
          : `translateY(${offset}px)`
      }}
    >
        {Array.from({ length: maxTicks }).map((_, i) => {
          const position = i * tickSpacing;
          const canvasPosition = position / zoom;
          
          // Skip negative positions and positions beyond canvas
          if (canvasPosition < 0 || canvasPosition > size) {
            return null;
          }

          return (
            <div
              key={i}
              className={`absolute ${
                isHorizontal 
                  ? 'h-full border-l border-gray-400 flex items-end justify-start pb-1 pl-1' 
                  : 'w-full border-t border-gray-400 flex items-start justify-start pt-1 pl-1'
              }`}
              style={{
                [isHorizontal ? 'left' : 'top']: `${position}px`,
              }}
            >
              <span 
                className={`text-xs text-gray-600 font-mono ${
                  isHorizontal ? '' : 'transform -rotate-90 origin-left'
                }`}
              >
                {Math.round(canvasPosition)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
} 