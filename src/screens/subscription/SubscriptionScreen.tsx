import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Badge, Button, Card, Chip, Header, LoadingState, Notice, Screen } from '../../components';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';
import {
  createSubscriptionOrder,
  fetchPlans,
  fetchSellingStatus,
  fetchSubscription,
  verifySubscriptionPayment,
  type CurrentSubscription,
  type SubscriptionPlan,
} from '../../api/seller';
import { apiError, formatInr } from '../../lib/format';
import {
  catalogPlanFor,
  namedFeaturesFor,
  planDetailLines,
  type PlanLimits,
} from '../../lib/planDetails';
import RazorpayCheckoutModal, { type RazorpayCheckoutOptions } from '../../lib/razorpayCheckout';
import { skipSetupToDashboard } from '../../lib/setupFlow';
import { PRODUCTION_RAZORPAY_KEY_ID } from '../../config/public';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import type { MainStackScreenProps } from '../../navigation/types';

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || PRODUCTION_RAZORPAY_KEY_ID;

type BillingCycle = 'monthly' | 'yearly';

function PlanDetailList({
  plan,
  entitlementCodes,
  limits,
  officialUrl,
  pathUrl,
}: {
  plan: SubscriptionPlan | null | undefined;
  entitlementCodes?: string[] | null;
  limits?: PlanLimits | null;
  officialUrl?: string | null;
  pathUrl?: string | null;
}) {
  const lines = planDetailLines(plan, { limits, officialUrl, pathUrl });
  const features = namedFeaturesFor(plan, entitlementCodes);
  if (!lines.length && !features.length) return null;
  return (
    <View style={styles.details}>
      {lines.map((item) => (
        <Text key={item.key} style={styles.meta}>{item.text}</Text>
      ))}
      {features.map((item) => (
        <Text key={item.code} style={styles.meta}>• {item.name}</Text>
      ))}
    </View>
  );
}

function planPrice(plan: SubscriptionPlan, cycle: BillingCycle): number {
  const monthly = Number(plan.price) || 0;
  if (cycle === 'yearly') return Number(plan.yearly_price) || monthly * 12 * 0.9;
  return monthly;
}

