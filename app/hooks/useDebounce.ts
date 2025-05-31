import { useCallback, useRef } from 'react';

export function useDebounce<T>(callback: (value: T) => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (value: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(value);
      }, delay);
    },
    [callback, delay]
  );
} 