import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AuthService from '../../services/AuthService';
import { AppStateContext } from '../../navigation/AppNavigator';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onMenuPress: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
  backgroundColor?: string;
  textColor?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  Dashboard:    { title: 'Dashboard',        icon: 'home-outline' },
  Products:     { title: 'My Products',      icon: 'cube-outline' },
  AddProduct:   { title: 'Add Product',      icon: 'add-circle-outline' },
  EditProduct:  { title: 'Edit Product',     icon: 'create-outline' },
  Orders:       { title: 'Orders',           icon: 'bag-handle-outline' },
  Notifications:{ title: 'Notifications',    icon: 'notifications-outline' },
  Subscription: { title: 'Subscription',     icon: 'diamond-outline' },
  StockManagement:{ title: 'Stock',          icon: 'layers-outline' },
  Billing:      { title: 'Local Billing',    icon: 'receipt-outline' },
  History:      { title: 'Sales History',    icon: 'time-outline' },
  CreateShop:   { title: 'Store Settings',   icon: 'settings-outline' },
  Profile:      { title: 'Profile',          icon: 'person-outline' },
};

// ── Component ─────────────────────────────────────────────────────────────────

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
  const [userData, setUserData] = useState<any>(null);
  const { notificationCount: ctxCount, loadNotificationCount } = useContext(AppStateContext);

  const currentRoute = useNavigationState(state => getActiveRouteName(state));

  useEffect(() => { loadUserData(); }, []);

  const loadUserData = async () => {
    try { setUserData(await AuthService.getCurrentUser()); } catch {}
  };

  // ── Derived values ──────────────────────────────────────────────────────────

  const firstName   = userData?.name?.split(' ')[0] || 'Seller';
  const shopName    = userData?.store_name || userData?.shop_name || 'Kerala Sellers';
  const isDashboard = currentRoute === 'Dashboard';

  const meta = SCREEN_META[currentRoute];
  const displayTitle    = propTitle    || (isDashboard ? shopName      : meta?.title    || shopName);
  const displaySubtitle = propSubtitle || (isDashboard ? `${getGreeting()}, ${firstName} 👋` : null);

  const notifCount = propNotificationCount ?? ctxCount;
  const hasNotif   = notifCount > 0;

  const handleNotifPress = () => {
    try {
      navigation.navigate('MainTabs', { screen: 'Notifications', initial: false });
      setTimeout(loadNotificationCount, 200);
    } catch {}
  };

  return (
    <View style={[s.root, { backgroundColor }]}>
      <View style={[s.bar, { paddingTop: Platform.OS === 'ios' ? 0 : 4 }]}>

        {/* ── Hamburger ── */}
        <TouchableOpacity style={s.iconBtn} onPress={onMenuPress} activeOpacity={0.7}>
          <Ionicons name="menu-outline" size={22} color={textColor} />
        </TouchableOpacity>

        {/* ── Title block ── */}
        <View style={s.titleBlock}>
          {/* Screen icon pill — only on non-dashboard screens */}
          {!isDashboard && meta && (
            <View style={s.routePill}>
              <Ionicons name={meta.icon} size={11} color="#3b82f6" />
              <Text style={s.routePillText}>{meta.title}</Text>
            </View>
          )}
          <Text style={[s.title, { color: textColor }]} numberOfLines={1}>
            {displayTitle}
          </Text>
          {displaySubtitle && (
            <Text style={s.subtitle} numberOfLines={1}>{displaySubtitle}</Text>
          )}
        </View>

        {/* ── Notification bell ── */}
        {showNotifications ? (
          <TouchableOpacity
            style={[s.iconBtn, hasNotif && s.iconBtnActive]}
            onPress={handleNotifPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hasNotif ? 'notifications' : 'notifications-outline'}
              size={22}
              color={hasNotif ? '#3b82f6' : textColor}
            />
            {hasNotif && (
              <View style={s.badge}>
                <Text style={s.badgeText}>
                  {notifCount > 99 ? '99+' : String(notifCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={s.iconBtn} />
        )}

      </View>

      {/* ── Notification hint banner — dashboard only ── */}
      {isDashboard && hasNotif && (
        <TouchableOpacity style={s.hint} onPress={handleNotifPress} activeOpacity={0.8}>
          <Ionicons name="mail-unread-outline" size={13} color="#3b82f6" />
          <Text style={s.hintText}>
            {notifCount} unread notification{notifCount !== 1 ? 's' : ''}
          </Text>
          <Ionicons name="chevron-forward" size={12} color="#3b82f6" />
        </TouchableOpacity>
      )}

      {/* ── Bottom border ── */}
      <View style={s.border} />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 56,
    gap: 8,
  },

  // Icon buttons (hamburger + bell) — same size, balanced layout
  iconBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center', alignItems: 'center',
  },
  iconBtnActive: {
    backgroundColor: '#eff6ff',
  },

  // Badge on bell
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: '#ffffff',
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: 'white' },

  // Title center block
  titleBlock: { flex: 1, alignItems: 'center', gap: 2 },

  routePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
    marginBottom: 2,
  },
  routePillText: { fontSize: 10, color: '#3b82f6', fontWeight: '700' },

  title: {
    fontSize: 16, fontWeight: '800', color: '#111827',
    textAlign: 'center', letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 11, color: '#9ca3af',
    textAlign: 'center', fontWeight: '500',
  },

  // Notification hint
  hint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderTopWidth: 1, borderTopColor: '#dbeafe',
  },
  hintText: {
    fontSize: 12, color: '#3b82f6', fontWeight: '600', flex: 1, textAlign: 'center',
  },

  border: { height: 1, backgroundColor: '#f3f4f6' },
});

export default TopBar;
