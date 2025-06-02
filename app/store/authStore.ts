import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  userId: number;
  username: string;
  tenantId: string;
  role: 'admin' | 'agent';
};

type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (token: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      user: null,
      setTokens: (token, refreshToken) => set({ isAuthenticated: true, token, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ 
        isAuthenticated: false, 
        token: null, 
        refreshToken: null,
        user: null 
      }),
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            return JSON.parse(str);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
); 