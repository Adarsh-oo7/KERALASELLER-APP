import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card, ErrorState, Header, LoadingState, Screen } from '../../components';
import { COLORS, FONT_SCALE, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchDashboard, fetchOrders, fetchProducts, fetchReportAdvanced, fetchReportProfit } from '../../api/seller';
import { apiError, formatInr } from '../../lib/format';
import type { MainStackScreenProps } from '../../navigation/types';

export default function AnalyticsScreen({ navigation }: MainStackScreenProps<'Analytics'>) {
  const [revenue, setRevenue] = useState(0);
  const [orders, setOrders] = useState(0);
  const [products, setProducts] = useState(0);
  const [pending, setPending] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [profit, setProfit] = useState('');
  const [top, setTop] = useState<{ name: string; sold: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [dash, orderList, productList] = await Promise.all([
        fetchDashboard(),
        fetchOrders({ ordering: '-created_at' }),
        fetchProducts(),
      ]);
      setRevenue(Number(dash.analytics?.total_revenue ?? 0));
      setOrders(Number(dash.analytics?.total_orders ?? orderList.length));
      setProducts(Number(dash.analytics?.total_products ?? productList.length));
      setPending(Number(dash.analytics?.new_orders_count ?? orderList.filter((o) => o.status === 'PENDING').length));
      setLowStock(productList.filter((p) => p.online_stock > 0 && p.online_stock <= 5).length);
      setTop(
        (dash.analytics?.top_selling_products || []).map((row) => ({
          name: row.product__name || 'Product',
          sold: Number(row.total_sold ?? 0),
        })),
      );
      const advanced = await fetchReportAdvanced().catch(() => null);
      if (advanced?.bestsellers?.length) {
        setTop(advanced.bestsellers.map((row: { name: string; qty: number }) => ({ name: row.name, sold: row.qty })));
      }
      const profitRow = await fetchReportProfit().catch(() => null);
      if (profitRow) {
        setProfit(`Est. profit ${formatInr(profitRow.estimated_profit)}`);
      }
    } catch (err) {
      setError(apiError(err, 'Could not load analytics.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const stats = useMemo(
    () => [
      { label: 'Revenue', value: formatInr(revenue) },
      { label: 'Orders', value: String(orders) },
      { label: 'Products', value: String(products) },
      { label: 'Pending', value: String(pending) },
      { label: 'Low stock', value: String(lowStock) },
    ],
    [revenue, orders, products, pending, lowStock],
  );

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Analytics" subtitle="A simple snapshot of your shop" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading analytics…" /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        <View style={styles.grid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={styles.value} maxFontSizeMultiplier={FONT_SCALE.heading}>{stat.value}</Text>
              <Text style={styles.label}>{stat.label}</Text>
            </View>
          ))}
        </View>
        {profit ? <Text style={styles.label}>{profit}</Text> : null}
        <Card>
          <Text style={styles.heading}>Top sellers</Text>
          {top.length === 0 ? (
            <Text style={styles.label}>No delivered sales yet.</Text>
          ) : (
            top.map((item) => (
              <View key={item.name} style={styles.topRow}>
                <Text style={styles.topName}>{item.name}</Text>
                <Text style={styles.topSold}>{item.sold} sold</Text>
              </View>
            ))
          )}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  stat: {
    minWidth: '45%',
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  value: { ...TYPOGRAPHY.heading, color: COLORS.primary },
  label: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  heading: { ...TYPOGRAPHY.heading, color: COLORS.textPrimary, marginBottom: SPACING.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  topName: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, flex: 1, paddingRight: SPACING.md },
  topSold: { ...TYPOGRAPHY.bodyStrong, color: COLORS.primary },
});
