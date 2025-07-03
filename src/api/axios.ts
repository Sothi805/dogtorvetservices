// src/api/axios.ts
import axios from 'axios';

// Use environment variable with fallback to production API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dogtorvet-api.onrender.com/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false, // Set to false for CORS
});

// Request interceptor to add token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors and auto-refresh tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't redirect to login if we're already on the login page
    const isLoginPage = window.location.pathname === '/login';
    
    // Check for authentication errors (401 or 403)
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry && !isLoginPage) {
      originalRequest._retry = true;
      
      // Check if we have a refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, immediately redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        // Try to refresh the token
        const refreshResponse = await axios.post(
          `${API_BASE_URL.replace('/api', '')}/api/auth/refresh`, 
          {
            refresh_token: refreshToken
          }
        );
        
        const data = refreshResponse.data.data || refreshResponse.data;
        const newToken = data.token || data.access_token;
        const newRefreshToken = data.refresh_token;
        
        if (newToken) {
          localStorage.setItem('token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, immediately redirect to login
        console.log('Session expired. Redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
