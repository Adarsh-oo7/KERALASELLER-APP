
// import React, {
//   useState, useEffect, useCallback, useRef, createContext, useContext,
// } from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

// // Auth screens
// import LoginScreen           from '../screens/auth/LoginScreen';
// import RegisterScreen        from '../screens/auth/RegisterScreen';
// import ForgotPasswordScreen  from '../screens/auth/ForgotPasswordScreen';

// // Main screens
// import CreateShopScreen      from '../screens/profile/CreateShopScreen';
// import DashboardScreen       from '../screens/dashboard/DashboardScreen';
// import AddProductScreen      from '../screens/products/AddProductScreen';
// import ProductsScreen        from '../screens/products/ProductsScreen';
// import OrdersScreen          from '../screens/orders/OrdersScreen';
// import OrderDetailsScreen    from '../screens/orders/OrderDetailsScreen';
// import BillingScreen         from '../screens/billing/BillingScreen';
// import HistoryScreen         from '../screens/history/HistoryScreen';
// import SubscriptionScreen    from '../screens/subscription/SubscriptionScreen';
// import NotificationsScreen   from '../screens/notifications/NotificationsScreen';
// import StockManagementScreen from '../screens/stock/StockManagementScreen';
// import PaymentsScreen        from '../screens/payments/PaymentsScreen';

// // Navigation components
// import BottomTabs   from './BottomTabs';
// import TopBar       from '../components/navigation/TopBar';
// import DrawerLayout from '../components/navigation/DrawerLayout';

// // Services
// import AuthService           from '../services/AuthService';
// import NotificationService   from '../services/NotificationService';

// const NOTIFICATION_POLL_MS = 60_000;

// // ── Context ───────────────────────────────────────────────────────────────────

// interface AppStateContextType {
//   isDrawerOpen:         boolean;
//   setIsDrawerOpen:      (open: boolean) => void;
//   notificationCount:    number;
//   setNotificationCount: (count: number) => void;
//   currentTitle:         string;
//   setCurrentTitle:      (title: string) => void;
//   currentSubtitle?:     string;
//   setCurrentSubtitle:   (subtitle?: string) => void;
//   refreshNotifications: () => void;
// }

// export const AppStateContext = createContext<AppStateContextType>({
//   isDrawerOpen:         false,
//   setIsDrawerOpen:      () => {},
//   notificationCount:    0,
//   setNotificationCount: () => {},
//   currentTitle:         'Kerala Sellers',
//   setCurrentTitle:      () => {},
//   currentSubtitle:      '',
//   setCurrentSubtitle:   () => {},
//   refreshNotifications: () => {},
// });

// // ── Tab title wrappers ────────────────────────────────────────────────────────
// // These ONLY update the shared TopBar title via context.
// // No local drawer, no local TopBar — the single TopBar lives in MainTabNavigator.

// interface TabWrapperConfig {
//   title:    string;
//   subtitle: string;
//   Screen:   React.ComponentType<any>;
// }

// const makeTabWrapper = ({ title, subtitle, Screen }: TabWrapperConfig) => {
//   const Wrapper: React.FC<any> = (props) => {
//     const { setCurrentTitle, setCurrentSubtitle } = useContext(AppStateContext);

//     // Use a ref so we only call setters when values actually change —
//     // prevents the brief title-flash on fast tab switches
//     const titleSet = useRef(false);
//     useEffect(() => {
//       if (!titleSet.current) {
//         setCurrentTitle(title);
//         setCurrentSubtitle(subtitle);
//         titleSet.current = true;
//       }
//     }, []);

//     // Reset on unmount so next mount always sets title fresh
//     useEffect(() => () => { titleSet.current = false; }, []);

//     return <Screen {...props} />;
//   };
//   Wrapper.displayName = `TabWrapper(${title})`;
//   return Wrapper;
// };

// const DashboardWrapper     = makeTabWrapper({ title: 'Dashboard',     subtitle: 'Welcome back! 🌴',                Screen: DashboardScreen      });
// const ProductsWrapper      = makeTabWrapper({ title: 'Products',      subtitle: 'Manage your inventory',          Screen: ProductsScreen       });
// const AddProductWrapper    = makeTabWrapper({ title: 'Add Product',   subtitle: 'Create new listing',             Screen: AddProductScreen     });
// const OrdersWrapper        = makeTabWrapper({ title: 'Orders',        subtitle: 'Customer orders',                Screen: OrdersScreen         });
// const HistoryWrapper       = makeTabWrapper({ title: 'Sales History', subtitle: 'Stock & sales records',          Screen: HistoryScreen        });
// const SubscriptionWrapper  = makeTabWrapper({ title: 'Subscription',  subtitle: 'Manage your plan',               Screen: SubscriptionScreen   });
// const NotificationsWrapper = makeTabWrapper({ title: 'Notifications', subtitle: 'Stay updated',                   Screen: NotificationsScreen  });

