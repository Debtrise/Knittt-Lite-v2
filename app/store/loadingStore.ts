'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;
  loadingProgress?: number;
  showProgress: boolean;
  
  // Actions
  setLoading: (loading: boolean, message?: string, progress?: number) => void;
  setProgress: (progress: number) => void;
  setMessage: (message: string) => void;
  hideLoading: () => void;
  showLoadingWithProgress: (message?: string) => void;
  showLoadingSimple: (message?: string) => void;
}

export const useLoadingStore = create<LoadingState>()(
  devtools(
    (set) => ({
      isLoading: false,
      loadingMessage: 'Loading...',
      loadingProgress: undefined,
      showProgress: false,

      setLoading: (loading, message = 'Loading...', progress) =>
        set({
          isLoading: loading,
          loadingMessage: message,
          loadingProgress: progress,
          showProgress: progress !== undefined,
        }),

      setProgress: (progress) =>
        set((state) => ({
          loadingProgress: progress,
          showProgress: true,
          isLoading: state.isLoading || progress < 100,
        })),

      setMessage: (message) =>
        set({ loadingMessage: message }),

      hideLoading: () =>
        set({
          isLoading: false,
          loadingProgress: undefined,
          showProgress: false,
        }),

      showLoadingWithProgress: (message = 'Loading...') =>
        set({
          isLoading: true,
          loadingMessage: message,
          showProgress: true,
          loadingProgress: 0,
        }),

      showLoadingSimple: (message = 'Loading...') =>
        set({
          isLoading: true,
          loadingMessage: message,
          showProgress: false,
          loadingProgress: undefined,
        }),
    }),
    {
      name: 'loading-store',
    }
  )
); 