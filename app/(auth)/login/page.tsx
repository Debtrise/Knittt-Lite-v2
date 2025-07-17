'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/button';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';

type LoginFormData = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const response = await api.auth.login(data.username, data.password);
      const { token, userId, username, tenantId, role } = response.data;
      
      setAuth(token, {
        userId,
        username,
        tenantId,
        role,
      });
      
      toast.success('Login successful');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card" style={{ maxWidth: 340, padding: '1.5rem 1.5rem 1.25rem 1.5rem' }}>
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-10 mb-3 flex items-center justify-center">
            <img src="/logo.png" alt="Knittt Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-center text-lg font-bold mb-1 font-poppins">
            Welcome to Knittt
          </h2>
          <p className="text-center text-sm mb-4 font-poppins" style={{ color: '#e0e0e0' }}>
            Sign in to your account
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <input
              id="username"
              type="text"
              {...register('username', { required: 'Username is required' })}
              className="login-input font-poppins"
              style={{ fontSize: '0.95rem', padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}
              placeholder="Username"
            />
            {errors.username && (
              <p className="mt-1 text-xs" style={{ color: 'var(--error-color)' }}>{errors.username.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="login-input font-poppins"
              style={{ fontSize: '0.95rem', padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}
              placeholder="Password"
            />
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: 'var(--error-color)' }}>{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="login-btn font-poppins"
            style={{ fontSize: '0.98rem', padding: '0.55rem 0.75rem', marginTop: '0.25rem', marginBottom: '0.25rem' }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="text-center mt-3">
          <p className="text-xs" style={{ color: '#e0e0e0' }}>
            Don&apos;t have an account?{' '}
            <a href="#" className="login-link">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 