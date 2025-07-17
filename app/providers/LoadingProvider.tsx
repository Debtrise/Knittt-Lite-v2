'use client';

import React, { ReactNode, useEffect } from 'react';
import { useLoadingStore } from '../store/loadingStore';
import { LoadingAnimation } from '../components/ui/LoadingAnimation';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { getLoadingMessage } from '../utils/loadingHelpers';

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const { 
    isLoading, 
    loadingMessage, 
    loadingProgress, 
    showProgress,
    setLoading,
    hideLoading 
  } = useLoadingStore();
  
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're in a dashboard layout by looking at the pathname
  const isDashboard = pathname?.startsWith('/(app)') || pathname?.startsWith('/app/');

  // Route change loading handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleRouteChangeStart = (targetPath?: string) => {
      // Show loading with a small delay to avoid flash for fast navigation
      timeoutId = setTimeout(() => {
        const message = targetPath ? getLoadingMessage(targetPath) : 'Loading page...';
        setLoading(true, message);
      }, 100);
    };

    const handleRouteChangeComplete = () => {
      clearTimeout(timeoutId);
      // Hide loading with a small delay to ensure smooth transition
      setTimeout(() => {
        hideLoading();
      }, 300);
    };

    // Monitor pathname changes for route transitions
    const currentPath = pathname;
    
    // Set up a custom navigation interceptor
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalBack = router.back;
    const originalForward = router.forward;

    // Wrap router methods to show loading
    router.push = (...args: any[]) => {
      const targetPath = args[0];
      handleRouteChangeStart(targetPath);
      return originalPush.apply(router, args);
    };

    router.replace = (...args: any[]) => {
      const targetPath = args[0];
      handleRouteChangeStart(targetPath);
      return originalReplace.apply(router, args);
    };

    router.back = () => {
      handleRouteChangeStart();
      return originalBack.call(router);
    };

    router.forward = () => {
      handleRouteChangeStart();
      return originalForward.call(router);
    };

    // Clean up on unmount
    return () => {
      clearTimeout(timeoutId);
      router.push = originalPush;
      router.replace = originalReplace;
      router.back = originalBack;
      router.forward = originalForward;
    };
  }, [router, pathname, setLoading, hideLoading]);

  // Hide loading when pathname changes (route change complete)
  useEffect(() => {
    hideLoading();
  }, [pathname, hideLoading]);

  // Auto-hide loading after maximum duration to prevent stuck states
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      timeoutId = setTimeout(() => {
        console.warn('Loading state auto-cleared after 15 seconds');
        hideLoading();
      }, 15000); // 15 seconds max loading time
    }

    return () => clearTimeout(timeoutId);
  }, [isLoading, hideLoading]);

  return (
    <>
      {children}
      <LoadingAnimation
        isVisible={isLoading}
        message={loadingMessage}
        progress={loadingProgress}
        showProgress={showProgress}
        variant={isDashboard ? 'content' : 'fullscreen'}
        isDashboard={isDashboard}
      />
    </>
  );
}

// Hook for easy access to loading functions
export function useAppLoading() {
  const {
    setLoading,
    setProgress,
    setMessage,
    hideLoading,
    showLoadingWithProgress,
    showLoadingSimple,
    isLoading
  } = useLoadingStore();

  return {
    showLoading: setLoading,
    updateProgress: setProgress,
    updateMessage: setMessage,
    hideLoading,
    showProgressLoading: showLoadingWithProgress,
    showSimpleLoading: showLoadingSimple,
    isLoading
  };
}

// Higher-order component for automatic loading states
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingMessage = 'Loading...'
) {
  return function LoadingWrapper(props: P) {
    const { showSimpleLoading, hideLoading } = useAppLoading();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      showSimpleLoading(loadingMessage);
      setMounted(true);
      
      // Hide loading once component is mounted
      const timer = setTimeout(() => {
        hideLoading();
      }, 100);

      return () => {
        clearTimeout(timer);
        hideLoading();
      };
    }, [showSimpleLoading, hideLoading]);

    if (!mounted) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Helper function for async operations with loading
export async function withLoadingAsync<T>(
  asyncFn: () => Promise<T>,
  message = 'Processing...',
  showProgress = false
): Promise<T> {
  const { showLoadingWithProgress, showSimpleLoading, hideLoading } = useLoadingStore.getState();
  
  try {
    if (showProgress) {
      showLoadingWithProgress(message);
    } else {
      showSimpleLoading(message);
    }
    
    const result = await asyncFn();
    return result;
  } finally {
    hideLoading();
  }
} 