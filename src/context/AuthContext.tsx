import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; phone?: string; password: string; role?: string }) => Promise<void>;
  logout: () => void;
  quickLogin: (role: 'admin' | 'passenger') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = sessionStorage.getItem('railconnect_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.getCurrentUser();
        setUser(user);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        sessionStorage.removeItem('railconnect_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    sessionStorage.setItem('railconnect_token', data.token);
    setUser(data.user);
  };

  const register = async (payload: { name: string; email: string; phone?: string; password: string; role?: string }) => {
    const data = await api.register(payload);
    sessionStorage.setItem('railconnect_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    api.logout().catch(() => {});
    sessionStorage.removeItem('railconnect_token');
    setUser(null);
  };

  const quickLogin = async (role: 'admin' | 'passenger') => {
    if (role === 'admin') {
      await login('admin@railconnect.com', 'admin123');
    } else {
      await login('rahul.sharma@example.com', 'password123');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, quickLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
