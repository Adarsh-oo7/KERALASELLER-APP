import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Badge, Button, Card, Header, LoadingState, Notice, Screen } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import {
  createAddonOrder,
  fetchEntitlements,
  verifyAddonPayment,
  type CatalogAddon,
  type EntitlementsPayload,
} from '../../api/seller';
import { apiError, formatInr } from '../../lib/format';
import { humanizeFeatureCode } from '../../lib/planDetails';
import RazorpayCheckoutModal, { type RazorpayCheckoutOptions } from '../../lib/razorpayCheckout';
import { PRODUCTION_RAZORPAY_KEY_ID } from '../../config/public';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import type { MainStackScreenProps } from '../../navigation/types';

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || PRODUCTION_RAZORPAY_KEY_ID;

function addonCapacity(addon: CatalogAddon): string[] {
  const lines: string[] = [];
  if (addon.extra_product_limit) lines.push(`+${addon.extra_product_limit} products`);
  if (addon.extra_staff_limit) lines.push(`+${addon.extra_staff_limit} staff`);
  if (addon.extra_branch_limit) lines.push(`+${addon.extra_branch_limit} location${addon.extra_branch_limit === 1 ? '' : 's'}`);
  (addon.feature_codes || []).forEach((code) => lines.push(humanizeFeatureCode(code)));
  return lines;
}

export default function AddonsScreen({ navigation }: MainStackScreenProps<'Addons'>) {
  const { requireOnline } = useOnlineGuard();
  const [data, setData] = useState<EntitlementsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [checkout, setCheckout] = useState<{ options: RazorpayCheckoutOptions; addonId: number } | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await fetchEntitlements());
    } catch (err) {
      setError(apiError(err, 'Could not load add-ons.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pay = async (addon: CatalogAddon) => {
    if (!requireOnline('Buying an add-on')) return;
    if (!RAZORPAY_KEY_ID) {
      Alert.alert('Payment unavailable', 'Razorpay key is missing.');
      return;
    }
    setBuyingId(addon.id);
    try {
      const order = await createAddonOrder(addon.id);
      const stored = await AsyncStorage.getItem('sellerData');
      const seller = stored ? (JSON.parse(stored) as { name?: string; email?: string; phone?: string }) : {};
      setCheckout({
        addonId: addon.id,
        options: {
          key: order.key_id || RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency || 'INR',
          order_id: order.order_id,
          name: 'Kerala Sellers',
          description: addon.name,
          prefill: {
            name: seller.name || 'Kerala Seller',
            email: seller.email,
            contact: seller.phone,
          },
        },
      });
    } catch (err) {
      Alert.alert('Could not start payment', apiError(err, 'Try again.'));
      setBuyingId(null);
    }
  };

  const onCheckoutSuccess = async (payload: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    const pending = checkout;
    setCheckout(null);
    if (!pending) {
      setBuyingId(null);
      return;
    }
    try {
      await verifyAddonPayment({ ...payload, addon_id: pending.addonId });
      Alert.alert('Add-on active', 'This extra is now on your shop.');
      await load();
    } catch (err) {
      Alert.alert(
        'Verification failed',
        apiError(err, 'If money was deducted, contact support with your payment id.'),
      );
    } finally {
      setBuyingId(null);
    }
  };

  const billing = data?.billing;
  const activeIds = new Set((billing?.active_addons || []).map((item) => item.id));
  const addons = data?.addons || [];

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Add-ons"
        subtitle="Extra capacity on top of your plan"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading add-ons…" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Notice
          tone="info"
          title="Same extras as the web dashboard"
          message="Prices and unlocks come from your shop entitlements. Staff, locations, GST, and similar extras appear here when they are in the catalog."
        />
        <Card>
          <Text style={styles.kicker}>This month</Text>
          <Text style={styles.total}>
            {formatInr(Number(billing?.monthly_total || 0))}
          </Text>
          <Text style={styles.meta}>
            Plan {formatInr(Number(billing?.base_plan_price || 0))} + add-ons {formatInr(Number(billing?.addons_price || 0))}
          </Text>
        </Card>

        <Text style={styles.section}>Active</Text>
        {(billing?.active_addons || []).length === 0 ? (
          <Text style={styles.meta}>No add-ons yet.</Text>
        ) : (billing?.active_addons || []).map((item) => (
          <Card key={String(item.purchase_id || item.id)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {formatInr(Number(item.price))} / {item.billing_period || 'month'}
              {item.end_date ? ` · until ${item.end_date.slice(0, 10)}` : ''}
            </Text>
          </Card>
        ))}

        <Text style={styles.section}>Available</Text>
        {addons.map((addon) => {
          const owned = activeIds.has(addon.id);
          const extras = addonCapacity(addon);
          return (
            <Card key={addon.id}>
              <View style={styles.head}>
                <Text style={styles.name}>{addon.name}</Text>
                {owned ? <Badge label="Active" tone="success" /> : null}
              </View>
              {addon.description ? <Text style={styles.meta}>{addon.description}</Text> : null}
              <Text style={styles.price}>
                {formatInr(Number(addon.price))}
                <Text style={styles.meta}> / {addon.billing_period === 'one_time' ? 'one time' : addon.billing_period || 'month'}</Text>
              </Text>
              {extras.map((line) => (
                <Text key={line} style={styles.meta}>• {line}</Text>
              ))}
              <Button
                label={owned ? 'Buy again' : `Add ${addon.name}`}
                onPress={() => pay(addon)}
                loading={buyingId === addon.id}
                disabled={buyingId != null}
              />
            </Card>
          );
        })}
      </View>
      <RazorpayCheckoutModal
        visible={Boolean(checkout)}
        options={checkout?.options ?? null}
        onSuccess={onCheckoutSuccess}
        onCancel={(message) => {
          setCheckout(null);
          setBuyingId(null);
          if (message) Alert.alert('Payment cancelled', message);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  kicker: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  section: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, marginTop: SPACING.sm },
  total: { ...TYPOGRAPHY.heading, color: COLORS.primary, marginTop: 4 },
  name: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, flex: 1 },
  price: { ...TYPOGRAPHY.title, color: COLORS.primary, marginVertical: 4 },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  error: { ...TYPOGRAPHY.body, color: COLORS.error },
});
