import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card, Header, LoadingState, Screen } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchCustomerHistory, fetchStoreCustomers } from '../../api/seller';
import { apiError, formatInr } from '../../lib/format';
import { useStoreAccess } from '../../hooks/useStoreAccess';
import type { MainStackScreenProps } from '../../navigation/types';

export default function CustomersScreen({ navigation }: MainStackScreenProps<'Customers'>) {
  const { can } = useStoreAccess();
  const [rows, setRows] = useState<{ phone: string; name: string; orders: number; total_purchases: number }[]>([]);
  const [history, setHistory] = useState<{ id: number; bill_number?: string; total_amount: number }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    try {
      setRows(await fetchStoreCustomers());
    } catch (err) {
      setError(apiError(err, 'Customers are not on the current plan.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = async (phone: string) => {
    if (!can('customers.view_history')) return;
    try {
      const data = await fetchCustomerHistory(phone);
      setHistory(data.orders || []);
    } catch (err) {
      setError(apiError(err, 'History is not on the current plan.'));
    }
  };

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Customers" subtitle="From bills and orders" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading…" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {rows.map((row) => (
          <TouchableOpacity key={row.phone} onPress={() => open(row.phone)} style={styles.item}>
            <Text style={styles.name}>{row.name || 'Customer'} · {row.phone}</Text>
            <Text style={styles.meta}>{row.orders} orders · {formatInr(row.total_purchases)}</Text>
          </TouchableOpacity>
        ))}
        {history.length > 0 ? (
          <Card>
            {history.map((row) => (
              <Text key={row.id} style={styles.meta}>{row.bill_number || row.id} · {formatInr(row.total_amount)}</Text>
            ))}
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.sm },
  error: { ...TYPOGRAPHY.body, color: COLORS.error },
  item: { paddingVertical: SPACING.sm },
  name: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.sm },
});
