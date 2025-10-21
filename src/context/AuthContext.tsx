import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// ✅ CORRECT:
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { api } from '../config/api';

// ✅ Enhanced SellerData interface for Kerala Sellers
interface SellerData {
  id: number;
  name: string;
  shop_name: string;
  phone: string;
  email: string;
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

// ✅ Network state interface
interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
}

// ✅ Performance metrics interface
interface PerformanceMetrics {
  loginTime: number;
  apiResponseTime: number;
  lastSyncTime: string | null;
}

// ✅ Enhanced AuthContextType
interface AuthContextType {
  // Core authentication
  isAuthenticated: boolean;
  isLoading: boolean;
  seller: SellerData | null;
  login: (loginData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  setIsAuthenticated: (value: boolean) => void;
  setSeller: (seller: SellerData | null) => void;
  
  // Enhanced features
  isFirstTime: boolean;
  authError: string | null;
  retryCount: number;
  connectionStatus: 'online' | 'offline' | 'checking';
  networkState: NetworkState;
  
  // Security & biometrics
  biometricSupported: boolean;
  biometricEnabled: boolean;
  authenticateWithBiometrics: () => Promise<boolean>;
  toggleBiometric: (enabled: boolean) => Promise<boolean>;
  
  // Advanced methods
  refreshUserData: () => Promise<void>;
  updateSellerProfile: (profileData: Partial<SellerData>) => Promise<boolean>;
  clearAuthError: () => void;
  testConnection: () => Promise<boolean>;
  getAuthHeaders: () => Promise<Record<string, string>>;
  isTokenExpired: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  performWithRetry: <T>(operation: () => Promise<T>, maxRetries?: number, delay?: number) => Promise<T>;
  
  // Performance monitoring
  performanceMetrics: PerformanceMetrics;
  trackPerformance: (operation: string, startTime: number) => void;
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
  BIOMETRIC_ENABLED: 'biometricEnabled',
  CRITICAL_DATA: 'criticalData',
} as const;

// ✅ Secure storage keys
const SECURE_KEYS = {
  REFRESH_TOKEN: 'secure_refresh_token',
  API_TOKEN: 'secure_api_token',
  BIOMETRIC_TOKEN: 'secure_biometric_token',
} as const;

// ✅ Create context
const AuthContext = createContext<AuthContextType | null>(null);

// ✅ useAuth hook with error handling
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

// ✅ Enhanced secure storage helpers
const secureStorage = {
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('❌ Secure storage set failed:', error);
      // Fallback to AsyncStorage for non-critical data
      await AsyncStorage.setItem(`secure_${key}`, value);
    }
  },
  
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('❌ Secure storage get failed:', error);
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem(`secure_${key}`);
    }
  },
  
  deleteItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('❌ Secure storage delete failed:', error);
      await AsyncStorage.removeItem(`secure_${key}`);
    }
  }
};

