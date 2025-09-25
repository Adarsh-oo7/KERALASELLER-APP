import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SellerData {
  id: number;
  name: string;
  shop_name: string;
  phone: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  seller: SellerData | null;
  login: (loginData: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
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
  const [seller, setSeller] = useState<SellerData | null>(null);

  const checkAuthStatus = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const userType = await AsyncStorage.getItem('userType');
      const sellerId = await AsyncStorage.getItem('sellerId');
      
      const isLoggedIn = !!(accessToken && userType === 'seller' && sellerId);
      
      if (isLoggedIn) {
        // Try to get stored seller data
        const storedSellerData = await AsyncStorage.getItem('sellerData');
        if (storedSellerData) {
          const sellerData = JSON.parse(storedSellerData);
          setSeller(sellerData);
        }
        
        console.log('✅ User is authenticated via AuthContext');
        setIsAuthenticated(true);
      } else {
        console.log('❌ User is not authenticated via AuthContext');
        setIsAuthenticated(false);
        setSeller(null);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setIsAuthenticated(false);
      setSeller(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (loginData: any) => {
    try {
      // Extract data from login response
      const { access_token, refresh_token, api_token, seller } = loginData;
      
      // Store all necessary data
      await AsyncStorage.multiSet([
        ['accessToken', access_token],
        ['refreshToken', refresh_token || ''],
        ['apiToken', api_token || ''],
        ['userType', 'seller'],
        ['sellerId', seller.id.toString()],
        ['sellerData', JSON.stringify(seller)], // Store seller data for quick access
      ]);
      
      // Update context state
      setSeller(seller);
      setIsAuthenticated(true);
      
      console.log('✅ Seller logged in via AuthContext:', {
        id: seller.id,
        name: seller.name,
        shopName: seller.shop_name,
      });
    } catch (error) {
      console.error('❌ Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear all authentication data
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'apiToken',
        'userPhone',
        'userType',
        'sellerId',
        'sellerData',
      ]);
      
      // Update context state
      setIsAuthenticated(false);
      setSeller(null);
      
      console.log('✅ User logged out via AuthContext');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        seller,
        login, 
        logout, 
        checkAuthStatus 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
