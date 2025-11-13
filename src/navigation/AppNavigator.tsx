import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen'; // ✅ ADD THIS

// Main screens
import CreateShopScreen from '../screens/profile/CreateShopScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AddProductScreen from '../screens/products/AddProductScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import BillingScreen from '../screens/billing/BillingScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import StockManagementScreen from '../screens/stock/StockManagementScreen';
import PaymentsScreen from '../screens/payments/PaymentsScreen';

// Navigation components
import BottomTabs from './BottomTabs';
import TopBar from '../components/navigation/TopBar';
import DrawerLayout from '../components/navigation/DrawerLayout';

// Services
import AuthService from '../services/AuthService';
import NotificationService from '../services/NotificationService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ✅ AppState Context
interface AppStateContextType {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  currentTitle: string;
  setCurrentTitle: (title: string) => void;
  currentSubtitle?: string;
  setCurrentSubtitle: (subtitle?: string) => void;
  loadNotificationCount: () => void;
}

const AppStateContext = React.createContext<AppStateContextType>({
  isDrawerOpen: false,
  setIsDrawerOpen: () => {},
  notificationCount: 0,
  setNotificationCount: () => {},
  currentTitle: 'Kerala Sellers',
  setCurrentTitle: () => {},
  currentSubtitle: '',
  setCurrentSubtitle: () => {},
  loadNotificationCount: () => {},
});

// ✅ Component wrappers
const CreateShopScreenWrapper: React.FC<any> = (props) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <TopBar
        title="Store Setup"
        subtitle="Complete your profile"
        onMenuPress={() => setIsDrawerOpen(true)}
        showNotifications={false}
        backgroundColor="#ffffff"
      />
      <DrawerLayout isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <View style={styles.screenContainer}>
          <CreateShopScreen {...props} />
        </View>
      </DrawerLayout>
    </View>
  );
};

const OrderDetailsScreenWrapper: React.FC<any> = (props) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <TopBar
        title="Order Details"
        subtitle="View order information"
        onMenuPress={() => setIsDrawerOpen(true)}
        showNotifications={true}
        backgroundColor="#ffffff"
      />
      <DrawerLayout isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <View style={styles.screenContainer}>
          <OrderDetailsScreen {...props} />
        </View>
      </DrawerLayout>
    </View>
  );
};

const BillingScreenWrapper: React.FC<any> = (props) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <TopBar
        title="Local Billing"
        subtitle="Point of Sale"
        onMenuPress={() => setIsDrawerOpen(true)}
        showNotifications={true}
        backgroundColor="#ffffff"
      />
      <DrawerLayout isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <View style={styles.screenContainer}>
          <BillingScreen {...props} />
        </View>
      </DrawerLayout>
    </View>
  );
};

const StockManagementScreenWrapper: React.FC<any> = (props) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <TopBar
        title="📦 Stock Management"
        subtitle="Quick inventory updates • Real-time tracking"
        onMenuPress={() => setIsDrawerOpen(true)}
        showNotifications={true}
        backgroundColor="#ffffff"
      />
      
      <DrawerLayout isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <View style={styles.screenContainer}>
          <StockManagementScreen {...props} />
        </View>
      </DrawerLayout>
    </View>
  );
};

// ✅ Tab screen wrappers
const DashboardScreenWrapper = (props: any) => {
  const { setCurrentTitle, setCurrentSubtitle } = React.useContext(AppStateContext);
  
  React.useEffect(() => {
    setCurrentTitle('Dashboard');
    setCurrentSubtitle('Welcome back! 🌴');
  }, [setCurrentTitle, setCurrentSubtitle]);

  return (
    <View style={styles.screenContainer}>
      <DashboardScreen {...props} />
    </View>
  );
};

const ProductsScreenWrapper = (props: any) => {
  const { setCurrentTitle, setCurrentSubtitle } = React.useContext(AppStateContext);
  
  React.useEffect(() => {
    setCurrentTitle('Products');
    setCurrentSubtitle('Manage your inventory');
  }, [setCurrentTitle, setCurrentSubtitle]);

  return (
    <View style={styles.screenContainer}>
      <ProductsScreen {...props} />
    </View>
  );
};

const AddProductScreenWrapper = (props: any) => {
  const { setCurrentTitle, setCurrentSubtitle } = React.useContext(AppStateContext);
  
  React.useEffect(() => {
    setCurrentTitle('Add Product');
    setCurrentSubtitle('Create new listing');
  }, [setCurrentTitle, setCurrentSubtitle]);

  return (
    <View style={styles.screenContainer}>
      <AddProductScreen {...props} />
    </View>
  );
};

const OrdersScreenWrapper = (props: any) => {
  const { setCurrentTitle, setCurrentSubtitle } = React.useContext(AppStateContext);
  
  React.useEffect(() => {
    setCurrentTitle('Orders');
    setCurrentSubtitle('Customer orders');
  }, [setCurrentTitle, setCurrentSubtitle]);

  return (
    <View style={styles.screenContainer}>
      <OrdersScreen {...props} />
    </View>
  );
};

const HistoryScreenWrapper = (props: any) => {
  const { setCurrentTitle, setCurrentSubtitle } = React.useContext(AppStateContext);
  
  React.useEffect(() => {
    setCurrentTitle('History');
    setCurrentSubtitle('Sales records');
  }, [setCurrentTitle, setCurrentSubtitle]);

  return (
    <View style={styles.screenContainer}>
      <HistoryScreen {...props} />
    </View>
  );
};

