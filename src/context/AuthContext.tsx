import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserProfile, logoutUser } from '../api/auth';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await getUserProfile();
      setUser(response.data.data || response.data);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    await refreshAuth();
  };

  const handleLogout = () => {
    // Clear state immediately
    setUser(null);
    
    // Clear storage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Navigate immediately to prevent flickering
    navigate('/login', { replace: true });
    
    // Optionally call API logout in background (non-blocking)
    logoutUser().catch(() => {
      // Ignore logout API errors since we've already signed out locally
      console.log('Background logout API call failed, but user is already signed out locally');
    });
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout: handleLogout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 