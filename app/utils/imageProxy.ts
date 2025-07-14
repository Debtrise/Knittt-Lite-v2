/**
 * Utility functions for handling image URLs and CORS issues
 */

/**
 * Checks if an image URL is external (not from the same origin)
 */
export function isExternalImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Data URLs and blob URLs are not external
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return false;
  }
  
  // Relative URLs are not external
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }
  
  try {
    const imageUrl = new URL(url);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    
    // If we're on the server side, treat all HTTP(S) URLs as external
    if (!currentOrigin) {
      return true;
    }
    
    return imageUrl.origin !== currentOrigin;
  } catch (error) {
    return false;
  }
}

/**
 * Gets a CORS-free URL for an image by routing it through our proxy if needed
 */
export function getCorsImageUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  
  // Don't proxy data URLs or blob URLs
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
    return originalUrl;
  }
  
  // Don't proxy relative URLs
  if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
    return originalUrl;
  }
  
  // Check if this is an external URL that needs proxying
  if (isExternalImageUrl(originalUrl)) {
    // Route through our image proxy
    const encodedUrl = encodeURIComponent(originalUrl);
    return `/api/proxy/image?url=${encodedUrl}`;
  }
  
  return originalUrl;
}

/**
 * Preloads an image to check if it can be loaded successfully
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 10000); // 10 second timeout
    
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Image failed to load'));
    };
    
    // Remove crossOrigin for proxied images (they should already be CORS-free)
    if (!src.startsWith('/api/proxy/image')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.src = src;
  });
}

/**
 * Tests if an image URL can be loaded successfully
 */
export async function testImageUrl(url: string): Promise<{ success: boolean; error?: string; dimensions?: { width: number; height: number } }> {
  try {
    const corsUrl = getCorsImageUrl(url);
    const img = await preloadImage(corsUrl);
    
    return {
      success: true,
      dimensions: {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gets image dimensions without loading the full image (if possible)
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to get image dimensions'));
    };
    
    const corsUrl = getCorsImageUrl(url);
    
    // Remove crossOrigin for proxied images
    if (!corsUrl.startsWith('/api/proxy/image')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.src = corsUrl;
  });
} 