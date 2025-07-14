'use client';

import { useDevAuth } from '../hooks/useDevAuth';

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  useDevAuth();
  return <>{children}</>;
} 