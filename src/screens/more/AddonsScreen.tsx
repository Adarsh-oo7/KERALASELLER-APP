import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Badge, Button, Card, Header, LoadingState, Notice, Screen } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import {
  createAddonOrder,
  fetchAddons,
  fetchEntitlements,
  fetchSubscription,
  cancelAddon,
  verifyAddonPayment,
  type CatalogAddon,
  type EntitlementsPayload,
} from '../../api/seller';
import {
  addonBuyLabel,
  addonCapacityLines,
  addonCatalogIsEmpty,
  addonNeedHint,
  addonPurchaseCounts,
  collectAddonCatalog,
  partitionAddons,
} from '../../lib/addonAccess';
import { apiError, formatInr, httpStatus } from '../../lib/format';
import RazorpayCheckoutModal, { type RazorpayCheckoutOptions } from '../../lib/razorpayCheckout';
import { PRODUCTION_RAZORPAY_KEY_ID } from '../../config/public';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import type { MainStackScreenProps } from '../../navigation/types';

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || PRODUCTION_RAZORPAY_KEY_ID;

function isMissingCatalog(err: unknown): boolean {
  return httpStatus(err) === 404;
}

async function loadCatalog(): Promise<EntitlementsPayload> {
  const [entitlementsResult, addonsResult, subscriptionResult] = await Promise.allSettled([
    fetchEntitlements(),
    fetchAddons(),
    fetchSubscription(),
  ]);

  if (entitlementsResult.status === 'rejected' && !isMissingCatalog(entitlementsResult.reason)) {
    throw entitlementsResult.reason;
  }

  const entitlements = entitlementsResult.status === 'fulfilled' ? entitlementsResult.value : null;
  const publicAddons = addonsResult.status === 'fulfilled' ? addonsResult.value : [];
  const subscription = subscriptionResult.status === 'fulfilled' ? subscriptionResult.value : null;
  const billing = entitlements?.billing ?? subscription?.entitlements?.billing;

  return {
    commercially_active: entitlements?.commercially_active ?? Boolean(subscription?.is_active),
    plan_id: entitlements?.plan_id ?? subscription?.plan?.id ?? subscription?.entitlements?.plan_id ?? null,
    plan_name: entitlements?.plan_name || subscription?.plan_name || subscription?.plan?.name || subscription?.entitlements?.plan_name,
    features: entitlements?.features ?? subscription?.entitlements?.features ?? [],
    addons: collectAddonCatalog({
      entitlementsAddons: entitlements?.addons,
      publicAddons,
      activeAddons: billing?.active_addons,
    }) as CatalogAddon[],
    billing,
  };
}

function AddonCard({
  addon,
  badge,
  hint,
  actionLabel,
  disabled,
  loading,
  onPress,
}: {
  addon: CatalogAddon;
  badge?: string;
  hint?: string | null;
  actionLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
}) {
  const extras = addonCapacityLines(addon);
  return (
    <Card>
      <View style={styles.head}>
        <Text style={styles.name}>{addon.name}</Text>
        {badge ? (
          <Badge
            label={badge}
            tone={badge === 'Active' || badge === 'Included' || badge.startsWith('On this shop') ? 'success' : badge === 'Not on this plan' ? 'warning' : 'neutral'}
          />
        ) : null}
      </View>
      {addon.description ? <Text style={styles.meta}>{addon.description}</Text> : null}
      <Text style={styles.price}>
        {formatInr(Number(addon.price))}
        <Text style={styles.meta}> / {addon.billing_period === 'one_time' ? 'one time' : addon.billing_period || 'month'}</Text>
      </Text>
      {extras.map((line) => (
        <Text key={line} style={styles.meta}>• {line}</Text>
      ))}
      {hint ? <Text style={styles.meta}>{hint}</Text> : null}
      {actionLabel && onPress ? (
        <Button label={actionLabel} onPress={onPress} loading={loading} disabled={disabled} />
      ) : null}
    </Card>
  );
}