const SubscriptionScreenWrapper = (props: any) => {
  const { setCurrentTitle, setCurrentSubtitle } = React.useContext(AppStateContext);
  
  React.useEffect(() => {
    setCurrentTitle('Subscription');
    setCurrentSubtitle('Manage your plan and unlock premium features');
  }, [setCurrentTitle, setCurrentSubtitle]);

  return (
    <View style={styles.screenContainer}>
      <SubscriptionScreen {...props} />
    </View>
  );
};

const NotificationsScreenWrapper = (props: any) => {
  const { setCurrentTitle, setCurrentSubtitle } = React.useContext(AppStateContext);
  
  React.useEffect(() => {
    setCurrentTitle('Notifications');
    setCurrentSubtitle('Stay updated with your business');
  }, [setCurrentTitle, setCurrentSubtitle]);

  return (
    <View style={styles.screenContainer}>
      <NotificationsScreen {...props} />
    </View>
  );
};

// ✅ Main Tab Navigator
const MainTabNavigator: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentTitle, setCurrentTitle] = useState('Dashboard');
  const [currentSubtitle, setCurrentSubtitle] = useState('Welcome back! 🌴');

  const loadNotificationCount = async (): Promise<void> => {
    try {
      const count = await NotificationService.getUnreadCount();
      setNotificationCount(count);
      console.log('🔔 AppNavigator: Notification count loaded:', count);
    } catch (error) {
      console.error('❌ AppNavigator: Failed to load notification count:', error);
      setNotificationCount(0);
    }
  };

  React.useEffect(() => {
    loadNotificationCount();
    const interval = setInterval(loadNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleDrawer = (): void => {
    console.log('🧭 Toggling drawer from TopBar');
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = (): void => {
    console.log('🧭 Closing drawer');
    setIsDrawerOpen(false);
  };

  return (
    <AppStateContext.Provider value={{
      isDrawerOpen,
      setIsDrawerOpen,
      notificationCount,
      setNotificationCount,
      currentTitle,
      setCurrentTitle,
      currentSubtitle,
      setCurrentSubtitle,
      loadNotificationCount,
    }}>
      <View style={styles.mainContainer}>
        <TopBar
          title={currentTitle}
          subtitle={currentSubtitle}
          onMenuPress={toggleDrawer}
          showNotifications={true}
          notificationCount={notificationCount}
          backgroundColor="#ffffff"
        />

        <DrawerLayout isOpen={isDrawerOpen} onClose={closeDrawer}>
          <View style={styles.tabContainer}>
            <Tab.Navigator
              tabBar={(props) => <BottomTabs {...props} />}
              screenOptions={{
                headerShown: false,
              }}
              initialRouteName="Dashboard"
            >
              <Tab.Screen name="Dashboard" component={DashboardScreenWrapper} />
              <Tab.Screen name="Products" component={ProductsScreenWrapper} />
              <Tab.Screen name="AddProduct" component={AddProductScreenWrapper} />
              <Tab.Screen name="Orders" component={OrdersScreenWrapper} />
              <Tab.Screen name="History" component={HistoryScreenWrapper} />
              
              <Tab.Screen 
                name="Subscription" 
                component={SubscriptionScreenWrapper}
                options={{
                  tabBarButton: () => null,
                }}
              />
              
              <Tab.Screen 
                name="Notifications" 
                component={NotificationsScreenWrapper}
                options={{
                  tabBarButton: () => null,
                }}
              />
            </Tab.Navigator>
          </View>
        </DrawerLayout>
      </View>
    </AppStateContext.Provider>
  );
};

// ✅ Main AppNavigator
const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const authCheckInterval = setInterval(async () => {
      try {
        const currentAuth = await AuthService.isAuthenticated();
        
        if (currentAuth !== isAuthenticated) {
          if (currentAuth) {
            console.log('🔐 User logged in successfully');
          } else {
            console.log('🚪 User logged out - navigation will be handled by AuthService');
          }
          setIsAuthenticated(currentAuth);
        }
        
      } catch (error) {
        console.error('❌ Auth check interval failed:', error);
        if (isAuthenticated) {
          console.log('🚪 Auth error detected, setting to logged out');
          setIsAuthenticated(false);
        }
      }
    }, 3000);

    return () => clearInterval(authCheckInterval);
  }, [isAuthenticated]);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      console.log('🔍 Initial authentication check...');
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      console.log('🔐 Initial authentication status:', authenticated ? 'Logged In' : 'Logged Out');
    } catch (error) {
      console.error('❌ Initial auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthChange = (authStatus: boolean): void => {
    console.log('🔄 Manual auth state change:', authStatus ? 'Logged In' : 'Logged Out');
    setIsAuthenticated(authStatus);
    
    if (!authStatus) {
      console.log('🧹 Cleaning up UI state after logout');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>
          Loading Kerala Sellers...
        </Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          {/* ✅ MAIN APP */}
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          
          {/* ✅ Modal screens */}
          <Stack.Screen name="CreateShop" component={CreateShopScreenWrapper} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreenWrapper} />
          <Stack.Screen name="Billing" component={BillingScreenWrapper} />
          <Stack.Screen name="StockManagement" component={StockManagementScreenWrapper} />
          <Stack.Screen name="Payments" component={PaymentsScreen} />
        </>
      ) : (
        <>
          {/* ✅ AUTH SCREENS */}
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen 
                {...props} 
                onLoginSuccess={() => handleAuthChange(true)} 
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Register" component={RegisterScreen} />
          {/* ✅ ADD THIS: ForgotPassword screen */}
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen}
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc'
  },
  loadingText: {
    marginTop: 16, 
    fontSize: 16, 
    color: '#6b7280',
    textAlign: 'center'
  },
});

export default AppNavigator;
export { AppStateContext };
