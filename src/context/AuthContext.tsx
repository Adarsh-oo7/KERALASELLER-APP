import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config/api';

// ✅ SellerData interface for any Kerala seller
interface SellerData {
  id: number;
  name: string;
  shop_name: string;
  phone: string;
  email: string;
  // ✅ Additional fields for Kerala sellers
  business_type?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  verification_status?: 'pending' | 'verified' | 'rejected';
  subscription_plan?: 'basic' | 'pro' | 'enterprise';
  created_at?: string;
  last_login?: string;
  is_active?: boolean;
  profile_picture?: string;
  whatsapp_number?: string;
  instagram_handle?: string;
  facebook_page?: string;
}

// ✅ AuthContextType for Kerala Sellers platform
interface AuthContextType {
  // ✅ Your existing properties
  isAuthenticated: boolean;
  isLoading: boolean;
  seller: SellerData | null;
  login: (loginData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  setIsAuthenticated: (value: boolean) => void;
  setSeller: (seller: SellerData | null) => void;
  
  // ✅ Enhanced properties for Kerala Sellers platform
  isFirstTime: boolean;
  authError: string | null;
  retryCount: number;
  connectionStatus: 'online' | 'offline' | 'checking';
  
  // ✅ Enhanced methods
  refreshUserData: () => Promise<void>;
  updateSellerProfile: (profileData: Partial<SellerData>) => Promise<boolean>;
  clearAuthError: () => void;
  testConnection: () => Promise<boolean>;
  getAuthHeaders: () => Promise<Record<string, string>>;
  isTokenExpired: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
}

// ✅ Storage keys for consistency
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  API_TOKEN: 'apiToken',
  USER_TYPE: 'userType',
  SELLER_ID: 'sellerId',
  SELLER_DATA: 'sellerData',
  USER_PHONE: 'userPhone',
  FIRST_TIME: 'isFirstTime',
  LAST_LOGIN: 'lastLogin',
} as const;

