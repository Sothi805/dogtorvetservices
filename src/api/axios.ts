// src/api/axios.ts
import axios from 'axios';

// Use environment variable with fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.endsWith('/v1') 
  ? import.meta.env.VITE_API_BASE_URL 
  : 'http://localhost:8000/api/v1';

// Log the API base URL for debugging
console.log('API Base URL:', API_BASE_URL);
console.log('Environment variables:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
  timeout: 60000, // 60 second timeout for cold start render times
});

// Request interceptor to add token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔐 Request interceptor - Token:', token ? 'Present' : 'Missing');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Added Authorization header');
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors and auto-refresh tokens
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.status, response.config.url);
    console.log('🔍 Original response data:', response.data);
    
    // Only flatten for non-paginated endpoints
    const url = response.config.url || '';
    const isPaginated =
      url.includes('/appointments/?') || // Only GET appointments (list) is paginated
      url.includes('/invoices') ||
      url.includes('/pets') ||
      url.includes('/users');

    if (response.data && response.data.success !== undefined) {
      if (!isPaginated) {
        // Flatten for non-paginated endpoints
        const modifiedResponse = {
          ...response,
          data: response.data.data
        };
        console.log('🔍 Modified response data (flattened):', modifiedResponse.data);
        return modifiedResponse;
      } else {
        // For paginated endpoints, extract the data field from APIResponse
      const modifiedResponse = {
        ...response,
        data: response.data.data
      };
        console.log('🔍 Paginated endpoint, returning extracted data:', modifiedResponse.data);
      return modifiedResponse;
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data
    });
    
    // Log CORS and network errors for debugging
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
      console.error('Network/CORS Error:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
    }
    
    // Don't redirect to login if we're already on the login page
    const isLoginPage = window.location.pathname === '/login';
    
    // Check for authentication errors (401 or 403)
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry && !isLoginPage) {
      originalRequest._retry = true;
      
      // Check if we have a refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, clear tokens and let AuthContext handle navigation
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return Promise.reject(error);
      }
      
      try {
        // Try to refresh the token - updated for new API structure
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          }
        );
        
        // Handle the new APIResponse format
        const responseData = refreshResponse.data.data || refreshResponse.data;
        const newToken = responseData.access_token;
        const newRefreshToken = responseData.refresh_token;
        
        if (newToken) {
          localStorage.setItem('token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and let AuthContext handle navigation
        console.log('Session expired. Tokens cleared.');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
