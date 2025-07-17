'use client';

import { useLoadingStore } from '../store/loadingStore';

// Route-specific loading messages
export const ROUTE_LOADING_MESSAGES = {
  '/dashboard': 'Loading dashboard...',
  '/leads': 'Loading leads...',
  '/calls': 'Loading calls...',
  '/recordings': 'Loading recordings...',
  '/reports': 'Generating reports...',
  '/settings': 'Loading settings...',
  '/journeys': 'Loading journeys...',
  '/optisigns': 'Loading OptiSigns...',
  '/sms': 'Loading SMS dashboard...',
  '/webhooks': 'Loading webhooks...',
  '/content-creator': 'Initializing content creator...',
  '/marketplace': 'Loading marketplace...',
  '/admin': 'Loading admin panel...',
  '/dids': 'Loading phone numbers...',
  '/tracers': 'Loading tracers...',
  '/dialplan': 'Loading dialplan...',
  '/email': 'Loading email dashboard...',
  default: 'Loading page...'
};

// Get loading message for a specific route
export function getLoadingMessage(pathname: string): string {
  // Check for exact matches first
  if (ROUTE_LOADING_MESSAGES[pathname as keyof typeof ROUTE_LOADING_MESSAGES]) {
    return ROUTE_LOADING_MESSAGES[pathname as keyof typeof ROUTE_LOADING_MESSAGES];
  }

  // Check for partial matches
  for (const [route, message] of Object.entries(ROUTE_LOADING_MESSAGES)) {
    if (route !== 'default' && pathname.startsWith(route)) {
      return message;
    }
  }

  return ROUTE_LOADING_MESSAGES.default;
}

// API call wrapper with loading
export async function withApiLoading<T>(
  apiCall: () => Promise<T>,
  message: string = 'Processing...',
  showProgress: boolean = false
): Promise<T> {
  const { showLoadingWithProgress, showLoadingSimple, hideLoading } = useLoadingStore.getState();
  
  try {
    if (showProgress) {
      showLoadingWithProgress(message);
    } else {
      showLoadingSimple(message);
    }
    
    const result = await apiCall();
    return result;
  } catch (error) {
    throw error;
  } finally {
    // Small delay to ensure smooth UX
    setTimeout(() => {
      hideLoading();
    }, 200);
  }
}

// File upload with progress
export async function withUploadProgress<T>(
  uploadFn: (onProgress: (progress: number) => void) => Promise<T>,
  message: string = 'Uploading...'
): Promise<T> {
  const { showLoadingWithProgress, setProgress, hideLoading } = useLoadingStore.getState();
  
  try {
    showLoadingWithProgress(message);
    
    const result = await uploadFn((progress) => {
      setProgress(progress);
    });
    
    return result;
  } finally {
    setTimeout(() => {
      hideLoading();
    }, 500); // Longer delay for uploads to show completion
  }
}

// Form submission with loading
export function withFormLoading<T extends (...args: any[]) => Promise<any>>(
  submitFn: T,
  message: string = 'Submitting...'
): T {
  return (async (...args: Parameters<T>) => {
    const { showLoadingSimple, hideLoading } = useLoadingStore.getState();
    
    try {
      showLoadingSimple(message);
      const result = await submitFn(...args);
      return result;
    } finally {
      setTimeout(() => {
        hideLoading();
      }, 300);
    }
  }) as T;
}

// Data fetching with loading
export class LoadingFetcher {
  private static instance: LoadingFetcher;
  
  static getInstance(): LoadingFetcher {
    if (!LoadingFetcher.instance) {
      LoadingFetcher.instance = new LoadingFetcher();
    }
    return LoadingFetcher.instance;
  }

  async fetch<T>(
    fetchFn: () => Promise<T>,
    options: {
      message?: string;
      showProgress?: boolean;
      minDuration?: number; // Minimum duration to show loading (prevents flash)
    } = {}
  ): Promise<T> {
    const { 
      message = 'Loading...',
      showProgress = false,
      minDuration = 300 
    } = options;

    const { showLoadingWithProgress, showLoadingSimple, hideLoading } = useLoadingStore.getState();
    
    const startTime = Date.now();
    
    try {
      if (showProgress) {
        showLoadingWithProgress(message);
      } else {
        showLoadingSimple(message);
      }
      
      const result = await fetchFn();
      
      // Ensure minimum duration
      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      
      return result;
    } finally {
      hideLoading();
    }
  }
}

// Hook for component-level loading
export function useComponentLoading() {
  const { isLoading, setLoading, hideLoading } = useLoadingStore();
  
  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    message: string = 'Loading...'
  ): Promise<T> => {
    try {
      setLoading(true, message);
      const result = await asyncFn();
      return result;
    } finally {
      hideLoading();
    }
  };

  return {
    isLoading,
    withLoading,
    show: (message?: string) => setLoading(true, message),
    hide: hideLoading
  };
}

// Navigation with loading
export function createLoadingRouter(router: any) {
  const { setLoading, hideLoading } = useLoadingStore.getState();
  
  return {
    push: async (path: string, options?: any) => {
      setLoading(true, getLoadingMessage(path));
      try {
        return await router.push(path, options);
      } finally {
        // Navigation completion is handled by the LoadingProvider
      }
    },
    replace: async (path: string, options?: any) => {
      setLoading(true, getLoadingMessage(path));
      try {
        return await router.replace(path, options);
      } finally {
        // Navigation completion is handled by the LoadingProvider
      }
    },
    back: () => {
      setLoading(true, 'Going back...');
      return router.back();
    },
    forward: () => {
      setLoading(true, 'Going forward...');
      return router.forward();
    }
  };
}

// Batch operations with progress
export async function withBatchProgress<T>(
  items: T[],
  processFn: (item: T, index: number) => Promise<void>,
  message: string = 'Processing items...'
): Promise<void> {
  const { showLoadingWithProgress, setProgress, setMessage, hideLoading } = useLoadingStore.getState();
  
  try {
    showLoadingWithProgress(message);
    
    for (let i = 0; i < items.length; i++) {
      setMessage(`${message} (${i + 1}/${items.length})`);
      setProgress(((i + 1) / items.length) * 100);
      
      await processFn(items[i], i);
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  } finally {
    setTimeout(() => {
      hideLoading();
    }, 500);
  }
} 