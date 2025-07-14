import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { auth } from '../lib/api';

export function useDevAuth() {
  const { token, isAuthenticated, setAuth } = useAuthStore();

  useEffect(() => {
    const autoLogin = async () => {
      console.log('🔍 useDevAuth: Checking authentication state...');
      console.log('🔍 Current state:', { 
        isAuthenticated, 
        hasToken: !!token,
        nodeEnv: process.env.NODE_ENV 
      });
      
      // Only auto-login in development and if not already authenticated
      if (process.env.NODE_ENV === 'development' && !isAuthenticated && !token) {
        try {
          console.log('🔐 Auto-logging in for development...');
          const response = await auth.login('admin', 'admin123');
          
          console.log('🔐 Login response:', {
            hasToken: !!response.data.token,
            userId: response.data.userId,
            username: response.data.username,
            role: response.data.role
          });
          
          if (response.data.token) {
            setAuth(response.data.token, {
              userId: response.data.userId,
              username: response.data.username,
              tenantId: response.data.tenantId,
              role: response.data.role
            });
            console.log('✅ Development auto-login successful');
            
            // Verify the token was stored
            setTimeout(() => {
              const authStorage = localStorage.getItem('auth-storage');
              console.log('🔍 Auth storage after login:', authStorage ? 'STORED' : 'MISSING');
              if (authStorage) {
                try {
                  const parsed = JSON.parse(authStorage);
                  console.log('🔍 Stored auth data:', {
                    hasToken: !!parsed.state?.token,
                    isAuthenticated: parsed.state?.isAuthenticated
                  });
                } catch (e) {
                  console.error('❌ Failed to parse stored auth data:', e);
                }
              }
            }, 100);
          } else {
            console.error('❌ No token in login response');
          }
        } catch (error) {
          console.error('❌ Development auto-login failed:', error);
        }
      } else {
        console.log('🔍 Skipping auto-login:', {
          reason: !isAuthenticated && !token ? 'not in development' : 'already authenticated'
        });
      }
    };

    autoLogin();
  }, [isAuthenticated, token, setAuth]);

  return { isAuthenticated };
} 