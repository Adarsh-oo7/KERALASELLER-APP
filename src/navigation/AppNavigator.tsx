// src/navigation/AppNavigator.tsx
import React, {
  useState, useEffect, useCallback, useRef, createContext, useContext,
} from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, StyleSheet, Platform } from 'react-native';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

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

// ── Constants ─────────────────────────────────────────────────────────────────

const NOTIFICATION_POLL_MS = 60_000; // 60s — was 30s, no need to hammer the API

// ── Context ───────────────────────────────────────────────────────────────────

interface AppStateContextType {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  currentTitle: string;
  setCurrentTitle: (title: string) => void;
  currentSubtitle?: string;
  setCurrentSubtitle: (subtitle?: string) => void;
  refreshNotifications: () => void;
}

export const AppStateContext = createContext<AppStateContextType>({
  isDrawerOpen: false,
  setIsDrawerOpen: () => {},
  notificationCount: 0,
  setNotificationCount: () => {},
  currentTitle: 'Kerala Sellers',
  setCurrentTitle: () => {},
  currentSubtitle: '',
  setCurrentSubtitle: () => {},
  refreshNotifications: () => {},
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Wraps any screen with TopBar + DrawerLayout.
 * Eliminates the 4 near-identical wrapper components you had before.
 */
const withTopBar = (
  WrappedScreen: React.ComponentType<any>,
  title: string,
  subtitle: string,
  showNotifications = true,
) => {
  const Wrapper: React.FC<any> = (props) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    return (
      <View style={s.fill}>
        <TopBar
          title={title}
          subtitle={subtitle}
          onMenuPress={() => setDrawerOpen(true)}
          showNotifications={showNotifications}
          backgroundColor="#ffffff"
        />
        <DrawerLayout isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <View style={s.fill}>
            <WrappedScreen {...props} />
          </View>
        </DrawerLayout>
      </View>
    );
  };
  Wrapper.displayName = `withTopBar(${title})`;
  return Wrapper;
};

// Stack-level screen wrappers (have their own local drawer state)
const CreateShopScreenWrapper    = withTopBar(CreateShopScreen,    'Store Setup',         'Complete your profile',                    false);
const OrderDetailsScreenWrapper  = withTopBar(OrderDetailsScreen,  'Order Details',       'View order information');
const BillingScreenWrapper       = withTopBar(BillingScreen,       'Local Billing',       'Point of Sale');
const StockManagementWrapper     = withTopBar(StockManagementScreen, 'Stock Management',  'Quick inventory updates');

// ── Tab screen wrappers — use context to set TopBar title ─────────────────────

interface TabWrapperConfig {
  title: string;
  subtitle: string;
  Screen: React.ComponentType<any>;
}

const makeTabWrapper = ({ title, subtitle, Screen }: TabWrapperConfig) => {
  const Wrapper: React.FC<any> = (props) => {
    const { setCurrentTitle, setCurrentSubtitle } = useContext(AppStateContext);
    useEffect(() => {
      setCurrentTitle(title);
      setCurrentSubtitle(subtitle);
    }, []); // ← intentionally empty — title only set once on mount
    return <Screen {...props} />;
  };
  Wrapper.displayName = `TabWrapper(${title})`;
  return Wrapper;
};

const DashboardWrapper      = makeTabWrapper({ title: 'Dashboard',     subtitle: 'Welcome back! 🌴',                       Screen: DashboardScreen });
const ProductsWrapper       = makeTabWrapper({ title: 'Products',      subtitle: 'Manage your inventory',                  Screen: ProductsScreen });
const AddProductWrapper     = makeTabWrapper({ title: 'Add Product',   subtitle: 'Create new listing',                     Screen: AddProductScreen });
const OrdersWrapper         = makeTabWrapper({ title: 'Orders',        subtitle: 'Customer orders',                        Screen: OrdersScreen });
const HistoryWrapper        = makeTabWrapper({ title: 'History',       subtitle: 'Sales records',                          Screen: HistoryScreen });
const SubscriptionWrapper   = makeTabWrapper({ title: 'Subscription',  subtitle: 'Manage your plan',                       Screen: SubscriptionScreen });
const NotificationsWrapper  = makeTabWrapper({ title: 'Notifications', subtitle: 'Stay updated with your business',        Screen: NotificationsScreen });

// ── Main Tab Navigator ────────────────────────────────────────────────────────

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const MainTabNavigator: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen]       = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentTitle, setCurrentTitle]       = useState('Dashboard');
  const [currentSubtitle, setCurrentSubtitle] = useState<string | undefined>('Welcome back! 🌴');

  // ── Notification polling — recursive setTimeout (no stacking) ────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setNotificationCount(count);
    } catch (e) {
      console.error('Notification fetch failed:', e);
    }
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const poll = async () => {
      await fetchNotifications();
      if (!cancelled) {
        timeoutId = setTimeout(poll, NOTIFICATION_POLL_MS);
      }
    };

    poll(); // fire immediately on mount

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [fetchNotifications]);

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
      refreshNotifications: fetchNotifications,
    }}>
      <View style={s.fill}>
        <TopBar
          title={currentTitle}
          subtitle={currentSubtitle}
          onMenuPress={() => setIsDrawerOpen(v => !v)}
          showNotifications
          notificationCount={notificationCount}
          backgroundColor="#ffffff"
        />
        <DrawerLayout isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <Tab.Navigator
            tabBar={(props) => <BottomTabs {...props} />}
            screenOptions={{ headerShown: false }}
            initialRouteName="Dashboard"
          >
            <Tab.Screen name="Dashboard"  component={DashboardWrapper} />
            <Tab.Screen name="Products"   component={ProductsWrapper} />
            <Tab.Screen name="AddProduct" component={AddProductWrapper} />
            <Tab.Screen name="Orders"     component={OrdersWrapper} />
            <Tab.Screen name="History"    component={HistoryWrapper} />
            <Tab.Screen
              name="Subscription"
              component={SubscriptionWrapper}
              options={{ tabBarButton: () => null }}
            />
            <Tab.Screen
              name="Notifications"
              component={NotificationsWrapper}
              options={{ tabBarButton: () => null }}
            />
          </Tab.Navigator>
        </DrawerLayout>
      </View>
    </AppStateContext.Provider>
  );
};

