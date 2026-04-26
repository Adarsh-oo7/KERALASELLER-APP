import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';

const COLORS = { primary: '#2B4B39', background: '#F8F9FA' };

// Auth context — shared across the whole app
export type AuthContextType = {
  isAuthenticated: boolean;
  userType: string | null;
  login: (token: string, type: string, data?: any) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userType: null,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthStackScreen() {
  return (
    <AuthStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { checkAuthStatus(); }, []);

  const checkAuthStatus = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const storedUserType = await AsyncStorage.getItem('userType');
      if (accessToken && storedUserType) {
        setIsAuthenticated(true);
        setUserType(storedUserType);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, type: string, data?: any) => {
    await AsyncStorage.setItem('accessToken', token);
    await AsyncStorage.setItem('userType', type);
    if (data) await AsyncStorage.setItem('sellerData', JSON.stringify(data));
    setUserType(type);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([
      'accessToken', 'refreshToken', 'apiToken',
      'userPhone', 'userType', 'sellerId', 'sellerData',
    ]);
    setUserType(null);
    setIsAuthenticated(false);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <AuthContext.Provider value={{ isAuthenticated, userType, login, logout }}>
      <NavigationContainer>
        {isAuthenticated ? <MainTabNavigator /> : <AuthStackScreen />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
