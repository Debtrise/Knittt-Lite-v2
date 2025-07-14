import { ContentProject, ContentElement, ContentAsset, ContentVariable, ContentTemplate } from '../store/contentStore';
import api from '../lib/api';

class ContentApiService {
  private getAuthHeaders() {
    // Get token from Zustand auth store
    const authStorage = localStorage.getItem('auth-storage');
    let token = null;
    
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        token = authData.state?.token;
      } catch (error) {
        console.error('Failed to parse auth storage:', error);
      }
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private normalizeUrl(url: string): string {
    if (!url) return url;
    
    // If already absolute URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If starts with /, it's relative to the domain
    if (url.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';
      // Remove /api suffix and add the relative URL
      const domainUrl = baseUrl.replace('/api', '');
      return `${domainUrl}${url}`;
    }
    
    // Otherwise, assume it's a relative path and prepend the full backend URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';
    const domainUrl = baseUrl.replace('/api', '');
    return `${domainUrl}/${url}`;
  }

  private normalizeAssetUrls(asset: any): any {
    if (!asset) return asset;
    
    return {
      ...asset,
      publicUrl: this.normalizeUrl(asset.publicUrl),
      thumbnailUrl: asset.thumbnailUrl ? this.normalizeUrl(asset.thumbnailUrl) : asset.thumbnailUrl,
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Helper to sanitize element data before sending to backend
  private sanitizeElementData(element: Partial<ContentElement>) {
    const sanitized = { ...element } as any;
    
    // Ensure properties are serializable
    if (sanitized.properties) {
      try {
        // Convert any functions or complex objects to strings
        sanitized.properties = JSON.parse(JSON.stringify(sanitized.properties));
      } catch (error) {
        console.warn('Failed to sanitize element properties:', error);
        sanitized.properties = {};
      }
    }

    // Ensure styles are serializable
    if (sanitized.styles) {
      try {
        sanitized.styles = JSON.parse(JSON.stringify(sanitized.styles));
      } catch (error) {
        console.warn('Failed to sanitize element styles:', error);
        sanitized.styles = {};
      }
    }

    // Remove any undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });

    return sanitized;
  }

  // Project APIs
  async getProjects(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const response = await api.content.getProjects(params);
    return response.data;
  }

  async getProject(projectId: string) {
    const response = await api.content.getProject(projectId);
    return response.data;
  }

  async createProject(project: Partial<ContentProject>) {
    const response = await api.content.createProject(project as any);
    return response.data;
  }

  async updateProject(projectId: string, updates: Partial<ContentProject>) {
    console.log('🔄 ContentApi.updateProject called');
    console.log('📝 Project ID:', projectId);
    console.log('📝 Updates:', JSON.stringify(updates, null, 2));
    
    // Check authentication before making the call
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) {
      console.error('❌ No auth storage found');
      throw new Error('Authentication required. Please refresh the page.');
    }
    
    let token = null;
    try {
      const authData = JSON.parse(authStorage);
      token = authData.state?.token;
      console.log('🔐 Token found:', token ? 'YES' : 'NO');
      console.log('🔐 Token preview:', token ? token.substring(0, 20) + '...' : 'NONE');
    } catch (error) {
      console.error('❌ Failed to parse auth storage:', error);
      throw new Error('Authentication data corrupted. Please refresh the page.');
    }
    
    if (!token) {
      console.error('❌ No token in auth storage');
      throw new Error('No authentication token found. Please refresh the page.');
    }
    
    try {
      console.log('🌐 Making API call to:', `http://34.122.156.88:3001/api/content/projects/${projectId}`);
      const response = await api.content.updateProject(projectId, updates);
      console.log('✅ API call successful:', response.status);
      console.log('📊 Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API call failed:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
      }
      if ((error as any).response) {
        console.error('❌ Response status:', (error as any).response.status);
        console.error('❌ Response data:', (error as any).response.data);
        console.error('❌ Response headers:', (error as any).response.headers);
      }
      if ((error as any).config) {
        console.error('❌ Request config:', {
          url: (error as any).config.url,
          method: (error as any).config.method,
          headers: (error as any).config.headers,
          data: (error as any).config.data
        });
      }
      throw error;
    }
  }

  async deleteProject(projectId: string) {
    const response = await api.content.deleteProject(projectId);
    return response.data;
  }

  async duplicateProject(projectId: string, name: string) {
    // This endpoint doesn't exist in the documented API, so we'll create a new project
    // by getting the existing one and creating a copy
    const project = await this.getProject(projectId);
    const duplicatedProject = {
      ...project,
      name,
      id: undefined, // Remove ID to create new
    };
    return this.createProject(duplicatedProject);
  }

  // Element APIs
  async createElement(projectId: string, element: Partial<ContentElement>) {
    try {
      const sanitizedElement = this.sanitizeElementData(element);
      const response = await api.content.createElement(projectId, sanitizedElement as any);
      return response.data;
    } catch (error) {
      console.error('Failed to create element:', error);
      throw error;
    }
  }

  async updateElement(projectId: string, elementId: string, updates: Partial<ContentElement>) {
    try {
      const sanitizedUpdates = this.sanitizeElementData(updates);
      console.log('Updating element with sanitized data:', sanitizedUpdates);
      
      const response = await api.content.updateElement(projectId, elementId, sanitizedUpdates);
      return response.data;
    } catch (error) {
      console.error('Failed to update element:', error);
      
      // If it's a network error, provide more helpful feedback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Network Error' || errorMessage.includes('fetch')) {
        throw new Error('Unable to save changes. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  }

  async deleteElement(projectId: string, elementId: string) {
    const response = await api.content.deleteElement(projectId, elementId);
    return response.data;
  }

  async reorderElements(projectId: string, elementOrders: Array<{ elementId: string; layerOrder: number }>) {
    const response = await api.content.reorderElements(projectId, { elementOrders });
    return response.data;
  }

  // Asset APIs
  async getAssets(params?: { assetType?: string; search?: string; tags?: string; page?: number; limit?: number }) {
    const response = await api.content.getAssets(params);
    const data = response.data;
    
    // Normalize URLs in all assets
    if (data.assets && Array.isArray(data.assets)) {
      data.assets = data.assets.map(asset => this.normalizeAssetUrls(asset));
    }
    
    return data;
  }

  async uploadAsset(file: File, metadata?: { name?: string; tags?: string; metadata?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value);
      });
    }

    const response = await api.content.uploadAsset(formData);
    const data = response.data;
    
    // Normalize URLs in the uploaded asset
    if (data.asset) {
      data.asset = this.normalizeAssetUrls(data.asset);
    }
    
    return data;
  }

  async deleteAsset(assetId: string) {
    const response = await api.content.deleteAsset(assetId);
    return response.data;
  }

  // Variable APIs
  async getVariables(params?: { category?: string; dataSource?: string }) {
    const response = await api.content.getVariables(params);
    return response.data;
  }

  async createVariable(variable: Partial<ContentVariable>) {
    const response = await api.content.createVariable(variable as any);
    return response.data;
  }

  async initializeSystemVariables() {
    const response = await api.content.initializeSystemVariables();
    return response.data;
  }

  // Template APIs
  async getTemplates(params?: { category?: string; isPublic?: boolean; search?: string; page?: number; limit?: number }) {
    const response = await api.content.templates.list(params);
    return response.data;
  }

  async getTemplate(templateId: string) {
    const response = await api.content.templates.get(templateId);
    return response.data;
  }

  async createTemplate(template: Partial<ContentTemplate>) {
    const response = await api.content.templates.create(template as any);
    return response.data;
  }

  async updateTemplate(templateId: string, updates: Partial<ContentTemplate>) {
    const response = await api.content.templates.update(templateId, updates);
    return response.data;
  }

  async deleteTemplate(templateId: string) {
    const response = await api.content.templates.delete(templateId);
    return response.data;
  }

  // Preview & Export APIs
  async generatePreview(projectId: string, contextData?: any) {
    const response = await api.content.generatePreview(projectId, contextData);
    return response.data;
  }

  async publishProject(projectId: string, displayIds: string[]) {
    const response = await api.content.publishProject(projectId, { displayIds });
    return response.data;
  }

  // System APIs
  async getAnalytics() {
    // This endpoint doesn't exist in the documented API
    // We'll return empty data for now
    return { analytics: [] };
  }

  async getSystemStatus() {
    const response = await api.content.getSystemStatus();
    return response.data;
  }
}

export const contentApi = new ContentApiService();
export default contentApi; 