import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabs from './BottomTabs';

// ✅ UPDATED: Import your existing screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import AddProductScreen from '../screens/products/AddProductScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import HistoryScreen from '../screens/history/HistoryScreen'; // ✅ CHANGED: Using HistoryScreen instead of AnalyticsScreen

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabs {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="AddProduct" component={AddProductScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
