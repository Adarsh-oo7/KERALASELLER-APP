import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, Header, Input, LoadingState, Screen } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import {
  createPurchase,
  createSupplier,
  fetchProducts,
  fetchPurchases,
  fetchSuppliers,
  type Product,
} from '../../api/seller';
import { apiError } from '../../lib/format';
import { useStoreAccess } from '../../hooks/useStoreAccess';
import type { MainStackScreenProps } from '../../navigation/types';

export default function PurchasesScreen({ navigation }: MainStackScreenProps<'Purchases'>) {
  const { can, allowed } = useStoreAccess();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<{ id: number; items: { name: string; quantity: number }[] }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [cost, setCost] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [catalog, rows] = await Promise.all([fetchProducts(), fetchPurchases()]);
      setProducts(catalog);
      setPurchases(rows);
      if (allowed.includes('inventory.manage_suppliers')) {
        setSuppliers(await fetchSuppliers().catch(() => []));
      }
    } catch (err) {
      setError(apiError(err, 'Receiving stock is not on the current plan.'));
    } finally {
      setLoading(false);
    }
  }, [allowed]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const matches = products.filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6);

  const receive = async () => {
    if (!product) {
      Alert.alert('Pick a product', 'Search and tap the item you received.');
      return;
    }
    try {
      let supplierId: number | undefined;
      if (can('inventory.manage_suppliers') && supplierName.trim()) {
        const existing = suppliers.find((row) => row.name.toLowerCase() === supplierName.trim().toLowerCase());
        supplierId = existing?.id || (await createSupplier({ name: supplierName.trim() })).id;
      }
      await createPurchase({
        supplier_id: supplierId,
        items: [{ product_id: product.id, quantity: Number(quantity) || 1, unit_cost: cost ? Number(cost) : 0 }],
      });
      setProduct(null);
      setQuery('');
      setQuantity('1');
      setCost('');
      await load();
    } catch (err) {
      Alert.alert('Could not receive', apiError(err, 'Try again.'));
    }
  };

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Receive stock" subtitle="Adds to the same stock used in billing" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading…" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Input label="Find product" value={query} onChangeText={setQuery} placeholder="Name" />
        {matches.map((row) => (
          <Text key={row.id} style={styles.pick} onPress={() => { setProduct(row); setQuery(row.name); }}>
            {row.name} · stock {row.total_stock}
          </Text>
        ))}
        <Input label="Quantity in" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
        <Input label="Unit cost (optional)" value={cost} onChangeText={setCost} keyboardType="decimal-pad" prefix="₹" />
        {can('inventory.manage_suppliers') ? (
          <Input label="From supplier (optional)" value={supplierName} onChangeText={setSupplierName} placeholder="Mill / distributor" />
        ) : null}
        <Button label="Add to stock" onPress={receive} disabled={!product} />
        <Card>
          {purchases.slice(0, 8).map((row) => (
            <Text key={row.id} style={styles.row}>
              #{row.id} · {(row.items || []).map((item) => `${item.name} x${item.quantity}`).join(', ')}
            </Text>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.sm },
  error: { ...TYPOGRAPHY.body, color: COLORS.error },
  pick: { ...TYPOGRAPHY.body, color: COLORS.primary, paddingVertical: SPACING.sm },
  row: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, marginBottom: SPACING.sm },
});
