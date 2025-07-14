'use client';

import React, { forwardRef, useCallback, useState, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { ContentElement } from '../../store/contentStore';
import { CanvasElement } from './CanvasElement';
import { CanvasToolbar } from './CanvasToolbar';
import { GridLines } from './GridLines';
import { ZoomControls } from './ZoomControls';
import { SnapGuides } from './SnapGuides';

interface CanvasProps {
  elements: ContentElement[];
  canvasSize: { width: number; height: number };
  canvasBackground: {
    type: 'solid' | 'gradient' | 'image' | 'video';
    color?: string;
    gradient?: string;
    imageUrl?: string;
    url?: string; // For video backgrounds
  };
  selectedElement: ContentElement | null;
  selectedElements: string[];
  onElementSelect: (element: ContentElement | null) => void;
  onElementsSelect: (elementIds: string[]) => void;
  onElementToggleSelect: (elementId: string) => void;
  onClearSelection: () => void;
  onElementUpdate: (elementId: string, updates: Partial<ContentElement>) => void;
  onElementUpdateLocal: (elementId: string, updates: Partial<ContentElement>) => void;
  onElementSyncToBackend: (elementId: string) => void;
  onElementDelete: (elementId: string) => void;
  onElementDrop: (elementType: string, position: { x: number; y: number }) => void;
  onAssetDrop?: (asset: any, position: { x: number; y: number }) => void;
  onCanvasBackgroundChange: (background: any) => void;
  onCanvasSizeChange: (size: { width: number; height: number }) => void;
  snapEnabled?: boolean;
}

interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  elements: string[];
  label?: string;
}

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  elements,
  canvasSize,
  canvasBackground,
  selectedElement,
  selectedElements,
  onElementSelect,
  onElementsSelect,
  onElementToggleSelect,
  onClearSelection,
  onElementUpdate,
  onElementUpdateLocal,
  onElementSyncToBackend,
  onElementDelete,
  onElementDrop,
  onAssetDrop,
  onCanvasBackgroundChange,
  onCanvasSizeChange,
  snapEnabled: parentSnapEnabled = true
}, ref) => {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers] = useState(false); // Always false - rulers disabled
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCentering, setIsCentering] = useState(false);
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);
  
  // Selection box states
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Snap guide states
  const [snapEnabled, setSnapEnabled] = useState(parentSnapEnabled);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [activeSnapLines, setActiveSnapLines] = useState<SnapGuide[]>([]);
  const [snapTolerance] = useState(8); // Snap tolerance in pixels at 100% zoom
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply snapping to element position - Define before useDrop to avoid initialization error
  const applySnapping = useCallback((position: { x: number; y: number }, size: { width: number; height: number }) => {
    if (!snapEnabled) return position;

    const scaledTolerance = snapTolerance / zoom;
    let snappedX = position.x;
    let snappedY = position.y;
    const activeSnaps: SnapGuide[] = [];

    // Check for vertical snaps (X position)
    const elementLeft = position.x;
    const elementRight = position.x + size.width;
    const elementCenterX = position.x + size.width / 2;

    snapGuides.forEach(guide => {
      if (guide.type === 'vertical') {
        // Left edge snap
        if (Math.abs(elementLeft - guide.position) < scaledTolerance) {
          snappedX = guide.position;
          activeSnaps.push(guide);
        }
        // Right edge snap
        else if (Math.abs(elementRight - guide.position) < scaledTolerance) {
          snappedX = guide.position - size.width;
          activeSnaps.push(guide);
        }
        // Center snap
        else if (Math.abs(elementCenterX - guide.position) < scaledTolerance) {
          snappedX = guide.position - size.width / 2;
          activeSnaps.push(guide);
        }
      }
    });

    // Check for horizontal snaps (Y position)
    const elementTop = position.y;
    const elementBottom = position.y + size.height;
    const elementCenterY = position.y + size.height / 2;

    snapGuides.forEach(guide => {
      if (guide.type === 'horizontal') {
        // Top edge snap
        if (Math.abs(elementTop - guide.position) < scaledTolerance) {
          snappedY = guide.position;
          activeSnaps.push(guide);
        }
        // Bottom edge snap
        else if (Math.abs(elementBottom - guide.position) < scaledTolerance) {
          snappedY = guide.position - size.height;
          activeSnaps.push(guide);
        }
        // Center snap
        else if (Math.abs(elementCenterY - guide.position) < scaledTolerance) {
          snappedY = guide.position - size.height / 2;
          activeSnaps.push(guide);
        }
      }
    });

    setActiveSnapLines(activeSnaps);

    return { x: snappedX, y: snappedY };
  }, [snapGuides, snapEnabled, snapTolerance, zoom]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['element', 'asset'],
    drop: (item: any, monitor) => {
      // Prevent duplicate drops
      if (isProcessingDrop) {
        console.log('Drop already in progress, skipping duplicate');
        return;
      }
      
      setIsProcessingDrop(true);
      
      try {
        const offset = monitor.getClientOffset();
        if (offset && canvasRef.current) {
          const canvasRect = canvasRef.current.getBoundingClientRect();
          const itemType = monitor.getItemType();
          
          let position = {
            x: (offset.x - canvasRect.left - canvasPosition.x) / zoom,
            y: (offset.y - canvasRect.top - canvasPosition.y) / zoom
          };

          // Apply snapping to dropped elements
          if (snapEnabled) {
            position = applySnapping(position, { width: 200, height: 100 });
          }

          if (itemType === 'element') {
            onElementDrop(item.elementType, position);
          } else if (itemType === 'asset' && onAssetDrop) {
            onAssetDrop(item.asset, position);
          }
        }
      } finally {
        // Reset the flag after a short delay
        setTimeout(() => {
          setIsProcessingDrop(false);
        }, 500);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [canvasPosition, zoom, snapEnabled, applySnapping, onElementDrop, onAssetDrop, isProcessingDrop]);

  // Calculate snap guides based on all elements
  const calculateSnapGuides = useCallback(() => {
    const guides: SnapGuide[] = [];
    
    // Canvas center lines
    guides.push({
      type: 'vertical',
      position: canvasSize.width / 2,
      elements: ['canvas-center'],
      label: 'Center'
    });
    guides.push({
      type: 'horizontal',
      position: canvasSize.height / 2,
      elements: ['canvas-center'],
      label: 'Center'
    });

    // Canvas edges
    guides.push({
      type: 'vertical',
      position: 0,
      elements: ['canvas-edge'],
      label: 'Left edge'
    });
    guides.push({
      type: 'vertical',
      position: canvasSize.width,
      elements: ['canvas-edge'],
      label: 'Right edge'
    });
    guides.push({
      type: 'horizontal',
      position: 0,
      elements: ['canvas-edge'],
      label: 'Top edge'
    });
    guides.push({
      type: 'horizontal',
      position: canvasSize.height,
      elements: ['canvas-edge'],
      label: 'Bottom edge'
    });

    // Element-based guides
    elements.forEach(element => {
      if (selectedElement && element.id === selectedElement.id) return;

      const { x, y } = element.position;
      const { width, height } = element.size;

      // Element edges
      guides.push({
        type: 'vertical',
        position: x,
        elements: [element.id],
        label: 'Left'
      });
      guides.push({
        type: 'vertical',
        position: x + width,
        elements: [element.id],
        label: 'Right'
      });
      guides.push({
        type: 'horizontal',
        position: y,
        elements: [element.id],
        label: 'Top'
      });
      guides.push({
        type: 'horizontal',
        position: y + height,
        elements: [element.id],
        label: 'Bottom'
      });

      // Element centers
      guides.push({
        type: 'vertical',
        position: x + width / 2,
        elements: [element.id],
        label: 'Center'
      });
      guides.push({
        type: 'horizontal',
        position: y + height / 2,
        elements: [element.id],
        label: 'Center'
      });
    });

    setSnapGuides(guides);
  }, [elements, selectedElement, canvasSize]);



  // Handle element drag start
  const handleElementDragStart = useCallback(() => {
    setIsDraggingElement(true);
    calculateSnapGuides();
  }, [calculateSnapGuides]);

  // Handle element drag end
  const handleElementDragEnd = useCallback(() => {
    setIsDraggingElement(false);
    setActiveSnapLines([]);
  }, []);

  // Handle element position update with snapping
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<ContentElement>) => {
    // Ensure updates object exists
    if (!updates) {
      return;
    }

    let finalUpdates = { ...updates };

    // Apply snapping only to position updates when dragging
    if (finalUpdates.position && snapEnabled && isDraggingElement && applySnapping) {
      const element = elements.find(el => el.id === elementId);
      if (element && element.size) {
        const snappedPosition = applySnapping(finalUpdates.position, element.size);
        finalUpdates.position = snappedPosition;
      }
    }

    onElementUpdateLocal(elementId, finalUpdates);
  }, [applySnapping, snapEnabled, isDraggingElement, elements, onElementUpdateLocal]);

  // Calculate which elements are within the selection box
  const getElementsInSelectionBox = useCallback((box: { x: number; y: number; width: number; height: number }) => {
    return elements.filter(element => {
      const elementRect = {
        x: element.position.x,
        y: element.position.y,
        width: element.size.width,
        height: element.size.height
      };

      // Check if element overlaps with selection box
      return (
        elementRect.x < box.x + box.width &&
        elementRect.x + elementRect.width > box.x &&
        elementRect.y < box.y + box.height &&
        elementRect.y + elementRect.height > box.y
      );
    }).map(element => element.id);
  }, [elements]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - canvasRect.left - canvasPosition.x) / zoom;
    const canvasY = (e.clientY - canvasRect.top - canvasPosition.y) / zoom;

    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+click for panning
      setIsDragging(true);
      setDragStart({ x: e.clientX - canvasPosition.x, y: e.clientY - canvasPosition.y });
      e.preventDefault();
    } else if (e.button === 0 && e.target === canvasRef.current) { // Left click on canvas
      if (!e.ctrlKey && !e.metaKey) {
        // Clear selection if not holding Ctrl/Cmd
        onClearSelection();
      }
      
      // Start selection box
      setIsSelecting(true);
      setSelectionStart({ x: canvasX, y: canvasY });
      setSelectionEnd({ x: canvasX, y: canvasY });
      setSelectionBox({ x: canvasX, y: canvasY, width: 0, height: 0 });
    }
  }, [canvasPosition, zoom, onClearSelection]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    if (isDragging) {
      setCanvasPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isSelecting) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const canvasX = (e.clientX - canvasRect.left - canvasPosition.x) / zoom;
      const canvasY = (e.clientY - canvasRect.top - canvasPosition.y) / zoom;

      setSelectionEnd({ x: canvasX, y: canvasY });

      // Update selection box
      const box = {
        x: Math.min(selectionStart.x, canvasX),
        y: Math.min(selectionStart.y, canvasY),
        width: Math.abs(canvasX - selectionStart.x),
        height: Math.abs(canvasY - selectionStart.y)
      };
      setSelectionBox(box);
    }
  }, [isDragging, dragStart, isSelecting, selectionStart, canvasPosition, zoom]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isSelecting) {
      // Select elements within the selection box
      if (selectionBox.width > 5 || selectionBox.height > 5) { // Only if box is large enough
        const elementsInBox = getElementsInSelectionBox(selectionBox);
        if (elementsInBox.length > 0) {
          onElementsSelect(elementsInBox);
        }
      }
      
      setIsSelecting(false);
      setSelectionBox({ x: 0, y: 0, width: 0, height: 0 });
    }
    
    setIsDragging(false);
  }, [isSelecting, selectionBox, getElementsInSelectionBox, onElementsSelect]);

  // Center canvas function
  const centerCanvas = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      setIsCentering(true);
      
      const containerRect = container.getBoundingClientRect();
      
      const scaledCanvasWidth = canvasSize.width * zoom;
      const scaledCanvasHeight = canvasSize.height * zoom;
      
      // Calculate center position - no ruler offset needed
      const centerX = (containerRect.width - scaledCanvasWidth) / 2;
      const centerY = (containerRect.height - scaledCanvasHeight) / 2;
      
      setCanvasPosition({ 
        x: Math.max(0, centerX), 
        y: Math.max(0, centerY) 
      });
      
      // Clear centering indicator after animation
      setTimeout(() => setIsCentering(false), 300);
    }
  }, [canvasSize, zoom]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, zoom * delta));
      
      setZoom(newZoom);
      // Re-center after zoom
      requestAnimationFrame(() => centerCanvas());
    }
  }, [zoom, centerCanvas]);

  const getCanvasStyle = () => {
    let backgroundStyle = {};
    
    switch (canvasBackground.type) {
      case 'solid':
        backgroundStyle = { backgroundColor: canvasBackground.color || '#ffffff' };
        break;
      case 'gradient':
        backgroundStyle = { background: canvasBackground.gradient || 'linear-gradient(45deg, #f0f0f0, #ffffff)' };
        break;
      case 'image':
        backgroundStyle = {
          backgroundImage: `url(${canvasBackground.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
        break;
      case 'video':
        // For video backgrounds, we'll set a fallback color and handle the video separately
        backgroundStyle = { backgroundColor: '#000000' };
        break;
    }

    return {
      width: `${canvasSize.width}px`,
      height: `${canvasSize.height}px`,
      transform: `scale(${zoom})`,
      transformOrigin: '0 0',
      ...backgroundStyle
    };
  };

  // Calculate snap guides when elements change
  useEffect(() => {
    calculateSnapGuides();
  }, [elements, selectedElement, calculateSnapGuides]);

  // Sync snap enabled state with parent
  useEffect(() => {
    setSnapEnabled(parentSnapEnabled);
  }, [parentSnapEnabled]);

  // Center canvas on mount and when container size changes
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        centerCanvas();
      }
    };

    if (!isInitialized && containerRef.current && canvasRef.current) {
      // Initial center with requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        centerCanvas();
        setIsInitialized(true);
      });
    }

    // Re-center on window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasSize, zoom, isInitialized, centerCanvas]);

  // Re-center when canvas size changes externally
  useEffect(() => {
    if (isInitialized) {
      requestAnimationFrame(() => centerCanvas());
    }
  }, [canvasSize.width, canvasSize.height, isInitialized, centerCanvas]);

  // Combine refs
  const combinedRef = useCallback((node: HTMLDivElement) => {
    canvasRef.current = node;
    drop(node);
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    }
  }, [drop, ref]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Canvas Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <CanvasToolbar
          zoom={zoom}
          onZoomChange={(newZoom) => {
            setZoom(newZoom);
            // Use requestAnimationFrame for smoother updates
            requestAnimationFrame(() => centerCanvas());
          }}
          showGrid={showGrid}
          onToggleGrid={setShowGrid}
          showRulers={false}
          onToggleRulers={() => {}} // No-op function
          canvasSize={canvasSize}
          onCanvasSizeChange={onCanvasSizeChange}
          canvasBackground={canvasBackground}
          onCanvasBackgroundChange={onCanvasBackgroundChange}
          snapEnabled={snapEnabled}
          onToggleSnap={setSnapEnabled}
        />
      </div>

      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Main Canvas Container */}
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-auto"
          style={{
            cursor: isDragging ? 'grabbing' : 'default',
            touchAction: 'none', // Prevent browser zoom on touch devices
            userSelect: 'none' // Prevent text selection
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          {/* Canvas Viewport */}
          <div 
            className="relative w-full h-full"
            style={{
              background: 'radial-gradient(circle at center, rgba(0,0,0,0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              minWidth: '100%',
              minHeight: '100%'
            }}
          >
            {/* Canvas */}
            <div
              className="absolute"
              style={{
                left: `${canvasPosition.x}px`,
                top: `${canvasPosition.y}px`,
                width: 'fit-content',
                height: 'fit-content'
              }}
            >
              <div
                ref={combinedRef}
                className={`relative shadow-2xl transition-all duration-300 rounded-lg overflow-hidden ${
                  isOver ? 'border-2 border-blue-400 bg-blue-50 shadow-blue-200' : 
                  isCentering ? 'border-2 border-green-400 bg-green-50 shadow-green-200' :
                  'bg-white hover:shadow-xl'
                }`}
                style={getCanvasStyle()}

              >
              {/* Video Background - Positioned behind all other elements */}
              {canvasBackground.type === 'video' && canvasBackground.url && (
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src={canvasBackground.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  style={{
                    zIndex: -1,
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('Video background failed to load:', {
                      url: canvasBackground.url,
                      error: e.currentTarget.error,
                      networkState: e.currentTarget.networkState,
                      readyState: e.currentTarget.readyState
                    });
                    // Fallback to solid background color
                    if (onCanvasBackgroundChange) {
                      onCanvasBackgroundChange({
                        type: 'solid',
                        color: '#000000'
                      });
                    }
                  }}
                  onLoadStart={() => {
                    console.log('Video background loading started:', canvasBackground.url);
                  }}
                  onCanPlay={() => {
                    console.log('Video background can play:', canvasBackground.url);
                  }}
                  onCanPlayThrough={async (e) => {
                    // Enhanced autoplay handling for background videos
                    try {
                      await e.currentTarget.play();
                      console.log('Video background autoplay successful');
                    } catch (error) {
                      console.warn('Video background autoplay failed:', error);
                    }
                  }}
                />
              )}

              {/* Grid Lines */}
              {showGrid && (
                <GridLines
                  width={canvasSize.width}
                  height={canvasSize.height}
                  zoom={zoom}
                />
              )}

              {/* Snap Guides */}
              {snapEnabled && isDraggingElement && (
                <SnapGuides
                  guides={activeSnapLines}
                  canvasSize={canvasSize}
                  zoom={zoom}
                />
              )}

              {/* Elements */}
              {elements
                .sort((a, b) => a.layerOrder - b.layerOrder)
                .map((element) => (
                  <CanvasElement
                    key={element.id}
                    element={element}
                    isSelected={selectedElement?.id === element.id || selectedElements.includes(element.id)}
                    zoom={zoom}
                    snapEnabled={snapEnabled}
                    onSelect={(e?: React.MouseEvent) => {
                      if (e && (e.ctrlKey || e.metaKey)) {
                        // Toggle selection with Ctrl/Cmd+click
                        onElementToggleSelect(element.id);
                      } else {
                        // Regular selection
                        onElementSelect(element);
                      }
                    }}
                    onUpdate={(updates) => handleElementUpdate(element.id, updates)}
                    onUpdateLocal={(updates) => handleElementUpdate(element.id, updates)}
                    onSyncToBackend={() => onElementSyncToBackend(element.id)}
                    onDelete={() => onElementDelete(element.id)}
                    onDragStart={handleElementDragStart}
                    onDragEnd={handleElementDragEnd}
                    onDoubleClick={() => {
                      // Open properties panel when double-clicking an element
                      onElementSelect(element);
                      // Switch to properties tab
                      const event = new CustomEvent('switch-to-properties');
                      window.dispatchEvent(event);
                    }}
                    applySnapping={applySnapping}
                  />
                ))}

              {/* Selection Box */}
              {isSelecting && selectionBox.width > 0 && selectionBox.height > 0 && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
                  style={{
                    left: `${selectionBox.x}px`,
                    top: `${selectionBox.y}px`,
                    width: `${selectionBox.width}px`,
                    height: `${selectionBox.height}px`,
                  }}
                />
              )}

              {/* Drop Zone Indicator */}
              {isOver && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    Drop element here
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 z-20">
          <ZoomControls
            zoom={zoom}
            onZoomChange={(newZoom, shouldCenter) => {
              setZoom(newZoom);
              if (shouldCenter) {
                // Use requestAnimationFrame for smoother updates
                requestAnimationFrame(() => centerCanvas());
              }
            }}
            onFitToScreen={() => {
              // Calculate zoom to fit canvas in viewport
              const container = containerRef.current;
              if (container) {
                const containerRect = container.getBoundingClientRect();
                const padding = 40;
                const availableWidth = containerRect.width - padding;
                const availableHeight = containerRect.height - padding;
                const zoomX = availableWidth / canvasSize.width;
                const zoomY = availableHeight / canvasSize.height;
                const fitZoom = Math.min(zoomX, zoomY, 1);
                const newZoom = Math.max(0.1, fitZoom);
                setZoom(newZoom);
                
                // Center after fitting
                requestAnimationFrame(() => centerCanvas());
              }
            }}
            onResetView={() => {
              setZoom(1);
              // Center at 100% zoom
              requestAnimationFrame(() => centerCanvas());
            }}
            onCenterCanvas={centerCanvas}
          />
        </div>

        {/* Snap Status Indicator */}
        {snapEnabled && activeSnapLines.length > 0 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg animate-pulse">
              Smart guides active
            </div>
          </div>
        )}
      </div>
    </div>
  );
}); 

Canvas.displayName = 'Canvas'; 