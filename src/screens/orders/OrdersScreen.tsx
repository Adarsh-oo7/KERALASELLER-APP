import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Badge, Card, Chip, EmptyState, ErrorState, Header, LoadingState, Screen } from '../../components';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchOrders, type Order } from '../../api/seller';
import { apiError, formatDate, formatInr } from '../../lib/format';
import type { MainTabScreenProps } from '../../navigation/types';

const STATUSES = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersScreen({ navigation }: MainTabScreenProps<'Orders'>) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const params: Record<string, string> = { ordering: '-created_at' };
      if (status !== 'ALL') params.status = status;
      setOrders(await fetchOrders(params));
    } catch (err) {
      setError(apiError(err, 'Could not load orders.'));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const toneFor = (value: string) => {
    if (value === 'DELIVERED') return 'success' as const;
    if (value === 'CANCELLED') return 'error' as const;
    if (value === 'PENDING') return 'warning' as const;
    return 'info' as const;
  };

  const list = useMemo(() => orders, [orders]);

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Orders" subtitle="Online and shop bills" />
      <View style={styles.content}>
        <View style={styles.filters}>
          {STATUSES.map((item) => (
            <Chip key={item} label={item === 'ALL' ? 'All' : item} selected={status === item} onPress={() => setStatus(item)} />
          ))}
        </View>
        {loading ? <LoadingState message="Loading orders…" /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && list.length === 0 ? (
          <EmptyState icon="receipt-outline" title="No orders" message="New online orders will show up here." />
        ) : null}
        {list.map((order) => (
          <TouchableOpacity
            key={order.id}
            onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            accessibilityRole="button"
            accessibilityLabel={`Order ${order.id}`}
          >
            <Card>
              <View style={styles.row}>
                <Text style={styles.id} maxFontSizeMultiplier={FONT_SCALE.body}>
                  #{order.id}
                </Text>
                <Badge label={order.status} tone={toneFor(order.status)} />
              </View>
              <Text style={styles.name} maxFontSizeMultiplier={FONT_SCALE.body}>
                {order.customer_name || 'Customer'}
              </Text>
              <Text style={styles.meta} maxFontSizeMultiplier={FONT_SCALE.caption}>
                {formatDate(order.created_at)} · {order.payment_method || 'COD'}
              </Text>
              <Text style={styles.amount} maxFontSizeMultiplier={FONT_SCALE.heading}>
                {order.formatted_total || formatInr(order.total_amount)}
              </Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  filters: { flexDirection: 'row', flexWrap: 'wrap' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  id: { ...TYPOGRAPHY.label, color: COLORS.textSecondary },
  name: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  amount: { ...TYPOGRAPHY.heading, color: COLORS.primary, marginTop: SPACING.sm },
});
