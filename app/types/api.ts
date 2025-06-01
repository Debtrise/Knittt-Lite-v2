// Common API Types
import { AxiosError } from 'axios';

// API Error Types
export interface ApiError extends AxiosError {
  response?: {
    data: {
      error?: string;
      message?: string;
      errors?: string[];
    };
    status: number;
  };
}

// Common Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Config Types
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    userId: string;
    username: string;
    email: string;
    role: 'admin' | 'agent';
    tenantId: string;
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  tenantId: string;
  role: 'admin' | 'agent';
}

// API Function Types
export type ApiFunction<TRequest, TResponse> = (data: TRequest) => Promise<TResponse>;

// Common Data Types
export interface Metadata {
  [key: string]: string | number | boolean | null | undefined;
}

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface BaseEntity extends Timestamps {
  id: number;
  isActive?: boolean;
  metadata?: Metadata;
}

// HTTP Request Config
export interface RequestConfig extends Partial<ApiConfig> {
  params?: Record<string, any>;
  data?: unknown;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

// Webhook Types
export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

// File Upload Types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// Error Response Type
export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResponse {
  isValid: boolean;
  errors: ValidationError[];
} 