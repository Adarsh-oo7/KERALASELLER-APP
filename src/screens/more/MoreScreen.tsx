import React, { useMemo } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Header, Screen } from '../../components';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../../config/legal';
import { useAuth } from '../../context/AuthContext';
import { useStoreAccess } from '../../hooks/useStoreAccess';
import { canUseTool } from '../../lib/storeAccess';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, SPACING, TYPOGRAPHY } from '../../theme';
import type { MainStackParamList, MainTabScreenProps } from '../../navigation/types';

type Item = {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: keyof MainStackParamList;
  permission?: string | string[];
};

type Group = { title: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: 'Billing counter',
    items: [
      { label: 'Local billing', hint: 'Scan, edit qty, cash or UPI', icon: 'cash-outline', route: 'Billing', permission: 'billing.access_pos' },
      { label: 'Barcodes', hint: 'Create or attach a packet barcode', icon: 'barcode-outline', route: 'Barcodes', permission: ['products.view', 'billing.access_pos'] },
      { label: 'Printers', hint: 'Bluetooth, thermal, Wi‑Fi, USB', icon: 'print-outline', route: 'Printers', permission: 'billing.access_pos' },
      { label: 'Customers', hint: 'From bills and orders', icon: 'people-outline', route: 'Customers', permission: 'customers.view' },
      { label: 'Reports', hint: 'Today, best sellers, profit', icon: 'stats-chart-outline', route: 'Analytics', permission: 'reports.view_basic' },
      { label: 'Expenses', hint: 'Rent, petrol, other costs', icon: 'wallet-outline', route: 'Expenses', permission: 'expenses.view' },
    ],
  },
  {
    title: 'Stock',
    items: [
      { label: 'Receive stock', hint: 'Purchase in — same inventory', icon: 'download-outline', route: 'Purchases', permission: 'inventory.manage_purchases' },
      { label: 'Stock history', hint: 'What changed, when', icon: 'time-outline', route: 'History' },
    ],
  },
  {
    title: 'Shop',
    items: [
      { label: 'Store settings', hint: 'Basic, advanced, and delivery', icon: 'storefront-outline', route: 'Settings' },
      { label: 'Locations', hint: 'Extra counters', icon: 'business-outline', route: 'Locations', permission: 'branches.view' },
      { label: 'Staff', hint: 'Cashier and inventory logins', icon: 'people-circle-outline', route: 'Staff', permission: 'staff.view' },
      { label: 'Loyalty', hint: 'Points on customer phone', icon: 'star-outline', route: 'Loyalty', permission: 'loyalty.view' },
      { label: 'Notifications', hint: 'New orders and alerts', icon: 'notifications-outline', route: 'Notifications' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Subscription', hint: 'Starter, Growth, or Pro', icon: 'sparkles-outline', route: 'Subscription' },
      { label: 'Add-ons', hint: 'Buy extras only if this shop needs them', icon: 'extension-puzzle-outline', route: 'Addons', permission: 'account.manage_subscription' },
      { label: 'Payments', hint: 'Razorpay keys and payouts', icon: 'card-outline', route: 'Payments' },
    ],
  },
];

function allowedFor(item: Item, allowed: string[] | null, isOwner: boolean) {
  return canUseTool(allowed, item.permission, isOwner);
}

export default function MoreScreen({ navigation }: MainTabScreenProps<'More'>) {
  const { logout } = useAuth();
  const { allowed, isOwner } = useStoreAccess();
  const groups = useMemo(
    () => GROUPS
      .map((group) => ({ ...group, items: group.items.filter((item) => allowedFor(item, allowed, isOwner)) }))
      .filter((group) => group.items.length > 0),
    [allowed, isOwner],
  );

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="More" subtitle="Till, stock, and extras on your plan" />
      <View style={styles.content}>
        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <Card>
              {group.items.map((item, index) => (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => navigation.navigate(item.route as never)}
                  style={[styles.row, index < group.items.length - 1 && styles.divider]}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityHint={item.hint}
                >
                  <View style={styles.icon}>
                    <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>{item.label}</Text>
                    <Text style={styles.hint} maxFontSizeMultiplier={FONT_SCALE.caption}>{item.hint}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        <Card>
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            style={[styles.row, styles.divider]}
            accessibilityRole="link"
            accessibilityLabel="Privacy policy"
          >
            <View style={styles.icon}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Privacy policy</Text>
              <Text style={styles.hint} maxFontSizeMultiplier={FONT_SCALE.caption}>How Kerala Sellers uses shop data</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(TERMS_URL)}
            style={[styles.row, styles.divider]}
            accessibilityRole="link"
            accessibilityLabel="Terms and conditions"
          >
            <View style={styles.icon}>
              <Ionicons name="reader-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Terms and conditions</Text>
              <Text style={styles.hint} maxFontSizeMultiplier={FONT_SCALE.caption}>Seller agreement for Kerala Sellers</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('DeleteAccount')}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
          >
            <View style={styles.icon}>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.label, { color: COLORS.error }]} maxFontSizeMultiplier={FONT_SCALE.body}>
                Delete account
              </Text>
              <Text style={styles.hint} maxFontSizeMultiplier={FONT_SCALE.caption}>
                Close this seller account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </Card>

        <TouchableOpacity
          onPress={() =>
            Alert.alert('Logout', 'Sign out of this device?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: () => logout() },
            ])
          }
          style={styles.logout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.lg },
  group: { gap: SPACING.sm },
  groupTitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginLeft: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.inputBorder },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glassOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  label: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  logout: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  logoutText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.error },
});
