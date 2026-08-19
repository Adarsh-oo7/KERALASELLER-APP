import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { Avatar, Badge, Card, Header, LoadingState, OnboardingChecklist, Screen } from '../../components';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchDashboard, fetchSellingStatus, type DashboardPayload, type OnboardingStatus } from '../../api/seller';
import { formatInr } from '../../lib/format';
import { consumeOpenSetupAfterRegister } from '../../lib/setupFlow';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import type { MainTabScreenProps } from '../../navigation/types';

type Shortcut = {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function DashboardScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { logout } = useAuth();
  const { requireOnline } = useOnlineGuard();
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [sellerName, setSellerName] = useState('Seller');
  const [shopName, setShopName] = useState('Shop');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      const stored = await AsyncStorage.getItem('sellerData');
      if (stored) {
        const seller = JSON.parse(stored) as { name?: string; shop_name?: string };
        if (seller.name) setSellerName(seller.name);
        if (seller.shop_name) setShopName(seller.shop_name);
      }
      const [data, merged] = await Promise.all([
        fetchDashboard(),
        fetchSellingStatus().catch(() => null),
      ]);
      setPayload(data);
      if (data.seller?.name) setSellerName(data.seller.name);
      if (data.seller?.shop_name) setShopName(data.seller.shop_name);
      setOnboarding(merged);
      if (!opts?.silent) {
        const openSetup = await consumeOpenSetupAfterRegister();
        if (openSetup && !merged?.is_ready_to_sell && !merged?.requirements?.is_live) {
          navigation.navigate('Settings', { setup: true });
        }
      }
    } catch (error) {
      const statusCode = (error as { response?: { status?: number } }).response?.status;
      if (statusCode !== 401) {
        console.warn('Dashboard load failed', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load({ silent: true });
  }, [load]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading) {
    return <LoadingState message="Loading Dashboard…" />;
  }

  const analytics = payload?.analytics;
  const ready = Boolean(onboarding?.is_ready_to_sell || onboarding?.requirements?.is_live);
  const blockedMessage = 'Finish store profile, Razorpay, and subscription before adding products.';
  const shortcuts: Shortcut[] = [
  { label: 'New bill', hint: 'Walk-in · 3-day offline', icon: 'cash-outline', onPress: () => navigation.navigate('Billing') },
    {
      label: 'Add product',
      hint: ready ? 'Catalogue' : 'Complete setup first',
      icon: 'add-circle-outline',
      onPress: () => {
        if (!requireOnline('Adding a product')) return;
        if (!ready) {
          Alert.alert('Shop not live yet', blockedMessage);
          return;
        }
        navigation.navigate('ProductForm', {});
      },
    },
    { label: 'Payments', hint: 'Razorpay & payouts', icon: 'card-outline', onPress: () => navigation.navigate('Payments') },
    { label: 'Store settings', hint: 'Basic, advanced, delivery', icon: 'settings-outline', onPress: () => navigation.navigate('Settings') },
    { label: 'Alerts', hint: 'Buyer messages', icon: 'notifications-outline', onPress: () => navigation.navigate('Notifications') },
    { label: 'Analytics', hint: 'Sales snapshot', icon: 'stats-chart-outline', onPress: () => navigation.navigate('Analytics') },
  ];

  return (
    <Screen
      scroll
      edges={['bottom']}
      gradient={false}
      statusBarStyle="light-content"
      contentContainerStyle={{ flexGrow: 1 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Header
        tone="brand"
        eyebrow="Welcome back"
        title={sellerName}
        subtitle={shopName}
        action={{
          icon: 'log-out-outline',
          onPress: handleLogout,
          accessibilityLabel: 'Log out',
        }}
      />

      <View style={styles.content}>
        <View style={styles.stats}>
          <Stat label="Revenue" value={formatInr(analytics?.total_revenue)} />
          <Stat label="Orders" value={String(analytics?.total_orders ?? 0)} />
          <Stat label="Products" value={String(analytics?.total_products ?? 0)} />
          <Stat label="New" value={String(analytics?.new_orders_count ?? 0)} />
        </View>

        <OnboardingChecklist
          status={onboarding}
          onOpenProfile={() => navigation.navigate('Settings', { setup: true })}
          onOpenPayments={() => navigation.navigate('Payments', { setup: true })}
          onOpenSubscription={() => navigation.navigate('Subscription', { setup: true })}
        />

        <Card>
          <Text style={styles.cardTitle} maxFontSizeMultiplier={FONT_SCALE.heading}>
            Daily tools
          </Text>
          <View style={styles.grid}>
            {shortcuts.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                style={styles.tile}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityHint={item.hint}
              >
                <View style={styles.tileIcon}>
                  <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.tileLabel} maxFontSizeMultiplier={FONT_SCALE.body}>
                  {item.label}
                </Text>
                <Text style={styles.tileHint} maxFontSizeMultiplier={FONT_SCALE.caption}>
                  {item.hint}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card glass>
          <View style={styles.identity}>
            <Avatar name={sellerName} size="md" />
            <View style={{ flex: 1 }}>
              <Text style={styles.identityName} maxFontSizeMultiplier={FONT_SCALE.body}>
                {sellerName}
              </Text>
              <Text style={styles.identityShop} maxFontSizeMultiplier={FONT_SCALE.caption}>
                {shopName}
              </Text>
            </View>
            <Badge label="Seller" tone="success" />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.statValue} maxFontSizeMultiplier={FONT_SCALE.heading} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} maxFontSizeMultiplier={FONT_SCALE.caption}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  stat: {
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    minHeight: MIN_TOUCH_TARGET + 16,
  },
  statValue: {
    ...TYPOGRAPHY.heading,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardTitle: {
    ...TYPOGRAPHY.heading,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    minHeight: 96,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    padding: SPACING.md,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glassOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  tileLabel: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.textPrimary,
  },
  tileHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  identityName: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.textPrimary,
  },
  identityShop: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
