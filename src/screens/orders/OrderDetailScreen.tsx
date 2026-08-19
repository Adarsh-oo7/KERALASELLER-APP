import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Badge, Button, Card, Header, Input, LoadingState, Screen, ErrorState } from '../../components';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchOrder, updateOrderStatus, type Order } from '../../api/seller';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import { apiError, formatDate, formatInr } from '../../lib/format';
import type { MainStackScreenProps } from '../../navigation/types';

const NEXT: Record<string, string | null> = {
  PENDING: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
  DELIVERED: null,
  CANCELLED: null,
};

export default function OrderDetailScreen({ navigation, route }: MainStackScreenProps<'OrderDetail'>) {
  const { orderId } = route.params;
  const { requireOnline } = useOnlineGuard();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchOrder(orderId);
      setOrder(data);
      setProvider(data.shipping_provider || '');
      setTracking(data.tracking_id || '');
      setNotes(data.shipping_notes || '');
    } catch (err) {
      setError(apiError(err, 'Could not load this order.'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const advance = async () => {
    if (!requireOnline('Updating an order')) return;
    if (!order) return;
    const next = NEXT[order.status];
    if (!next) return;
    if (next === 'SHIPPED' && (!provider.trim() || !tracking.trim())) {
      Alert.alert('Shipping details', 'Courier name and tracking ID are required to mark as shipped.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateOrderStatus(order.id, {
        status: next,
        shipping_provider: provider.trim(),
        tracking_id: tracking.trim(),
        shipping_notes: notes.trim(),
      });
      setOrder(updated);
    } catch (err) {
      Alert.alert('Could not update', apiError(err, 'Try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading order…" />;

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title={`Order #${orderId}`}
        subtitle={order?.customer_name || 'Customer'}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {order ? (
          <>
            <Card>
              <View style={styles.row}>
                <Text style={styles.label}>Status</Text>
                <Badge label={order.status} tone="info" />
              </View>
              <Text style={styles.value}>{formatInr(order.total_amount)}</Text>
              <Text style={styles.meta}>{formatDate(order.created_at)} · {order.payment_method || 'COD'}</Text>
              {order.customer_phone ? <Text style={styles.meta}>Phone {order.customer_phone}</Text> : null}
              {order.shipping_address ? <Text style={styles.meta}>{order.shipping_address}</Text> : null}
            </Card>

            <Card>
              <Text style={styles.heading}>Items</Text>
              {(order.items || []).map((item) => (
                <View key={item.id} style={styles.item}>
                  <Text style={styles.itemName}>{item.product?.name || 'Item'} × {item.quantity}</Text>
                  <Text style={styles.itemPrice}>{formatInr(item.item_total ?? Number(item.price) * item.quantity)}</Text>
                </View>
              ))}
            </Card>

            {NEXT[order.status] === 'SHIPPED' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? (
              <Card>
                <Text style={styles.heading}>Shipping</Text>
                <Input label="Courier" value={provider} onChangeText={setProvider} placeholder="Delhivery, DTDC…" />
                <Input label="Tracking ID" value={tracking} onChangeText={setTracking} />
                <Input label="Notes" value={notes} onChangeText={setNotes} />
              </Card>
            ) : null}

            {NEXT[order.status] ? (
              <Button
                label={`Mark as ${NEXT[order.status]}`}
                onPress={advance}
                loading={saving}
                disabled={saving}
              />
            ) : (
              <Text style={styles.meta}>This order is complete.</Text>
            )}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  value: { ...TYPOGRAPHY.title, color: COLORS.primary, marginTop: SPACING.sm },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  heading: { ...TYPOGRAPHY.heading, color: COLORS.textPrimary, marginBottom: SPACING.md },
  item: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  itemName: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, flex: 1, paddingRight: SPACING.md },
  itemPrice: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
});
