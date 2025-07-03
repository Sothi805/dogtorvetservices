// src/api/auth.ts
import axios from './axios'; // ✅ default import

export const loginUser = (credentials: { email: string; password: string }) => {
  return axios.post('/auth/login', credentials);
};

export const logoutUser = () => {
  return axios.post('/auth/logout');
};

export const getUserProfile = () => {
  return axios.get('/auth/me');
};

export const refreshToken = () => {
  return axios.post('/auth/refresh');
};

// Utility function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

// Utility function to logout and redirect
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
};
