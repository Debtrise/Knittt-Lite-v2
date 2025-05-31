'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';

type RegisterFormData = {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  tenantId: string;
  role: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.auth.register({
        username: data.username,
        password: data.password,
        email: data.email,
        tenantId: data.tenantId,
        role: data.role as 'admin' | 'agent',
      });
      
      toast.success('Registration successful');
      router.push('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
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
            Create Account
          </h2>
          <p className="text-center text-xl text-gray-300 font-semibold font-poppins">
            Join Knittt today
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
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#265871] focus:border-[#265871] focus:z-10 sm:text-sm font-poppins"
                placeholder="Email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#265871] focus:border-[#265871] focus:z-10 sm:text-sm font-poppins"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === watch('password') || 'Passwords do not match'
                })}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#265871] focus:border-[#265871] focus:z-10 sm:text-sm font-poppins"
                placeholder="Confirm Password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="tenantId" className="sr-only">
                Tenant ID
              </label>
              <input
                id="tenantId"
                type="text"
                {...register('tenantId', { required: 'Tenant ID is required' })}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#265871] focus:border-[#265871] focus:z-10 sm:text-sm font-poppins"
                placeholder="Tenant ID"
              />
              {errors.tenantId && (
                <p className="mt-1 text-sm text-red-500">{errors.tenantId.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="role" className="sr-only">
                Role
              </label>
              <select
                id="role"
                {...register('role', { required: 'Role is required' })}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-600 bg-white text-gray-900 placeholder-gray-500 rounded-b-md focus:outline-none focus:ring-2 focus:ring-[#265871] focus:border-[#265871] focus:z-10 sm:text-sm font-poppins"
              >
                <option value="">Select a role</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#265871] hover:bg-[#1d4355] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#265871] transition-colors duration-200 font-poppins"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-white bg-[#333333] px-3 py-2 rounded font-poppins">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-300 hover:text-blue-200">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 