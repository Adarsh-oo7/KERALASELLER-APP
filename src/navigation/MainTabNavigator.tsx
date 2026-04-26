import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Lazy import screens that may not exist yet — prevents crash if missing
let ProductListScreen: any, ProductFormScreen: any, StockEditScreen: any;
try { ProductListScreen = require('../screens/products/ProductListScreen').default; } catch { ProductListScreen = () => null; }
try { ProductFormScreen = require('../screens/products/ProductFormScreen').default; } catch { ProductFormScreen = () => null; }
try { StockEditScreen = require('../screens/products/StockEditScreen').default; } catch { StockEditScreen = () => null; }

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const ProductStack = createNativeStackNavigator();

const COLORS = {
  primary: '#2B4B39',
  surface: '#FFFFFF',
  textSecondary: '#86868B',
  border: '#E5E5E7',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠', Products: '📦', Orders: '🛍️', Profile: '👤',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[name] || '●'}
    </Text>
  );
}

function ProductStackScreen() {
  return (
    <ProductStack.Navigator screenOptions={{ headerShown: false }}>
      <ProductStack.Screen name="ProductList" component={ProductListScreen} />
      <ProductStack.Screen name="ProductForm" component={ProductFormScreen} />
      <ProductStack.Screen name="StockEdit" component={StockEditScreen} />
    </ProductStack.Navigator>
  );
}

function TabNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Products" component={ProductStackScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile">
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function MainTabNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.textSecondary,
        drawerStyle: { backgroundColor: COLORS.surface, width: 280 },
      }}
    >
      <Drawer.Screen name="Main">
        {() => <TabNavigator onLogout={onLogout} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}
