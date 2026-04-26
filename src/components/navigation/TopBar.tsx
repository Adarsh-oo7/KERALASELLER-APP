
// // src/components/navigation/TopBar.tsx
// import React, { useState, useEffect, useContext, useRef } from 'react';
// import {
//   View, Text, TouchableOpacity, StyleSheet,
//   Platform, StatusBar, Animated,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation, useNavigationState } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import AuthService from '../../services/AuthService';
// import { AppStateContext } from '../../context/AppStateContext';

// interface TopBarProps {
//   title?: string;
//   subtitle?: string;
//   onMenuPress: () => void;
//   showNotifications?: boolean;
//   notificationCount?: number;
//   backgroundColor?: string;
//   textColor?: string;
// }

// const getActiveRouteName = (state: any): string => {
//   if (!state) return 'Dashboard';
//   const route = state.routes[state.index];
//   if (route?.state) return getActiveRouteName(route.state);
//   return route?.name || 'Dashboard';
// };

// const getGreeting = (): string => {
//   const h = new Date().getHours();
//   if (h < 12) return 'Good morning';
//   if (h < 17) return 'Good afternoon';
//   if (h < 21) return 'Good evening';
//   return 'Good night';
// };

// const SCREEN_META: Record<string, { title: string; icon: any }> = {
//   Dashboard:       { title: 'Dashboard',      icon: 'home-outline' },
//   Products:        { title: 'My Products',    icon: 'cube-outline' },
//   AddProduct:      { title: 'Add Product',    icon: 'add-circle-outline' },
//   EditProduct:     { title: 'Edit Product',   icon: 'create-outline' },
//   Orders:          { title: 'Orders',         icon: 'bag-handle-outline' },
//   Notifications:   { title: 'Notifications',  icon: 'notifications-outline' },
//   Subscription:    { title: 'Subscription',   icon: 'diamond-outline' },
//   StockManagement: { title: 'Stock',          icon: 'layers-outline' },
//   Billing:         { title: 'Local Billing',  icon: 'receipt-outline' },
//   History:         { title: 'Sales History',  icon: 'time-outline' },
//   CreateShop:      { title: 'Store Settings', icon: 'settings-outline' },
//   Profile:         { title: 'Profile',        icon: 'person-outline' },
// };

// const TopBar: React.FC<TopBarProps> = ({
//   title: propTitle,
//   subtitle: propSubtitle,
//   onMenuPress,
//   showNotifications = true,
//   notificationCount: propNotificationCount,
//   backgroundColor = '#ffffff',
//   textColor = '#111827',
// }) => {
//   const navigation = useNavigation<StackNavigationProp<any>>();
//   const insets     = useSafeAreaInsets();
//   const [userData, setUserData] = useState<any>(null);
//   const fadeAnim   = useRef(new Animated.Value(1)).current;
//   const bellAnim   = useRef(new Animated.Value(1)).current;

//   const { notificationCount: ctxCount, refreshNotifications } = useContext(AppStateContext);
//   const currentRoute = useNavigationState(state => getActiveRouteName(state));

//   useEffect(() => { loadUserData(); }, []);

//   // Fade title on route change
//   useEffect(() => {
//     Animated.sequence([
//       Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
//       Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
//     ]).start();
//   }, [currentRoute]);

//   const loadUserData = async () => {
//     try { setUserData(await AuthService.getCurrentUser()); } catch {}
//   };

//   const firstName   = userData?.name?.split(' ')[0] || 'Seller';
//   const shopName    = userData?.store_name || userData?.shop_name || 'Kerala Sellers';
//   const isDashboard = currentRoute === 'Dashboard';

//   const meta            = SCREEN_META[currentRoute];
//   const displayTitle    = propTitle    || (isDashboard ? shopName : meta?.title || currentRoute);
//   const displaySubtitle = propSubtitle || (isDashboard ? `${getGreeting()}, ${firstName} 👋` : null);

//   const notifCount = propNotificationCount ?? ctxCount;
//   const hasNotif   = notifCount > 0;

//   const topPad = Platform.OS === 'android'
//     ? (insets.top > 0 ? insets.top : (StatusBar.currentHeight ?? 24))
//     : 0;

//   const handleNotifPress = () => {
//     // Bell wobble animation
//     Animated.sequence([
//       Animated.timing(bellAnim, { toValue: 1.25, duration: 100, useNativeDriver: true }),
//       Animated.timing(bellAnim, { toValue: 0.9,  duration: 80,  useNativeDriver: true }),
//       Animated.spring(bellAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 6 }),
//     ]).start();
//     try {
//       navigation.navigate('MainTabs', { screen: 'Notifications', initial: false });
//       setTimeout(refreshNotifications, 200);
//     } catch {}
//   };

