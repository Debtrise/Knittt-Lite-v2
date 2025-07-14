'use client';

import React, { useState, useCallback, useRef } from 'react';
import { ContentElement } from '../../store/contentStore';

interface ResizeHandlesProps {
  element?: ContentElement;
  zoom?: number;
  onResize: (newSize: { width: number; height: number }) => void;
  onResizeStart: () => void;
  onResizeEnd: () => void;
}

export function ResizeHandles({ element, zoom = 1, onResize, onResizeStart, onResizeEnd }: ResizeHandlesProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);

  // Get element-specific constraints
  const getElementConstraints = (elementType?: string) => {
    const constraints = {
      minWidth: 20,
      minHeight: 20,
      maxWidth: 2000,
      maxHeight: 2000,
      aspectRatio: null as number | null,
      snapToAspectRatio: false
    };

    switch (elementType) {
      case 'animation':
      case 'confetti':
        // Animations work best with square or specific aspect ratios
        constraints.minWidth = 50;
        constraints.minHeight = 50;
        constraints.snapToAspectRatio = true;
        break;
      
      case 'qr_code':
        // QR codes should always be square
        constraints.aspectRatio = 1;
        constraints.minWidth = 50;
        constraints.minHeight = 50;
        break;
      
      case 'timer':
      case 'weather':
        // These modules have preferred aspect ratios
        constraints.minWidth = 100;
        constraints.minHeight = 60;
        break;
      
      case 'chart':
        // Charts need minimum size to be readable
        constraints.minWidth = 150;
        constraints.minHeight = 100;
        break;
      
      case 'video':
        // Videos often benefit from 16:9 aspect ratio
        constraints.minWidth = 160;
        constraints.minHeight = 90;
        constraints.snapToAspectRatio = true;
        break;
      
      case 'image':
      case 'standard_photo':
        // Images should maintain aspect ratio when shift is held
        constraints.minWidth = 50;
        constraints.minHeight = 50;
        constraints.snapToAspectRatio = true;
        break;
      
      case 'button':
        // Buttons have typical size constraints
        constraints.minWidth = 60;
        constraints.minHeight = 30;
        constraints.maxHeight = 100;
        break;
      
      case 'text':
        // Text needs minimum readable size
        constraints.minWidth = 50;
        constraints.minHeight = 20;
        break;
    }

    return constraints;
  };

  const handleMouseDown = useCallback((direction: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizeDirection(direction);
    setStartPosition({ x: e.clientX, y: e.clientY });
    setMaintainAspectRatio(e.shiftKey);
    
    // Get the initial size from the element props instead of DOM rect
    if (element) {
      setStartSize({ 
        width: element.size.width, 
        height: element.size.height 
      });
    } else {
      // Fallback to DOM measurement
    const elementContainer = (e.target as HTMLElement).parentElement?.parentElement;
    if (elementContainer) {
      const rect = elementContainer.getBoundingClientRect();
      setStartSize({ width: rect.width, height: rect.height });
      }
    }
    
    onResizeStart();
  }, [onResizeStart, element]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    // Account for zoom level in resize calculations
    const deltaX = (e.clientX - startPosition.x) / zoom;
    const deltaY = (e.clientY - startPosition.y) / zoom;
    const constraints = getElementConstraints(element?.elementType);
    
    let newWidth = startSize.width;
    let newHeight = startSize.height;
    const aspectRatio = startSize.width / startSize.height;

    // Check if shift key is held for aspect ratio
    const shouldMaintainAspectRatio = e.shiftKey || 
                                     maintainAspectRatio || 
                                     constraints.aspectRatio !== null ||
                                     (constraints.snapToAspectRatio && Math.abs(aspectRatio - 1) < 0.1);

    switch (resizeDirection) {
      case 'nw':
        newWidth = startSize.width - deltaX;
        newHeight = shouldMaintainAspectRatio ? newWidth / aspectRatio : startSize.height - deltaY;
        break;
      case 'n':
        newHeight = startSize.height - deltaY;
        if (shouldMaintainAspectRatio) {
          newWidth = newHeight * aspectRatio;
        }
        break;
      case 'ne':
        newWidth = startSize.width + deltaX;
        newHeight = shouldMaintainAspectRatio ? newWidth / aspectRatio : startSize.height - deltaY;
        break;
      case 'e':
        newWidth = startSize.width + deltaX;
        if (shouldMaintainAspectRatio) {
          newHeight = newWidth / aspectRatio;
        }
        break;
      case 'se':
        newWidth = startSize.width + deltaX;
        newHeight = shouldMaintainAspectRatio ? newWidth / aspectRatio : startSize.height + deltaY;
        break;
      case 's':
        newHeight = startSize.height + deltaY;
        if (shouldMaintainAspectRatio) {
          newWidth = newHeight * aspectRatio;
        }
        break;
      case 'sw':
        newWidth = startSize.width - deltaX;
        newHeight = shouldMaintainAspectRatio ? newWidth / aspectRatio : startSize.height + deltaY;
        break;
      case 'w':
        newWidth = startSize.width - deltaX;
        if (shouldMaintainAspectRatio) {
          newHeight = newWidth / aspectRatio;
        }
        break;
    }

    // Apply constraints
    if (constraints.aspectRatio) {
      // Force specific aspect ratio
      if (newWidth / newHeight !== constraints.aspectRatio) {
        newHeight = newWidth / constraints.aspectRatio;
      }
    }

    // Apply size constraints
    newWidth = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, newWidth));
    newHeight = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, newHeight));

    // If maintaining aspect ratio, adjust both dimensions
    if (shouldMaintainAspectRatio && !constraints.aspectRatio) {
      const currentAspectRatio = newWidth / newHeight;
      if (Math.abs(currentAspectRatio - aspectRatio) > 0.01) {
        if (resizeDirection.includes('e') || resizeDirection.includes('w')) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }
    }

    onResize({ width: newWidth, height: newHeight });
  }, [isResizing, resizeDirection, startPosition, startSize, onResize, element?.elementType, maintainAspectRatio, zoom]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      setResizeDirection('');
      setMaintainAspectRatio(false);
      onResizeEnd();
    }
  }, [isResizing, onResizeEnd]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const constraints = getElementConstraints(element?.elementType);
  const isSpecialElement = ['animation', 'confetti', 'qr_code', 'timer', 'weather'].includes(element?.elementType || '');

  const handleStyle = `absolute bg-blue-500 border-2 border-white shadow-lg transition-all duration-200 pointer-events-auto z-50 ${
    isResizing ? 'scale-110' : 'scale-100 hover:scale-125'
  }`;
  const cornerHandleStyle = `${handleStyle} w-4 h-4 rounded-full ${
    isSpecialElement ? 'bg-purple-500' : 'bg-blue-500'
  }`;
  const edgeHandleStyle = `${handleStyle} ${
    isSpecialElement ? 'bg-purple-400' : 'bg-blue-400'
  }`;

  return (
    <>
      {/* Size indicator during resize */}
      {isResizing && (
        <div className="absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-50">
          {Math.round(startSize.width)} × {Math.round(startSize.height)}
          {(maintainAspectRatio || constraints.aspectRatio) && (
            <span className="ml-1 text-yellow-300">🔒</span>
          )}
        </div>
      )}

      {/* Corner handles */}
      <div
        className={`${cornerHandleStyle} -top-2 -left-2 cursor-nw-resize`}
        onMouseDown={handleMouseDown('nw')}
        title="Resize (hold Shift for aspect ratio)"
      />
      <div
        className={`${cornerHandleStyle} -top-2 -right-2 cursor-ne-resize`}
        onMouseDown={handleMouseDown('ne')}
        title="Resize (hold Shift for aspect ratio)"
      />
      <div
        className={`${cornerHandleStyle} -bottom-2 -right-2 cursor-se-resize`}
        onMouseDown={handleMouseDown('se')}
        title="Resize (hold Shift for aspect ratio)"
      />
      <div
        className={`${cornerHandleStyle} -bottom-2 -left-2 cursor-sw-resize`}
        onMouseDown={handleMouseDown('sw')}
        title="Resize (hold Shift for aspect ratio)"
      />

      {/* Edge handles - hide for elements that should maintain aspect ratio */}
      {!constraints.aspectRatio && (
        <>
          <div
            className={`${edgeHandleStyle} -top-1 left-1/2 transform -translate-x-1/2 w-8 h-3 rounded cursor-n-resize`}
            onMouseDown={handleMouseDown('n')}
            title="Resize height"
          />
          <div
            className={`${edgeHandleStyle} -right-1 top-1/2 transform -translate-y-1/2 w-3 h-8 rounded cursor-e-resize`}
            onMouseDown={handleMouseDown('e')}
            title="Resize width"
          />
          <div
            className={`${edgeHandleStyle} -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-3 rounded cursor-s-resize`}
            onMouseDown={handleMouseDown('s')}
            title="Resize height"
          />
          <div
            className={`${edgeHandleStyle} -left-1 top-1/2 transform -translate-y-1/2 w-3 h-8 rounded cursor-w-resize`}
            onMouseDown={handleMouseDown('w')}
            title="Resize width"
          />
        </>
      )}

      {/* Aspect ratio indicator for special elements */}
      {isSpecialElement && (
        <div className="absolute -bottom-8 right-0 bg-purple-600 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none">
          {element?.elementType}
        </div>
      )}
    </>
  );
} 