// ── App Navigator ─────────────────────────────────────────────────────────────

const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading]           = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ── Auth check: ONCE on mount ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    AuthService.isAuthenticated()
      .then(auth => { if (!cancelled) setIsAuthenticated(auth); })
      .catch(() => { if (!cancelled) setIsAuthenticated(false); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, []); // ← runs ONCE — no polling loop

  // ── Auth polling: every 30s, only check if state actually changed ─────────
  // Uses a ref for isAuthenticated so the interval closure is never stale
  const isAuthRef = useRef(isAuthenticated);
  useEffect(() => { isAuthRef.current = isAuthenticated; }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return; // don't poll until initial check is done

    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const poll = async () => {
      try {
        const current = await AuthService.isAuthenticated();
        // Only update state if it actually changed — prevents re-renders
        if (!cancelled && current !== isAuthRef.current) {
          setIsAuthenticated(current);
        }
      } catch {
        if (!cancelled && isAuthRef.current) {
          setIsAuthenticated(false);
        }
      }
      if (!cancelled) {
        timeoutId = setTimeout(poll, 30_000); // check every 30s, not 3s
      }
    };

    timeoutId = setTimeout(poll, 30_000); // first check after 30s, not immediately

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isLoading]); // ← only depends on isLoading, not isAuthenticated

  const handleAuthChange = useCallback((auth: boolean) => {
    setIsAuthenticated(auth);
  }, []);

  // ── Loading screen ────────────────────────────────────────────────────────

  if (isLoading) return (
    <View style={s.loadingWrap}>
      <View style={s.loadingIconWrap}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
      <Text style={s.loadingTitle}>Kerala Sellers</Text>
      <Text style={s.loadingSub}>Setting up your store...</Text>
    </View>
  );

  // ── Navigator ─────────────────────────────────────────────────────────────

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs"       component={MainTabNavigator} />
          <Stack.Screen name="CreateShop"     component={CreateShopScreenWrapper} />
          <Stack.Screen name="OrderDetails"   component={OrderDetailsScreenWrapper} />
          <Stack.Screen name="Billing"        component={BillingScreenWrapper} />
          <Stack.Screen name="StockManagement" component={StockManagementWrapper} />
          <Stack.Screen name="Payments"       component={PaymentsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen {...props} onLoginSuccess={() => handleAuthChange(true)} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Register"        component={RegisterScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false, animationEnabled: true }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill:         { flex: 1, backgroundColor: '#f8fafc' },
  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', gap: 12 },
  loadingIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  loadingTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  loadingSub:   { fontSize: 13, color: '#9ca3af' },
});

export default AppNavigator;