//   return (
//     <View style={[s.root, { backgroundColor, paddingTop: topPad }]}>
//       <View style={s.bar}>

//         {/* Hamburger */}
//         <TouchableOpacity style={s.iconBtn} onPress={onMenuPress} activeOpacity={0.7}>
//           <Ionicons name="menu-outline" size={22} color={textColor} />
//         </TouchableOpacity>

//         {/* Title block — left-aligned on inner screens, centered on Dashboard */}
//         <Animated.View style={[s.titleBlock, { opacity: fadeAnim }]}>
//           {!isDashboard && meta && (
//             <View style={s.breadcrumb}>
//               <Ionicons name={meta.icon} size={12} color="#6b7280" />
//               <Text style={s.breadcrumbText}>{meta.title}</Text>
//             </View>
//           )}
//           <Text
//             style={[
//               s.title,
//               { color: textColor },
//               isDashboard && s.titleCentered,
//             ]}
//             numberOfLines={1}
//           >
//             {displayTitle}
//           </Text>
//           {displaySubtitle && (
//             <Text
//               style={[s.subtitle, isDashboard && s.subtitleCentered]}
//               numberOfLines={1}
//             >
//               {displaySubtitle}
//             </Text>
//           )}
//         </Animated.View>

//         {/* Notification bell */}
//         {showNotifications ? (
//           <TouchableOpacity
//             style={[s.iconBtn, hasNotif && s.iconBtnActive]}
//             onPress={handleNotifPress}
//             activeOpacity={0.7}
//           >
//             <Animated.View style={{ transform: [{ scale: bellAnim }] }}>
//               <Ionicons
//                 name={hasNotif ? 'notifications' : 'notifications-outline'}
//                 size={22}
//                 color={hasNotif ? '#3b82f6' : textColor}
//               />
//             </Animated.View>
//             {hasNotif && (
//               <View style={s.badge}>
//                 <Text style={s.badgeText}>
//                   {notifCount > 99 ? '99+' : String(notifCount)}
//                 </Text>
//               </View>
//             )}
//           </TouchableOpacity>
//         ) : (
//           <View style={s.iconBtn} />
//         )}

//       </View>

//       {/* Dashboard: accent bottom bar instead of full notification banner */}
//       {isDashboard && hasNotif ? (
//         <TouchableOpacity style={s.notifStrip} onPress={handleNotifPress} activeOpacity={0.8}>
//           <View style={s.notifStripDot} />
//           <Text style={s.notifStripText}>
//             {notifCount} new notification{notifCount !== 1 ? 's' : ''}
//           </Text>
//           <Ionicons name="chevron-forward" size={12} color="#3b82f6" />
//         </TouchableOpacity>
//       ) : (
//         <View style={s.border} />
//       )}
//     </View>
//   );
// };

// const s = StyleSheet.create({
//   root: {
//     backgroundColor: '#ffffff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.06,
//     shadowRadius: 6,
//     elevation: 4,
//     zIndex: 100,
//   },
//   bar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     minHeight: 54,
//     gap: 10,
//   },
//   iconBtn: {
//     width: 38, height: 38, borderRadius: 12,
//     backgroundColor: '#f9fafb',
//     justifyContent: 'center', alignItems: 'center',
//     borderWidth: 1, borderColor: '#f3f4f6',
//   },
//   iconBtnActive: { backgroundColor: '#eff6ff', borderColor: '#dbeafe' },
//   badge: {
//     position: 'absolute', top: -5, right: -5,
//     backgroundColor: '#ef4444',
//     borderRadius: 10, minWidth: 18, height: 18,
//     justifyContent: 'center', alignItems: 'center',
//     paddingHorizontal: 4,
//     borderWidth: 2, borderColor: '#ffffff',
//   },
//   badgeText:       { fontSize: 9, fontWeight: '800', color: 'white' },
//   titleBlock:      { flex: 1, justifyContent: 'center', gap: 1 },
//   breadcrumb:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 },
//   breadcrumbText:  { fontSize: 11, color: '#9ca3af', fontWeight: '500', letterSpacing: 0.2 },
//   title:           { fontSize: 17, fontWeight: '800', color: '#111827', letterSpacing: -0.2 },
//   titleCentered:   { textAlign: 'center' },
//   subtitle:        { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
//   subtitleCentered:{ textAlign: 'center' },
//   notifStrip: {
//     flexDirection: 'row', alignItems: 'center',
//     gap: 6, paddingHorizontal: 16, paddingVertical: 7,
//     backgroundColor: '#eff6ff',
//     borderTopWidth: 1, borderTopColor: '#dbeafe',
//   },
//   notifStripDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6' },
//   notifStripText: { fontSize: 12, color: '#2563eb', fontWeight: '600', flex: 1 },
//   border:         { height: 1, backgroundColor: '#f3f4f6' },
// });

