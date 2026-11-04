import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../api/client';
import { ApiResponse, AuthResponse, User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('acxiom_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = localStorage.getItem('acxiom_refresh_token');
      if (refreshToken) {
        try {
          const resp = await api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken });
          const data = resp.data.data;
          setAccessToken(data.accessToken);
          localStorage.setItem('acxiom_refresh_token', data.refreshToken);

          const meResp = await api.get<ApiResponse<User>>('/auth/me');
          setUser(meResp.data.data);
          localStorage.setItem('acxiom_user', JSON.stringify(meResp.data.data));
        } catch (e) {
          setAccessToken(null);
          localStorage.removeItem('acxiom_refresh_token');
          localStorage.removeItem('acxiom_user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const resp = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    const data = resp.data.data;
    setAccessToken(data.accessToken);
    localStorage.setItem('acxiom_refresh_token', data.refreshToken);

    const meResp = await api.get<ApiResponse<User>>('/auth/me');
    setUser(meResp.data.data);
    localStorage.setItem('acxiom_user', JSON.stringify(meResp.data.data));
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('acxiom_refresh_token');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setAccessToken(null);
      localStorage.removeItem('acxiom_refresh_token');
      localStorage.removeItem('acxiom_user');
      setUser(null);
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('acxiom_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

