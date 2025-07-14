import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { contentApi } from '../services/contentApi';
import { exportApi, PublishOptions, PublishProgress, ExportStatusResponse } from '../services/exportApi';

export interface ContentElement {
  id: string;
  elementType: 'text' | 'image' | 'video' | 'shape' | 'button' | 'qr_code' | 'chart' | 'timer' | 'weather' | 'animation' | 'confetti' | 'standard_photo';
  position: { x: number; y: number; z: number };
  size: { width: number; height: number };
  properties: Record<string, any>;
  styles: Record<string, any>;
  animations?: Array<{
    type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'zoomIn' | 'zoomOut' | 'bounce' | 'pulse' | 'shake' | 'flip' | 'trigger';
    duration?: number;
    delay?: number;
    trigger?: 'onLoad' | 'onClick' | 'onHover' | 'onScroll' | 'manual';
    direction?: 'left' | 'right' | 'up' | 'down';
    intensity?: number;
  }>;
  layerOrder: number;
  assetId?: string;
  opacity?: number;
  // Enhanced properties based on API documentation
  metadata?: Record<string, any>;
  isLocked?: boolean;
  isVisible?: boolean;
  groupId?: string;
  constraints?: {
    maintainAspectRatio?: boolean;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
}

export interface ContentProject {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  canvasSize: { width: number; height: number };
  canvasBackground: {
    type: 'solid' | 'gradient' | 'image' | 'video';
    color?: string;
    gradient?: string;
    imageUrl?: string;
    url?: string; // For video backgrounds
  };
  elements: ContentElement[];
  variables: Record<string, any>;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: number;
  publishedAt?: string;
}

export interface ContentAsset {
  id: string;
  name: string;
  assetType: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  fileSize: number;
  publicUrl: string;
  thumbnailUrl?: string;
  dimensions?: { width: number; height: number };
  tags: string[];
  usageCount: number;
  uploadedAt: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ContentVariable {
  id: string;
  name: string;
  displayName: string;
  description: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'image' | 'url';
  dataSource: 'lead' | 'call' | 'tenant' | 'system' | 'external_api' | 'static';
  sourceField?: string;
  defaultValue: any;
  formatTemplate?: string;
  category: string;
  isSystemVariable: boolean;
  isRequired: boolean;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  canvasSize: { width: number; height: number };
  templateData: {
    elements: any[];
    canvasBackground: any;
  };
  variables: Record<string, any>;
  previewImage?: string;
  usageCount: number;
  isPublic: boolean;
  createdAt: string;
}

interface ContentStore {
  // State
  currentProject: ContentProject | null;
  projects: ContentProject[];
  elements: ContentElement[];
  selectedElement: ContentElement | null;
  selectedElements: string[]; // Array of selected element IDs
  assets: ContentAsset[];
  variables: ContentVariable[];
  templates: ContentTemplate[];
  canvasSize: { width: number; height: number };
  canvasBackground: {
    type: 'solid' | 'gradient' | 'image' | 'video';
    color?: string;
    gradient?: string;
    imageUrl?: string;
    url?: string; // For video backgrounds
  };
  isLoading: boolean;
  error: string | null;
  
  // New state for tracking unsaved changes
  pendingUpdates: Map<string, Partial<ContentElement>>;
  hasUnsavedChanges: boolean;
  autoSaveTimeout: NodeJS.Timeout | null;

