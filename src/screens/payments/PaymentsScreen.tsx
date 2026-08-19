import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Badge, Button, Card, Header, Input, LoadingState, Notice, Screen } from '../../components';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';
import { connectRazorpay, fetchGatewayStatus, fetchPayoutHistory, fetchSellingStatus } from '../../api/seller';
import { apiError, asList, formatInr } from '../../lib/format';
import { skipSetupToDashboard } from '../../lib/setupFlow';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import type { MainStackScreenProps } from '../../navigation/types';

export default function PaymentsScreen({ navigation, route }: MainStackScreenProps<'Payments'>) {
  const setup = Boolean(route.params?.setup);
  const { requireOnline } = useOnlineGuard();
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhook, setWebhook] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [subscriptionReady, setSubscriptionReady] = useState(false);

  const connected = Boolean(status?.is_ready || status?.is_ready_for_payment);

  const load = useCallback(async () => {
    try {
      const [gateway, payouts, selling] = await Promise.all([
        fetchGatewayStatus().catch(() => ({}) as Record<string, unknown>),
        fetchPayoutHistory().catch(() => []),
        fetchSellingStatus().catch(() => null),
      ]);
      setStatus(gateway);
      setHistory(asList<Record<string, unknown>>(payouts));
      setSubscriptionReady(Boolean(selling?.requirements?.subscription?.complete));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const continueSetup = () => {
    if (!subscriptionReady) {
      navigation.navigate('Subscription', { setup: true });
      return;
    }
    skipSetupToDashboard(navigation);
  };

  const connect = async () => {
    if (!requireOnline('Connecting Razorpay')) return;
    if (!keyId.trim() || !keySecret.trim()) {
      Alert.alert('Required', 'Key ID and secret are required.');
      return;
    }
    setSaving(true);
    try {
      await connectRazorpay({
        key_id: keyId.trim(),
        key_secret: keySecret.trim(),
        webhook_secret: webhook.trim() || null,
      });
      setKeySecret('');
      setWebhook('');
      setShowKeyForm(false);
      Alert.alert('Connected', 'Razorpay is set up for online checkout.');
      await load();
      if (setup) {
        const selling = await fetchSellingStatus().catch(() => null);
        if (!selling?.requirements?.subscription?.complete) {
          navigation.navigate('Subscription', { setup: true });
        } else {
          skipSetupToDashboard(navigation);
        }
      }
    } catch (err) {
      Alert.alert('Could not connect', apiError(err, 'Check the keys and try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading payments…" />;

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Payments"
        subtitle={connected ? 'Online checkout is ready' : 'Connect Razorpay to go live'}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Card>
          <View style={styles.row}>
            <Text style={styles.heading}>Razorpay</Text>
            <Badge label={connected ? 'Connected' : 'Not connected'} tone={connected ? 'success' : 'warning'} />
          </View>

          {connected && !showKeyForm ? (
            <>
              <Text style={styles.help}>
                Your Razorpay account is connected. Customers can pay online. Keys stay hidden for security.
              </Text>
              {setup && !subscriptionReady ? (
                <Button label="Continue to subscription" onPress={continueSetup} />
              ) : setup ? (
                <Button label="Back to dashboard" variant="secondary" onPress={() => skipSetupToDashboard(navigation)} />
              ) : null}
              <Button label="Change keys" variant="ghost" onPress={() => setShowKeyForm(true)} />
            </>
          ) : (
            <>
              <Text style={styles.help}>
                Add Key ID and Secret from your Razorpay dashboard. Your shop cannot go live until this is connected.
              </Text>
              <Input label="Key ID" value={keyId} onChangeText={setKeyId} autoCapitalize="none" placeholder="rzp_live_…" />
              <Input label="Key secret" value={keySecret} onChangeText={setKeySecret} secure autoCapitalize="none" />
              <Input label="Webhook secret (optional)" value={webhook} onChangeText={setWebhook} secure autoCapitalize="none" />
              <Button
                label={connected ? 'Update Razorpay' : 'Connect Razorpay'}
                onPress={connect}
                loading={saving}
                disabled={saving}
              />
              {connected ? (
                <Button label="Cancel" variant="ghost" onPress={() => setShowKeyForm(false)} />
              ) : (
                <>
                  <Notice
                    tone="info"
                    title="You can finish this later"
                    message="Skip does not unlock products or your public shop link. Connect Razorpay from the dashboard checklist whenever you are ready."
                  />
                  <Button
                    label="Skip for now"
                    variant="ghost"
                    onPress={() => skipSetupToDashboard(navigation)}
                  />
                </>
              )}
            </>
          )}
        </Card>

        <Card>
          <Text style={styles.heading}>Recent payouts</Text>
          {history.length === 0 ? (
            <Text style={styles.help}>No payout history yet.</Text>
          ) : (
            history.slice(0, 8).map((item, index) => (
              <View key={String(item.id ?? index)} style={styles.payout}>
                <Text style={styles.payoutTitle}>{String(item.status ?? item.id ?? 'Payout')}</Text>
                <Text style={styles.help}>
                  {item.amount != null ? formatInr(item.amount as number) : ''}
                </Text>
              </View>
            ))
          )}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  heading: { ...TYPOGRAPHY.heading, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  help: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.md },
  payout: { marginBottom: SPACING.sm },
  payoutTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
});
