import { useCallback } from 'react';
import { toast } from 'sonner';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const showToast = useCallback(({ title, description, variant = 'default', duration = 3000 }: ToastProps) => {
    if (variant === 'destructive') {
      toast.error(title, {
        description,
        duration,
      });
    } else {
      toast(title, {
        description,
        duration,
      });
    }
  }, []);

  return { toast: showToast };
} 