// ✅ Create context with proper null check
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// ✅ AuthProvider for Kerala Sellers platform
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // ✅ Your existing state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [seller, setSeller] = useState<SellerData | null>(null);
  
  // ✅ Enhanced state for Kerala Sellers platform
  const [isFirstTime, setIsFirstTime] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // ✅ Clear auth error helper
  const clearAuthError = useCallback(() => {
    setAuthError(null);
    setRetryCount(0);
  }, []);

  // ✅ Test connection to backend
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setConnectionStatus('checking');
      const isConnected = await api.testConnection();
      setConnectionStatus(isConnected ? 'online' : 'offline');
      return isConnected;
    } catch (error) {
      console.error('❌ AuthContext: Connection test failed:', error);
      setConnectionStatus('offline');
      return false;
    }
  }, []);

  // ✅ Check if token is expired
  const isTokenExpired = useCallback(async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) return true;

      // Simple token expiry check
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return tokenData.exp < currentTime;
    } catch (error) {
      console.error('❌ AuthContext: Error checking token expiry:', error);
      return true;
    }
  }, []);

  // ✅ Refresh access token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 AuthContext: Refreshing token...');
      const refreshTokenValue = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshTokenValue) {
        console.log('❌ AuthContext: No refresh token available');
        return false;
      }

      // Call your API to refresh token
      const response = await api.testAuth();
      
      if (response && response.access_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
        if (response.refresh_token) {
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
        }
        console.log('✅ AuthContext: Token refreshed successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ AuthContext: Token refresh failed:', error);
    }
    return false;
  }, []);

  // ✅ Get auth headers for API calls
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }, []);

  // ✅ Enhanced check auth status with retry logic
  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      console.log('🔍 AuthContext: Checking authentication status...');
      setConnectionStatus('checking');
      
      const [accessToken, userType, sellerId, storedSellerData, firstTimeFlag] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_TYPE),
        AsyncStorage.getItem(STORAGE_KEYS.SELLER_ID),
        AsyncStorage.getItem(STORAGE_KEYS.SELLER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.FIRST_TIME)
      ]);
      
      setIsFirstTime(firstTimeFlag !== 'false');
      
      const isLoggedIn = !!(accessToken && userType === 'seller' && sellerId);
      
      if (isLoggedIn) {
        // ✅ Check if token is expired
        const expired = await isTokenExpired();
        if (expired) {
          console.log('⏰ AuthContext: Token expired, attempting refresh...');
          const refreshed = await refreshToken();
          if (!refreshed) {
            console.log('❌ AuthContext: Token refresh failed, logging out...');
            await logout();
            return;
          }
        }
        
        setIsAuthenticated(true);
        setConnectionStatus('online');
        
        if (storedSellerData) {
          try {
            const sellerData: SellerData = JSON.parse(storedSellerData);
            setSeller(sellerData);
            console.log('✅ AuthContext: Kerala seller authenticated, data loaded');
            console.log('🏪 AuthContext: Shop -', sellerData.shop_name, '| Seller -', sellerData.name);
          } catch (parseError) {
            console.error('❌ AuthContext: Error parsing seller data:', parseError);
            setSeller(null);
          }
        }
        
        clearAuthError();
      } else {
        console.log('❌ AuthContext: Seller is not authenticated');
        setIsAuthenticated(false);
        setSeller(null);
        setConnectionStatus('offline');
      }
    } catch (error) {
      console.error('❌ AuthContext: Error checking auth status:', error);
      setAuthError('Failed to check authentication status');
      setIsAuthenticated(false);
      setSeller(null);
      setConnectionStatus('offline');
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [isTokenExpired, refreshToken, clearAuthError, logout]);

  // ✅ Enhanced login for any Kerala seller
  const login = useCallback(async (loginData: any): Promise<boolean> => {
    try {
      console.log('🔑 AuthContext: Processing Kerala seller login...');
      setIsLoading(true);
      clearAuthError();
      
      if (!loginData || !loginData.access_token || !loginData.seller) {
        console.error('❌ AuthContext: Invalid login data provided');
        setAuthError('Invalid login response from server');
        return false;
      }

      const { access_token, refresh_token, api_token, seller: sellerData } = loginData;
      
      if (!sellerData.id || !sellerData.name) {
        console.error('❌ AuthContext: Invalid seller data in login response');
        setAuthError('Invalid seller information received');
        return false;
      }
      
      // ✅ Enhanced data storage
      const currentTime = new Date().toISOString();
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, access_token],
        [STORAGE_KEYS.REFRESH_TOKEN, refresh_token || ''],
        [STORAGE_KEYS.API_TOKEN, api_token || ''],
        [STORAGE_KEYS.USER_TYPE, 'seller'],
        [STORAGE_KEYS.SELLER_ID, sellerData.id.toString()],
        [STORAGE_KEYS.SELLER_DATA, JSON.stringify({
          ...sellerData,
          last_login: currentTime,
        })],
        [STORAGE_KEYS.USER_PHONE, sellerData.phone || ''],
        [STORAGE_KEYS.FIRST_TIME, 'false'],
        [STORAGE_KEYS.LAST_LOGIN, currentTime],
      ]);
      
      setSeller({
        ...sellerData,
        last_login: currentTime,
      });
      setIsAuthenticated(true);
      setConnectionStatus('online');
      setIsFirstTime(false);
      
      console.log('✅ AuthContext: Kerala seller logged in successfully:', {
        id: sellerData.id,
        name: sellerData.name,
        shopName: sellerData.shop_name,
        phone: sellerData.phone,
        loginTime: currentTime,
      });
      
      return true;
    } catch (error) {
      console.error('❌ AuthContext: Error during login:', error);
      setAuthError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthError]);

  // ✅ Enhanced logout for Kerala sellers
  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('🚪 AuthContext: Logging out Kerala seller...');
      
      // ✅ Call logout API if available
      try {
        // await api.logout(); // Uncomment when you have logout endpoint
      } catch (apiError) {
        console.warn('⚠️ AuthContext: Logout API call failed, continuing with local logout');
      }
      
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.API_TOKEN,
        STORAGE_KEYS.USER_PHONE,
        STORAGE_KEYS.USER_TYPE,
        STORAGE_KEYS.SELLER_ID,
        STORAGE_KEYS.SELLER_DATA,
        STORAGE_KEYS.LAST_LOGIN,
      ]);
      
      setIsAuthenticated(false);
      setSeller(null);
      setConnectionStatus('offline');
      clearAuthError();
      
      console.log('✅ AuthContext: Kerala seller logged out successfully');
    } catch (error) {
      console.error('❌ AuthContext: Error during logout:', error);
      throw error;
    }
  }, [clearAuthError]);

  // ✅ Refresh user data from server
  const refreshUserData = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 AuthContext: Refreshing seller data...');
      const response = await api.getProfile();
      
      if (response && response.seller) {
        const updatedSellerData = {
          ...seller,
          ...response.seller,
        };
        
        setSeller(updatedSellerData);
        await AsyncStorage.setItem(STORAGE_KEYS.SELLER_DATA, JSON.stringify(updatedSellerData));
        console.log('✅ AuthContext: Seller data refreshed');
      }
    } catch (error) {
      console.error('❌ AuthContext: Error refreshing seller data:', error);
      setAuthError('Failed to refresh seller data');
    }
  }, [seller]);

  // ✅ Update seller profile
  const updateSellerProfile = useCallback(async (profileData: Partial<SellerData>): Promise<boolean> => {
    try {
      console.log('📝 AuthContext: Updating seller profile...');
      
      const response = await api.updateProfile(profileData);
      
      if (response && response.seller) {
        const updatedSellerData = {
          ...seller,
          ...response.seller,
        };
        
        setSeller(updatedSellerData);
        await AsyncStorage.setItem(STORAGE_KEYS.SELLER_DATA, JSON.stringify(updatedSellerData));
        console.log('✅ AuthContext: Seller profile updated');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ AuthContext: Error updating seller profile:', error);
      setAuthError('Failed to update profile');
      return false;
    }
  }, [seller]);

  // ✅ Enhanced useEffect with connection testing
  useEffect(() => {
    const initializeAuth = async () => {
      await testConnection();
      await checkAuthStatus();
    };
    
    initializeAuth();
  }, [checkAuthStatus, testConnection]);

  // ✅ Enhanced context value with all new features
  const contextValue = React.useMemo<AuthContextType>(() => ({
    // ✅ Your existing properties
    isAuthenticated,
    isLoading,
    seller,
    login,
    logout,
    checkAuthStatus,
    setIsAuthenticated,
    setSeller,
    
    // ✅ Enhanced properties
    isFirstTime,
    authError,
    retryCount,
    connectionStatus,
    
    // ✅ Enhanced methods
    refreshUserData,
    updateSellerProfile,
    clearAuthError,
    testConnection,
    getAuthHeaders,
    isTokenExpired,
    refreshToken,
  }), [
    isAuthenticated, isLoading, seller, login, logout, checkAuthStatus,
    isFirstTime, authError, retryCount, connectionStatus,
    refreshUserData, updateSellerProfile, clearAuthError, testConnection,
    getAuthHeaders, isTokenExpired, refreshToken
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Set displayName AFTER component definition
AuthProvider.displayName = 'AuthProvider';

// ✅ Enhanced exports
export { AuthProvider, STORAGE_KEYS };
export type { SellerData, AuthContextType };
export default AuthContext;
