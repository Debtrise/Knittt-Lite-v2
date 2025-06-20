import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create local API instance for Next.js API routes
const localApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add auth token to localApi requests
localApi.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: (username: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', { username, password }),
  register: (data: RegisterRequest) => 
    api.post<ApiResponse<LoginResponse>>('/auth/register', data),
  adminLogin: () =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', { 
      username: 'admin', 
      password: 'admin123' 
    }),
};

export { localApi };
export default api; 