// // ── Stack screen wrapper (for screens OUTSIDE the tab navigator) ──────────────
// // Uses the GLOBAL drawer from context — no second drawer instance.

// interface StackWrapperConfig {
//   title:             string;
//   subtitle:          string;
//   Screen:            React.ComponentType<any>;
//   showNotifications?: boolean;
// }

// const makeStackWrapper = ({ title, subtitle, Screen, showNotifications = true }: StackWrapperConfig) => {
//   const Wrapper: React.FC<any> = (props) => {
//     const { isDrawerOpen, setIsDrawerOpen, notificationCount } = useContext(AppStateContext);
//     return (
//       <View style={s.fill}>
//         <TopBar
//           title={title}
//           subtitle={subtitle}
//           onMenuPress={() => setIsDrawerOpen(!isDrawerOpen)}
//           showNotifications={showNotifications}
//           notificationCount={notificationCount}
//           backgroundColor="#ffffff"
//         />
//         {/* ✅ Uses global drawer state — no double drawer */}
//         <DrawerLayout isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
//           <View style={s.fill}>
//             <Screen {...props} />
//           </View>
//         </DrawerLayout>
//       </View>
//     );
//   };
//   Wrapper.displayName = `StackWrapper(${title})`;
//   return Wrapper;
// };

// const CreateShopWrapper       = makeStackWrapper({ title: 'Store Setup',       subtitle: 'Complete your profile',        Screen: CreateShopScreen,       showNotifications: false });
// const OrderDetailsWrapper     = makeStackWrapper({ title: 'Order Details',     subtitle: 'View order information',       Screen: OrderDetailsScreen      });
// const BillingWrapper          = makeStackWrapper({ title: 'Local Billing',     subtitle: 'Point of Sale',                Screen: BillingScreen           });
// const StockManagementWrapper  = makeStackWrapper({ title: 'Stock Management',  subtitle: 'Quick inventory updates',      Screen: StockManagementScreen   });

// // ── Main Tab Navigator ────────────────────────────────────────────────────────

// const Stack = createStackNavigator();
// const Tab   = createBottomTabNavigator();

// const MainTabNavigator: React.FC = () => {
//   const [isDrawerOpen,       setIsDrawerOpen]       = useState(false);
//   const [notificationCount,  setNotificationCount]  = useState(0);
//   const [currentTitle,       setCurrentTitle]       = useState('Dashboard');
//   const [currentSubtitle,    setCurrentSubtitle]    = useState<string | undefined>('Welcome back! 🌴');

//   // ── Notification polling ──────────────────────────────────────────────────
//   const fetchNotifications = useCallback(async () => {
//     try {
//       const count = await NotificationService.getUnreadCount();
//       setNotificationCount(count);
//     } catch {}
//   }, []);

//   useEffect(() => {
//     let cancelled = false;
//     let timeoutId: ReturnType<typeof setTimeout>;
//     const poll = async () => {
//       await fetchNotifications();
//       if (!cancelled) timeoutId = setTimeout(poll, NOTIFICATION_POLL_MS);
//     };
//     poll();
//     return () => { cancelled = true; clearTimeout(timeoutId); };
//   }, [fetchNotifications]);

//   return (
//     <AppStateContext.Provider value={{
//       isDrawerOpen,
//       setIsDrawerOpen,
//       notificationCount,
//       setNotificationCount,
//       currentTitle,
//       setCurrentTitle,
//       currentSubtitle,
//       setCurrentSubtitle,
//       refreshNotifications: fetchNotifications,
//     }}>
//       {/* ✅ Single TopBar — not duplicated per screen */}
//       <View style={s.fill}>
//         <TopBar
//           title={currentTitle}
//           subtitle={currentSubtitle}
//           onMenuPress={() => setIsDrawerOpen(v => !v)}
//           showNotifications
//           notificationCount={notificationCount}
//           backgroundColor="#ffffff"
//         />
//         {/* ✅ Single DrawerLayout — wraps the entire tab area */}
//         <DrawerLayout isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
//           <Tab.Navigator
//             tabBar={(props) => <BottomTabs {...props} />}
//             screenOptions={{ headerShown: false }}
//             initialRouteName="Dashboard"
//           >
//             <Tab.Screen name="Dashboard"  component={DashboardWrapper}     />
//             <Tab.Screen name="Products"   component={ProductsWrapper}      />
//             <Tab.Screen
//               name="AddProduct"
//               component={AddProductWrapper}
//               options={{ unmountOnBlur: true }}
//             />
//             <Tab.Screen name="Orders"     component={OrdersWrapper}        />
//             <Tab.Screen name="History"    component={HistoryWrapper}       />
//             <Tab.Screen
//               name="Subscription"
//               component={SubscriptionWrapper}
//               options={{ tabBarButton: () => null }}
//             />
//             <Tab.Screen
//               name="Notifications"
//               component={NotificationsWrapper}
//               options={{ tabBarButton: () => null }}
//             />
//           </Tab.Navigator>
//         </DrawerLayout>
//       </View>
//     </AppStateContext.Provider>
//   );
// };

