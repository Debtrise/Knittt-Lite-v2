// SMS API Authentication utilities

export interface SmsApiConfig {
  baseUrl: string;
  apiKey?: string;
  authToken?: string;
}

// Get stored API configuration from localStorage
export function getSmsApiConfig(): SmsApiConfig {
  if (typeof window === 'undefined') return { baseUrl: 'http://34.122.156.88:3001/api' };
  
  try {
    const stored = localStorage.getItem('sms_api_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to parse stored SMS API config:', error);
  }
  
  return { baseUrl: 'http://34.122.156.88:3001/api' };
}

// Save API configuration to localStorage
export function saveSmsApiConfig(config: SmsApiConfig): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('sms_api_config', JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save SMS API config:', error);
  }
}

// Get authentication headers for API requests
export function getSmsAuthHeaders(config?: SmsApiConfig): Record<string, string> {
  const apiConfig = config || getSmsApiConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Try different authentication methods
  if (apiConfig.authToken) {
    headers['Authorization'] = apiConfig.authToken.startsWith('Bearer ') 
      ? apiConfig.authToken 
      : `Bearer ${apiConfig.authToken}`;
  } else if (apiConfig.apiKey) {
    headers['X-API-Key'] = apiConfig.apiKey;
  }
  
  return headers;
}

// Create authenticated fetch request
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  config?: SmsApiConfig
): Promise<Response> {
  const apiConfig = config || getSmsApiConfig();
  const authHeaders = getSmsAuthHeaders(apiConfig);
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}

// Test API connection with current configuration
export async function testSmsApiConnection(config?: SmsApiConfig): Promise<{
  success: boolean;
  error?: string;
  status?: number;
}> {
  try {
    const apiConfig = config || getSmsApiConfig();
    const response = await authenticatedFetch(`${apiConfig.baseUrl}/campaigns`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    }, apiConfig);
    
    return {
      success: response.ok,
      status: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 