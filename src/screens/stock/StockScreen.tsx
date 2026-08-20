import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Badge, Button, Card, Chip, EmptyState, ErrorState, Header, Input, LoadingState, Screen } from '../../components';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchProducts, readLocalProducts, updateStock, type Product } from '../../api/seller';
import { apiError } from '../../lib/format';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import type { MainTabScreenProps } from '../../navigation/types';

export default function StockScreen({ navigation }: MainTabScreenProps<'Stock'>) {
  const { requireOnline } = useOnlineGuard();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<number, { total: string; online: string }>>({});

  const load = useCallback(async (opts?: { fresh?: boolean }) => {
    setError('');
    const cached = await readLocalProducts();
    if (cached.length) {
      setProducts(cached);
      setDrafts(
        Object.fromEntries(
          cached.map((p) => [p.id, { total: String(p.total_stock), online: String(p.online_stock) }]),
        ),
      );
      setLoading(false);
    }
    try {
      const list = await fetchProducts({ fresh: opts?.fresh });
      setProducts(list);
      setDrafts(
        Object.fromEntries(
          list.map((p) => [p.id, { total: String(p.total_stock), online: String(p.online_stock) }]),
        ),
      );
    } catch (err) {
      if (!cached.length) setError(apiError(err, 'Could not load stock.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(() => {
    if (filter === 'low') return products.filter((p) => p.online_stock > 0 && p.online_stock <= 5);
    if (filter === 'out') return products.filter((p) => !p.online_stock);
    return products;
  }, [products, filter]);

  const save = (product: Product) => {
    if (!requireOnline('Updating stock')) return;
    const draft = drafts[product.id];
    const total = Math.max(0, parseInt(draft?.total || '0', 10) || 0);
    const online = Math.max(0, parseInt(draft?.online || '0', 10) || 0);
    if (online > total) {
      Alert.alert('Stock', 'Online stock cannot be more than shop stock.');
      return;
    }
    Alert.alert(
      'Update stock',
      `${product.name}: shop ${product.total_stock} → ${total}, online ${product.online_stock} → ${online}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            try {
              await updateStock(product.id, {
                total_stock: total,
                online_stock: online,
                note: 'Updated from mobile stock screen',
              });
              await load();
            } catch (err) {
              Alert.alert('Could not update', apiError(err, 'Try again.'));
            }
          },
        },
      ],
    );
  };

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Stock"
        subtitle="Shop and online quantities"
        action={{
          icon: 'time-outline',
          onPress: () => navigation.navigate('History'),
          accessibilityLabel: 'Stock history',
        }}
      />
      <View style={styles.content}>
        <View style={styles.filters}>
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="Low" selected={filter === 'low'} onPress={() => setFilter('low')} />
          <Chip label="Out" selected={filter === 'out'} onPress={() => setFilter('out')} />
        </View>
        {loading && products.length === 0 ? <LoadingState message="Loading stock…" /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && visible.length === 0 ? (
          <EmptyState title="No products" message="Add products first, then adjust stock here." />
        ) : null}
        {visible.map((product) => {
          const draft = drafts[product.id] || { total: '0', online: '0' };
          const tone = !product.online_stock ? 'error' : product.online_stock <= 5 ? 'warning' : 'success';
          return (
            <Card key={product.id}>
              <View style={styles.row}>
                <Text style={styles.name} maxFontSizeMultiplier={FONT_SCALE.body}>{product.name}</Text>
                <Badge label={tone === 'error' ? 'Out' : tone === 'warning' ? 'Low' : 'OK'} tone={tone} />
              </View>
              <Input
                label="Shop stock"
                value={draft.total}
                keyboardType="number-pad"
                onChangeText={(value) =>
                  setDrafts((prev) => ({ ...prev, [product.id]: { ...draft, total: value } }))
                }
              />
              <Input
                label="Online stock"
                value={draft.online}
                keyboardType="number-pad"
                onChangeText={(value) =>
                  setDrafts((prev) => ({ ...prev, [product.id]: { ...draft, online: value } }))
                }
              />
              <Button label="Save stock" size="sm" onPress={() => save(product)} />
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  filters: { flexDirection: 'row', flexWrap: 'wrap' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  name: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, flex: 1, paddingRight: SPACING.md },
});
