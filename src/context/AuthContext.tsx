import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';
import { api, getToken, removeToken, getCachedUser, setCachedUser } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nama: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from cache if token is present to eliminate flicker on refresh
  const [user, setUser] = useState<User | null>(() => {
    const token = getToken();
    if (token) {
      return getCachedUser();
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // Only show full loader if token exists but cached user is missing
    const token = getToken();
    const cached = getCachedUser();
    return Boolean(token && !cached);
  });

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.user) {
        setUser(res.user);
        setCachedUser(res.user);
      } else {
        setUser(null);
        removeToken();
      }
    } catch (err) {
      console.warn('[Auth check status]:', err);
      // If server explicitly returned 401, removeToken was already called
      if (!getToken()) {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
      removeToken();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.user) {
        setUser(res.user);
        setCachedUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    nama: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    setIsLoading(true);
    try {
      const res = await api.register(nama, email, password, confirmPassword);
      if (res.user) {
        setUser(res.user);
        setCachedUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