export default function SubscriptionScreen({ navigation, route }: MainStackScreenProps<'Subscription'>) {
  const setup = Boolean(route.params?.setup);
  const { requireOnline } = useOnlineGuard();
  const [current, setCurrent] = useState<CurrentSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [payingId, setPayingId] = useState<number | null>(null);
  const [checkout, setCheckout] = useState<{
    options: RazorpayCheckoutOptions;
    planId: number;
    cycle: BillingCycle;
  } | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [sub, list, selling] = await Promise.all([
        fetchSubscription(),
        fetchPlans(),
        fetchSellingStatus().catch(() => null),
      ]);
      setCurrent(sub);
      setPlans(list);
      setSubscribed(Boolean(selling?.requirements?.subscription?.complete || sub?.is_active));
    } catch (err) {
      setError(apiError(err, 'Could not load subscription.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pay = async (plan: SubscriptionPlan) => {
    if (!requireOnline('Paying for a plan')) return;
    if (!RAZORPAY_KEY_ID) {
      Alert.alert('Payment unavailable', 'Razorpay key is missing. Restart the app after checking .env.');
      return;
    }
    const amount = planPrice(plan, billingCycle);
    Alert.alert(
      `Subscribe to ${plan.name}`,
      `${formatInr(amount)} / ${billingCycle === 'yearly' ? 'year' : 'month'}\nContinue to secure Razorpay checkout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            setPayingId(plan.id);
            try {
              const order = await createSubscriptionOrder({
                plan_id: plan.id,
                billing_cycle: billingCycle,
              });
              const stored = await AsyncStorage.getItem('sellerData');
              const seller = stored ? (JSON.parse(stored) as { name?: string; email?: string; phone?: string }) : {};
              setCheckout({
                planId: plan.id,
                cycle: billingCycle,
                options: {
                  key: RAZORPAY_KEY_ID,
                  amount: order.amount,
                  currency: order.currency || 'INR',
                  order_id: order.order_id,
                  name: 'Kerala Sellers',
                  description: `${plan.name} · ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`,
                  prefill: {
                    name: seller.name || 'Kerala Seller',
                    email: seller.email,
                    contact: seller.phone,
                  },
                },
              });
            } catch (err) {
              Alert.alert('Could not start payment', apiError(err, 'Try again.'));
              setPayingId(null);
            }
          },
        },
      ],
    );
  };

  const onCheckoutSuccess = async (payload: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    const pending = checkout;
    setCheckout(null);
    if (!pending) {
      setPayingId(null);
      return;
    }
    try {
      await verifySubscriptionPayment({
        ...payload,
        plan_id: pending.planId,
        billing_cycle: pending.cycle,
      });
      Alert.alert('Payment successful', 'Your subscription is now active.');
      await load();
    } catch (err) {
      Alert.alert(
        'Verification failed',
        apiError(err, 'If money was deducted, contact support with your payment id.'),
      );
    } finally {
      setPayingId(null);
    }
  };

  const planName = current?.plan_name || current?.plan?.name || 'No active plan';
  const status = current?.is_active ? 'Active' : current ? 'Inactive' : 'None';
  const currentPlanId = current?.plan?.id;
  const currentPlan = catalogPlanFor(current, plans) || current?.plan || null;

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Subscription" subtitle="Pay in the app with Razorpay" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading plan…" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Card>
          <Text style={styles.kicker}>Current plan</Text>
          <Text style={styles.title} maxFontSizeMultiplier={FONT_SCALE.heading}>{planName}</Text>
          <Text style={styles.meta}>
            {subscribed || current?.is_active ? 'Active' : status}
            {current?.days_remaining != null && current.is_active
              ? ` · ${current.days_remaining} days left`
              : ''}
          </Text>
          <PlanDetailList
            plan={currentPlan}
            entitlementCodes={current?.entitlements?.features}
            limits={current?.entitlements?.limits}
            officialUrl={current?.entitlements?.official_url}
            pathUrl={current?.entitlements?.path_url}
          />
        </Card>

        <View style={styles.cycle}>
          <Chip label="Monthly" selected={billingCycle === 'monthly'} onPress={() => setBillingCycle('monthly')} />
          <Chip label="Yearly (10% off)" selected={billingCycle === 'yearly'} onPress={() => setBillingCycle('yearly')} />
        </View>

        {plans.map((plan) => {
          const amount = planPrice(plan, billingCycle);
          const isCurrent = currentPlanId === plan.id && Boolean(current?.is_active);
          return (
            <Card key={String(plan.id)}>
              <View style={styles.planHead}>
                <Text style={styles.planName}>{plan.name}</Text>
                {isCurrent ? <Badge label="Current" tone="success" /> : null}
                {!isCurrent && plan.is_popular ? <Badge label="Popular" tone="info" /> : null}
              </View>
              <Text style={styles.price}>
                {formatInr(amount)}
                <Text style={styles.meta}> / {billingCycle === 'yearly' ? 'year' : 'month'}</Text>
              </Text>
              {billingCycle === 'yearly' && plan.yearly_savings ? (
                <Text style={styles.meta}>Save {formatInr(plan.yearly_savings)} vs monthly</Text>
              ) : null}
              <PlanDetailList plan={plan} />
              <Button
                label={isCurrent ? 'Renew this plan' : `Subscribe to ${plan.name}`}
                onPress={() => pay(plan)}
                loading={payingId === plan.id}
                disabled={payingId != null}
              />
            </Card>
          );
        })}

        {!subscribed ? (
          <>
            <Notice
              tone="info"
              title="You can finish this later"
              message="Skip does not unlock products or your public shop link. Your dashboard checklist will keep this step outstanding."
            />
            <Button
              label="Skip for now"
              variant="ghost"
              onPress={() => skipSetupToDashboard(navigation)}
            />
          </>
        ) : setup ? (
          <Button label="Back to dashboard" variant="secondary" onPress={() => skipSetupToDashboard(navigation)} />
        ) : null}
      </View>
      <RazorpayCheckoutModal
        visible={Boolean(checkout)}
        options={checkout?.options ?? null}
        onSuccess={onCheckoutSuccess}
        onCancel={(message) => {
          setCheckout(null);
          setPayingId(null);
          if (message) Alert.alert('Payment cancelled', message);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  kicker: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  title: { ...TYPOGRAPHY.title, color: COLORS.textPrimary, marginTop: 4 },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  details: { marginTop: 4 },
  cycle: { flexDirection: 'row', flexWrap: 'wrap' },
  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  planName: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, flex: 1 },
  price: { ...TYPOGRAPHY.heading, color: COLORS.primary, marginVertical: 4 },
  error: { ...TYPOGRAPHY.body, color: COLORS.error },
});
