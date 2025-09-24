import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Import screens (you'll create these)
import LoginScreen from '../screens/LoginScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductFormScreen from '../screens/ProductFormScreen';
import StockEditScreen from '../screens/StockEditScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2D5A47',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Products" 
          component={ProductListScreen}
          options={{ title: 'My Products' }}
        />
        <Stack.Screen 
          name="AddProduct" 
          component={ProductFormScreen}
          options={{ title: 'Add Product' }}
        />
        <Stack.Screen 
          name="EditStock" 
          component={StockEditScreen}
          options={{ title: 'Edit Stock' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
