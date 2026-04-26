import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductFormScreen from '../screens/ProductFormScreen';
import StockEditScreen from '../screens/StockEditScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const ProductStack = createNativeStackNavigator();

const COLORS = {
  primary: '#2B4B39',
  primaryLight: '#3A5D47',
  inactive: '#9E9E9E',
  surface: '#FFFFFF',
  border: '#E0E0E0',
};

// Products has its own nested stack (List → Add → EditStock)
function ProductsStackScreen() {
  return (
    <ProductStack.Navigator screenOptions={{ headerShown: false }}>
      <ProductStack.Screen name="ProductList" component={ProductListScreen} />
      <ProductStack.Screen name="AddProduct" component={ProductFormScreen} />
      <ProductStack.Screen name="EditStock" component={StockEditScreen} />
    </ProductStack.Navigator>
  );
}

// Bottom Tab Navigator
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Products') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Products" component={ProductsStackScreen} options={{ title: 'Products' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// Custom Drawer Content
function CustomDrawerContent({ navigation }: any) {
  const menuItems = [
    { label: 'Dashboard', icon: 'home-outline', tab: 'Dashboard' },
    { label: 'Products', icon: 'cube-outline', tab: 'Products' },
    { label: 'Orders', icon: 'receipt-outline', tab: 'Orders' },
    { label: 'Profile', icon: 'person-outline', tab: 'Profile' },
  ];

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerAvatar}>
          <Ionicons name="storefront" size={32} color="#FFF" />
        </View>
        <Text style={styles.drawerTitle}>Kerala Sellers</Text>
        <Text style={styles.drawerSubtitle}>Seller Dashboard</Text>
      </View>

      <View style={styles.drawerMenu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.tab}
            style={styles.drawerItem}
            onPress={() => {
              // Navigate inside the Main tab drawer screen
              navigation.navigate('Main', { screen: item.tab });
              navigation.closeDrawer();
            }}
          >
            <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
            <Text style={styles.drawerItemText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.inactive} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Main: Drawer wraps Bottom Tabs
export default function MainTabNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 280 },
        overlayColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <Drawer.Screen name="Main" component={BottomTabs} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabLabel: { fontSize: 11, fontWeight: '500' },
  drawerContainer: { flex: 1, backgroundColor: COLORS.surface },
  drawerHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 55, paddingBottom: 24,
    paddingHorizontal: 20, alignItems: 'center',
  },
  drawerAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  drawerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  drawerSubtitle: { fontSize: 13, color: '#FFF', opacity: 0.8, marginTop: 2 },
  drawerMenu: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 10, marginBottom: 2,
  },
  drawerItemText: { flex: 1, fontSize: 15, color: '#333', marginLeft: 14 },
});
