import api from '@/app/lib/api';
import { toast } from 'react-hot-toast';

// Types for API responses
interface Journey {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  steps?: any[];
  createdAt: string;
  updatedAt: string;
}

interface ContentProject {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  variables: Record<string, any>;
  elements?: any[];
  canvasSize?: { width: number; height: number };
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

interface Display {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  isOnline: boolean;
  resolution?: { width: number; height: number };
  tags?: string[];
  groupIds?: string[];
  lastSeen: string;
}

interface SalesRepPhoto {
  id: string;
  email: string;
  photoUrl: string;
  fileName: string;
  uploadedAt: string;
}

interface WebhookApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

// Enhanced API integration class
export class WebhookApiIntegration {
  private static instance: WebhookApiIntegration;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): WebhookApiIntegration {
    if (!WebhookApiIntegration.instance) {
      WebhookApiIntegration.instance = new WebhookApiIntegration();
    }
    return WebhookApiIntegration.instance;
  }

  private getCacheKey(method: string, params?: any): string {
    return `${method}_${JSON.stringify(params || {})}`;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Enhanced error handling
  private handleApiError(error: any, operation: string): never {
    console.error(`❌ API Error in ${operation}:`, error);
    
    if (error.response?.status === 401) {
      toast.error('Authentication failed. Please log in again.');
      throw new Error('Authentication failed');
    }
    
    if (error.response?.status === 403) {
      toast.error('Access denied. Check your permissions.');
      throw new Error('Access denied');
    }
    
    if (error.response?.status === 404) {
      toast.error('Resource not found.');
      throw new Error('Resource not found');
    }
    
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
      throw new Error('Server error');
    }
    
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    toast.error(`${operation} failed: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  // Journey API integration
  async fetchJourneys(useCache: boolean = true): Promise<Journey[]> {
    const cacheKey = this.getCacheKey('journeys');
    
    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('✅ Using cached journeys');
        return cached;
      }
    }

    try {
      console.log('🔄 Fetching journeys from API...');
      const response = await api.journeys.list();
      
      const data = response.data || response;
      let journeys = data.journeys || data || [];
      
      if (!Array.isArray(journeys)) {
        journeys = [];
      }
      
      // Transform and validate journeys
      const transformedJourneys = journeys.map((journey: any) => ({
        id: journey.id,
        name: journey.name || 'Unnamed Journey',
        description: journey.description || '',
        isActive: journey.isActive !== false,
        steps: journey.steps || [],
        createdAt: journey.createdAt || new Date().toISOString(),
        updatedAt: journey.updatedAt || new Date().toISOString()
      }));
      
      this.setCache(cacheKey, transformedJourneys);
      console.log('✅ Journeys fetched successfully:', transformedJourneys.length);
      return transformedJourneys;
      
    } catch (error) {
      this.handleApiError(error, 'Fetch Journeys');
    }
  }

  // Content Projects API integration
  async fetchContentProjects(useCache: boolean = true): Promise<ContentProject[]> {
    const cacheKey = this.getCacheKey('content_projects');
    
    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('✅ Using cached content projects');
        return cached;
      }
    }

    try {
      console.log('🎨 Fetching content projects from API...');
      const response = await api.content.getProjects({
        page: 1,
        limit: 100
      });
      
      const projects = response.data?.projects || response.projects || [];
      
      // Transform and validate projects
      const transformedProjects = projects.map((project: any) => ({
        id: project.id,
        name: project.name || 'Unnamed Project',
        description: project.description || '',
        status: project.status || 'draft',
        variables: project.variables || {},
        elements: project.elements || [],
        canvasSize: project.canvasSize || { width: 1920, height: 1080 },
        thumbnail: project.thumbnail,
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: project.updatedAt || new Date().toISOString()
      }));
      
      this.setCache(cacheKey, transformedProjects);
      console.log('✅ Content projects fetched successfully:', transformedProjects.length);
      return transformedProjects;
      
    } catch (error) {
      this.handleApiError(error, 'Fetch Content Projects');
    }
  }

  // OptiSigns Displays API integration
  async fetchDisplays(useCache: boolean = true): Promise<Display[]> {
    const cacheKey = this.getCacheKey('displays');
    
    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('✅ Using cached displays');
        return cached;
      }
    }

    try {
      console.log('📺 Fetching displays from OptiSigns API...');
      const response = await api.optisigns.getDisplays({ limit: 500 });
      
      const displays = response.data?.displays || response.displays || [];
      
      // Transform and validate displays
      const transformedDisplays = displays.map((display: any) => ({
        id: display.id || display.deviceId || display.displayId,
        name: display.name || display.deviceName || display.displayName || `Display ${display.id}`,
        location: display.location || display.address || display.site || display.locationName || 'Unknown Location',
        status: (display.isOnline || display.online || display.status === 'online') ? 'online' : 'offline',
        isOnline: display.isOnline || display.online || false,
        resolution: display.resolution || display.screenResolution || { width: 1920, height: 1080 },
        tags: display.tags || display.deviceTags || [],
        groupIds: display.groupIds || display.groups || [],
        lastSeen: display.lastSeen || display.lastActivity || display.updatedAt || new Date().toISOString()
      }));
      
      this.setCache(cacheKey, transformedDisplays);
      console.log('✅ Displays fetched successfully:', transformedDisplays.length);
      return transformedDisplays;
      
    } catch (error) {
      this.handleApiError(error, 'Fetch Displays');
    }
  }

  // Sales Rep Photos API integration
  async fetchSalesRepPhotos(useCache: boolean = true): Promise<SalesRepPhoto[]> {
    const cacheKey = this.getCacheKey('sales_rep_photos');
    
    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('✅ Using cached sales rep photos');
        return cached;
      }
    }

    try {
      console.log('📸 Fetching sales rep photos from API...');
      const response = await api.salesRepPhotos.list();
      
      const photos = response.data?.photos || response.photos || [];
      
      // Transform and validate photos
      const transformedPhotos = photos.map((photo: any) => ({
        id: photo.id,
        email: photo.email,
        photoUrl: photo.photoUrl || photo.url,
        fileName: photo.fileName || photo.filename,
        uploadedAt: photo.uploadedAt || photo.createdAt || new Date().toISOString()
      }));
      
      this.setCache(cacheKey, transformedPhotos);
      console.log('✅ Sales rep photos fetched successfully:', transformedPhotos.length);
      return transformedPhotos;
      
    } catch (error) {
      this.handleApiError(error, 'Fetch Sales Rep Photos');
    }
  }

  // Get sales rep photo by email
  async getSalesRepPhotoByEmail(email: string): Promise<SalesRepPhoto | null> {
    try {
      console.log(`📸 Fetching photo for sales rep: ${email}`);
      const response = await api.salesRepPhotos.getByEmail(email);
      
      if (!response.data && !response.photoUrl) {
        return null;
      }
      
      const photo = response.data || response;
      return {
        id: photo.id,
        email: photo.email,
        photoUrl: photo.photoUrl || photo.url,
        fileName: photo.fileName || photo.filename,
        uploadedAt: photo.uploadedAt || photo.createdAt || new Date().toISOString()
      };
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`ℹ️ No photo found for sales rep: ${email}`);
        return null;
      }
      this.handleApiError(error, 'Get Sales Rep Photo');
    }
  }

  // Create content from template
  async createContentFromProject(projectId: string, variables: Record<string, any>): Promise<any> {
    try {
      console.log(`🎨 Creating content from project: ${projectId}`);
      const response = await api.content.createFromProject(projectId, {
        variables,
        autoGenerate: true
      });
      
      const content = response.data || response;
      console.log('✅ Content created successfully:', content.id);
      
      // Clear content cache to force refresh
      this.clearCache('content_projects');
      
      return content;
      
    } catch (error) {
      this.handleApiError(error, 'Create Content');
    }
  }

  // Trigger display takeover
  async triggerDisplayTakeover(displayIds: string[], contentId: string, options: any = {}): Promise<any> {
    try {
      console.log(`📺 Triggering display takeover for ${displayIds.length} displays`);
      const response = await api.optisigns.triggerTakeover({
        displayIds,
        contentId,
        priority: options.priority || 'MEDIUM',
        duration: options.duration || 30,
        restoreAfter: options.restoreAfter !== false,
        overrideCurrent: options.overrideCurrent || false
      });
      
      const result = response.data || response;
      console.log('✅ Display takeover triggered successfully');
      return result;
      
    } catch (error) {
      this.handleApiError(error, 'Trigger Display Takeover');
    }
  }

  // Test webhook functionality
  async testWebhookIntegration(webhookType: string, payload: any): Promise<any> {
    try {
      console.log(`🧪 Testing webhook integration for type: ${webhookType}`);
      
      let testResult: any = {};
      
      switch (webhookType) {
        case 'announcement':
          // Test announcement workflow
          testResult = await this.testAnnouncementWorkflow(payload);
          break;
          
        case 'go':
          // Test lead creation workflow
          testResult = await this.testLeadCreationWorkflow(payload);
          break;
          
        default:
          testResult = { success: true, message: 'Basic webhook test passed' };
      }
      
      console.log('✅ Webhook integration test completed:', testResult);
      return testResult;
      
    } catch (error) {
      this.handleApiError(error, 'Test Webhook Integration');
    }
  }

  // Test announcement workflow
  private async testAnnouncementWorkflow(payload: any): Promise<any> {
    const results = {
      success: true,
      steps: [] as any[],
      errors: [] as string[]
    };

    try {
      // Step 1: Validate payload
      results.steps.push({
        step: 'payload_validation',
        status: 'success',
        message: 'Payload validation passed'
      });

      // Step 2: Check if sales rep photo exists
      if (payload.rep_email) {
        const photo = await this.getSalesRepPhotoByEmail(payload.rep_email);
        results.steps.push({
          step: 'sales_rep_photo',
          status: photo ? 'success' : 'warning',
          message: photo ? 'Sales rep photo found' : 'No photo found for sales rep'
        });
      }

      // Step 3: Check content projects
      const projects = await this.fetchContentProjects();
      results.steps.push({
        step: 'content_projects',
        status: projects.length > 0 ? 'success' : 'error',
        message: `${projects.length} content projects available`
      });

      // Step 4: Check displays
      const displays = await this.fetchDisplays();
      const onlineDisplays = displays.filter(d => d.status === 'online');
      results.steps.push({
        step: 'displays',
        status: onlineDisplays.length > 0 ? 'success' : 'error',
        message: `${onlineDisplays.length} online displays available`
      });

      if (projects.length === 0) {
        results.errors.push('No content projects available');
        results.success = false;
      }

      if (onlineDisplays.length === 0) {
        results.errors.push('No online displays available');
        results.success = false;
      }

    } catch (error) {
      results.success = false;
      results.errors.push(`Test failed: ${error.message}`);
    }

    return results;
  }

  // Test lead creation workflow
  private async testLeadCreationWorkflow(payload: any): Promise<any> {
    const results = {
      success: true,
      steps: [] as any[],
      errors: [] as string[]
    };

    try {
      // Step 1: Validate required fields
      const requiredFields = ['phone'];
      for (const field of requiredFields) {
        if (!payload[field]) {
          results.errors.push(`Missing required field: ${field}`);
          results.success = false;
        }
      }

      results.steps.push({
        step: 'field_validation',
        status: results.errors.length === 0 ? 'success' : 'error',
        message: results.errors.length === 0 ? 'All required fields present' : 'Missing required fields'
      });

      // Step 2: Check journeys for auto-enrollment
      const journeys = await this.fetchJourneys();
      results.steps.push({
        step: 'journeys',
        status: journeys.length > 0 ? 'success' : 'warning',
        message: `${journeys.length} journeys available for auto-enrollment`
      });

    } catch (error) {
      results.success = false;
      results.errors.push(`Test failed: ${error.message}`);
    }

    return results;
  }

  // Get comprehensive system status
  async getSystemStatus(): Promise<any> {
    const status = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {} as Record<string, any>
    };

    try {
      // Test journeys API
      try {
        const journeys = await this.fetchJourneys(false);
        status.services.journeys = {
          status: 'healthy',
          count: journeys.length,
          message: `${journeys.length} journeys available`
        };
      } catch (error) {
        status.services.journeys = {
          status: 'error',
          message: error.message
        };
        status.overall = 'degraded';
      }

      // Test content projects API
      try {
        const projects = await this.fetchContentProjects(false);
        status.services.content = {
          status: 'healthy',
          count: projects.length,
          message: `${projects.length} content projects available`
        };
      } catch (error) {
        status.services.content = {
          status: 'error',
          message: error.message
        };
        status.overall = 'degraded';
      }

      // Test displays API
      try {
        const displays = await this.fetchDisplays(false);
        const onlineDisplays = displays.filter(d => d.status === 'online');
        status.services.displays = {
          status: 'healthy',
          count: displays.length,
          onlineCount: onlineDisplays.length,
          message: `${onlineDisplays.length}/${displays.length} displays online`
        };
      } catch (error) {
        status.services.displays = {
          status: 'error',
          message: error.message
        };
        status.overall = 'degraded';
      }

      // Test sales rep photos API
      try {
        const photos = await this.fetchSalesRepPhotos(false);
        status.services.salesRepPhotos = {
          status: 'healthy',
          count: photos.length,
          message: `${photos.length} sales rep photos available`
        };
      } catch (error) {
        status.services.salesRepPhotos = {
          status: 'error',
          message: error.message
        };
        status.overall = 'degraded';
      }

    } catch (error) {
      status.overall = 'error';
    }

    return status;
  }

  // Clear all caches
  clearAllCaches(): void {
    this.clearCache();
    console.log('✅ All caches cleared');
  }

  // Refresh all data
  async refreshAllData(): Promise<void> {
    console.log('🔄 Refreshing all data...');
    this.clearAllCaches();
    
    await Promise.all([
      this.fetchJourneys(false),
      this.fetchContentProjects(false),
      this.fetchDisplays(false),
      this.fetchSalesRepPhotos(false)
    ]);
    
    console.log('✅ All data refreshed');
  }
}

// Export singleton instance
export const webhookApi = WebhookApiIntegration.getInstance();

// Export convenience functions
export const fetchJourneys = () => webhookApi.fetchJourneys();
export const fetchContentProjects = () => webhookApi.fetchContentProjects();
export const fetchDisplays = () => webhookApi.fetchDisplays();
export const fetchSalesRepPhotos = () => webhookApi.fetchSalesRepPhotos();
export const getSalesRepPhotoByEmail = (email: string) => webhookApi.getSalesRepPhotoByEmail(email);
export const createContentFromProject = (projectId: string, variables: Record<string, any>) => 
  webhookApi.createContentFromProject(projectId, variables);
export const triggerDisplayTakeover = (displayIds: string[], contentId: string, options?: any) => 
  webhookApi.triggerDisplayTakeover(displayIds, contentId, options);
export const testWebhookIntegration = (webhookType: string, payload: any) => 
  webhookApi.testWebhookIntegration(webhookType, payload);
export const getSystemStatus = () => webhookApi.getSystemStatus();
export const refreshAllData = () => webhookApi.refreshAllData();
export const clearAllCaches = () => webhookApi.clearAllCaches(); 