// ✅ Enhanced AuthProvider
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Core state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [seller, setSeller] = useState<SellerData | null>(null);
  
  // Enhanced state
  const [isFirstTime, setIsFirstTime] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  
  // Network state
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: null,
    isInternetReachable: null,
    type: 'unknown'
  });
  
  // Security state
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    loginTime: 0,
    apiResponseTime: 0,
    lastSyncTime: null,
  });

  // ✅ Performance tracking
  const trackPerformance = useCallback((operation: string, startTime: number) => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ ${operation} took ${duration}ms`);
    
    setPerformanceMetrics(prev => ({
      ...prev,
      [`${operation}Time`]: duration,
      lastSyncTime: new Date().toISOString(),
    }));
  }, []);

  // ✅ Clear auth error helper
  const clearAuthError = useCallback(() => {
    setAuthError(null);
    setRetryCount(0);
  }, []);

  // ✅ Enhanced retry logic with exponential backoff
  const performWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        
        if (attempt > 0) {
          console.log(`✅ Operation succeeded on attempt ${attempt + 1}`);
          setRetryCount(0);
        }
        
        trackPerformance('retry_operation', startTime);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries - 1) {
          const backoffDelay = delay * Math.pow(2, attempt);
          console.log(`⏳ Retrying in ${backoffDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }
    
    setRetryCount(maxRetries);
    throw lastError!;
  }, [trackPerformance]);

  // ✅ Test connection to backend
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setConnectionStatus('checking');
      const startTime = Date.now();
      
      const isConnected = await api.testConnection();
      
      trackPerformance('connection_test', startTime);
      setConnectionStatus(isConnected ? 'online' : 'offline');
      return isConnected;
    } catch (error) {
      console.error('❌ AuthContext: Connection test failed:', error);
      setConnectionStatus('offline');
      return false;
    }
  }, [trackPerformance]);

  // ✅ Enhanced token validation
  const isTokenExpired = useCallback(async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) return true;

      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('⚠️ Invalid token format');
        return true;
      }

      try {
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Check if token expires within the next 5 minutes
        const bufferTime = 5 * 60;
        const isExpiring = payload.exp < (currentTime + bufferTime);
        
        if (isExpiring) {
          console.log('⏰ Token is expiring soon, needs refresh');
        }
        
        return payload.exp < currentTime;
      } catch (decodeError) {
        console.error('❌ Error decoding token:', decodeError);
        return true;
      }
    } catch (error) {
      console.error('❌ Error checking token expiry:', error);
      return true;
    }
  }, []);

  // ✅ Enhanced token refresh
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 AuthContext: Refreshing token...');
      const startTime = Date.now();
      
      const refreshTokenValue = await secureStorage.getItem(SECURE_KEYS.REFRESH_TOKEN);
      
      if (!refreshTokenValue) {
        console.log('❌ AuthContext: No refresh token available');
        return false;
      }

      const response = await performWithRetry(async () => {
        return await api.refreshToken(refreshTokenValue);
      });
      
      if (response && response.access_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
        
        if (response.refresh_token) {
          await secureStorage.setItem(SECURE_KEYS.REFRESH_TOKEN, response.refresh_token);
        }
        
        trackPerformance('token_refresh', startTime);
        console.log('✅ AuthContext: Token refreshed successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ AuthContext: Token refresh failed:', error);
      setAuthError('Session expired. Please login again.');
    }
    return false;
  }, [performWithRetry, trackPerformance]);

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

  // ✅ Biometric support check
  const checkBiometricSupport = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supported = hasHardware && isEnrolled;
      
      setBiometricSupported(supported);
      
      if (supported) {
        const biometricPref = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
        setBiometricEnabled(biometricPref === 'true');
      }
      
      console.log('🔐 Biometric support:', { hasHardware, isEnrolled, supported });
    } catch (error) {
      console.error('❌ Biometric check failed:', error);
      setBiometricSupported(false);
    }
  }, []);

  // ✅ Authenticate with biometrics
  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      if (!biometricSupported) return false;
      
      const startTime = Date.now();
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Kerala Sellers',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });
      
      trackPerformance('biometric_auth', startTime);
      return result.success;
    } catch (error) {
      console.error('❌ Biometric authentication failed:', error);
      return false;
    }
  }, [biometricSupported, trackPerformance]);

  // ✅ Toggle biometric authentication
  const toggleBiometric = useCallback(async (enabled: boolean) => {
    try {
      if (enabled && biometricSupported) {
        const authenticated = await authenticateWithBiometrics();
        if (!authenticated) return false;
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
      setBiometricEnabled(enabled);
      return true;
    } catch (error) {
      console.error('❌ Error toggling biometric:', error);
      return false;
    }
  }, [biometricSupported, authenticateWithBiometrics]);

  // ✅ Save critical data when app goes to background
  const saveCriticalData = useCallback(async () => {
    try {
      const criticalData = {
        lastActiveTime: new Date().toISOString(),
        sellerId: seller?.id,
        authStatus: isAuthenticated,
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.CRITICAL_DATA, JSON.stringify(criticalData));
      console.log('💾 Critical data saved');
    } catch (error) {
      console.error('❌ Failed to save critical data:', error);
    }
  }, [seller?.id, isAuthenticated]);

  // ✅ Enhanced check auth status
  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      console.log('🔍 AuthContext: Checking authentication status...');
      setConnectionStatus('checking');
      const startTime = Date.now();
      
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
            console.log('✅ AuthContext: Kerala seller authenticated');
            console.log('🏪 Shop:', sellerData.shop_name, '| Seller:', sellerData.name);
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
      
      trackPerformance('auth_check', startTime);
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
  }, [isTokenExpired, refreshToken, clearAuthError, logout, trackPerformance]);

  // ✅ Enhanced login
  const login = useCallback(async (loginData: any): Promise<boolean> => {
    try {
      console.log('🔑 AuthContext: Processing Kerala seller login...');
      setIsLoading(true);
      clearAuthError();
      const startTime = Date.now();
      
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
      
      const currentTime = new Date().toISOString();
      
      // Store tokens securely
      if (refresh_token) {
        await secureStorage.setItem(SECURE_KEYS.REFRESH_TOKEN, refresh_token);
      }
      if (api_token) {
        await secureStorage.setItem(SECURE_KEYS.API_TOKEN, api_token);
      }
      
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, access_token],
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
      
      trackPerformance('login', startTime);
      
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
  }, [clearAuthError, trackPerformance]);

  // ✅ Enhanced logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('🚪 AuthContext: Logging out Kerala seller...');
      const startTime = Date.now();
      
      // Clear secure storage
      await Promise.all([
        secureStorage.deleteItem(SECURE_KEYS.REFRESH_TOKEN),
        secureStorage.deleteItem(SECURE_KEYS.API_TOKEN),
        secureStorage.deleteItem(SECURE_KEYS.BIOMETRIC_TOKEN),
      ]);
      
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.USER_PHONE,
        STORAGE_KEYS.USER_TYPE,
        STORAGE_KEYS.SELLER_ID,
        STORAGE_KEYS.SELLER_DATA,
        STORAGE_KEYS.LAST_LOGIN,
        STORAGE_KEYS.CRITICAL_DATA,
      ]);
      
      setIsAuthenticated(false);
      setSeller(null);
      setConnectionStatus('offline');
      clearAuthError();
      
      trackPerformance('logout', startTime);
      console.log('✅ AuthContext: Kerala seller logged out successfully');
    } catch (error) {
      console.error('❌ AuthContext: Error during logout:', error);
      throw error;
    }
  }, [clearAuthError, trackPerformance]);

  // ✅ Refresh user data from server
  const refreshUserData = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 AuthContext: Refreshing seller data...');
      const startTime = Date.now();
      
      const response = await performWithRetry(async () => {
        return await api.getProfile();
      });
      
      if (response && response.seller) {
        const updatedSellerData = {
          ...seller,
          ...response.seller,
        };
        
        setSeller(updatedSellerData);
        await AsyncStorage.setItem(STORAGE_KEYS.SELLER_DATA, JSON.stringify(updatedSellerData));
        
        trackPerformance('data_refresh', startTime);
        console.log('✅ AuthContext: Seller data refreshed');
      }
    } catch (error) {
      console.error('❌ AuthContext: Error refreshing seller data:', error);
      setAuthError('Failed to refresh seller data');
    }
  }, [seller, performWithRetry, trackPerformance]);

  // ✅ Update seller profile
  const updateSellerProfile = useCallback(async (profileData: Partial<SellerData>): Promise<boolean> => {
    try {
      console.log('📝 AuthContext: Updating seller profile...');
      const startTime = Date.now();
      
      const response = await performWithRetry(async () => {
        return await api.updateProfile(profileData);
      });
      
      if (response && response.seller) {
        const updatedSellerData = {
          ...seller,
          ...response.seller,
        };
        
        setSeller(updatedSellerData);
        await AsyncStorage.setItem(STORAGE_KEYS.SELLER_DATA, JSON.stringify(updatedSellerData));
        
        trackPerformance('profile_update', startTime);
        console.log('✅ AuthContext: Seller profile updated');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ AuthContext: Error updating seller profile:', error);
      setAuthError('Failed to update profile');
      return false;
    }
  }, [seller, performWithRetry, trackPerformance]);

  // ✅ Network monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('📡 Network state changed:', state);
      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type
      });
      
      setConnectionStatus(
        state.isConnected && state.isInternetReachable ? 'online' : 'offline'
      );
    });

    return () => unsubscribe();
  }, []);

  // ✅ App state management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        checkAuthStatus();
        testConnection();
      } else if (nextAppState === 'background') {
        saveCriticalData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [checkAuthStatus, testConnection, saveCriticalData]);

  // ✅ Initialize on mount
  useEffect(() => {
    const initializeAuth = async () => {
      await checkBiometricSupport();
      await testConnection();
      await checkAuthStatus();
    };
    
    initializeAuth();
  }, [checkAuthStatus, testConnection, checkBiometricSupport]);

  // ✅ Enhanced context value
  const contextValue = React.useMemo<AuthContextType>(() => ({
    // Core authentication
    isAuthenticated,
    isLoading,
    seller,
    login,
    logout,
    checkAuthStatus,
    setIsAuthenticated,
    setSeller,
    
    // Enhanced features
    isFirstTime,
    authError,
    retryCount,
    connectionStatus,
    networkState,
    
    // Security & biometrics
    biometricSupported,
    biometricEnabled,
    authenticateWithBiometrics,
    toggleBiometric,
    
    // Advanced methods
    refreshUserData,
    updateSellerProfile,
    clearAuthError,
    testConnection,
    getAuthHeaders,
    isTokenExpired,
    refreshToken,
    performWithRetry,
    
    // Performance monitoring
    performanceMetrics,
    trackPerformance,
  }), [
    isAuthenticated, isLoading, seller, login, logout, checkAuthStatus,
    isFirstTime, authError, retryCount, connectionStatus, networkState,
    biometricSupported, biometricEnabled, authenticateWithBiometrics, toggleBiometric,
    refreshUserData, updateSellerProfile, clearAuthError, testConnection,
    getAuthHeaders, isTokenExpired, refreshToken, performWithRetry,
    performanceMetrics, trackPerformance
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Set displayName
AuthProvider.displayName = 'AuthProvider';

// ✅ Enhanced exports
export { AuthProvider, STORAGE_KEYS, SECURE_KEYS };
export type { SellerData, AuthContextType, NetworkState, PerformanceMetrics };
export default AuthContext;