// export default TopBar;


// src/components/navigation/TopBar.tsx
import React, { useEffect, useContext, useRef, useReducer } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  Platform, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthService from '../../services/AuthService';
import { AppStateContext } from '../../context/AppStateContext';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onMenuPress: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
  backgroundColor?: string;
  textColor?: string;
}

const getActiveRouteName = (state: any): string => {
  if (!state) return 'Dashboard';
  const route = state.routes[state.index];
  if (route?.state) return getActiveRouteName(route.state);
  return route?.name || 'Dashboard';
};

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
};

const SCREEN_META: Record<string, { title: string; icon: any }> = {
  Dashboard:       { title: 'Dashboard',      icon: 'home-outline' },
  Products:        { title: 'My Products',    icon: 'cube-outline' },
  AddProduct:      { title: 'Add Product',    icon: 'add-circle-outline' },
  EditProduct:     { title: 'Edit Product',   icon: 'create-outline' },
  Orders:          { title: 'Orders',         icon: 'bag-handle-outline' },
  Notifications:   { title: 'Notifications',  icon: 'notifications-outline' },
  Subscription:    { title: 'Subscription',   icon: 'diamond-outline' },
  StockManagement: { title: 'Stock',          icon: 'layers-outline' },
  Billing:         { title: 'Local Billing',  icon: 'receipt-outline' },
  History:         { title: 'Sales History',  icon: 'time-outline' },
  CreateShop:      { title: 'Store Settings', icon: 'settings-outline' },
  Profile:         { title: 'Profile',        icon: 'person-outline' },
};

