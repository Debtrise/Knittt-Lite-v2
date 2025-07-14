'use client';

import React from 'react';

interface GridLinesProps {
  width: number;
  height: number;
  zoom: number;
  gridSize?: number;
}

export function GridLines({ width, height, zoom, gridSize = 20 }: GridLinesProps) {
  const adjustedGridSize = gridSize * zoom;
  const horizontalLines = Math.ceil(height / gridSize);
  const verticalLines = Math.ceil(width / gridSize);

  return (
    <div className="absolute inset-0 pointer-events-none opacity-30">
      <svg
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <pattern
            id="grid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />
      </svg>
    </div>
  );
} 