export default function AddonsScreen({ navigation }: MainStackScreenProps<'Addons'>) {
  const { requireOnline } = useOnlineGuard();
  const [data, setData] = useState<EntitlementsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [checkout, setCheckout] = useState<{ options: RazorpayCheckoutOptions; addonId: number } | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await loadCatalog());
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
  const purchaseCounts = useMemo(
    () => addonPurchaseCounts(billing?.active_addons),
    [billing],
  );
  const groups = useMemo(
    () => partitionAddons(data?.addons || [], {
      planId: data?.plan_id,
      activeIds: purchaseCounts.keys(),
      featureCodes: data?.features,
    }),
    [data, purchaseCounts],
  );
  const emptyCatalog = addonCatalogIsEmpty(groups);
  const canPurchase = Boolean(data?.commercially_active);

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Add-ons"
        subtitle={data?.plan_name ? `Add extras ${data.plan_name} does not already cover` : 'Buy only the extras this shop needs'}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading add-ons…" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Notice
          tone="info"
          title="Buy only what this shop needs"
          message="Your plan stays the same. Add a feature or extra product, staff, or location capacity only if this shop needs it. Capacity extras can be added more than once."
        />
        {!canPurchase && !loading ? (
          <Notice
            tone="warning"
            title="Take a plan first"
            message="Add-ons sit on top of an active plan. Choose a plan, then come back and buy only the extras this shop needs."
          />
        ) : null}
        <Card>
          <Text style={styles.kicker}>{data?.plan_name || 'Current plan'}</Text>
          <Text style={styles.total}>{formatInr(Number(billing?.monthly_total || 0))}</Text>
          <Text style={styles.meta}>
            Plan {formatInr(Number(billing?.base_plan_price || 0))} + add-ons {formatInr(Number(billing?.addons_price || 0))} this month. Pay this one total each month.
          </Text>
          {data?.official_url || data?.path_url ? (
            <Text style={styles.meta}>
              Shop URL: {data.official_url || data.path_url}
              {data.can_use_custom_subdomain ? '' : ' (path link until a subdomain add-on or plan is active)'}
            </Text>
          ) : null}
          {(billing?.active_addons || []).length ? (
            <View style={{ gap: 8, marginTop: 8 }}>
              {(billing?.active_addons || []).map((row) => (
                <View key={String(row.purchase_id || row.id)} style={styles.head}>
                  <Text style={styles.meta}>{row.name} · {formatInr(Number(row.price || 0))}/mo</Text>
                  <Button
                    label={removingId === (row.purchase_id || row.id) ? 'Removing…' : 'Remove'}
                    variant="ghost"
                    onPress={() => {
                      Alert.alert(
                        'Remove add-on',
                        `Stop ${row.name}? This month’s total will drop and a custom subdomain will be removed if it came from this extra.`,
                        [
                          { text: 'Keep', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => {
                              void (async () => {
                                setRemovingId(row.purchase_id || row.id || null);
                                try {
                                  await cancelAddon({ purchase_id: row.purchase_id, addon_id: row.id });
                                  await load();
                                } catch (err) {
                                  Alert.alert('Could not remove', apiError(err, 'Try again.'));
                                } finally {
                                  setRemovingId(null);
                                }
                              })();
                            },
                          },
                        ],
                      );
                    }}
                  />
                </View>
              ))}
            </View>
          ) : null}
          {!canPurchase && !loading ? (
            <Button label="View plans" onPress={() => navigation.navigate('Subscription')} />
          ) : null}
        </Card>

        {emptyCatalog ? (
          <Card>
            <Text style={styles.name}>No extras in the catalog yet</Text>
            <Text style={styles.meta}>
              When extra products, staff logins, GST, or locations are listed for this shop, they appear here so you can buy only what you need.
            </Text>
          </Card>
        ) : (
          <>
            <Text style={styles.section}>Add if this shop needs it</Text>
            {groups.compatible.length === 0 ? (
              <Text style={styles.meta}>Nothing extra to buy on this plan right now. Other extras are listed below.</Text>
            ) : null}
            {groups.compatible.map((addon) => {
              const count = purchaseCounts.get(addon.id) || 0;
              return (
                <AddonCard
                  key={addon.id}
                  addon={addon}
                  badge={count > 0 ? `On this shop ×${count}` : undefined}
                  hint={addonNeedHint(addon, count)}
                  actionLabel={canPurchase ? addonBuyLabel(addon, count) : undefined}
                  loading={buyingId === addon.id}
                  disabled={buyingId != null}
                  onPress={canPurchase ? () => pay(addon) : undefined}
                />
              );
            })}

            {groups.onPlan.length > 0 ? (
              <>
                <Text style={styles.section}>Already in this plan</Text>
                {groups.onPlan.map((addon) => (
                  <AddonCard
                    key={addon.id}
                    addon={addon}
                    badge="Included"
                    hint="This shop already has this on the current plan, so there is nothing extra to buy."
                  />
                ))}
              </>
            ) : null}

            {groups.included.length > 0 ? (
              <>
                <Text style={styles.section}>Already bought</Text>
                {groups.included.map((addon) => (
                  <AddonCard
                    key={addon.id}
                    addon={addon}
                    badge="Active"
                    hint="This extra is already on this shop. One purchase is enough."
                  />
                ))}
              </>
            ) : null}

            {groups.otherPlans.length > 0 ? (
              <>
                <Text style={styles.section}>Not on this plan</Text>
                <Text style={styles.meta}>These extras stay visible, but they cannot be added on the plan this shop is on.</Text>
                {groups.otherPlans.map((addon) => (
                  <AddonCard key={addon.id} addon={addon} badge="Not on this plan" />
                ))}
              </>
            ) : null}
          </>
        )}
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
