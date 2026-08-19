import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearSellerSession, onAuthExpired } from '../lib/session';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const [[, token], [, refresh], [, userType]] = await AsyncStorage.multiGet([
        'accessToken',
        'refreshToken',
        'userType',
      ]);
      setIsAuthenticated(userType === 'seller' && Boolean(token || refresh));
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string) => {
    await AsyncStorage.multiSet([
      ['accessToken', token],
      ['userType', 'seller'],
    ]);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await clearSellerSession();
    } finally {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    return onAuthExpired(() => setIsAuthenticated(false));
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, refresh: checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};
