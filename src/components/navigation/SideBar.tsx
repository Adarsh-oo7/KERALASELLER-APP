// src/components/navigation/SideBar.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../../services/AuthService';

interface SideBarProps {
  onClose: () => void;
  isVisible: boolean;
}

// ── Static config ─────────────────────────────────────────────────────────────

const MAIN_MENU = [
  { id: 'dashboard',   label: 'Dashboard',     sub: 'Overview & analytics',    icon: 'home-outline' as const,         route: 'Dashboard',   color: '#3b82f6' },
  { id: 'products',    label: 'My Products',   sub: 'Manage your inventory',   icon: 'cube-outline' as const,          route: 'Products',    color: '#8b5cf6' },
  { id: 'add-product', label: 'Add Product',   sub: 'Create a new listing',    icon: 'add-circle-outline' as const,    route: 'AddProduct',  color: '#10b981' },
  { id: 'orders',      label: 'Orders',        sub: 'Customer orders',         icon: 'bag-handle-outline' as const,    route: 'Orders',      color: '#f59e0b' },
  { id: 'history',     label: 'Sales History', sub: 'Transaction records',     icon: 'time-outline' as const,          route: 'History',     color: '#6b7280' },
];

const TOOLS_MENU = [
  { id: 'stock',    label: 'Stock Management', sub: 'Quick inventory updates', icon: 'layers-outline' as const,   route: 'StockManagement', color: '#10b981', badge: 'NEW',  badgeColor: '#10b981' },
  { id: 'payments', label: 'Payment Gateways', sub: 'Razorpay & payouts',      icon: 'card-outline' as const,     route: 'Payments',        color: '#3b82f6', badge: 'LIVE', badgeColor: '#3b82f6' },
  { id: 'billing',  label: 'Local Billing',    sub: 'Point of sale',           icon: 'receipt-outline' as const,  route: 'Billing',         color: '#f59e0b' },
  { id: 'sub',      label: 'Subscription',     sub: 'Upgrade your plan',       icon: 'diamond-outline' as const,  route: 'Subscription',    color: '#8b5cf6' },
  { id: 'settings', label: 'Store Settings',   sub: 'Profile & setup',         icon: 'settings-outline' as const, route: 'CreateShop',      color: '#64748b' },
];

const MAIN_TABS = ['Dashboard', 'Products', 'AddProduct', 'Orders', 'History', 'Subscription'];

// ── Component ─────────────────────────────────────────────────────────────────

