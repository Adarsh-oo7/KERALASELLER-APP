// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabs from './BottomTabs';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProductsScreen   from '../screens/products/ProductsScreen';
import AddProductScreen from '../screens/products/AddProductScreen';
import OrdersScreen     from '../screens/orders/OrdersScreen';
import HistoryScreen    from '../screens/history/HistoryScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    tabBar={props => <BottomTabs {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Dashboard"  component={DashboardScreen} />
    <Tab.Screen name="Products"   component={ProductsScreen} />
    <Tab.Screen
      name="AddProduct"
      component={AddProductScreen}
      options={{ unmountOnBlur: true }}   {/* ← form resets on every visit */}
    />
    <Tab.Screen name="Orders"     component={OrdersScreen} />
    <Tab.Screen name="History"    component={HistoryScreen} />
  </Tab.Navigator>
);

export default TabNavigator;