const TopBar: React.FC<TopBarProps> = ({
  title: propTitle,
  subtitle: propSubtitle,
  onMenuPress,
  showNotifications = true,
  notificationCount: propNotificationCount,
  backgroundColor = '#ffffff',
  textColor = '#111827',
}) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets     = useSafeAreaInsets();

  // ✅ useRef + forceRender avoids full re-render on every loadUserData call
  const userDataRef = useRef<any>(null);
  const [, forceRender] = useReducer(x => x + 1, 0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bellAnim = useRef(new Animated.Value(1)).current;
  // ✅ Guard bell from firing animation twice on double-tap
  const bellBusy = useRef(false);

  const { notificationCount: ctxCount, refreshNotifications } = useContext(AppStateContext);
  const currentRoute = useNavigationState(state => getActiveRouteName(state));

  useEffect(() => {
    AuthService.getCurrentUser()
      .then(u => { userDataRef.current = u; forceRender(); })
      .catch(() => {});
  }, []);

  // Fade title on route change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [currentRoute]);

  const u           = userDataRef.current;
  const firstName   = u?.name?.split(' ')[0] || 'Seller';
  const shopName    = u?.store_name || u?.shop_name || 'Kerala Sellers';
  const isDashboard = currentRoute === 'Dashboard';

  const meta            = SCREEN_META[currentRoute];
  const displayTitle    = propTitle    || (isDashboard ? shopName : meta?.title || currentRoute);
  const displaySubtitle = propSubtitle || (isDashboard ? `${getGreeting()}, ${firstName} 👋` : null);

  const notifCount = propNotificationCount ?? ctxCount;
  const hasNotif   = notifCount > 0;

  const topPad = Platform.OS === 'android'
    ? (insets.top > 0 ? insets.top : (StatusBar.currentHeight ?? 24))
    : 0;

  const handleNotifPress = () => {
    // ✅ Skip animation if already running
    if (bellBusy.current) return;
    bellBusy.current = true;
    Animated.sequence([
      Animated.timing(bellAnim, { toValue: 1.25, duration: 100, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 0.9,  duration: 80,  useNativeDriver: true }),
      Animated.spring(bellAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 6 }),
    ]).start(() => { bellBusy.current = false; });

    try {
      navigation.navigate('MainTabs', { screen: 'Notifications', initial: false });
      setTimeout(refreshNotifications, 200);
    } catch {}
  };

  return (
    <View style={[s.root, { backgroundColor, paddingTop: topPad }]}>
      <View style={s.bar}>

        {/* ✅ Hamburger — Pressable + ripple = instant, no 100ms delay */}
        <Pressable
          style={({ pressed }) => [
            s.iconBtn,
            pressed && Platform.OS === 'ios' && s.iconBtnPressed,
          ]}
          onPress={onMenuPress}
          android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false, radius: 19 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu-outline" size={22} color={textColor} />
        </Pressable>

        {/* Title block */}
        <Animated.View style={[s.titleBlock, { opacity: fadeAnim }]}>
          {!isDashboard && meta && (
            <View style={s.breadcrumb}>
              <Ionicons name={meta.icon} size={12} color="#6b7280" />
              <Text style={s.breadcrumbText}>{meta.title}</Text>
            </View>
          )}
          <Text
            style={[s.title, { color: textColor }, isDashboard && s.titleCentered]}
            numberOfLines={1}
          >
            {displayTitle}
          </Text>
          {displaySubtitle && (
            <Text
              style={[s.subtitle, isDashboard && s.subtitleCentered]}
              numberOfLines={1}
            >
              {displaySubtitle}
            </Text>
          )}
        </Animated.View>

        {/* ✅ Notification bell — Pressable + ripple */}
        {showNotifications ? (
          <Pressable
            style={({ pressed }) => [
              s.iconBtn,
              hasNotif && s.iconBtnActive,
              pressed && Platform.OS === 'ios' && s.iconBtnPressed,
            ]}
            onPress={handleNotifPress}
            android_ripple={{ color: 'rgba(59,130,246,0.15)', borderless: false, radius: 19 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View style={{ transform: [{ scale: bellAnim }] }}>
              <Ionicons
                name={hasNotif ? 'notifications' : 'notifications-outline'}
                size={22}
                color={hasNotif ? '#3b82f6' : textColor}
              />
            </Animated.View>
            {hasNotif && (
              <View style={s.badge}>
                <Text style={s.badgeText}>
                  {notifCount > 99 ? '99+' : String(notifCount)}
                </Text>
              </View>
            )}
          </Pressable>
        ) : (
          <View style={s.iconBtn} />
        )}

      </View>

      {/* Notification strip / border */}
      {isDashboard && hasNotif ? (
        <Pressable
          style={({ pressed }) => [s.notifStrip, pressed && s.notifStripPressed]}
          onPress={handleNotifPress}
          android_ripple={{ color: 'rgba(59,130,246,0.12)' }}
        >
          <View style={s.notifStripDot} />
          <Text style={s.notifStripText}>
            {notifCount} new notification{notifCount !== 1 ? 's' : ''}
          </Text>
          <Ionicons name="chevron-forward" size={12} color="#3b82f6" />
        </Pressable>
      ) : (
        <View style={s.border} />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 100,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 54,
    gap: 10,
  },

  // ✅ Both icon buttons — same base style
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#f9fafb',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#f3f4f6',
    // ✅ overflow hidden required for ripple to stay inside border-radius on Android
    overflow: 'hidden',
  },
  iconBtnActive:  { backgroundColor: '#eff6ff', borderColor: '#dbeafe' },
  // ✅ iOS pressed fallback (Android uses ripple instead)
  iconBtnPressed: { backgroundColor: '#f3f4f6', opacity: 0.7 },

  badge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: '#ffffff',
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: 'white' },

  titleBlock:       { flex: 1, justifyContent: 'center', gap: 1 },
  breadcrumb:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 },
  breadcrumbText:   { fontSize: 11, color: '#9ca3af', fontWeight: '500', letterSpacing: 0.2 },
  title:            { fontSize: 17, fontWeight: '800', color: '#111827', letterSpacing: -0.2 },
  titleCentered:    { textAlign: 'center' },
  subtitle:         { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  subtitleCentered: { textAlign: 'center' },

  notifStrip: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: '#eff6ff',
    borderTopWidth: 1, borderTopColor: '#dbeafe',
    overflow: 'hidden',
  },
  notifStripPressed: { backgroundColor: '#dbeafe' },
  notifStripDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6' },
  notifStripText:    { fontSize: 12, color: '#2563eb', fontWeight: '600', flex: 1 },
  border:            { height: 1, backgroundColor: '#f3f4f6' },
});

export default TopBar;