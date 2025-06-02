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
  const { setTokens, setUser } = useAuthStore();
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
      const { token, refreshToken, userId, username, tenantId, role } = response.data;
      
      // Set both tokens in the auth store
      setTokens(token, refreshToken);
      
      // Set user data in the auth store
      setUser({
        userId,
        username,
        tenantId,
        role
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
    <div className="min-h-screen flex items-center justify-center gradient-animation">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#404040] rounded-lg shadow-lg relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 mb-6">
            <img src="/logo.png" alt="Knittt Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-center text-5xl font-bold text-white mb-2 font-poppins">
            Welcome to Knittt
          </h2>
          <p className="text-center text-xl text-gray-300 font-semibold font-poppins">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                type="text"
                {...register('username', { required: 'Username is required' })}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-white text-gray-900 placeholder-gray-500 rounded-t-md focus:outline-none focus:ring-2 focus:ring-[#265871] focus:border-[#265871] focus:z-10 sm:text-sm font-poppins"
                placeholder="Username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
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
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-white text-gray-900 placeholder-gray-500 rounded-b-md focus:outline-none focus:ring-2 focus:ring-[#265871] focus:border-[#265871] focus:z-10 sm:text-sm font-poppins"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#265871] hover:bg-[#1d4355] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#265871] transition-colors duration-200 font-poppins"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-white bg-[#333333] px-3 py-2 rounded">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-blue-300 hover:text-blue-200">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 