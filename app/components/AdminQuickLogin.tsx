'use client';

import React from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { Button } from './ui/button';
import { Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function AdminQuickLogin() {
  const { setAuth } = useAuthStore();

  const handleQuickLogin = () => {
    // Set admin auth state directly
    setAuth(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJhZG1pbiIsInRlbmFudElkIjoiMSIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjp7fSwiaWF0IjoxNzUxNTYzODg2LCJleHAiOjE3NTE2NTAyODZ9.PwbgwJX2TGLL9lIeGzQo77AA1wE5lw6atd3GTQsYWVg',
      {
        userId: 4,
        username: 'admin',
        tenantId: '1',
        role: 'admin',
      }
    );
    
    toast.success('Admin access granted!');
    
    // Refresh the page to update the UI
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleQuickLogin}
        variant="destructive"
        className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
      >
        <Shield className="w-4 h-4 mr-2" />
        Quick Admin Login
      </Button>
    </div>
  );
} 