import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (tokens: { accessToken: string; refreshToken: string; sellerId?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token    = await AsyncStorage.getItem('accessToken');
        const userType = await AsyncStorage.getItem('userType');
        setIsAuthenticated(!!(token && userType === 'seller'));
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = async ({ accessToken, refreshToken, sellerId }: {
    accessToken: string;
    refreshToken: string;
    sellerId?: string;
  }) => {
    const pairs: [string, string][] = [
      ['accessToken',  accessToken],
      ['refreshToken', refreshToken],
      ['userType',     'seller'],
    ];
    if (sellerId) pairs.push(['sellerId', sellerId]);
    await AsyncStorage.multiSet(pairs);
    setIsAuthenticated(true);   // ← triggers navigator switch automatically
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userType', 'sellerId', 'userPhone']);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
