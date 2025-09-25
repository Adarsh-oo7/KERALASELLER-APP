import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Text } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import ProductsScreen from './src/screens/products/ProductsScreen';
import OrdersScreen from './src/screens/orders/OrdersScreen';

const COLORS = {
  primary: '#0077B5',
  background: '#F3F2F0',
  surface: '#FFFFFF',
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orders: undefined;
  More: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function AuthStackScreen() {
  return (
    <AuthStack.Navigator 
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// Simple More/Profile Screen
function MoreScreen() {
  const { seller, logout } = useAuth();
  
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: COLORS.background, 
      padding: 20 
    }}>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: '700', 
        color: '#333', 
        marginBottom: 20 
      }}>
        Profile
      </Text>
      
      <View style={{ 
        backgroundColor: COLORS.surface, 
        padding: 20, 
        borderRadius: 12, 
        marginBottom: 20 
      }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
          {seller?.name || 'Seller Name'}
        </Text>
        <Text style={{ fontSize: 16, color: COLORS.primary, marginBottom: 4 }}>
          🏪 {seller?.shop_name || 'Your Shop'}
        </Text>
        <Text style={{ fontSize: 14, color: '#666' }}>
          📱 {seller?.phone || 'N/A'}
        </Text>
      </View>
      
      <View style={{ 
        backgroundColor: COLORS.surface, 
        borderRadius: 12, 
        overflow: 'hidden' 
      }}>
        <Text style={{ 
          backgroundColor: '#dc3545', 
          color: 'white', 
          textAlign: 'center', 
          padding: 16, 
          fontSize: 16, 
          fontWeight: '600' 
        }} onPress={() => logout()}>
          🚪 Logout
        </Text>
      </View>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Kerala Sellers',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{
          title: 'My Products',
          tabBarLabel: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: COLORS.background 
    }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ 
        marginTop: 12, 
        fontSize: 16, 
        color: '#666',
        fontWeight: '500' 
      }}>
        Loading...
      </Text>
    </View>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthStackScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