const SideBar: React.FC<SideBarProps> = ({ onClose, isVisible }) => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (isVisible) load();
  }, [isVisible]);

  const load = async () => {
    try { setUserData(await AuthService.getCurrentUser()); } catch {}
  };

  const go = (route: string, params?: any) => {
    onClose();
    setTimeout(() => {
      try {
        if (MAIN_TABS.includes(route)) {
          navigation.navigate('MainTabs' as never, { screen: route } as never);
        } else {
          navigation.navigate(route as never, params as never);
        }
      } catch {
        Alert.alert('Navigation Error', `Unable to navigate to ${route}.`);
      }
    }, 220);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from Kerala Sellers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout', style: 'destructive',
          onPress: async () => {
            try { onClose(); await AuthService.logout(); } catch {}
          },
        },
      ]
    );
  };

  const initial = userData?.name?.charAt(0)?.toUpperCase() ?? 'K';
  const name    = userData?.name  ?? 'Kerala Seller';
  const email   = userData?.email ?? '';
  const shop    = userData?.shop_name ?? userData?.store_name ?? 'My Store';

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={Platform.OS === 'ios'}>

        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: Platform.OS === 'ios' ? 56 : 44 }]}>

          {/* Close */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={16} color="#6b7280" />
          </TouchableOpacity>

          {/* Avatar row */}
          <View style={s.profileRow}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initial}</Text>
              </View>
              <View style={s.onlineDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName} numberOfLines={1}>{name}</Text>
              {!!email && <Text style={s.userEmail} numberOfLines={1}>{email}</Text>}
            </View>
            <TouchableOpacity style={s.editBtn} onPress={() => go('CreateShop')}>
              <Ionicons name="pencil-outline" size={14} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {/* Store tag */}
          <View style={s.storeTag}>
            <Ionicons name="storefront-outline" size={12} color="#059669" />
            <Text style={s.storeTagText} numberOfLines={1}>{shop}</Text>
          </View>
        </View>

        {/* ── Main Menu ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>MAIN MENU</Text>
          {MAIN_MENU.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[s.row, idx < MAIN_MENU.length - 1 && s.rowBorder]}
              activeOpacity={0.7}
              onPress={() => go(item.route)}
            >
              <View style={[s.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View style={s.rowBody}>
                <Text style={s.rowLabel}>{item.label}</Text>
                <Text style={s.rowSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.divider} />

        {/* ── Business Tools ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>BUSINESS TOOLS</Text>
          {TOOLS_MENU.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[s.row, idx < TOOLS_MENU.length - 1 && s.rowBorder]}
              activeOpacity={0.7}
              onPress={() => go(item.route)}
            >
              <View style={[s.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View style={s.rowBody}>
                <View style={s.labelRow}>
                  <Text style={s.rowLabel}>{item.label}</Text>
                  {item.badge && (
                    <View style={[s.badge, { backgroundColor: item.badgeColor }]}>
                      <Text style={s.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={s.rowSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.divider} />

        {/* ── Pro card ── */}
        <View style={s.proCard}>
          <View style={s.proLeft}>
            <Text style={s.proTitle}>🌴 Kerala Sellers Pro</Text>
            <Text style={s.proSub}>Unlock premium features & boost sales</Text>
          </View>
          <TouchableOpacity style={s.proBtn} onPress={() => go('Subscription')}>
            <Text style={s.proBtnText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        <View style={s.divider} />

        {/* ── Support ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SUPPORT</Text>

          <TouchableOpacity
            style={[s.row, s.rowBorder]}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              Alert.alert('Help & Support', '📧 support@keralasellers.com\n📱 WhatsApp: +91 9876543210');
            }}
          >
            <View style={[s.iconBox, { backgroundColor: '#f59e0b15' }]}>
              <Ionicons name="help-circle-outline" size={18} color="#f59e0b" />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.row}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              Alert.alert(
                'About Kerala Sellers',
                'Empowering local businesses across Kerala with zero-commission online stores.\n\nVersion: 1.0.0\n🌴 Made with love in Kerala'
              );
            }}
          >
            <View style={[s.iconBox, { backgroundColor: '#6b728015' }]}>
              <Ionicons name="information-circle-outline" size={18} color="#6b7280" />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowLabel}>About Kerala Sellers</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        <View style={s.divider} />

        {/* ── Logout ── */}
        <View style={s.section}>
          <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={handleLogout}>
            <View style={[s.iconBox, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            </View>
            <View style={s.rowBody}>
              <Text style={[s.rowLabel, { color: '#ef4444' }]}>Logout</Text>
              <Text style={s.rowSub}>Sign out of Kerala Sellers</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <Text style={s.footer}>Kerala Sellers · v1.0.0 · © 2025</Text>
        <View style={{ height: 48 }} />

      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },

  // Header
  header: {
    paddingHorizontal: 18, paddingBottom: 18,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  closeBtn: {
    alignSelf: 'flex-end', marginBottom: 14,
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center', alignItems: 'center',
  },
  profileRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 14,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#ffffff',
  },
  userName:  { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 2 },
  userEmail: { fontSize: 11, color: '#9ca3af' },
  editBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    justifyContent: 'center', alignItems: 'center',
  },
  storeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  storeTagText: { fontSize: 11, color: '#15803d', fontWeight: '600' },

  // Section
  section: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 6 },
  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: '#9ca3af',
    letterSpacing: 1.2, marginBottom: 10, marginLeft: 2,
  },

  // Row
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  rowBody: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  rowSub:   { fontSize: 11, color: '#9ca3af' },

  // Badge
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 8, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },

  // Divider
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 14 },

  // Pro card
  proCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 14, padding: 14, borderRadius: 14,
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
  },
  proLeft:  { flex: 1 },
  proTitle: { fontSize: 13, fontWeight: '800', color: '#1e40af', marginBottom: 3 },
  proSub:   { fontSize: 11, color: '#3b82f6', lineHeight: 16 },
  proBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
  },
  proBtnText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },

  // Footer
  footer: {
    textAlign: 'center', fontSize: 11,
    color: '#d1d5db', fontWeight: '500',
    marginTop: 16,
  },
});

export default SideBar;
