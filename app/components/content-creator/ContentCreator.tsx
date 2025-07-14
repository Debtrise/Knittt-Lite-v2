'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ElementPanel } from './ElementPanel';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { ProjectToolbar } from './ProjectToolbar';
import { PreviewModal } from './PreviewModal';
import { AssetLibrary } from './AssetLibrary';
import { VariablePanel } from './VariablePanel';
import { ExportPanel } from './ExportPanel';
import { SaveAsTemplateDialog, type TemplateData } from './SaveAsTemplateDialog';
import { QuickShortcuts } from './QuickShortcuts';
import { SalesRepPhotosPanel } from './SalesRepPhotosPanel';
import { TemplateBrowser } from './TemplateBrowser';
import { useContentStore } from '../../store/contentStore';
import type { ContentElement } from '../../store/contentStore';
import { 
  Play, Save, Upload, Settings, Eye, Layers, Download, 
  History, Palette, Layout, Zap, Library, Sparkles,
  PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose,
  Maximize2, Minimize2, RotateCcw, RotateCw, Copy, Trash2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ChevronDown, Plus, Search, Filter, Grid3X3, Ruler, Magnet,
  FileImage
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Input } from '../ui/Input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';

interface ContentCreatorProps {
  projectId?: string;
  templateId?: string;
}