  // Actions
  setCurrentProject: (project: ContentProject | null) => void;
  loadProjects: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: (projectId: string) => Promise<void>;
  createProject: (project: Partial<ContentProject>) => Promise<ContentProject>;
  updateProject: (projectId: string, updates: Partial<ContentProject>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  duplicateProject: (projectId: string, name: string) => Promise<ContentProject>;

  createElement: (element: Partial<ContentElement>) => Promise<void>;
  updateElement: (elementId: string, updates: Partial<ContentElement>) => Promise<void>;
  updateElementLocal: (elementId: string, updates: Partial<ContentElement>) => void;
  syncElementToBackend: (elementId: string) => Promise<void>;
  syncAllPendingUpdates: () => Promise<void>;
  deleteElement: (elementId: string) => Promise<void>;
  selectElement: (element: ContentElement | null) => void;
  selectElements: (elementIds: string[]) => void;
  addToSelection: (elementId: string) => void;
  removeFromSelection: (elementId: string) => void;
  toggleElementSelection: (elementId: string) => void;
  clearSelection: () => void;
  selectAllElements: () => void;
  reorderElements: (elementOrders: Array<{ elementId: string; layerOrder: number }>) => void;

  loadAssets: () => Promise<void>;
  uploadAsset: (file: File, metadata?: any) => Promise<ContentAsset>;
  deleteAsset: (assetId: string) => Promise<void>;

  loadVariables: () => Promise<void>;
  createVariable: (variable: Partial<ContentVariable>) => Promise<ContentVariable>;
  // Note: Variable update/delete not supported in current API

  loadTemplates: () => Promise<void>;
  createTemplate: (template: Partial<ContentTemplate>) => Promise<ContentTemplate>;
  saveAsTemplate: (templateData: { name: string; description: string; category: string; isPublic: boolean; tags: string[] }) => Promise<ContentTemplate>;
  loadTemplate: (templateId: string) => Promise<void>;
  updateTemplate: (templateId: string, updates: Partial<ContentTemplate>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;

  setCanvasSize: (size: { width: number; height: number }) => void;
  updateCanvasBackground: (background: any) => void;

  generatePreview: (contextData?: any) => Promise<any>;
  publishProject: (projectId: string, displayIds: string[]) => Promise<void>;

  // Export functions
  createExport: (projectId: string, exportType: 'html' | 'image' | 'video' | 'pdf', options: any) => Promise<any>;
  getProjectExports: (projectId: string) => Promise<any>;
  downloadExport: (exportId: string) => Promise<Blob>;
  deleteExport: (exportId: string) => Promise<void>;
  getOptiSignsStatus: (projectId: string) => Promise<any>;
  publishToOptiSigns: (projectId: string, options: PublishOptions) => Promise<ExportStatusResponse>;
  publishToOptiSignsLegacy: (projectId: string, displayIds: string[], options?: any) => Promise<void>;
  publishWithProgress: (projectId: string, options: PublishOptions, onProgress?: (progress: PublishProgress) => void) => Promise<ExportStatusResponse>;
  getExportStatus: (exportId: string) => Promise<ExportStatusResponse>;
  getAvailableDisplays: () => Promise<any>;
  refreshDeviceStatuses: () => Promise<any>;
  getLiveDeviceStatus: () => Promise<any>;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';

export const useContentStore = create<ContentStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentProject: null,
      projects: [],
      elements: [],
      selectedElement: null,
      selectedElements: [],
      assets: [],
      variables: [],
      templates: [],
      canvasSize: { width: 1920, height: 1080 },
      canvasBackground: { type: 'solid', color: '#ffffff' },
      isLoading: false,
      error: null,
      
      // New state for tracking unsaved changes
      pendingUpdates: new Map(),
      hasUnsavedChanges: false,
      autoSaveTimeout: null,

      // Project actions
      setCurrentProject: (project) => set({ currentProject: project }),

      loadProjects: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.getProjects();
          set({ projects: data.projects, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      loadProject: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.getProject(projectId);
          const project = data.project;
          
          set({
            currentProject: project,
            elements: project.elements || [],
            canvasSize: project.canvasSize,
            canvasBackground: project.canvasBackground,
            isLoading: false,
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      saveProject: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { currentProject, canvasSize, canvasBackground, pendingUpdates } = get();
          
          // Check authentication
          const authStorage = localStorage.getItem('auth-storage');
          console.log('Auth storage:', authStorage ? 'present' : 'missing');
          
          // Only send project-level data, NOT elements
          // Elements are managed separately through their own endpoints
          const projectUpdateData = {
            name: currentProject?.name,
            description: currentProject?.description,
            status: currentProject?.status,
            canvasSize,
            canvasBackground,
            variables: currentProject?.variables,
          };
          
          console.log('Saving project with data (NO ELEMENTS):', projectUpdateData);
          
          await contentApi.updateProject(projectId, projectUpdateData);
          
          // Sync any pending element updates separately
          if (pendingUpdates.size > 0) {
            console.log('Syncing pending updates:', Array.from(pendingUpdates.keys()));
            await get().syncAllPendingUpdates();
          }
          
          set({ isLoading: false });
          console.log('Project saved successfully');
        } catch (error) {
          console.error('Save project error:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      createProject: async (project: Partial<ContentProject>) => {
        console.log('Creating project:', project.name, 'templateId:', project.templateId);
        
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.createProject(project);
          console.log('Project created successfully:', data.project.id, data.project.name);
          set({ isLoading: false });
          return data.project;
        } catch (error) {
          console.error('Create project error:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      updateProject: async (projectId: string, updates: Partial<ContentProject>) => {
        set({ isLoading: true, error: null });
        try {
          await contentApi.updateProject(projectId, updates);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to update project:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      deleteProject: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          await contentApi.deleteProject(projectId);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to delete project:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      duplicateProject: async (projectId: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.duplicateProject(projectId, name);
          set({ isLoading: false });
          return data.project;
        } catch (error) {
          console.error('Failed to duplicate project:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      // Element actions
      createElement: async (element: Partial<ContentElement>) => {
        const { currentProject } = get();
        if (!currentProject) {
          set({ error: 'No project selected' });
          return;
        }

        console.log('Creating element:', element.elementType, 'for project:', currentProject.id);
        
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.createElement(currentProject.id, element);
          const newElement = data.element;
          
          console.log('Element created successfully:', newElement.id, newElement.elementType);
          
          set(state => ({
            elements: [...state.elements, newElement],
            selectedElement: newElement,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to create element:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      updateElement: async (elementId: string, updates: Partial<ContentElement>) => {
        const { currentProject } = get();
        if (!currentProject) {
          set({ error: 'No project selected' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          await contentApi.updateElement(currentProject.id, elementId, updates);
          
          set(state => ({
            elements: state.elements.map(element =>
              element.id === elementId ? { ...element, ...updates } : element
            ),
            selectedElement: state.selectedElement?.id === elementId
              ? { ...state.selectedElement, ...updates }
              : state.selectedElement,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to update element:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      updateElementLocal: (elementId: string, updates: Partial<ContentElement>) => {
        set(state => {
          // Update local state immediately
          const newElements = state.elements.map(element =>
            element.id === elementId ? { ...element, ...updates } : element
          );
          
          // Track pending updates
          const newPendingUpdates = new Map(state.pendingUpdates);
          const existingUpdates = newPendingUpdates.get(elementId) || {};
          newPendingUpdates.set(elementId, { ...existingUpdates, ...updates });
          
          // Clear any existing auto-save timeout
          if (state.autoSaveTimeout) {
            clearTimeout(state.autoSaveTimeout);
          }

          return {
            elements: newElements,
            selectedElement: state.selectedElement?.id === elementId
              ? { ...state.selectedElement, ...updates }
              : state.selectedElement,
            pendingUpdates: newPendingUpdates,
            hasUnsavedChanges: true,
            autoSaveTimeout: null
          };
        });
      },

      syncElementToBackend: async (elementId: string) => {
        const { currentProject, pendingUpdates } = get();
        if (!currentProject) {
          set({ error: 'No project selected' });
          return;
        }

        const updates = pendingUpdates.get(elementId);
        if (!updates) return;

        try {
          await contentApi.updateElement(currentProject.id, elementId, updates);
          console.log(`Synced element ${elementId} to backend`);
        } catch (error) {
          console.error('Failed to sync element to backend:', error);
          set({ error: (error as Error).message });
        }
      },

      syncAllPendingUpdates: async () => {
        const { currentProject, pendingUpdates } = get();
        if (!currentProject) {
          set({ error: 'No project selected' });
          return;
        }

        if (pendingUpdates.size === 0) return;

        set({ isLoading: true, error: null });
        try {
          const updatePromises = Array.from(pendingUpdates.entries()).map(([elementId, updates]) =>
            contentApi.updateElement(currentProject.id, elementId, updates)
          );
          
          await Promise.all(updatePromises);
          
          set({
            pendingUpdates: new Map(),
            hasUnsavedChanges: false,
            isLoading: false
          });
          
          console.log('All pending updates synced to backend');
        } catch (error) {
          console.error('Failed to sync all pending updates:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      deleteElement: async (elementId: string) => {
        const { currentProject } = get();
        if (!currentProject) {
          set({ error: 'No project selected' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          await contentApi.deleteElement(currentProject.id, elementId);
          
          set(state => ({
            elements: state.elements.filter(element => element.id !== elementId),
            selectedElement: state.selectedElement?.id === elementId ? null : state.selectedElement,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to delete element:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      selectElement: (element: ContentElement | null) => {
        set({ selectedElement: element });
      },

      selectElements: (elementIds: string[]) => {
        set({ selectedElements: elementIds });
      },

      addToSelection: (elementId: string) => {
        set(state => ({
          selectedElements: [...state.selectedElements, elementId],
        }));
      },

      removeFromSelection: (elementId: string) => {
        set(state => ({
          selectedElements: state.selectedElements.filter(id => id !== elementId),
        }));
      },

      toggleElementSelection: (elementId: string) => {
        set(state => ({
          selectedElements: state.selectedElements.includes(elementId)
            ? state.selectedElements.filter(id => id !== elementId)
            : [...state.selectedElements, elementId],
        }));
      },

      clearSelection: () => {
        set({ selectedElements: [] });
      },

      selectAllElements: () => {
        const { elements } = get();
        set({ selectedElements: elements.map(element => element.id) });
      },

      reorderElements: (elementOrders: Array<{ elementId: string; layerOrder: number }>) => {
        set(state => ({
          elements: state.elements.map(element => {
            const order = elementOrders.find(o => o.elementId === element.id);
            return order ? { ...element, layerOrder: order.layerOrder } : element;
          }).sort((a, b) => a.layerOrder - b.layerOrder),
        }));
      },

      // Asset actions
      loadAssets: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.getAssets();
          set({ assets: data.assets, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      uploadAsset: async (file: File, metadata?: any) => {
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.uploadAsset(file, metadata);
          set(state => ({
            assets: [...state.assets, data.asset],
            isLoading: false,
          }));
          return data.asset;
        } catch (error) {
          console.error('Failed to upload asset:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      deleteAsset: async (assetId: string) => {
        set({ isLoading: true, error: null });
        try {
          await contentApi.deleteAsset(assetId);
          set(state => ({
            assets: state.assets.filter(asset => asset.id !== assetId),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to delete asset:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      // Variable actions
      loadVariables: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.getVariables();
          set({ variables: data.variables, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      createVariable: async (variable: Partial<ContentVariable>) => {
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.createVariable(variable);
          set(state => ({
            variables: [...state.variables, data.variable],
            isLoading: false,
          }));
          return data.variable;
        } catch (error) {
          console.error('Failed to create variable:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      // Note: Variable update/delete functions removed as they're not supported in the current API

      // Template actions
      loadTemplates: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.getTemplates();
          set({ templates: data.templates, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      createTemplate: async (template: Partial<ContentTemplate>) => {
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.createTemplate(template);
          set(state => ({
            templates: [...state.templates, data.template],
            isLoading: false,
          }));
          return data.template;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      saveAsTemplate: async (templateData: { name: string; description: string; category: string; isPublic: boolean; tags: string[] }) => {
        set({ isLoading: true, error: null });
        try {
          const { currentProject, elements, canvasSize, canvasBackground, variables } = get();
          
          if (!currentProject) {
            throw new Error('No project selected to save as template');
          }

          // Create template object from current project
          const template: Partial<ContentTemplate> = {
            name: templateData.name,
            description: templateData.description,
            category: templateData.category,
            canvasSize: canvasSize,
            templateData: {
              elements: elements.map(element => ({
                elementType: element.elementType,
                position: element.position,
                size: element.size,
                properties: element.properties,
                styles: element.styles,
                animations: element.animations || [],
                layerOrder: element.layerOrder,
                opacity: element.opacity || 1,
                assetId: element.assetId,
                metadata: element.metadata,
                isLocked: element.isLocked,
                isVisible: element.isVisible,
                groupId: element.groupId,
                constraints: element.constraints
              })),
              canvasBackground: canvasBackground
            },
            variables: variables || {},
            isPublic: templateData.isPublic
          };

          const data = await contentApi.createTemplate(template);
          
          set(state => ({
            templates: [...state.templates, data.template],
            isLoading: false,
          }));
          return data.template;
        } catch (error) {
          console.error('Failed to save template:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      loadTemplate: async (templateId: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await contentApi.getTemplate(templateId);
          const template = data.template;
          set({ isLoading: false });
          return template;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      updateTemplate: async (templateId: string, updates: Partial<ContentTemplate>) => {
        set({ isLoading: true, error: null });
        try {
          await contentApi.updateTemplate(templateId, updates);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to update template:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      deleteTemplate: async (templateId: string) => {
        set({ isLoading: true, error: null });
        try {
          await contentApi.deleteTemplate(templateId);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to delete template:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      // Canvas actions
      setCanvasSize: (size: { width: number; height: number }) => {
        set({ canvasSize: size });
      },

      updateCanvasBackground: (background: any) => {
        console.log('Updating canvas background:', background);
        set({ canvasBackground: background });
      },

      // Preview and publish actions
      generatePreview: async (contextData?: any) => {
        set({ isLoading: true, error: null });
        try {
          const { currentProject } = get();
          if (!currentProject) throw new Error('No project selected');

          const data = await contentApi.generatePreview(currentProject.id, contextData);
          set({ isLoading: false });
          return data.preview;
        } catch (error) {
          console.error('Failed to generate preview:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      publishProject: async (projectId: string, displayIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          await contentApi.publishProject(projectId, displayIds);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to publish project:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      // Export actions
      createExport: async (projectId: string, exportType: 'html' | 'image' | 'video' | 'pdf', options: any) => {
        set({ isLoading: true, error: null });
        try {
          const data = await exportApi.createExport(projectId, exportType, options);
          set({ isLoading: false });
          return data;
        } catch (error) {
          console.error('Failed to create export:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      getProjectExports: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await exportApi.getProjectExports(projectId);
          set({ isLoading: false });
          return data;
        } catch (error) {
          console.error('Failed to get project exports:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      downloadExport: async (exportId: string) => {
        try {
          return await exportApi.downloadExport(exportId);
        } catch (error) {
          console.error('Failed to download export:', error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      deleteExport: async (exportId: string) => {
        set({ isLoading: true, error: null });
        try {
          await exportApi.deleteExport(exportId);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to delete export:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      getOptiSignsStatus: async (projectId: string) => {
        try {
          return await exportApi.getOptiSignsStatus(projectId);
        } catch (error) {
          console.error('Failed to get OptiSigns status:', error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      publishToOptiSigns: async (projectId: string, options: PublishOptions): Promise<ExportStatusResponse> => {
        set({ isLoading: true, error: null });
        try {
          const result = await exportApi.publishToOptiSigns(projectId, options);
          set({ isLoading: false });
          return result;
        } catch (error) {
          console.error('Failed to publish to OptiSigns:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      publishToOptiSignsLegacy: async (projectId: string, displayIds: string[], options?: any) => {
        set({ isLoading: true, error: null });
        try {
          await exportApi.publishToOptiSignsLegacy(projectId, displayIds, options);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to publish to OptiSigns:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      publishWithProgress: async (projectId: string, options: PublishOptions, onProgress?: (progress: PublishProgress) => void): Promise<ExportStatusResponse> => {
        set({ isLoading: true, error: null });
        try {
          const result = await exportApi.publishWithProgress(projectId, options, onProgress);
          set({ isLoading: false });
          return result;
        } catch (error) {
          console.error('Failed to publish with progress:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      getExportStatus: async (exportId: string): Promise<ExportStatusResponse> => {
        try {
          return await exportApi.getExportStatus(exportId);
        } catch (error) {
          console.error('Failed to get export status:', error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      getAvailableDisplays: async () => {
        try {
          return await exportApi.getAvailableDisplays();
        } catch (error) {
          console.error('Failed to get available displays:', error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      refreshDeviceStatuses: async () => {
        // This endpoint is not available in the current API
        console.warn('Refresh device statuses endpoint not available');
        return { message: 'Device status refresh not available in current API' };
      },

      getLiveDeviceStatus: async () => {
        // This endpoint is not available in the current API
        console.warn('Live device status endpoint not available');
        return { devices: [] };
      },

      // Utility actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'content-store',
    }
  )
); 