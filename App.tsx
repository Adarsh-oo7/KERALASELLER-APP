import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ConnectivityProvider } from './src/context/ConnectivityContext';
import { ErrorBoundary, LoadingState } from './src/components';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import MainTabs from './src/navigation/MainTabs';
import ProductFormScreen from './src/screens/products/ProductFormScreen';
import OrderDetailScreen from './src/screens/orders/OrderDetailScreen';
import BillingScreen from './src/screens/billing/BillingScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import BasicSettingsScreen from './src/screens/settings/BasicSettingsScreen';
import PaymentsScreen from './src/screens/payments/PaymentsScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import HistoryScreen from './src/screens/history/HistoryScreen';
import AnalyticsScreen from './src/screens/analytics/AnalyticsScreen';
import SubscriptionScreen from './src/screens/subscription/SubscriptionScreen';
import HomepageListingScreen from './src/screens/more/HomepageListingScreen';
import DeliveryChargesScreen from './src/screens/more/DeliveryChargesScreen';
import DeleteAccountScreen from './src/screens/more/DeleteAccountScreen';
import StaffScreen from './src/screens/more/StaffScreen';
import ExpensesScreen from './src/screens/more/ExpensesScreen';
import PurchasesScreen from './src/screens/more/PurchasesScreen';
import LocationsScreen from './src/screens/more/LocationsScreen';
import LoyaltyScreen from './src/screens/more/LoyaltyScreen';
import CustomersScreen from './src/screens/more/CustomersScreen';
import { COLORS } from './src/theme';
import type { AuthStackParamList, MainStackParamList } from './src/navigation/types';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.error,
  },
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

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

function MainStackScreen() {
  return (
    <MainStack.Navigator
      initialRouteName="Tabs"
      screenOptions={{ headerShown: false }}
    >
      <MainStack.Screen name="Tabs" component={MainTabs} />
      <MainStack.Screen name="ProductForm" component={ProductFormScreen} />
      <MainStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <MainStack.Screen name="Billing" component={BillingScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="BasicSettings" component={BasicSettingsScreen} />
      <MainStack.Screen name="Payments" component={PaymentsScreen} />
      <MainStack.Screen name="Notifications" component={NotificationsScreen} />
      <MainStack.Screen name="History" component={HistoryScreen} />
      <MainStack.Screen name="Analytics" component={AnalyticsScreen} />
      <MainStack.Screen name="Subscription" component={SubscriptionScreen} />
      <MainStack.Screen name="HomepageListing" component={HomepageListingScreen} />
      <MainStack.Screen name="DeliveryCharges" component={DeliveryChargesScreen} />
      <MainStack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <MainStack.Screen name="Staff" component={StaffScreen} />
      <MainStack.Screen name="Expenses" component={ExpensesScreen} />
      <MainStack.Screen name="Purchases" component={PurchasesScreen} />
      <MainStack.Screen name="Locations" component={LocationsScreen} />
      <MainStack.Screen name="Loyalty" component={LoyaltyScreen} />
      <MainStack.Screen name="Customers" component={CustomersScreen} />
    </MainStack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Loading…" />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <MainStackScreen /> : <AuthStackScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <ConnectivityProvider>
              <RootNavigator />
            </ConnectivityProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
