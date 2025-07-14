'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ContentElement } from '../../store/contentStore';
import { ResizeHandles } from './ResizeHandles';
import { ElementRenderer } from './ElementRenderer';
import { 
  Move, 
  RotateCw, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff,
  Lock,
  Unlock,
  Magnet,
  Type
} from 'lucide-react';

interface CanvasElementProps {
  element: ContentElement;
  isSelected: boolean;
  zoom: number;
  snapEnabled?: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onUpdate: (updates: Partial<ContentElement>) => void;
  onUpdateLocal: (updates: Partial<ContentElement>) => void;
  onSyncToBackend: () => void;
  onDelete: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDoubleClick?: () => void;
  applySnapping?: (position: { x: number; y: number }, size: { width: number; height: number }) => { x: number; y: number };
}

export function CanvasElement({
  element,
  isSelected,
  zoom,
  snapEnabled = true,
  onSelect,
  onUpdate,
  onUpdateLocal,
  onSyncToBackend,
  onDelete,
  onDragStart,
  onDragEnd,
  onDoubleClick,
  applySnapping
}: CanvasElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isSnapping, setIsSnapping] = useState(false);
  
  // Add click vs drag detection
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseDownTime, setMouseDownTime] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const [dragThreshold] = useState(5); // pixels to move before considering it a drag

  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isLocked) return;
    
    e.stopPropagation();
    
    // Start click detection
    setIsMouseDown(true);
    setMouseDownTime(Date.now());
    setHasMoved(false);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x: element.position.x, y: element.position.y });
    
    // Select the element immediately
    onSelect(e);
  }, [element.position, onSelect, isLocked]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDown || isLocked) return;
    
    // Check if we've moved enough to consider it a drag
    const deltaX = Math.abs(e.clientX - dragStart.x);
    const deltaY = Math.abs(e.clientY - dragStart.y);
    
    if (!hasMoved && (deltaX > dragThreshold || deltaY > dragThreshold)) {
      setHasMoved(true);
      setIsDragging(true);
      
      // Notify parent that dragging started (for snap guide calculation)
      if (onDragStart) {
        onDragStart();
      }
    }
    
    // Only update position if we're actually dragging
    if (isDragging) {
      const moveDeltaX = (e.clientX - dragStart.x) / zoom;
      const moveDeltaY = (e.clientY - dragStart.y) / zoom;
      
      let newPosition = {
        x: elementStart.x + moveDeltaX,
        y: elementStart.y + moveDeltaY
      };

      // Apply snapping if enabled and function is available
      if (snapEnabled && applySnapping) {
        const snappedPosition = applySnapping(newPosition, element.size);
        const wasSnapped = snappedPosition.x !== newPosition.x || snappedPosition.y !== newPosition.y;
        setIsSnapping(wasSnapped);
        newPosition = snappedPosition;
      } else {
        setIsSnapping(false);
      }
      
      onUpdateLocal({
        position: {
          ...element.position,
          x: newPosition.x,
          y: newPosition.y
        }
      });
    }
  }, [isMouseDown, isDragging, dragStart, elementStart, zoom, onUpdateLocal, element.position, element.size, isLocked, snapEnabled, applySnapping, hasMoved, dragThreshold, onDragStart]);

  const handleMouseUp = useCallback((e?: MouseEvent) => {
    if (!isMouseDown) return;
    
    const clickDuration = Date.now() - mouseDownTime;
    const isQuickClick = clickDuration < 200 && !hasMoved;
    
    setIsMouseDown(false);
    
    if (isDragging) {
      setIsDragging(false);
      setIsSnapping(false);
      
      // Notify parent that dragging ended
      if (onDragEnd) {
        onDragEnd();
      }
      
      // Sync to backend after drag
      onSyncToBackend();
    } else if (isQuickClick && e) {
      // This was a quick click, not a drag
      // The element is already selected from mouseDown
      console.log('Quick click detected');
    }
    
    setIsResizing(false);
  }, [isMouseDown, mouseDownTime, hasMoved, isDragging, onDragEnd, onSyncToBackend]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isLocked) return;
    
    e.stopPropagation();
    
    // For text elements, deselect the element and focus on text editing
    if ((element.properties.customElementType || element.elementType) === 'text') {
      // Clear the selection to prevent global hotkeys from interfering
      onSelect(null); // This will deselect the element
      
      // Dispatch event to switch to properties tab
      window.dispatchEvent(new CustomEvent('switch-to-properties'));
      
      // Small delay to ensure properties panel is rendered
      setTimeout(() => {
        const textArea = document.getElementById('text') as HTMLTextAreaElement;
        if (textArea) {
          textArea.focus();
          textArea.select();
        }
      }, 100);
    } else if (onDoubleClick) {
      onDoubleClick();
    }
  }, [isLocked, onDoubleClick, element.properties.customElementType, element.elementType, onSelect]);

  useEffect(() => {
    if (isMouseDown) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isMouseDown, handleMouseMove, handleMouseUp]);

  const handleResize = useCallback((newSize: { width: number; height: number }) => {
    if (isLocked) return;
    onUpdateLocal({ size: newSize });
  }, [onUpdateLocal, isLocked]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    onSyncToBackend();
  }, [onSyncToBackend]);

  const handleRotate = useCallback(() => {
    if (isLocked) return;
    const currentRotation = element.styles?.transform?.includes('rotate') 
      ? parseInt(element.styles.transform.match(/rotate\((-?\d+)deg\)/)?.[1] || '0')
      : 0;
    
    onUpdate({
      styles: {
        ...element.styles,
        transform: `rotate(${currentRotation + 15}deg)`
      }
    });
  }, [element.styles, onUpdate, isLocked]);

  const handleDuplicate = useCallback(() => {
    // This would typically be handled by the parent component
    console.log('Duplicate element:', element.id);
  }, [element.id]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isSelected) return;

    // Enhanced check to prevent shortcuts when typing in input fields or contentEditable elements
    const target = e.target as HTMLElement;
    const isInputField = target instanceof HTMLInputElement || 
                        target instanceof HTMLTextAreaElement ||
                        target.isContentEditable ||
                        target.tagName === 'INPUT' ||
                        target.tagName === 'TEXTAREA' ||
                        target.closest('[contenteditable]') ||
                        target.closest('input') ||
                        target.closest('textarea') ||
                        target.id === 'text'; // Specifically check for the text editing textarea
    
    // Also check if the currently focused element is an input field
    const activeElement = document.activeElement;
    const isActiveInputField = activeElement instanceof HTMLInputElement ||
                              activeElement instanceof HTMLTextAreaElement ||
                              activeElement?.tagName === 'INPUT' ||
                              activeElement?.tagName === 'TEXTAREA' ||
                              activeElement?.id === 'text';
    
    if (isInputField || isActiveInputField) {
      return;
    }

    // Special check for text elements being edited
    if ((element.properties.customElementType || element.elementType) === 'text') {
      const textArea = document.getElementById('text') as HTMLTextAreaElement;
      if (textArea && document.activeElement === textArea) {
        return; // Don't process shortcuts when editing text
      }
    }

    // Function to move element with snapping support
    const moveElement = (deltaX: number, deltaY: number) => {
      let newPosition = {
        x: element.position.x + deltaX,
        y: element.position.y + deltaY
      };

      // Apply snapping if enabled and function is available
      if (snapEnabled && applySnapping) {
        newPosition = applySnapping(newPosition, element.size);
      }

      onUpdateLocal({
        position: {
          ...element.position,
          x: newPosition.x,
          y: newPosition.y
        }
      });
    };

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (!isLocked) {
          onDelete();
        }
        break;
      case 'ArrowUp':
        if (!isLocked) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          moveElement(0, -step);
        }
        break;
      case 'ArrowDown':
        if (!isLocked) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          moveElement(0, step);
        }
        break;
      case 'ArrowLeft':
        if (!isLocked) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          moveElement(-step, 0);
        }
        break;
      case 'ArrowRight':
        if (!isLocked) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          moveElement(step, 0);
        }
        break;
    }
  }, [isSelected, element.position, element.size, onUpdateLocal, onDelete, isLocked, snapEnabled, applySnapping]);

  useEffect(() => {
    if (isSelected) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isSelected, handleKeyDown]);

  const elementStyle = {
    position: 'absolute' as const,
    left: `${element.position.x}px`,
    top: `${element.position.y}px`,
    width: `${element.size.width}px`,
    height: `${element.size.height}px`,
    zIndex: element.position.z || 0,
    opacity: isVisible ? (element.opacity || 1) : 0.3,
    cursor: isLocked ? 'default' : (isDragging ? 'grabbing' : (isSelected ? 'move' : 'pointer')),
    transform: element.styles?.transform || 'none',
    ...element.styles
  };

  // Check if this text element is being edited (textarea is focused)
  const isTextEditing = React.useMemo(() => {
    if ((element.properties.customElementType || element.elementType) !== 'text') return false;
    const textArea = document.getElementById('text') as HTMLTextAreaElement;
    return textArea && document.activeElement === textArea;
  }, [element.properties.customElementType, element.elementType]);

  return (
    <div
      ref={elementRef}
      id={`element-${element.id}`}
      className={`group transition-all duration-300 ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' : ''
      } ${isLocked ? 'pointer-events-none opacity-75' : ''} ${
        isHovered && !isSelected ? 'ring-1 ring-gray-300 ring-offset-1' : ''
      } ${
        isSnapping ? 'ring-2 ring-green-500 ring-offset-2 shadow-green-200' : ''
      } ${
        isDragging ? 'ring-2 ring-orange-500 ring-offset-2 shadow-orange-200 scale-105' : ''
      } ${
        isTextEditing ? 'ring-2 ring-purple-500 ring-offset-2 shadow-purple-200' : ''
      }`}
      style={elementStyle}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Element Content */}
      <ElementRenderer element={element} />

      {/* Text Editing Indicator */}
      {isTextEditing && (
        <div className="absolute -top-3 -left-3 bg-purple-500 text-white text-xs px-2 py-1 rounded-full shadow-lg pointer-events-none animate-pulse">
          <Type className="w-3 h-3 inline mr-1" />
          Editing
        </div>
      )}

      {/* Snap indicator */}
      {isSnapping && snapEnabled && (
        <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg pointer-events-none animate-pulse">
          <Magnet className="w-3 h-3 inline mr-1" />
          Snapped
        </div>
      )}
          
          {/* Resize Handles */}
      {isSelected && !isLocked && (
            <ResizeHandles
              element={element}
          zoom={zoom}
              onResize={handleResize}
              onResizeStart={() => setIsResizing(true)}
              onResizeEnd={handleResizeEnd}
            />
      )}

      {/* Element Controls */}
      {isSelected && (
        <div className="absolute -top-12 left-0 flex items-center space-x-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2 pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLocked(!isLocked);
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
            title={isLocked ? 'Unlock element' : 'Lock element'}
          >
            {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(!isVisible);
              onUpdate({ opacity: isVisible ? 0.3 : 1 });
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
            title={isVisible ? 'Hide element' : 'Show element'}
          >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <div className="w-px h-4 bg-gray-300"></div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRotate();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors disabled:opacity-50"
            title="Rotate 15° clockwise"
            disabled={isLocked}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors disabled:opacity-50"
            title="Duplicate element"
            disabled={isLocked}
          >
            <Copy className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-gray-300"></div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 hover:bg-red-100 rounded-md text-red-600 transition-colors disabled:opacity-50"
            title="Delete element"
            disabled={isLocked}
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Snap status indicator */}
          {snapEnabled && (
            <div className="w-px h-4 bg-gray-300 ml-1"></div>
          )}
          {snapEnabled && (
            <div className="flex items-center px-2 py-1 bg-blue-50 rounded text-xs text-blue-700 border border-blue-200">
              <Magnet className="w-3 h-3 mr-1" />
              <span>Snap</span>
            </div>
          )}
        </div>
      )}

      {/* Element Type Badge */}
      {(isSelected || isHovered) && (
        <div className="absolute -bottom-8 left-0 bg-gray-900/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none shadow-lg">
          <span className="capitalize font-medium">
            {(element.properties?.customElementType || element.elementType).replace(/_/g, ' ')}
          </span>
          {/* Position indicator */}
          <span className="ml-2 opacity-75 font-mono">
            {Math.round(element.position.x)}, {Math.round(element.position.y)}
          </span>
          {/* Special indicators for constrained elements */}
          {element.elementType === 'qr_code' && <span className="ml-1.5 opacity-75">□</span>}
          {['animation', 'confetti'].includes(element.elementType) && <span className="ml-1.5 opacity-75">⚡</span>}
          {['timer', 'weather', 'chart'].includes(element.elementType) && <span className="ml-1.5 opacity-75">📊</span>}
          {isSnapping && <span className="ml-1.5 text-green-400">📍</span>}
        </div>
      )}

      {/* Enhanced resizing hints with snap information */}
      {isSelected && (isResizing || isDragging) && (
        <div className="absolute -top-16 left-0 bg-blue-600 text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none z-50 max-w-xs">
          {isDragging && snapEnabled && "Smart guides help align with other elements"}
          {isDragging && !snapEnabled && "Hold Shift for fine positioning"}
          {isResizing && element.elementType === 'qr_code' && "QR codes maintain square aspect ratio"}
          {isResizing && ['animation', 'confetti'].includes(element.elementType) && "Hold Shift for proportional resize"}
          {isResizing && element.elementType === 'video' && "Videos work best with 16:9 ratio (hold Shift)"}
          {isResizing && element.elementType === 'image' && "Hold Shift to maintain aspect ratio"}
          {isResizing && element.elementType === 'standard_photo' && "Hold Shift to maintain aspect ratio"}
          {isResizing && ['timer', 'weather'].includes(element.elementType) && "Modules have minimum readable sizes"}
          {isResizing && element.elementType === 'chart' && "Charts need sufficient size for data visibility"}
          {isResizing && !['qr_code', 'animation', 'confetti', 'video', 'image', 'standard_photo', 'timer', 'weather', 'chart'].includes(element.elementType) && 
           "Hold Shift to maintain aspect ratio"}
        </div>
      )}

      {/* Keyboard shortcuts hint for selected element */}
      {isSelected && !isDragging && !isResizing && (
        <div className="absolute -bottom-16 left-0 bg-gray-800/90 text-white text-xs px-3 py-2 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity delay-500">
          <div className="space-y-1">
            <div>Use arrow keys to move (Shift+arrow for 10px)</div>
            <div>Delete/Backspace to remove • R to rotate</div>
            {snapEnabled && <div className="text-blue-300">Smart guides: ON</div>}
          </div>
        </div>
      )}
    </div>
  );
} 