export function ContentCreator({ projectId, templateId }: ContentCreatorProps) {
  const {
    currentProject,
    projects,
    elements,
    selectedElement,
    selectedElements,
    assets,
    variables,
    templates,
    canvasSize,
    canvasBackground,
    isLoading,
    error,
    hasUnsavedChanges,
    setCurrentProject,
    loadProjects,
    loadProject,
    saveProject,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    createElement,
    updateElement,
    updateElementLocal,
    syncElementToBackend,
    deleteElement,
    selectElement,
    selectElements,
    addToSelection,
    removeFromSelection,
    toggleElementSelection,
    clearSelection,
    selectAllElements,
    reorderElements,
    loadAssets,
    uploadAsset,
    deleteAsset,
    loadVariables,
    createVariable,
    loadTemplates,
    createTemplate,
    saveAsTemplate,
    loadTemplate,
    updateTemplate,
    deleteTemplate,
    setCanvasSize,
    updateCanvasBackground,
    generatePreview,
    publishProject,
  } = useContentStore();

  // Enhanced UI State
  const [activeTab, setActiveTab] = useState('elements');
  const [showPreview, setShowPreview] = useState(false);
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [historyPanel, setHistoryPanel] = useState(false);
  const [layersPanel, setLayersPanel] = useState(false);
  
  // New user-friendly features
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>(['#3b82f6', '#ef4444', '#10b981', '#f59e0b']);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<'design' | 'preview' | 'code'>('design');
  const [draggedElement, setDraggedElement] = useState<string | null>(null);

  // Add state to prevent duplicate element creation
  const [isCreatingElement, setIsCreatingElement] = useState(false);
  const [pendingElementCreation, setPendingElementCreation] = useState<Set<string>>(new Set());

  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Quick elements for keyboard shortcuts
  const quickElements = ['text', 'image', 'video', 'pie_chart', 'matrix_rain', 'floating_hearts', 'raining_money', 'solar_flare'];

  // Enhanced element creation with better defaults and duplication prevention
  const handleElementDrop = useCallback(async (elementType: string, position: { x: number; y: number }) => {
    // For new element creation from drag/drop, we want to prevent rapid duplicates
    // but still allow legitimate new element creation
    const creationKey = `${elementType}-${Math.floor(position.x/50)}-${Math.floor(position.y/50)}`; // Group nearby positions
    
    // Prevent duplicate creation only for very similar positions/types in short time
    if (isCreatingElement || pendingElementCreation.has(creationKey)) {
      console.log('Element creation already in progress for this position, skipping duplicate');
      return;
    }
    
    setIsCreatingElement(true);
    setPendingElementCreation(prev => new Set(prev).add(creationKey));
    
    try {
      const elementConfig = getEnhancedElementConfig(elementType);
      
      // Map new element types to database-compatible types
      const dbElementType = mapToDbElementType(elementType);
      
      await createElement({
        elementType: dbElementType,
        position: { ...position, z: elements.length },
        size: elementConfig.size,
        properties: {
          ...elementConfig.properties,
          customElementType: elementType // Store the original type for rendering
        },
        styles: elementConfig.styles,
        animations: elementConfig.animations || [],
        layerOrder: elements.length,
        opacity: 1
      });
    } catch (error) {
      console.error('Error creating element:', error);
      toast.error('Failed to create element');
    } finally {
      setIsCreatingElement(false);
      // Clear the creation key after a shorter delay to allow new elements at different positions
      setTimeout(() => {
        setPendingElementCreation(prev => {
          const newSet = new Set(prev);
          newSet.delete(creationKey);
          return newSet;
        });
      }, 300); // Shorter delay for element creation
    }
  }, [createElement, elements.length, isCreatingElement, pendingElementCreation]);

  // Handle element updates (position, size, properties changes)
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<ContentElement>) => {
    // For element updates, we should always use updateElement, not createElement
    // This is for existing elements being modified
    updateElementLocal(elementId, updates);
  }, [updateElementLocal]);

  // Handle element updates that need to be synced to backend
  const handleElementUpdateAndSync = useCallback(async (elementId: string, updates: Partial<ContentElement>) => {
    // Update locally first for immediate UI feedback
    updateElementLocal(elementId, updates);
    
    // Then sync to backend
    try {
      await updateElement(elementId, updates);
    } catch (error) {
      console.error('Error syncing element update:', error);
      toast.error('Failed to save element changes');
    }
  }, [updateElementLocal, updateElement]);

  // Handle asset drop - creates appropriate elements based on asset type
  const handleAssetDrop = useCallback(async (asset: any, position: { x: number; y: number }) => {
    // For asset drops, check if we're replacing an existing element or creating new
    const creationKey = `asset-${asset.id}-${Math.floor(position.x/50)}-${Math.floor(position.y/50)}`;
    
    // Prevent duplicate asset drops
    if (isCreatingElement || pendingElementCreation.has(creationKey)) {
      console.log('Asset drop already in progress for this position, skipping duplicate');
      return;
    }
    
    setIsCreatingElement(true);
    setPendingElementCreation(prev => new Set(prev).add(creationKey));
    
    try {
      let elementType: string;
      let elementConfig: any;
      
      // Determine element type based on asset type
      switch (asset.assetType) {
        case 'image':
          elementType = 'image';
          elementConfig = getEnhancedElementConfig('image');
          // Set size to fill the entire canvas
          elementConfig.size = { 
            width: canvasSize.width, 
            height: canvasSize.height 
          };
          // Set position to top-left (0,0) to fill canvas
          position = { x: 0, y: 0 };
          elementConfig.properties = {
            ...elementConfig.properties,
            src: asset.publicUrl,
            alt: asset.name,
            assetId: asset.id,
            objectFit: 'cover' // Cover the entire canvas
          };
          break;
          
        case 'video':
          elementType = 'video_player';
          elementConfig = getEnhancedElementConfig('video_player');
          // Set size to fill the entire canvas
          elementConfig.size = { 
            width: canvasSize.width, 
            height: canvasSize.height 
          };
          // Set position to top-left (0,0) to fill canvas
          position = { x: 0, y: 0 };
          elementConfig.properties = {
            ...elementConfig.properties,
            src: asset.publicUrl,
            assetId: asset.id,
            objectFit: 'cover' // Cover the entire canvas
          };
          break;
          
        case 'audio':
          elementType = 'audio_player';
          elementConfig = getEnhancedElementConfig('audio_player');
          // Keep original position for audio player
          elementConfig.properties = {
            ...elementConfig.properties,
            src: asset.publicUrl,
            assetId: asset.id
          };
          break;
          
        default:
          toast.error(`Asset type "${asset.assetType}" is not supported yet`);
          return;
      }
      
      // Map to database-compatible type
      const dbElementType = mapToDbElementType(elementType);
      
      await createElement({
        elementType: dbElementType,
        position: { ...position, z: elements.length },
        size: elementConfig.size,
        properties: {
          ...elementConfig.properties,
          customElementType: elementType // Store the original type for rendering
        },
        styles: elementConfig.styles,
        animations: elementConfig.animations || [],
        layerOrder: elements.length,
        opacity: 1
      });
      
      toast.success(`${asset.name} added to canvas`);
    } catch (error) {
      console.error('Error creating element from asset:', error);
      toast.error('Failed to add asset to canvas');
    } finally {
      setIsCreatingElement(false);
      setTimeout(() => {
        setPendingElementCreation(prev => {
          const newSet = new Set(prev);
          newSet.delete(creationKey);
          return newSet;
        });
      }, 300);
    }
  }, [createElement, elements.length, canvasSize, isCreatingElement, pendingElementCreation]);

  // Map new element types to database-compatible types
  const mapToDbElementType = (elementType: string): ContentElement['elementType'] => {
    const mapping: Record<string, ContentElement['elementType']> = {
      // Text elements -> text
      'text': 'text', // Basic text element
      'gradient_text': 'text',
      'shadow_text': 'text',
      'outline_text': 'text',
      
      // Interactive elements -> animation (closest match)
      'image_hotspot': 'animation',
      'accordion': 'animation',
      'tabs': 'animation',
      
      // Chart elements -> chart
      'pie_chart': 'chart',
      'bar_chart': 'chart',
      'line_chart': 'chart',
      
      // Media elements -> video/image
      'image': 'image', // Basic image element
      'video': 'video', // Basic video element  
      'button': 'button', // Basic button element
      'image_carousel': 'image',
      'audio_player': 'video',
      'video_player': 'video', // Maps to video type for database compatibility
      'standard_photo': 'standard_photo',
      'sales_rep_photo': 'image', // Maps to image type but with special binding
      
      // Effects elements -> animation
      'snow_animation': 'animation',
      'fireworks': 'animation',
      'matrix_rain': 'animation',
      'starfield': 'animation',
      'ocean_waves': 'animation',
      'geometric_pulse': 'animation',
      'aurora_borealis': 'animation',
      'bubble_float': 'animation',
      'lightning_storm': 'animation',
      'floating_hearts': 'animation',
      'falling_leaves': 'animation',
      'neon_pulse': 'animation',
      'raining_money': 'animation',
      'solar_flare': 'animation',
      'rainbow_tunnel': 'animation',
      'floating_balloons': 'animation',
      'pixel_sparks': 'animation',
      'butterfly_swarm': 'animation',
      
      // Form elements -> button (closest interactive match)
      'contact_form': 'button',
      'survey_form': 'button'
    };
    
    return mapping[elementType] || 'animation';
  };

  const handleSave = async (showToast = true) => {
    console.log('🔄 handleSave called', { currentProject: !!currentProject, showToast });
    
    if (!currentProject) {
      console.error('❌ No current project to save');
      toast.error('No project selected to save');
      return;
    }

    console.log('💾 Starting save process for project:', currentProject.id);
    
    try {
      console.log('🔄 Syncing pending updates...');
      await syncAllPendingUpdates();
      
      console.log('🔄 Saving project...');
      await saveProject(currentProject.id);
      
      console.log('✅ Save completed successfully');
      if (showToast) {
        toast.success('Project saved successfully!');
      }
      setLastAutoSave(new Date());
    } catch (error) {
      console.error('❌ Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to save project: ${errorMessage}`);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !hasUnsavedChanges || !currentProject) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave(false); // Silent save
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, autoSave, currentProject]);

  // Quick template creation
  const handleQuickTemplate = async () => {
    if (!currentProject || elements.length === 0) {
      toast.error('Add some elements first!');
      return;
    }
    
    try {
      const templateName = `Quick Template ${new Date().toLocaleDateString()}`;
      await saveAsTemplate({
        name: templateName,
        description: `Auto-generated template from ${currentProject.name}`,
        category: 'quick',
        isPublic: false,
        tags: ['quick', 'auto-generated']
      });
      toast.success(`Template "${templateName}" saved!`);
    } catch (error) {
      toast.error('Failed to create quick template');
    }
  };

  // Smart element duplication for single or multiple elements
  const handleSmartDuplicate = () => {
    const elementsToClone = selectedElements.length > 0 
      ? elements.filter(el => selectedElements.includes(el.id))
      : selectedElement ? [selectedElement] : [];
    
    if (elementsToClone.length === 0) {
      toast.error('No elements selected to duplicate');
      return;
    }
    
    elementsToClone.forEach((element, index) => {
      const smartOffset = {
        x: element.position.x + (element.size.width * 0.1) + (index * 10),
        y: element.position.y + (element.size.height * 0.1) + (index * 10)
      };
      
      const newElement = {
        ...element,
        position: { ...smartOffset, z: element.position.z + 1 + index }
      };
      
      createElement(newElement);
    });
    
    toast.success(`${elementsToClone.length} element${elementsToClone.length > 1 ? 's' : ''} duplicated smartly!`);
  };

  // Listen for switch to properties event from double-click
  useEffect(() => {
    const handleSwitchToProperties = () => {
      setActiveTab('properties');
    };

    window.addEventListener('switch-to-properties', handleSwitchToProperties);
    return () => {
      window.removeEventListener('switch-to-properties', handleSwitchToProperties);
    };
  }, []);

  // Enhanced keyboard shortcuts with more user-friendly options
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

      // Prevent duplicate element creation
      if (isCreatingElement) {
        return;
      }

      // Save project (Ctrl+S)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentProject) {
          saveProject(currentProject.id);
        }
      }

      // Copy element (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElement) {
        e.preventDefault();
        handleCopyElement();
      }

      // Delete element (Delete/Backspace)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        e.preventDefault();
        handleDeleteElement();
      }

      // Toggle fullscreen (F11)
      if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }

      // Toggle snap to grid (Ctrl+G)
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setSnapToGrid(!snapToGrid);
      }

      // Toggle rulers (Ctrl+R)
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        setShowRulers(!showRulers);
      }

      // Toggle quick actions (Space)
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setShowQuickActions(!showQuickActions);
      }

      // Quick element creation (1-8)
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= quickElements.length) {
        e.preventDefault();
        const elementType = quickElements[keyNum - 1];
        handleElementDrop(elementType, { x: 100, y: 100 });
        const displayName = elementType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        toast.success(`${displayName} element added!`);
      }
      
      // Escape to deselect
      if (e.key === 'Escape') {
        selectElement(null);
        clearSelection();
        setShowQuickActions(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentProject, selectedElement, isFullscreen, showQuickActions, snapToGrid, showRulers, isCreatingElement, handleElementDrop]);

  const handleCopyElement = () => {
    const elementsToClone = selectedElements.length > 0 
      ? elements.filter(el => selectedElements.includes(el.id))
      : selectedElement ? [selectedElement] : [];
    
    if (elementsToClone.length === 0) {
      toast.error('No elements selected to copy');
      return;
    }
    
    elementsToClone.forEach((element, index) => {
      const newElement = {
        ...element,
        position: {
          ...element.position,
          x: element.position.x + 20 + (index * 5),
          y: element.position.y + 20 + (index * 5)
        }
      };
      createElement(newElement);
    });
    
    toast.success(`${elementsToClone.length} element${elementsToClone.length > 1 ? 's' : ''} copied!`);
  };

  const handleDeleteElement = () => {
    if (selectedElement) {
      deleteElement(selectedElement.id);
      toast.success('Element deleted');
    } else if (selectedElements.length > 0) {
      selectedElements.forEach(elementId => {
        deleteElement(elementId);
      });
      toast.success(`${selectedElements.length} elements deleted`);
    }
  };

  // This function seems to be incorrectly named and doing deletion instead of saving template
  // Let me fix this to be a proper save template function
  const handleSaveTemplate = () => {
    if (!currentProject) {
      toast.error('No project to save as template');
      return;
    }
    
    // This would typically open a save template dialog
    // For now, just show a success message
    toast.success('Template save functionality available in template dialog');
  };

  const handleUndo = () => {
    // TODO: Implement undo functionality
    toast.success('Undo functionality coming soon!');
  };

  const handleRedo = () => {
    // TODO: Implement redo functionality  
    toast.success('Redo functionality coming soon!');
  };

  // Layer management functions
  const handleBringToFront = () => {
    if (!selectedElement) return;
    const maxLayer = Math.max(...elements.map(el => el.layerOrder || 0));
    const newOrder = maxLayer + 1;
    updateElementLocal(selectedElement.id, { layerOrder: newOrder });
    syncElementToBackend(selectedElement.id);
    toast.success('Moved to front');
  };

  const handleSendToBack = () => {
    if (!selectedElement) return;
    const minLayer = Math.min(...elements.map(el => el.layerOrder || 0));
    const newOrder = minLayer - 1;
    updateElementLocal(selectedElement.id, { layerOrder: newOrder });
    syncElementToBackend(selectedElement.id);
    toast.success('Moved to back');
  };

  const handleMoveForward = () => {
    if (!selectedElement) return;
    const currentLayer = selectedElement.layerOrder || 0;
    const higherElements = elements.filter(el => (el.layerOrder || 0) > currentLayer).sort((a, b) => (a.layerOrder || 0) - (b.layerOrder || 0));
    
    if (higherElements.length > 0) {
      const targetElement = higherElements[0];
      const targetLayer = targetElement.layerOrder || 0;
      
      // Swap the layers
      updateElementLocal(selectedElement.id, { layerOrder: targetLayer });
      updateElementLocal(targetElement.id, { layerOrder: currentLayer });
      
      syncElementToBackend(selectedElement.id);
      syncElementToBackend(targetElement.id);
      toast.success('Moved forward');
    } else {
      toast.success('Already at the front');
    }
  };

  const handleMoveBackward = () => {
    if (!selectedElement) return;
    const currentLayer = selectedElement.layerOrder || 0;
    const lowerElements = elements.filter(el => (el.layerOrder || 0) < currentLayer).sort((a, b) => (b.layerOrder || 0) - (a.layerOrder || 0));
    
    if (lowerElements.length > 0) {
      const targetElement = lowerElements[0];
      const targetLayer = targetElement.layerOrder || 0;
      
      // Swap the layers
      updateElementLocal(selectedElement.id, { layerOrder: targetLayer });
      updateElementLocal(targetElement.id, { layerOrder: currentLayer });
      
      syncElementToBackend(selectedElement.id);
      syncElementToBackend(targetElement.id);
      toast.success('Moved backward');
    } else {
      toast.success('Already at the back');
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleExport = () => {
    setActiveTab('export');
  };

  const handleSaveAsTemplate = async (templateData: TemplateData) => {
    try {
      const template = await saveAsTemplate(templateData);
      toast.success(`Template "${template.name}" created successfully!`);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
      throw error;
    }
  };

  // Enhanced element alignment functions
  const handleAlignElements = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const elementsToAlign = selectedElements.length > 1 
      ? elements.filter(el => selectedElements.includes(el.id))
      : [];
    
    if (elementsToAlign.length < 2) {
      toast.error('Select multiple elements to align');
      return;
    }

    // Calculate alignment reference based on all selected elements
    const positions = elementsToAlign.map(el => ({
      id: el.id,
      left: el.position.x,
      right: el.position.x + el.size.width,
      top: el.position.y,
      bottom: el.position.y + el.size.height,
      centerX: el.position.x + el.size.width / 2,
      centerY: el.position.y + el.size.height / 2
    }));

    let referenceValue: number;
    
    switch (alignment) {
      case 'left':
        referenceValue = Math.min(...positions.map(p => p.left));
        elementsToAlign.forEach(element => {
          updateElementLocal(element.id, {
            position: { ...element.position, x: referenceValue }
          });
        });
        break;
      case 'right':
        referenceValue = Math.max(...positions.map(p => p.right));
        elementsToAlign.forEach(element => {
          updateElementLocal(element.id, {
            position: { ...element.position, x: referenceValue - element.size.width }
          });
        });
        break;
      case 'center':
        referenceValue = positions.reduce((sum, p) => sum + p.centerX, 0) / positions.length;
        elementsToAlign.forEach(element => {
          updateElementLocal(element.id, {
            position: { ...element.position, x: referenceValue - element.size.width / 2 }
          });
        });
        break;
      case 'top':
        referenceValue = Math.min(...positions.map(p => p.top));
        elementsToAlign.forEach(element => {
          updateElementLocal(element.id, {
            position: { ...element.position, y: referenceValue }
          });
        });
        break;
      case 'bottom':
        referenceValue = Math.max(...positions.map(p => p.bottom));
        elementsToAlign.forEach(element => {
          updateElementLocal(element.id, {
            position: { ...element.position, y: referenceValue - element.size.height }
          });
        });
        break;
      case 'middle':
        referenceValue = positions.reduce((sum, p) => sum + p.centerY, 0) / positions.length;
        elementsToAlign.forEach(element => {
          updateElementLocal(element.id, {
            position: { ...element.position, y: referenceValue - element.size.height / 2 }
          });
        });
        break;
    }
    
    // Sync all changes to backend
    elementsToAlign.forEach(element => {
      syncElementToBackend(element.id);
    });
    
    toast.success(`${elementsToAlign.length} elements aligned to ${alignment}`);
  };

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          loadAssets(),
          loadVariables(),
          loadTemplates(),
          loadProjects()
        ]);

        // Only handle project loading if a specific projectId is provided
        // Template-to-project creation is handled by ContentCreatorWrapper
        if (projectId && !currentProject) {
          await loadProject(projectId);
        } else if (!currentProject && !projectId && !templateId) {
          // Only create a new project if no project, projectId, or templateId is provided
          const newProject = await createProject({
            name: 'New Project',
            description: 'A new content creation project',
            canvasSize: { width: 1920, height: 1080 },
            canvasBackground: { type: 'solid', color: '#ffffff' },
            variables: {}
          });
          await loadProject(newProject.id);
        }
      } catch (error) {
        console.error('Failed to initialize content creator:', error);
        toast.error('Failed to initialize content creator');
      }
    };

    initializeData();
  }, [projectId, templateId]); // Removed function dependencies to prevent infinite re-runs

  const filteredElements = elements.filter(element => 
    !searchQuery || 
    element.elementType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (element.properties.text && element.properties.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        className={`h-screen w-full flex flex-col bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
        style={{ 
          touchAction: 'manipulation', // Prevent pinch zoom on mobile
          userSelect: 'none', // Prevent text selection
          overflow: 'hidden' // Prevent any scrollbars on the main container
        }}
      >
        {/* Enhanced Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Left Section - Project Info & Controls */}
            <div className="flex items-center space-x-2 min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px]">
                  {currentProject?.name || 'Content Creator'}
                </h1>
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs flex-shrink-0">
                    Unsaved
                  </Badge>
                )}
              </div>
              
              <Separator orientation="vertical" className="h-5 hidden md:block" />
              
              {/* Quick Actions - Hidden on small screens */}
              <div className="hidden lg:flex items-center space-x-1">
                <Button variant="ghost" size="sm" onClick={handleUndo} className="h-8 w-8 p-0">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRedo} className="h-8 w-8 p-0">
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyElement}
                  className={`h-8 w-8 p-0 ${!selectedElement ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDeleteElement}
                  className={`h-8 w-8 p-0 ${!selectedElement ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-5 hidden xl:block" />

              {/* Multi-selection tools - shown when multiple elements selected */}
              {selectedElements.length > 1 && (
                <div className="hidden lg:flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                  <span className="text-xs text-blue-700 font-medium mr-2">
                    {selectedElements.length} selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleAlignElements('left')} className="h-7 w-7 p-0">
                    <AlignLeft className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleAlignElements('center')} className="h-7 w-7 p-0">
                    <AlignCenter className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleAlignElements('right')} className="h-7 w-7 p-0">
                    <AlignRight className="w-3 h-3" />
                  </Button>
                  <Separator orientation="vertical" className="h-4 mx-1" />
                  <Button variant="ghost" size="sm" onClick={handleSmartDuplicate} className="h-7 w-7 p-0">
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDeleteElement} className="h-7 w-7 p-0 text-red-600 hover:text-red-700">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Alignment Tools - Hidden on smaller screens, shown when single element selected */}
              {selectedElements.length <= 1 && (
                <div className="hidden xl:flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => handleAlignElements('left')} className="h-8 w-8 p-0">
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleAlignElements('center')} className="h-8 w-8 p-0">
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleAlignElements('right')} className="h-8 w-8 p-0">
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Center Section - Search */}
            <div className="flex-1 max-w-xs mx-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search elements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Exit to Dashboard Button - Hidden on smaller screens */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
                className="h-9 text-gray-600 hover:text-gray-900 hidden lg:flex"
                title="Exit to Dashboard"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden xl:inline">Dashboard</span>
              </Button>

              {/* Auto-save indicator - Hidden on smaller screens */}
              {autoSave && lastAutoSave && (
                <div className="text-xs text-gray-500 mr-1 hidden xl:block">
                  Auto-saved {new Date(lastAutoSave).toLocaleTimeString()}
                </div>
              )}
              
              {/* Quick Actions Dropdown */}
              <DropdownMenu open={showQuickActions} onOpenChange={setShowQuickActions}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9">
                    <Zap className="w-4 h-4 mr-1" />
                    <span className="hidden md:inline">Quick</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleQuickTemplate}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Save as Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSmartDuplicate} disabled={!selectedElement}>
                    <Copy className="w-4 h-4 mr-2" />
                    Smart Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Layer Controls</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleBringToFront} disabled={!selectedElement}>
                    <Layers className="w-4 h-4 mr-2" />
                    Bring to Front <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">⌘⇧]</kbd>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSendToBack} disabled={!selectedElement}>
                    <Layers className="w-4 h-4 mr-2" />
                    Send to Back <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">⌘⇧[</kbd>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMoveForward} disabled={!selectedElement}>
                    <ChevronDown className="w-4 h-4 mr-2 rotate-180" />
                    Move Forward <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">⌘]</kbd>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMoveBackward} disabled={!selectedElement}>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move Backward <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">⌘[</kbd>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSnapToGrid(!snapToGrid)}>
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    {snapToGrid ? 'Disable' : 'Enable'} Snap to Grid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSnapEnabled(!snapEnabled)}>
                    <Magnet className="w-4 h-4 mr-2" />
                    {snapEnabled ? 'Disable' : 'Enable'} Smart Snap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowRulers(!showRulers)}>
                    <Ruler className="w-4 h-4 mr-2" />
                    {showRulers ? 'Hide' : 'Show'} Rulers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAutoSave(!autoSave)}>
                    <Save className="w-4 h-4 mr-2" />
                    {autoSave ? 'Disable' : 'Enable'} Auto-save
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="sm" onClick={() => setHistoryPanel(!historyPanel)} className="h-9 w-9 p-0 hidden lg:flex">
                <History className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setLayersPanel(!layersPanel)} className="h-9 w-9 p-0 hidden lg:flex">
                <Layers className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreview} className="h-9">
                <Eye className="w-4 h-4 mr-1" />
                <span className="hidden md:inline">Preview</span>
              </Button>
              <Button onClick={() => handleSave()} size="sm" className={`h-9 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isLoading ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-1" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                <span className="hidden md:inline">Save</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="h-9 w-9 p-0">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0 w-full">
          {/* Enhanced Left Sidebar */}
          <div className={`${leftPanelCollapsed ? 'w-12' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0`}>
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              {!leftPanelCollapsed && (
                <h2 className="font-medium text-gray-900 text-sm">Design Panel</h2>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                className="h-8 w-8 p-0"
              >
                {leftPanelCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </Button>
            </div>

            {!leftPanelCollapsed && (
              <div className="flex-1 flex flex-col min-h-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                  <TabsList className="grid w-full grid-cols-7 m-2 flex-shrink-0">
                    <TabsTrigger value="elements" className="text-xs p-1.5" title="Elements (1)">
                      <Layers className="w-3.5 h-3.5" />
                    </TabsTrigger>
                    <TabsTrigger value="assets" className="text-xs p-1.5" title="Assets (2)">
                      <Library className="w-3.5 h-3.5" />
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="text-xs p-1.5" title="Templates (3)">
                      <FileImage className="w-3.5 h-3.5" />
                    </TabsTrigger>
                    <TabsTrigger value="sales-reps" className="text-xs p-1.5" title="Sales Rep Photos (4)">
                      <Sparkles className="w-3.5 h-3.5" />
                    </TabsTrigger>
                    <TabsTrigger value="variables" className="text-xs p-1.5" title="Variables (5)">
                      <Zap className="w-3.5 h-3.5" />
                    </TabsTrigger>
                    <TabsTrigger value="properties" className="text-xs p-1.5" title="Properties (6)">
                      <Settings className="w-3.5 h-3.5" />
                    </TabsTrigger>
                    <TabsTrigger value="export" className="text-xs p-1.5" title="Export (7)">
                      <Download className="w-3.5 h-3.5" />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="elements" className="flex-1 p-2 overflow-hidden">
                    <ElementPanel onElementDrop={handleElementDrop} searchQuery={searchQuery} />
                  </TabsContent>

                  <TabsContent value="assets" className="flex-1 p-2 overflow-hidden">
                    <AssetLibrary compact searchQuery={searchQuery} />
                  </TabsContent>

                  <TabsContent value="templates" className="flex-1 p-2 overflow-hidden">
                    <TemplateBrowser 
                      compact
                      onTemplateSelect={(template) => {
                        // Load template into current project
                        window.location.href = `/content-creator?template=${template.id}`;
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="sales-reps" className="flex-1 p-2 overflow-hidden">
                    <SalesRepPhotosPanel 
                      compact 
                      searchQuery={searchQuery}
                      onPhotoSelect={(photo) => {
                        // Create a sales_rep_photo element that binds to {rep_photo} variable
                        // This follows the documented behavior where the element auto-fills from webhook
                        handleElementDrop('sales_rep_photo', { x: 200, y: 200 });
                        
                        // Update the element with proper webhook binding
                        setTimeout(() => {
                          const newElement = elements[elements.length - 1];
                          if (newElement) {
                            updateElementLocal(newElement.id, {
                              properties: {
                                ...newElement.properties,
                                src: '{rep_photo}', // Keep the variable binding for webhook
                                alt: 'Sales Representative Photo',
                                repEmail: photo.repEmail, // For reference/fallback
                                repName: photo.repName, // For reference/fallback
                                fallbackUrl: photo.photoUrl, // Use selected photo as fallback
                                previewUrl: photo.photoUrl // For design-time preview only
                              }
                            });
                          }
                        }, 100);
                        toast.success(`Added sales rep photo element - will auto-fill from webhook with {rep_photo} variable`);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="variables" className="flex-1 p-2 overflow-hidden">
                    <VariablePanel searchQuery={searchQuery} />
                  </TabsContent>

                  <TabsContent value="properties" className="flex-1 p-2 overflow-hidden">
                    <PropertiesPanel
                      element={selectedElement}
                      onUpdate={updateElementLocal}
                    />
                  </TabsContent>

                  <TabsContent value="styles" className="flex-1 p-2 overflow-hidden">
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm">Quick Styles</h3>
                      {/* TODO: Add quick style presets */}
                      <p className="text-sm text-gray-500">Style presets coming soon!</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="export" className="flex-1 p-2 overflow-hidden">
                    <ExportPanel projectId={currentProject?.id} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          {/* Enhanced Canvas Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-gray-100 w-0 overflow-hidden">
            <Canvas
              ref={canvasRef}
              elements={filteredElements}
              canvasSize={canvasSize}
              canvasBackground={canvasBackground}
              selectedElement={selectedElement}
              selectedElements={selectedElements}
              onElementSelect={selectElement}
              onElementsSelect={selectElements}
              onElementToggleSelect={toggleElementSelection}
              onClearSelection={clearSelection}
              onElementUpdate={handleElementUpdateAndSync}
              onElementUpdateLocal={handleElementUpdate}
              onElementSyncToBackend={syncElementToBackend}
              onElementDelete={deleteElement}
              onElementDrop={handleElementDrop}
              onAssetDrop={handleAssetDrop}
              onCanvasBackgroundChange={updateCanvasBackground}
              onCanvasSizeChange={setCanvasSize}
              snapEnabled={snapEnabled}
            />
          </div>

          {/* Enhanced Right Sidebar - Layers & History */}
          {(layersPanel || historyPanel) && (
            <div className={`${rightPanelCollapsed ? 'w-12' : 'w-56'} bg-white border-l border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0`}>
              <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                {!rightPanelCollapsed && (
                  <h2 className="font-medium text-gray-900 text-sm">
                    {layersPanel ? 'Layers' : 'History'}
                  </h2>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                  className="h-8 w-8 p-0"
                >
                  {rightPanelCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
                </Button>
              </div>

              {!rightPanelCollapsed && (
                <div className="flex-1 p-3 overflow-hidden">
                  {layersPanel && (
                    <div className="space-y-3 h-full flex flex-col">
                      <div className="flex items-center justify-between flex-shrink-0">
                        <h3 className="text-sm font-medium">Element Layers</h3>
                        <div className="flex items-center space-x-2">
                          {selectedElements.length > 0 && (
                            <Badge variant="default" className="text-xs bg-blue-500">
                              {selectedElements.length} selected
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {elements.length} total
                          </Badge>
                        </div>
                      </div>
                      
                      {elements.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 flex-1 flex flex-col justify-center">
                          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No elements yet</p>
                          <p className="text-xs">Press 1-5 to add elements</p>
                        </div>
                      ) : (
                        <div className="space-y-1 flex-1 overflow-y-auto">
                          {elements
                            .sort((a, b) => (b.layerOrder || 0) - (a.layerOrder || 0))
                            .map((element, index) => (
                            <div
                              key={element.id}
                              className={`group p-2 rounded cursor-pointer border transition-all ${
                                selectedElement?.id === element.id || selectedElements.includes(element.id)
                                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={(e) => {
                                if (e.ctrlKey || e.metaKey) {
                                  toggleElementSelection(element.id);
                                } else {
                                  selectElement(element);
                                }
                              }}
                              onDoubleClick={() => {
                                // Focus on element
                                const elementDiv = document.getElementById(`element-${element.id}`);
                                if (elementDiv) {
                                  elementDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <div className="w-3 h-3 rounded border border-gray-300 flex-shrink-0" 
                                       style={{ backgroundColor: element.styles?.backgroundColor || '#ffffff' }} />
                                  <span className="text-sm capitalize font-medium truncate">
                                    {element.properties?.customElementType || element.elementType}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <span className="text-xs text-gray-500">#{element.layerOrder || index}</span>
                                  
                                  {/* Layer control buttons - shown on hover */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-5 h-5 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        selectElement(element);
                                        handleMoveForward();
                                      }}
                                      title="Move Forward"
                                    >
                                      <ChevronDown className="w-3 h-3 rotate-180" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-5 h-5 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        selectElement(element);
                                        handleMoveBackward();
                                      }}
                                      title="Move Backward"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteElement(element.id);
                                    }}
                                    title="Delete Element"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              {element.properties?.text && (
                                <p className="text-xs text-gray-600 mt-1 truncate">
                                  "{element.properties.text}"
                                </p>
                              )}
                              
                              {/* Element type indicator for special elements */}
                              {element.properties?.customElementType && (
                                <div className="flex items-center mt-1">
                                  <Badge variant="outline" className="text-xs py-0">
                                    {element.properties.customElementType.replace(/_/g, ' ')}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {historyPanel && (
                    <div className="space-y-4 h-full flex flex-col">
                      <div className="space-y-2 flex-shrink-0">
                        <h3 className="text-sm font-medium">History</h3>
                        <p className="text-sm text-gray-500">History panel coming soon!</p>
                      </div>
                      
                      {/* Quick Shortcuts */}
                      <div className="flex-1">
                        <QuickShortcuts />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Preview Modal */}
        <PreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          project={currentProject}
          elements={elements}
          canvasSize={canvasSize}
          canvasBackground={canvasBackground}
          variables={variables}
        />

        {/* Enhanced Asset Library Modal */}
        <Dialog open={showAssetLibrary} onOpenChange={setShowAssetLibrary}>
          <DialogContent className="max-w-6xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Library className="w-5 h-5 mr-2" />
                Asset Library
              </DialogTitle>
            </DialogHeader>
            <AssetLibrary onAssetSelect={(asset) => {
              console.log('Asset selected:', asset);
            }} />
          </DialogContent>
        </Dialog>

        {/* Save as Template Modal */}
        <SaveAsTemplateDialog
          isOpen={showSaveAsTemplate}
          onClose={() => setShowSaveAsTemplate(false)}
          onSave={handleSaveAsTemplate}
          currentProjectName={currentProject?.name}
          isLoading={isLoading}
        />

        {/* Floating Action Button for Quick Element Creation */}
        {!isFullscreen && (
          <div className="fixed bottom-6 right-6 z-40">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="lg" 
                  className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 mb-2">
                <DropdownMenuLabel>Quick Add Elements</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => !isCreatingElement && handleElementDrop('text', { x: 200, y: 200 })}>
                  <span className="w-6 h-6 rounded bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center mr-2">T</span>
                  Text <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">1</kbd>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => !isCreatingElement && handleElementDrop('image', { x: 200, y: 200 })}>
                  <span className="w-6 h-6 rounded bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center mr-2">📷</span>
                  Image <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">2</kbd>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => !isCreatingElement && handleElementDrop('video', { x: 200, y: 200 })}>
                  <span className="w-6 h-6 rounded bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center mr-2">🎬</span>
                  Video <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">3</kbd>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => !isCreatingElement && handleElementDrop('pie_chart', { x: 200, y: 200 })}>
                  <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center mr-2">📊</span>
                  Pie Chart <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">4</kbd>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => !isCreatingElement && handleElementDrop('matrix_rain', { x: 200, y: 200 })}>
                  <span className="w-6 h-6 rounded bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center mr-2">🔢</span>
                  Matrix Rain <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">5</kbd>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => !isCreatingElement && handleElementDrop('floating_hearts', { x: 200, y: 200 })}>
                  <span className="w-6 h-6 rounded bg-pink-100 text-pink-600 text-xs font-bold flex items-center justify-center mr-2">💕</span>
                  Floating Hearts <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">6</kbd>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => !isCreatingElement && handleElementDrop('raining_money', { x: 200, y: 200 })}>
                  <span className="w-6 h-6 rounded bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center mr-2">💸</span>
                  Raining Money <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">7</kbd>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => !isCreatingElement && handleElementDrop('solar_flare', { x: 200, y: 200 })}>
                  <span className="w-6 h-6 rounded bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mr-2">☀️</span>
                  Solar Flare <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">8</kbd>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleElementDrop('butterfly_swarm', { x: 200, y: 200 })}>
                  <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center mr-2">🦋</span>
                  Butterfly Swarm <kbd className="ml-auto text-xs bg-gray-100 px-1 rounded">9</kbd>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowTemplateLibrary(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Browse Templates
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Template Library Modal */}
        <Dialog open={showTemplateLibrary} onOpenChange={setShowTemplateLibrary}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Template Library
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 p-4 max-h-96 overflow-y-auto">
              {templates.map((template) => (
                <Card key={template.id} className="p-4 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Preview</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      // TODO: Load template
                      toast.success(`Loading template: ${template.name}`);
                      setShowTemplateLibrary(false);
                    }}
                  >
                    Use Template
                  </Button>
                </Card>
              ))}
              {templates.length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No templates available</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleQuickTemplate}
                  >
                    Create Your First Template
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}

// Enhanced element configuration with new element types
function getEnhancedElementConfig(elementType: string) {
  const configs: Record<string, any> = {
    // Basic Elements
    text: {
      size: { width: 300, height: 60 },
      properties: {
        text: 'Your text here - click to edit',
        textAlign: 'left'
      },
      styles: {
        fontSize: '18px',
        fontWeight: '500',
        color: '#1f2937',
        fontFamily: 'Inter, sans-serif',
        lineHeight: '1.4',
        padding: '8px'
      }
    },
    button: {
      size: { width: 150, height: 40 },
      properties: {
        text: 'Button',
        action: 'click'
      },
      styles: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: '500',
        borderRadius: '8px',
        border: 'none'
      }
    },
    
    // Text Elements
    gradient_text: {
      size: { width: 400, height: 80 },
      properties: { 
        text: 'Gradient Text',
        gradientType: 'linear',
        gradientAngle: 45,
        gradientColors: ['#667eea', '#764ba2']
      },
      styles: { 
        fontSize: '48px', 
        fontWeight: 'bold',
        fontFamily: 'Inter, sans-serif',
        background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
        '-webkit-background-clip': 'text',
        '-webkit-text-fill-color': 'transparent'
      }
    },
    shadow_text: {
      size: { width: 350, height: 70 },
      properties: { 
        text: 'Shadow Text',
        shadowType: 'drop',
        shadowBlur: 4,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowColor: 'rgba(0,0,0,0.3)'
      },
      styles: { 
        fontSize: '36px', 
        color: '#1a202c',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }
    },
    outline_text: {
      size: { width: 380, height: 75 },
      properties: { 
        text: 'Outline Text',
        strokeWidth: 2,
        strokeColor: '#000000',
        fillColor: '#ffffff'
      },
      styles: { 
        fontSize: '42px', 
        color: '#ffffff',
        fontWeight: 'bold',
        '-webkit-text-stroke': '2px #000000',
        '-webkit-text-fill-color': '#ffffff'
      }
    },

    // Interactive Elements
    image_hotspot: {
      size: { width: 500, height: 350 },
      properties: { 
        hotspots: [
          { 
            x: 50,
            y: 50,
            label: 'Click here',
            action: 'tooltip',
            content: 'Information'
          }
        ],
        pulseAnimation: true,
        hotspotColor: '#ef4444'
      },
      styles: { 
        position: 'relative',
        width: '100%',
        height: '100%'
      }
    },
    accordion: {
      size: { width: 400, height: 300 },
      properties: { 
        items: [
          { 
            title: 'Section 1',
            content: 'Content for section 1',
            isOpen: true
          },
          { 
            title: 'Section 2', 
            content: 'Content for section 2', 
            isOpen: false 
          }
        ],
        allowMultiple: false,
        animationSpeed: 300
      },
      styles: { 
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#ffffff'
      }
    },
    tabs: {
      size: { width: 500, height: 300 },
      properties: { 
        tabs: [
          { 
            id: 'tab1',
            label: 'Tab 1',
            content: 'Content for tab 1',
            active: true
          },
          { 
            id: 'tab2', 
            label: 'Tab 2', 
            content: 'Content for tab 2', 
            active: false 
          }
        ],
        tabStyle: 'underline',
        tabPosition: 'top'
      },
      styles: { 
        backgroundColor: '#ffffff',
        borderRadius: '8px'
      }
    },

    // Chart Elements
    pie_chart: {
      size: { width: 400, height: 400 },
      properties: {
        data: [
          { label: 'Category A', value: 30, color: '#3b82f6' },
          { label: 'Category B', value: 25, color: '#ef4444' },
          { label: 'Category C', value: 45, color: '#10b981' }
        ],
        showLabels: true,
        showLegend: true,
        animateOnLoad: true
      },
      styles: {
        width: '400px',
        height: '400px'
      }
    },
    bar_chart: {
      size: { width: 600, height: 400 },
      properties: {
        data: [
          { label: 'Jan', value: 65 },
          { label: 'Feb', value: 80 },
          { label: 'Mar', value: 75 },
          { label: 'Apr', value: 90 }
        ],
        orientation: 'vertical',
        showGrid: true,
        animateOnLoad: true,
        barColor: '#3b82f6'
      },
      styles: {
        width: '600px',
        height: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '20px'
      }
    },
    line_chart: {
      size: { width: 600, height: 400 },
      properties: {
        datasets: [
          {
            label: 'Sales',
            data: [30, 45, 60, 55, 70, 85, 90],
            color: '#3b82f6',
            smooth: true
          }
        ],
        xLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        showGrid: true,
        showDots: true,
        fillArea: false
      },
      styles: {
        width: '600px',
        height: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '20px'
      }
    },

    // Media Elements
    image_carousel: {
      size: { width: 800, height: 400 },
      properties: {
        images: [],
        autoPlay: true,
        interval: 3000,
        showIndicators: true,
        showArrows: true,
        transitionType: 'slide',
        infiniteLoop: true
      },
      styles: {
        width: '800px',
        height: '400px',
        borderRadius: '8px',
        overflow: 'hidden'
      }
    },
    audio_player: {
      size: { width: 400, height: 120 },
      properties: {
        src: '',
        showVisualizer: true,
        visualizerType: 'bars',
        autoplay: false,
        loop: false,
        showPlaylist: false
      },
      styles: {
        width: '400px',
        height: '120px',
        backgroundColor: '#1a202c',
        borderRadius: '8px',
        padding: '20px'
      }
    },

    // Effects Elements
    snow_animation: {
      size: { width: 400, height: 300 },
      properties: {
        snowflakeCount: 100,
        fallSpeed: { min: 1, max: 3 },
        snowflakeSize: { min: 5, max: 15 },
        windEffect: true,
        accumulation: false
      },
      styles: { 
        position: 'relative',
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }
    },
    fireworks: {
      size: { width: 500, height: 400 },
      properties: {
        launchInterval: 1000,
        explosionSize: 100,
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
        soundEnabled: false,
        autoPlay: true,
        duration: 10000
      },
      styles: { 
        position: 'relative',
        width: '100%',
        height: '100%'
      }
    },
    matrix_rain: {
      size: { width: 800, height: 600 },
      properties: {
        dropSpeed: { min: 5, max: 15 },
        dropFrequency: 0.95,
        characters: '01',
        useKatakana: true,
        fontSize: 16,
        columnGap: 20,
        fadeLength: 8,
        glowEffect: true,
        color: '#00ff00'
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        overflow: 'hidden',
        zIndex: -1
      }
    },
    starfield: {
      size: { width: 800, height: 600 },
      properties: {
        starCount: 200,
        starSpeed: { min: 0.5, max: 3 },
        starSize: { min: 1, max: 3 },
        twinkle: true,
        shootingStars: true,
        shootingStarFrequency: 0.01,
        direction: 'forward',
        colorVariation: true,
        baseColors: ['#ffffff', '#ffffd0', '#ffffe0', '#e0e0ff']
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000033',
        overflow: 'hidden'
      }
    },
    ocean_waves: {
      size: { width: 800, height: 600 },
      properties: {
        waveCount: 3,
        waveSpeed: 2,
        waveHeight: 100,
        waveComplexity: 3,
        foamEffect: true,
        reflections: true,
        particleSpray: true,
        colors: {
          deep: '#003366',
          shallow: '#0066cc',
          foam: '#ffffff'
        }
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #87ceeb 0%, #0066cc 50%, #003366 100%)',
        overflow: 'hidden'
      }
    },
    geometric_pulse: {
      size: { width: 800, height: 600 },
      properties: {
        shapeType: 'hexagon',
        gridSize: 50,
        pulseSpeed: 2,
        pulseDelay: 0.1,
        rotateShapes: true,
        colorShift: true,
        strokeWidth: 2,
        fillOpacity: 0.1,
        colors: ['#3b82f6', '#8b5cf6', '#ec4899']
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden'
      }
    },
    aurora_borealis: {
      size: { width: 800, height: 600 },
      properties: {
        waveCount: 4,
        waveSpeed: 0.5,
        intensity: 0.7,
        shimmer: true,
        stars: true,
        colors: [
          '#00ff00',
          '#00ffff',
          '#ff00ff',
          '#ffff00'
        ],
        blendMode: 'screen'
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000033',
        overflow: 'hidden'
      }
    },
    bubble_float: {
      size: { width: 800, height: 600 },
      properties: {
        bubbleCount: 30,
        sizeRange: { min: 20, max: 80 },
        riseSpeed: { min: 1, max: 3 },
        wobbleAmount: 20,
        popOnClick: true,
        generateNew: true,
        opacity: 0.3,
        shimmer: true,
        colors: ['#ffffff', '#e0f2ff', '#c7e9ff']
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #87ceeb 0%, #e0f2ff 100%)',
        overflow: 'hidden'
      }
    },
    lightning_storm: {
      size: { width: 800, height: 600 },
      properties: {
        strikeFrequency: 3,
        branchComplexity: 4,
        glowIntensity: 2,
        thunderSound: false,
        rainEffect: true,
        flashDuration: 200,
        colors: {
          lightning: '#ffffff',
          glow: '#9999ff',
          sky: '#1a1a2e'
        }
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a2e',
        overflow: 'hidden'
      }
    },
    floating_hearts: {
      size: { width: 800, height: 600 },
      properties: {
        heartCount: 20,
        sizeRange: { min: 20, max: 60 },
        floatSpeed: { min: 1, max: 3 },
        swayAmount: 30,
        rotationSpeed: 1,
        fadeInOut: true,
        pulseEffect: true,
        colors: ['#ff1744', '#ff4569', '#ff6b96', '#ff8fab']
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #ffe0e6 0%, #ffb3c1 100%)',
        overflow: 'hidden'
      }
    },
    falling_leaves: {
      size: { width: 800, height: 600 },
      properties: {
        leafCount: 30,
        leafTypes: ['maple', 'oak', 'birch'],
        fallSpeed: { min: 1, max: 3 },
        swayAmount: 50,
        rotationSpeed: { min: 0.5, max: 2 },
        sizeRange: { min: 30, max: 80 },
        colors: [
          '#ff6b35',
          '#f7931e',
          '#ff0000',
          '#8b0000',
          '#ffd700'
        ]
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #87ceeb 0%, #f0e68c 100%)',
        overflow: 'hidden'
      }
    },
    neon_pulse: {
      size: { width: 800, height: 600 },
      properties: {
        gridPattern: 'lines',
        pulseSpeed: 2,
        pulseIntensity: 0.8,
        glowRadius: 20,
        lineWidth: 2,
        flickerEffect: true,
        traceAnimation: true,
        colors: [
          '#ff00ff',
          '#00ffff',
          '#ffff00',
          '#ff0099'
        ]
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden'
      }
    },
    raining_money: {
      size: { width: 800, height: 600 },
      properties: {
        billCount: 40,
        billTypes: ['$1', '$5', '$10', '$20', '$50', '$100'],
        fallSpeed: { min: 1.5, max: 4 },
        swayAmount: 80,
        rotationSpeed: { min: 0.5, max: 2.5 },
        billSize: { min: 70, max: 140 },
        continuous: true,
        duration: null,
        currency: 'USD',
        sparkleEffect: true,
        sound: false,
        fadeOut: true,
        colors: {
          '$1': '#22c55e',
          '$5': '#f59e0b',
          '$10': '#eab308',
          '$20': '#06b6d4',
          '$50': '#ec4899',
          '$100': '#10b981'
        }
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 100
      }
    },

    // Additional Full Page Animated Effects
    solar_flare: {
      size: { width: 800, height: 600 },
      properties: {
        flareIntensity: 0.8,
        rotationSpeed: 1.5,
        particleCount: 200,
        color: '#ff6600',
        loop: true
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        overflow: 'hidden'
      }
    },
    rainbow_tunnel: {
      size: { width: 800, height: 600 },
      properties: {
        tunnelDepth: 500,
        rotationSpeed: 2,
        colorCycleSpeed: 5,
        lineWidth: 4,
        perspective: 800
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        overflow: 'hidden'
      }
    },
    floating_balloons: {
      size: { width: 800, height: 600 },
      properties: {
        balloonCount: 25,
        riseSpeed: { min: 1, max: 3 },
        swayAmount: 40,
        colors: ['#ff0000', '#ffcc00', '#00ccff', '#66ff66'],
        popOnClick: false
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        overflow: 'hidden'
      }
    },
    pixel_sparks: {
      size: { width: 800, height: 600 },
      properties: {
        sparkCount: 150,
        decayRate: 0.9,
        gravity: 0.5,
        spread: 60,
        colors: ['#ffffff', '#ffe600', '#ff0080']
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        overflow: 'hidden'
      }
    },
    butterfly_swarm: {
      size: { width: 800, height: 600 },
      properties: {
        butterflyCount: 20,
        speedRange: { min: 1, max: 4 },
        sizeRange: { min: 30, max: 60 },
        wingFlapSpeed: 2,
        colors: ['#ff8a00', '#ff008a', '#00c0ff', '#8aff00']
      },
      styles: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        overflow: 'hidden'
      }
    },

    // Standard Elements
    image: {
      size: { width: 400, height: 300 },
      properties: {
        src: '',
        alt: '',
        frame: 'none',
        frameColor: '#000000',
        frameWidth: 8,
        objectFit: 'cover'
      },
      styles: {
        borderRadius: '8px'
      }
    },
    
    // Sales Rep Photo Element (binds to {rep_photo} variable)
    // This element automatically fills with the sales rep's photo when triggered via webhook
    sales_rep_photo: {
      size: { width: 480, height: 480 }, // Match documentation default size
      properties: {
        src: '{rep_photo}', // Matches documentation - this is the key binding
        alt: 'Sales Representative Photo',
        fit: 'cover', // Match documentation property name
        borderRadius: '50%', // Match documentation - circular by default
        variableBinding: 'rep_photo', // Internal binding reference
        fallbackUrl: '', // Will be set to fallback photo from API
        objectFit: 'cover', // CSS object-fit
        repEmail: '', // For internal tracking
        repName: '', // For internal tracking
        autoFill: true, // Indicates this element auto-fills from webhook data
        webhookVariable: 'rep_photo' // The variable name the webhook will populate
      },
      styles: {
        borderRadius: '50%', // Circular frame as documented
        overflow: 'hidden', // Ensure image respects border radius
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)', // Professional shadow
        backgroundColor: '#f3f4f6' // Background color for loading state
      }
    },
    standard_photo: {
      size: { width: 400, height: 300 },
      properties: {
        imageUrl: '',
        alt: 'Standard Photo',
        objectFit: 'cover',
        objectPosition: 'center',
        loading: 'lazy',
        crossOrigin: 'anonymous',
        showPlaceholder: true,
        placeholderText: 'Enter image URL...',
        placeholderColor: '#f3f4f6',
        errorFallback: true,
        errorText: 'Image failed to load',
        errorColor: '#ef4444',
        showLoadingState: true,
        loadingText: 'Loading image...',
        loadingColor: '#6b7280',
        loadingTimeout: 10000
      },
      styles: {
        borderRadius: '8px',
        backgroundColor: '#f9fafb'
      }
    },
    video: {
      size: { width: 640, height: 360 },
      properties: {
        src: '',
        autoplay: true,
        loop: true,
        muted: true, // Default to muted for autoplay compatibility
        controls: true,
        poster: '',
        preload: 'metadata',
        playbackRate: 1,
        objectFit: 'contain',
        volume: 1,
        showControlsOnHover: true,
        showTimeDisplay: true,
        showVolumeControl: true,
        showFullscreenButton: true,
        showProgressBar: true,
        customSkin: 'default',
        aspectRatio: '16:9',
        maxWidth: '100%',
        enableKeyboardControls: true,
        crossOrigin: 'anonymous',
        enablePictureInPicture: true,
        showVideoInfo: false
      },
      styles: {
        borderRadius: '8px',
        backgroundColor: '#000000',
        overflow: 'hidden'
      }
    },
    video_player: {
      size: { width: 800, height: 450 },
      properties: {
        src: '',
        poster: '',
        autoplay: true,
        loop: true,
        muted: true, // Default to muted for autoplay compatibility
        controls: true,
        preload: 'metadata',
        playbackRate: 1,
        objectFit: 'contain',
        volume: 1,
        showControlsOnHover: true,
        showTimeDisplay: true,
        showVolumeControl: true,
        showFullscreenButton: true,
        showProgressBar: true,
        customSkin: 'default',
        aspectRatio: '16:9',
        maxWidth: '100%',
        enableKeyboardControls: true,
        crossOrigin: 'anonymous',
        enablePictureInPicture: true,
        showVideoInfo: false,
        // Advanced features
        skipBackwardSeconds: 10,
        skipForwardSeconds: 10,
        bufferingIndicator: true,
        qualitySelector: false,
        subtitleSupport: false,
        chapterMarkers: false,
        customControls: true,
        theme: 'default',
        controlBarPosition: 'bottom',
        showPlaybackRate: true,
        showQualitySelector: false,
        showSubtitleSelector: false,
        showChapterSelector: false,
        showDownloadButton: false,
        showShareButton: false,
        showCastButton: false,
        showTheaterMode: false,
        showMiniPlayer: false,
        showPlaylistControls: false,
        autoHideControls: true,
        controlsTimeout: 3000,
        hoverToShowControls: true,
        clickToPlay: true,
        doubleClickToFullscreen: true,
        keyboardShortcuts: true,
        mobileOptimized: true,
        responsiveDesign: true,
        accessibilityFeatures: true,
        analyticsTracking: false,
        customEvents: false,
        watermark: false,
        watermarkText: '',
        watermarkPosition: 'bottom-right',
        watermarkOpacity: 0.7,
        watermarkFontSize: '12px',
        watermarkColor: '#ffffff'
      },
      styles: {
        borderRadius: '12px',
        backgroundColor: '#000000',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s ease'
      }
    },

    // Form Elements
    contact_form: {
      size: { width: 400, height: 500 },
      properties: {
        fields: [
          { type: 'text', name: 'name', label: 'Name', required: true },
          { type: 'email', name: 'email', label: 'Email', required: true },
          { type: 'textarea', name: 'message', label: 'Message', required: true }
        ],
        submitText: 'Send Message',
        successMessage: 'Thank you for contacting us!',
        action: 'email',
        recipient: ''
      },
      styles: {
        width: '400px',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }
    },
    survey_form: {
      size: { width: 600, height: 400 },
      properties: {
        steps: [
          {
            title: 'Step 1',
            questions: [
              { 
                type: 'radio',
                question: 'How satisfied are you?',
                options: ['Very', 'Somewhat', 'Not']
              }
            ]
          }
        ],
        showProgress: true,
        allowBack: true,
        submitAction: 'webhook',
        webhookUrl: ''
      },
      styles: {
        width: '600px',
        minHeight: '400px',
        padding: '30px',
        backgroundColor: '#ffffff',
        borderRadius: '12px'
      }
    }
  };

  return configs[elementType] || {
    size: { width: 200, height: 100 },
    properties: {},
    styles: {}
  };
} 