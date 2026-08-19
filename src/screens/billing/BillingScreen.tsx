import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, EmptyState, ErrorState, Header, Input, LoadingState, Screen } from '../../components';
import { APP_DISPLAY_NAME } from '../../config/legal';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import { createLocalBill, fetchProducts, lookupLoyalty, type Product } from '../../api/seller';
import { apiError, formatInr } from '../../lib/format';
import type { MainStackScreenProps } from '../../navigation/types';

type Line = { product: Product; quantity: number; variantId?: number };

export default function BillingScreen({ navigation }: MainStackScreenProps<'Billing'>) {
  const { requireLocalBilling, mode } = useOnlineGuard();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'SPLIT'>('CASH');
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setProducts(await fetchProducts());
    } catch (err) {
      setError(apiError(err, 'Could not load products.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const digits = customerPhone.replace(/\D/g, '').slice(-10);
    setUsePoints(false);
    if (digits.length !== 10) {
      setLoyaltyBalance(0);
      return;
    }
    let live = true;
    lookupLoyalty(digits)
      .then((data) => {
        if (live) setLoyaltyBalance(Number(data.balance || 0));
      })
      .catch(() => {
        if (live) setLoyaltyBalance(0);
      });
    return () => {
      live = false;
    };
  }, [customerPhone]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = products.filter((p) => p.total_stock > 0 && p.sale_type !== 'ONLINE');
    if (!q) return available.slice(0, 8);
    return available.filter((p) =>
      p.name.toLowerCase().includes(q)
      || (p.sku && p.sku.toLowerCase() === q)
      || (p.barcode && p.barcode.toLowerCase() === q)
      || (p.variants || []).some((variant) => (variant.sku || '').toLowerCase() === q || (variant.barcode || '').toLowerCase() === q),
    ).slice(0, 8);
  }, [products, query]);

  const add = (product: Product, variantId?: number) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.product.id === product.id && line.variantId === variantId);
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id && line.variantId === variantId ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...prev, { product, quantity: 1, variantId }];
    });
    setQuery('');
  };

  const changeQty = (id: number, delta: number) => {
    setLines((prev) =>
      prev
        .map((line) => (line.product.id === id ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0),
    );
  };

  const total = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);

  const checkout = async () => {
    if (lines.length === 0) {
      Alert.alert('Empty bill', 'Add at least one product.');
      return;
    }
    if (!requireLocalBilling()) return;
    setSaving(true);
    try {
      const result = await createLocalBill(
        {
          customer_name: customerName.trim() || 'Walk-in Customer',
          customer_phone: customerPhone.trim(),
          items: lines.map((line) => ({
            id: line.product.id,
            variant_id: line.variantId,
            quantity: line.quantity,
            price: Number(line.product.price),
          })),
          payment_method: paymentMethod,
          payments: paymentMethod === 'SPLIT' ? [
            Number(splitCash) > 0 ? { method: 'CASH', amount: Number(splitCash) } : null,
            Number(splitUpi) > 0 ? { method: 'UPI', amount: Number(splitUpi) } : null,
          ].filter((row): row is { method: string; amount: number } => Boolean(row)) : undefined,
          loyalty_points: usePoints ? Math.min(loyaltyBalance, Math.floor(total)) : undefined,
        },
        {
          forceQueue: mode === 'offline_grace',
          queueIfOffline: true,
        },
      );
      const receipt = [
        `${APP_DISPLAY_NAME} bill ${result.bill_id}${result.queued ? ' (saved on this phone)' : ''}`,
        customerName ? `Customer: ${customerName}` : 'Walk-in customer',
        ...lines.map((line) => `${line.product.name} x${line.quantity} = ${formatInr(Number(line.product.price) * line.quantity)}`),
        `Total: ${formatInr(result.total_amount ?? total)}`,
      ].join('\n');
      setLines([]);
      setCustomerName('');
      setCustomerPhone('');
      setUsePoints(false);
      setLoyaltyBalance(0);
      await load();
      await Share.share({ message: receipt });
    } catch (err) {
      Alert.alert('Bill failed', apiError(err, 'Stock may have changed. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Local bill"
        subtitle={mode === 'offline_grace' ? 'Saved on this phone, syncs in 3 days' : 'Walk-in cash bill'}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading products…" /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        <Input label="Customer name" value={customerName} onChangeText={setCustomerName} placeholder="Optional" />
        <Input label="Customer phone" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholder="Optional" />
        {loyaltyBalance > 0 ? (
          <TouchableOpacity
            onPress={() => setUsePoints((on) => !on)}
            style={[styles.payChip, usePoints && styles.payChipOn]}
            accessibilityRole="button"
            accessibilityLabel={usePoints ? 'Using loyalty points' : 'Use loyalty points'}
          >
            <Text style={styles.payChipText}>
              {usePoints ? `Using ${Math.min(loyaltyBalance, Math.floor(total))} points` : `Use ${loyaltyBalance} points`}
            </Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.payRow}>
          {(['CASH', 'UPI', 'SPLIT'] as const).map((method) => (
            <TouchableOpacity key={method} onPress={() => setPaymentMethod(method)} style={[styles.payChip, paymentMethod === method && styles.payChipOn]}>
              <Text style={styles.payChipText}>{method === 'SPLIT' ? 'Cash+UPI' : method}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {paymentMethod === 'SPLIT' ? (
          <>
            <Input label="Cash amount" value={splitCash} onChangeText={setSplitCash} keyboardType="decimal-pad" placeholder="0" />
            <Input label="UPI amount" value={splitUpi} onChangeText={setSplitUpi} keyboardType="decimal-pad" placeholder="0" />
          </>
        ) : null}
        <Input label="Add product" value={query} onChangeText={setQuery} placeholder="Name, SKU, or barcode" />
        {matches.flatMap((product) => {
          const variants = product.variants || [];
          if (variants.length === 0) {
            return [
              <TouchableOpacity key={product.id} onPress={() => add(product)} style={styles.suggest}>
                <Text style={styles.suggestName}>{product.name}</Text>
                <Text style={styles.suggestMeta}>{formatInr(product.price)} · stock {product.total_stock}</Text>
              </TouchableOpacity>,
            ];
          }
          return variants.map((variant) => (
            <TouchableOpacity key={`${product.id}-${variant.id}`} onPress={() => add(product, variant.id)} style={styles.suggest}>
              <Text style={styles.suggestName}>{product.name} ({variant.name})</Text>
              <Text style={styles.suggestMeta}>{formatInr(variant.selling_price ?? variant.price ?? product.price)} · stock {variant.total_stock}</Text>
            </TouchableOpacity>
          ));
        })}

        {lines.length === 0 ? (
          <EmptyState icon="cart-outline" title="Bill is empty" message="Search and tap a product to add it." />
        ) : (
          <Card>
            {lines.map((line) => (
              <View key={line.product.id} style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestName}>{line.product.name}</Text>
                  <Text style={styles.suggestMeta}>{formatInr(Number(line.product.price) * line.quantity)}</Text>
                </View>
                <TouchableOpacity onPress={() => changeQty(line.product.id, -1)} style={styles.step}>
                  <Text style={styles.stepText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{line.quantity}</Text>
                <TouchableOpacity onPress={() => changeQty(line.product.id, 1)} style={styles.step}>
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={styles.total}>Total {formatInr(total)}</Text>
          </Card>
        )}

        <Button
          label={mode === 'offline_grace' ? 'Save bill on this phone' : 'Create bill & share'}
          onPress={checkout}
          loading={saving}
          disabled={saving || lines.length === 0}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.sm },
  suggest: {
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.inputBorder,
  },
  suggestName: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  suggestMeta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  step: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { ...TYPOGRAPHY.title, color: COLORS.primary },
  qty: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, minWidth: 24, textAlign: 'center' },
  total: { ...TYPOGRAPHY.heading, color: COLORS.primary, marginTop: SPACING.sm },
  payRow: { flexDirection: 'row', gap: SPACING.sm, marginVertical: SPACING.sm },
  payChip: {
    paddingHorizontal: SPACING.md,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payChipOn: { backgroundColor: COLORS.primary },
  payChipText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
});
