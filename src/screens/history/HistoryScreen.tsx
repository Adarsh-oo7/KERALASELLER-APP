import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card, EmptyState, ErrorState, Header, LoadingState, Screen } from '../../components';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchStockHistory, type StockHistoryItem } from '../../api/seller';
import { apiError, formatDate } from '../../lib/format';
import type { MainStackScreenProps } from '../../navigation/types';

export default function HistoryScreen({ navigation }: MainStackScreenProps<'History'>) {
  const [items, setItems] = useState<StockHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(await fetchStockHistory());
    } catch (err) {
      setError(apiError(err, 'Could not load stock history.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const nameOf = (item: StockHistoryItem) =>
    typeof item.product === 'object' && item.product ? item.product.name : `Product ${item.product ?? ''}`;

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Stock history" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading history…" /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState title="No stock changes yet" />
        ) : null}
        {items.map((item) => (
          <Card key={item.id}>
            <Text style={styles.name} maxFontSizeMultiplier={FONT_SCALE.body}>{nameOf(item)}</Text>
            <Text style={styles.meta}>{item.action || 'Updated'} · {formatDate(item.timestamp)}</Text>
            <Text style={styles.meta}>
              Shop {item.change_total ?? 0} · Online {item.change_online ?? 0}
            </Text>
            {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  name: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  note: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, marginTop: SPACING.sm },
});