// // ── App Navigator ─────────────────────────────────────────────────────────────

// const AppNavigator: React.FC = () => {
//   const [isLoading,       setIsLoading]       = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   useEffect(() => {
//     let cancelled = false;
//     AuthService.isAuthenticated()
//       .then(auth  => { if (!cancelled) setIsAuthenticated(auth); })
//       .catch(()   => { if (!cancelled) setIsAuthenticated(false); })
//       .finally(() => { if (!cancelled) setIsLoading(false); });
//     return () => { cancelled = true; };
//   }, []);

//   const isAuthRef = useRef(isAuthenticated);
//   useEffect(() => { isAuthRef.current = isAuthenticated; }, [isAuthenticated]);

//   useEffect(() => {
//     if (isLoading) return;
//     let cancelled = false;
//     let timeoutId: ReturnType<typeof setTimeout>;
//     const poll = async () => {
//       try {
//         const current = await AuthService.isAuthenticated();
//         if (!cancelled && current !== isAuthRef.current) setIsAuthenticated(current);
//       } catch {
//         if (!cancelled && isAuthRef.current) setIsAuthenticated(false);
//       }
//       if (!cancelled) timeoutId = setTimeout(poll, 30_000);
//     };
//     timeoutId = setTimeout(poll, 30_000);
//     return () => { cancelled = true; clearTimeout(timeoutId); };
//   }, [isLoading]);

//   const handleAuthChange = useCallback((auth: boolean) => setIsAuthenticated(auth), []);

//   if (isLoading) return (
//     <View style={s.loadingWrap}>
//       <View style={s.loadingIconWrap}>
//         <ActivityIndicator size="large" color="#3b82f6" />
//       </View>
//       <Text style={s.loadingTitle}>Kerala Sellers</Text>
//       <Text style={s.loadingSub}>Setting up your store...</Text>
//     </View>
//   );

//   return (
//     // ✅ Stack screens (CreateShop, OrderDetails, etc.) are wrapped with
//     // AppStateContext.Provider via MainTabNavigator — they access the SAME
//     // drawer & notification state, no second drawer spawned.
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       {isAuthenticated ? (
//         <>
//           <Stack.Screen name="MainTabs"        component={MainTabNavigator}      />
//           {/* Stack screens use makeStackWrapper — pulls drawer from context */}
//           <Stack.Screen name="CreateShop"      component={CreateShopWrapper}     />
//           <Stack.Screen name="OrderDetails"    component={OrderDetailsWrapper}   />
//           <Stack.Screen name="Billing"         component={BillingWrapper}        />
//           <Stack.Screen name="StockManagement" component={StockManagementWrapper}/>
//           <Stack.Screen name="Payments"        component={PaymentsScreen}        />
//         </>
//       ) : (
//         <>
//           <Stack.Screen name="Login">
//             {(props) => <LoginScreen {...props} onLoginSuccess={() => handleAuthChange(true)} />}
//           </Stack.Screen>
//           <Stack.Screen name="Register"       component={RegisterScreen}        />
//           <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen}  />
//         </>
//       )}
//     </Stack.Navigator>
//   );
// };

// // ── Styles ────────────────────────────────────────────────────────────────────

// const s = StyleSheet.create({
//   fill:            { flex: 1, backgroundColor: '#f1f5f9' },
//   loadingWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', gap: 12 },
//   loadingIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
//   loadingTitle:    { fontSize: 20, fontWeight: '900', color: '#111827' },
//   loadingSub:      { fontSize: 13, color: '#9ca3af' },
// });










// // src/navigation/AppNavigator.tsx
// import React, {
//   useState, useEffect, useCallback, useRef, useContext,
// } from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { ActivityIndicator, View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';

// import { AppStateContext } from '../context/AppStateContext';
// export { AppStateContext } from '../context/AppStateContext';

// import LoginScreen          from '../screens/auth/LoginScreen';
// import RegisterScreen       from '../screens/auth/RegisterScreen';
// import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
// import CreateShopScreen      from '../screens/profile/CreateShopScreen';
// import DashboardScreen       from '../screens/dashboard/DashboardScreen';
// import AddProductScreen      from '../screens/products/AddProductScreen';
// import ProductsScreen        from '../screens/products/ProductsScreen';
// import OrdersScreen          from '../screens/orders/OrdersScreen';
// import OrderDetailsScreen    from '../screens/orders/OrderDetailsScreen';
// import BillingScreen         from '../screens/billing/BillingScreen';
// import HistoryScreen         from '../screens/history/HistoryScreen';
// import SubscriptionScreen    from '../screens/subscription/SubscriptionScreen';
// import NotificationsScreen   from '../screens/notifications/NotificationsScreen';
// import StockManagementScreen from '../screens/stock/StockManagementScreen';
// import PaymentsScreen        from '../screens/payments/PaymentsScreen';

// import BottomTabs   from './BottomTabs';
// import TopBar       from '../components/navigation/TopBar';
// import DrawerLayout from '../components/navigation/DrawerLayout';

// import AuthService         from '../services/AuthService';
// import NotificationService from '../services/NotificationService';
// import { AUTH_EVENTS }     from '../constants/events';

// const NOTIFICATION_POLL_MS  = 60_000;
// const TOPBAR_HIDDEN_SCREENS = new Set(['AddProduct']);

// // ── Tab wrappers ──────────────────────────────────────────────────────────────

// interface TabWrapperConfig {
//   title:    string;
//   subtitle: string;
//   Screen:   React.ComponentType<any>;
// }

// const makeTabWrapper = ({ title, subtitle, Screen }: TabWrapperConfig) => {
//   const Wrapper: React.FC<any> = (props) => {
//     const { setCurrentTitle, setCurrentSubtitle } = useContext(AppStateContext);
//     const titleSet = useRef(false);
//     useEffect(() => {
//       if (!titleSet.current) {
//         setCurrentTitle(title);
//         setCurrentSubtitle(subtitle);
//         titleSet.current = true;
//       }
//     }, []);
//     useEffect(() => () => { titleSet.current = false; }, []);
//     return <Screen {...props} />;
//   };
//   Wrapper.displayName = `TabWrapper(${title})`;
//   return Wrapper;
// };

// const DashboardWrapper     = makeTabWrapper({ title: 'Dashboard',     subtitle: 'Welcome back! 🌴',       Screen: DashboardScreen      });
// const ProductsWrapper      = makeTabWrapper({ title: 'Products',      subtitle: 'Manage your inventory',  Screen: ProductsScreen       });
// const AddProductWrapper    = makeTabWrapper({ title: 'Add Product',   subtitle: 'Create new listing',     Screen: AddProductScreen     });
// const OrdersWrapper        = makeTabWrapper({ title: 'Orders',        subtitle: 'Customer orders',        Screen: OrdersScreen         });
// const HistoryWrapper       = makeTabWrapper({ title: 'Sales History', subtitle: 'Stock & sales records',  Screen: HistoryScreen        });
// const SubscriptionWrapper  = makeTabWrapper({ title: 'Subscription',  subtitle: 'Manage your plan',       Screen: SubscriptionScreen   });
// const NotificationsWrapper = makeTabWrapper({ title: 'Notifications', subtitle: 'Stay updated',           Screen: NotificationsScreen  });

// // ── Stack wrappers ────────────────────────────────────────────────────────────

// interface StackWrapperConfig {
//   title:              string;
//   subtitle:           string;
//   Screen:             React.ComponentType<any>;
//   showNotifications?: boolean;
// }

// const makeStackWrapper = ({ title, subtitle, Screen, showNotifications = true }: StackWrapperConfig) => {
//   const Wrapper: React.FC<any> = (props) => {
//     // ✅ Now accessible — AppStateContext.Provider is at AppNavigator level
//     const { isDrawerOpen, setIsDrawerOpen, notificationCount } = useContext(AppStateContext);
//     return (
//       <View style={s.fill}>
//         <TopBar
//           title={title}
//           subtitle={subtitle}
//           onMenuPress={() => setIsDrawerOpen(v => !v)}
//           showNotifications={showNotifications}
//           notificationCount={notificationCount}
//           backgroundColor="#ffffff"
//         />
//         <DrawerLayout isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
//           <View style={s.fill}>
//             <Screen {...props} />
//           </View>
//         </DrawerLayout>
//       </View>
//     );
//   };
//   Wrapper.displayName = `StackWrapper(${title})`;
//   return Wrapper;
// };

// const CreateShopWrapper      = makeStackWrapper({ title: 'Store Setup',      subtitle: 'Complete your profile',   Screen: CreateShopScreen,     showNotifications: false });
// const OrderDetailsWrapper    = makeStackWrapper({ title: 'Order Details',    subtitle: 'View order information',  Screen: OrderDetailsScreen    });
// const BillingWrapper         = makeStackWrapper({ title: 'Local Billing',    subtitle: 'Point of Sale',           Screen: BillingScreen         });
// const StockManagementWrapper = makeStackWrapper({ title: 'Stock Management', subtitle: 'Quick inventory updates', Screen: StockManagementScreen });

// // ── Tab Navigator ─────────────────────────────────────────────────────────────

// const Tab = createBottomTabNavigator();

// const MainTabNavigator: React.FC = () => {
//   // ✅ Consume context from parent — no longer providing it here
//   const {
//     isDrawerOpen, setIsDrawerOpen,
//     notificationCount, currentTitle, currentSubtitle,
//   } = useContext(AppStateContext);

//   const [activeTab, setActiveTab] = useState('Dashboard');
//   const hideTopBar = TOPBAR_HIDDEN_SCREENS.has(activeTab);

//   return (
//     <View style={s.fill}>
//       {!hideTopBar && (
//         <TopBar
//           title={currentTitle}
//           subtitle={currentSubtitle}
//           onMenuPress={() => setIsDrawerOpen(v => !v)}
//           showNotifications
//           notificationCount={notificationCount}
//           backgroundColor="#ffffff"
//         />
//       )}
//       <DrawerLayout isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
//         <Tab.Navigator
//           tabBar={(props) => <BottomTabs {...props} />}
//           screenOptions={{ headerShown: false }}
//           initialRouteName="Dashboard"
//           screenListeners={{
//             state: (e) => {
//               const routes = (e.data as any)?.state?.routes;
//               const index  = (e.data as any)?.state?.index;
//               if (routes && index !== undefined) {
//                 setActiveTab(routes[index]?.name ?? 'Dashboard');
//               }
//             },
//           }}
//         >
//           <Tab.Screen name="Dashboard"     component={DashboardWrapper}     />
//           <Tab.Screen name="Products"      component={ProductsWrapper}      />
//           <Tab.Screen
//             name="AddProduct"
//             component={AddProductWrapper}
//             options={{ unmountOnBlur: true, tabBarStyle: { display: 'none' } }}
//           />
//           <Tab.Screen name="Orders"        component={OrdersWrapper}        />
//           <Tab.Screen name="History"       component={HistoryWrapper}       />
//           <Tab.Screen name="Subscription"  component={SubscriptionWrapper}  options={{ tabBarButton: () => null }} />
//           <Tab.Screen name="Notifications" component={NotificationsWrapper} options={{ tabBarButton: () => null }} />
//         </Tab.Navigator>
//       </DrawerLayout>
//     </View>
//   );
// };

// // ── App Navigator ─────────────────────────────────────────────────────────────

// const Stack = createStackNavigator();

// const AppNavigator: React.FC = () => {
//   const [isLoading,       setIsLoading]       = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   // ✅ Shared drawer + notification state lives HERE — accessible by ALL screens
//   const [isDrawerOpen,      setIsDrawerOpen]      = useState(false);
//   const [notificationCount, setNotificationCount] = useState(0);
//   const [currentTitle,      setCurrentTitle]      = useState('Dashboard');
//   const [currentSubtitle,   setCurrentSubtitle]   = useState<string | undefined>('Welcome back! 🌴');

//   const fetchNotifications = useCallback(async () => {
//     try {
//       const count = await NotificationService.getUnreadCount();
//       setNotificationCount(count);
//     } catch {}
//   }, []);

//   // Notification polling — only when authenticated
//   useEffect(() => {
//     if (!isAuthenticated) return;
//     let cancelled = false;
//     let timeoutId: ReturnType<typeof setTimeout>;
//     const poll = async () => {
//       await fetchNotifications();
//       if (!cancelled) timeoutId = setTimeout(poll, NOTIFICATION_POLL_MS);
//     };
//     poll();
//     return () => { cancelled = true; clearTimeout(timeoutId); };
//   }, [isAuthenticated, fetchNotifications]);

//   // Auth init
//   useEffect(() => {
//     let cancelled = false;
//     AuthService.isAuthenticated()
//       .then(auth  => { if (!cancelled) setIsAuthenticated(auth); })
//       .catch(()   => { if (!cancelled) setIsAuthenticated(false); })
//       .finally(() => { if (!cancelled) setIsLoading(false); });
//     return () => { cancelled = true; };
//   }, []);

//   // Auth event listeners
//   useEffect(() => {
//     const onLogout = () => setIsAuthenticated(false);
//     const onLogin  = () => setIsAuthenticated(true);
//     const logoutSub = DeviceEventEmitter.addListener(AUTH_EVENTS.LOGOUT, onLogout);
//     const loginSub  = DeviceEventEmitter.addListener(AUTH_EVENTS.LOGIN,  onLogin);
//     return () => { logoutSub.remove(); loginSub.remove(); };
//   }, []);

//   const isAuthRef = useRef(isAuthenticated);
//   useEffect(() => { isAuthRef.current = isAuthenticated; }, [isAuthenticated]);

//   // Periodic auth check
//   useEffect(() => {
//     if (isLoading) return;
//     let cancelled = false;
//     let timeoutId: ReturnType<typeof setTimeout>;
//     const poll = async () => {
//       try {
//         const current = await AuthService.isAuthenticated();
//         if (!cancelled && current !== isAuthRef.current) setIsAuthenticated(current);
//       } catch {
//         if (!cancelled && isAuthRef.current) setIsAuthenticated(false);
//       }
//       if (!cancelled) timeoutId = setTimeout(poll, 30_000);
//     };
//     timeoutId = setTimeout(poll, 30_000);
//     return () => { cancelled = true; clearTimeout(timeoutId); };
//   }, [isLoading]);

//   if (isLoading) return (
//     <View style={s.loadingWrap}>
//       <View style={s.loadingIconWrap}>
//         <ActivityIndicator size="large" color="#3b82f6" />
//       </View>
//       <Text style={s.loadingTitle}>Kerala Sellers</Text>
//       <Text style={s.loadingSub}>Setting up your store...</Text>
//     </View>
//   );

//   return (
//     // ✅ Provider wraps the entire Stack — all screens can access drawer state
//     <AppStateContext.Provider value={{
//       isDrawerOpen,
//       setIsDrawerOpen,
//       notificationCount,
//       setNotificationCount,
//       currentTitle,
//       setCurrentTitle,
//       currentSubtitle,
//       setCurrentSubtitle,
//       refreshNotifications: fetchNotifications,
//     }}>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         {isAuthenticated ? (
//           <>
//             <Stack.Screen name="MainTabs"        component={MainTabNavigator}       />
//             <Stack.Screen name="CreateShop"      component={CreateShopWrapper}      />
//             <Stack.Screen name="OrderDetails"    component={OrderDetailsWrapper}    />
//             <Stack.Screen name="Billing"         component={BillingWrapper}         />
//             <Stack.Screen name="StockManagement" component={StockManagementWrapper} />
//             <Stack.Screen name="Payments"        component={PaymentsScreen}         />
//           </>
//         ) : (
//           <>
//             <Stack.Screen name="Login">
//               {(props) => (
//                 <LoginScreen
//                   {...props}
//                   onLoginSuccess={() => DeviceEventEmitter.emit(AUTH_EVENTS.LOGIN)}
//                 />
//               )}
//             </Stack.Screen>
//             <Stack.Screen name="Register"       component={RegisterScreen}       />
//             <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
//           </>
//         )}
//       </Stack.Navigator>
//     </AppStateContext.Provider>
//   );
// };

// const s = StyleSheet.create({
//   fill:            { flex: 1, backgroundColor: '#f1f5f9' },
//   loadingWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', gap: 12 },
//   loadingIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
//   loadingTitle:    { fontSize: 20, fontWeight: '900', color: '#111827' },
//   loadingSub:      { fontSize: 13, color: '#9ca3af' },
// });

// export default AppNavigator;


// src/navigation/AppNavigator.tsx
import React, {
  useState, useEffect, useCallback, useRef, useContext,
} from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';

import { AppStateContext } from '../context/AppStateContext';

import LoginScreen          from '../screens/auth/LoginScreen';
import RegisterScreen       from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import CreateShopScreen      from '../screens/profile/CreateShopScreen';
import DashboardScreen       from '../screens/dashboard/DashboardScreen';
import AddProductScreen      from '../screens/products/AddProductScreen';
import ProductsScreen        from '../screens/products/ProductsScreen';
import OrdersScreen          from '../screens/orders/OrdersScreen';
import OrderDetailsScreen    from '../screens/orders/OrderDetailsScreen';
import BillingScreen         from '../screens/billing/BillingScreen';
import HistoryScreen         from '../screens/history/HistoryScreen';
import SubscriptionScreen    from '../screens/subscription/SubscriptionScreen';
import NotificationsScreen   from '../screens/notifications/NotificationsScreen';
import StockManagementScreen from '../screens/stock/StockManagementScreen';
import PaymentsScreen        from '../screens/payments/PaymentsScreen';

import BottomTabs   from './BottomTabs';
import TopBar       from '../components/navigation/TopBar';
import DrawerLayout from '../components/navigation/DrawerLayout';

import AuthService         from '../services/AuthService';
import NotificationService from '../services/NotificationService';
import { AUTH_EVENTS }     from '../constants/events';

const NOTIFICATION_POLL_MS  = 60_000;
const TOPBAR_HIDDEN_SCREENS = new Set(['AddProduct']);

// ── Tab wrappers ──────────────────────────────────────────────────────────────

interface TabWrapperConfig {
  title:    string;
  subtitle: string;
  Screen:   React.ComponentType<any>;
}

const makeTabWrapper = ({ title, subtitle, Screen }: TabWrapperConfig) => {
  const Wrapper: React.FC<any> = (props) => {
    const { setCurrentTitle, setCurrentSubtitle } = useContext(AppStateContext);
    const titleSet = useRef(false);
    useEffect(() => {
      if (!titleSet.current) {
        setCurrentTitle(title);
        setCurrentSubtitle(subtitle);
        titleSet.current = true;
      }
    }, []);
    useEffect(() => () => { titleSet.current = false; }, []);
    return <Screen {...props} />;
  };
  Wrapper.displayName = `TabWrapper(${title})`;
  return Wrapper;
};

const DashboardWrapper     = makeTabWrapper({ title: 'Dashboard',     subtitle: 'Welcome back! 🌴',       Screen: DashboardScreen      });
const ProductsWrapper      = makeTabWrapper({ title: 'Products',      subtitle: 'Manage your inventory',  Screen: ProductsScreen       });
const AddProductWrapper    = makeTabWrapper({ title: 'Add Product',   subtitle: 'Create new listing',     Screen: AddProductScreen     });
const OrdersWrapper        = makeTabWrapper({ title: 'Orders',        subtitle: 'Customer orders',        Screen: OrdersScreen         });
const HistoryWrapper       = makeTabWrapper({ title: 'Sales History', subtitle: 'Stock & sales records',  Screen: HistoryScreen        });
const SubscriptionWrapper  = makeTabWrapper({ title: 'Subscription',  subtitle: 'Manage your plan',       Screen: SubscriptionScreen   });
const NotificationsWrapper = makeTabWrapper({ title: 'Notifications', subtitle: 'Stay updated',           Screen: NotificationsScreen  });

// ── Stack wrappers ────────────────────────────────────────────────────────────

interface StackWrapperConfig {
  title:              string;
  subtitle:           string;
  Screen:             React.ComponentType<any>;
  showNotifications?: boolean;
}

const makeStackWrapper = ({ title, subtitle, Screen, showNotifications = true }: StackWrapperConfig) => {
  const Wrapper: React.FC<any> = (props) => {
    const { isDrawerOpen, setIsDrawerOpen, notificationCount } = useContext(AppStateContext);
    return (
      <View style={s.fill}>
        <TopBar
          title={title}
          subtitle={subtitle}
          onMenuPress={() => setIsDrawerOpen(v => !v)}
          showNotifications={showNotifications}
          notificationCount={notificationCount}
          backgroundColor="#ffffff"
        />
        <DrawerLayout isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <View style={s.fill}>
            <Screen {...props} />
          </View>
        </DrawerLayout>
      </View>
    );
  };
  Wrapper.displayName = `StackWrapper(${title})`;
  return Wrapper;
};

const CreateShopWrapper      = makeStackWrapper({ title: 'Store Setup',      subtitle: 'Complete your profile',   Screen: CreateShopScreen,     showNotifications: false });
const OrderDetailsWrapper    = makeStackWrapper({ title: 'Order Details',    subtitle: 'View order information',  Screen: OrderDetailsScreen    });
const BillingWrapper         = makeStackWrapper({ title: 'Local Billing',    subtitle: 'Point of Sale',           Screen: BillingScreen         });
const StockManagementWrapper = makeStackWrapper({ title: 'Stock Management', subtitle: 'Quick inventory updates', Screen: StockManagementScreen });

// ── Navigators ────────────────────────────────────────────────────────────────

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const MainTabNavigator: React.FC = () => {
  const {
    isDrawerOpen, setIsDrawerOpen,
    notificationCount, currentTitle, currentSubtitle,
  } = useContext(AppStateContext);

  const [activeTab, setActiveTab] = useState('Dashboard');
  const hideTopBar = TOPBAR_HIDDEN_SCREENS.has(activeTab);

  return (
    <View style={s.fill}>
      {!hideTopBar && (
        <TopBar
          title={currentTitle}
          subtitle={currentSubtitle}
          onMenuPress={() => setIsDrawerOpen(v => !v)}
          showNotifications
          notificationCount={notificationCount}
          backgroundColor="#ffffff"
        />
      )}
      <DrawerLayout isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <Tab.Navigator
          tabBar={(props) => <BottomTabs {...props} />}
          screenOptions={{ headerShown: false }}
          initialRouteName="Dashboard"
          screenListeners={{
            state: (e) => {
              const routes = (e.data as any)?.state?.routes;
              const index  = (e.data as any)?.state?.index;
              if (routes && index !== undefined) {
                setActiveTab(routes[index]?.name ?? 'Dashboard');
              }
            },
          }}
        >
          <Tab.Screen name="Dashboard"     component={DashboardWrapper}     />
          <Tab.Screen name="Products"      component={ProductsWrapper}      />
          <Tab.Screen
            name="AddProduct"
            component={AddProductWrapper}
            options={{ unmountOnBlur: true, tabBarStyle: { display: 'none' } }}
          />
          <Tab.Screen name="Orders"        component={OrdersWrapper}        />
          <Tab.Screen name="History"       component={HistoryWrapper}       />
          <Tab.Screen name="Subscription"  component={SubscriptionWrapper}  options={{ tabBarButton: () => null }} />
          <Tab.Screen name="Notifications" component={NotificationsWrapper} options={{ tabBarButton: () => null }} />
        </Tab.Navigator>
      </DrawerLayout>
    </View>
  );
};

// ── App Navigator ─────────────────────────────────────────────────────────────

const AppNavigator: React.FC = () => {
  const [isLoading,       setIsLoading]       = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ All shared state lives here — accessible by ALL screens including business tools
  const [isDrawerOpen,      setIsDrawerOpen]      = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentTitle,      setCurrentTitle]      = useState('Dashboard');
  const [currentSubtitle,   setCurrentSubtitle]   = useState<string | undefined>('Welcome back! 🌴');

  const fetchNotifications = useCallback(async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setNotificationCount(count);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await fetchNotifications();
      if (!cancelled) timeoutId = setTimeout(poll, NOTIFICATION_POLL_MS);
    };
    poll();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [isAuthenticated, fetchNotifications]);

  useEffect(() => {
    let cancelled = false;
    AuthService.isAuthenticated()
      .then(auth  => { if (!cancelled) setIsAuthenticated(auth); })
      .catch(()   => { if (!cancelled) setIsAuthenticated(false); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onLogout = () => setIsAuthenticated(false);
    const onLogin  = () => setIsAuthenticated(true);
    const logoutSub = DeviceEventEmitter.addListener(AUTH_EVENTS.LOGOUT, onLogout);
    const loginSub  = DeviceEventEmitter.addListener(AUTH_EVENTS.LOGIN,  onLogin);
    return () => { logoutSub.remove(); loginSub.remove(); };
  }, []);

  const isAuthRef = useRef(isAuthenticated);
  useEffect(() => { isAuthRef.current = isAuthenticated; }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const current = await AuthService.isAuthenticated();
        if (!cancelled && current !== isAuthRef.current) setIsAuthenticated(current);
      } catch {
        if (!cancelled && isAuthRef.current) setIsAuthenticated(false);
      }
      if (!cancelled) timeoutId = setTimeout(poll, 30_000);
    };
    timeoutId = setTimeout(poll, 30_000);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [isLoading]);

  if (isLoading) return (
    <View style={s.loadingWrap}>
      <View style={s.loadingIconWrap}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
      <Text style={s.loadingTitle}>Kerala Sellers</Text>
      <Text style={s.loadingSub}>Setting up your store...</Text>
    </View>
  );

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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs"        component={MainTabNavigator}       />
            <Stack.Screen name="CreateShop"      component={CreateShopWrapper}      />
            <Stack.Screen name="OrderDetails"    component={OrderDetailsWrapper}    />
            <Stack.Screen name="Billing"         component={BillingWrapper}         />
            <Stack.Screen name="StockManagement" component={StockManagementWrapper} />
            <Stack.Screen name="Payments"        component={PaymentsScreen}         />
          </>
        ) : (
          <>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={() => DeviceEventEmitter.emit(AUTH_EVENTS.LOGIN)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register"       component={RegisterScreen}       />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </AppStateContext.Provider>
  );
};

const s = StyleSheet.create({
  fill:            { flex: 1, backgroundColor: '#f1f5f9' },
  loadingWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', gap: 12 },
  loadingIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  loadingTitle:    { fontSize: 20, fontWeight: '900', color: '#111827' },
  loadingSub:      { fontSize: 13, color: '#9ca3af' },
});

export default AppNavigator;