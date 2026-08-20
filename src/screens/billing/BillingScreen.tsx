import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, EmptyState, ErrorState, Header, Input, LoadingState, Notice, Screen, BarcodeScannerModal } from '../../components';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import {
  createLocalBill,
  fetchLocalBill,
  fetchLocalBills,
  fetchProducts,
  lookupLoyalty,
  readLocalProducts,
  updateLocalBill,
  type LocalBill,
  type Product,
} from '../../api/seller';
import { printBill, saveBillPdf, snapshotFromBill, type BillSnapshot } from '../../lib/billPrint';
import { apiError, formatDate, formatInr, httpStatus } from '../../lib/format';
import { findProductByCode } from '../../lib/barcode';
import type { MainStackScreenProps } from '../../navigation/types';

type Line = { product: Product; quantity: number; variantId?: number; unitPrice: number };

function unitPriceOf(product: Product, variantId?: number): number {
  const variant = (product.variants || []).find((item) => item.id === variantId);
  return Number(variant?.selling_price ?? variant?.price ?? product.price);
}

function stubProduct(item: { product_id?: number; name?: string; price?: number | string; variant_id?: number | null }): Product {
  return {
    id: item.product_id || 0,
    name: item.name || 'Item',
    price: Number(item.price || 0),
    total_stock: 9999,
    online_stock: 0,
    sale_type: 'OFFLINE',
  };
}

export default function BillingScreen({ navigation, route }: MainStackScreenProps<'Billing'>) {
  const { requireLocalBilling, requireOnline, mode } = useOnlineGuard();
  const [products, setProducts] = useState<Product[]>([]);
  const [recent, setRecent] = useState<LocalBill[]>([]);
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
  const [scanner, setScanner] = useState(Boolean(route.params?.openScanner));
  const [editingBillId, setEditingBillId] = useState<number | null>(route.params?.billId ?? null);
  const [editingBillLabel, setEditingBillLabel] = useState('');
  const loadedBill = useRef<number | null>(null);

  const load = useCallback(async () => {
    setError('');
    const cached = await readLocalProducts();
    if (cached.length) {
      setProducts(cached);
      setLoading(false);
    }
    try {
      const list = await fetchProducts({ page_size: 100 });
      setProducts(list);
    } catch (err) {
      if (!cached.length) setError(apiError(err, 'Could not load products.'));
    }
    try {
      const bills = await fetchLocalBills();
      setRecent(bills.filter((bill) => bill.status !== 'CANCELLED' && bill.payment_status !== 'CANCELLED'));
    } catch {
      setRecent([]);
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
    if (route.params?.openScanner) setScanner(true);
  }, [route.params?.openScanner]);

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

  const applyBill = useCallback((bill: LocalBill, catalog: Product[]) => {
    if (!bill.id) return;
    setEditingBillId(bill.id);
    setEditingBillLabel(bill.bill_id || bill.bill_number || `Bill ${bill.id}`);
    setCustomerName(bill.customer_name || '');
    setCustomerPhone(bill.customer_phone || '');
    const method = (bill.payment_method || 'CASH').toUpperCase();
    setPaymentMethod(method === 'UPI' || method === 'SPLIT' ? method : 'CASH');
    setLines((bill.items || []).map((item) => {
      const found = catalog.find((product) => product.id === item.product_id);
      const product = found || stubProduct(item);
      return {
        product,
        quantity: item.quantity,
        variantId: item.variant_id || undefined,
        unitPrice: Number(item.price),
      };
    }));
  }, []);

  useEffect(() => {
    const billId = route.params?.billId;
    if (!billId || products.length === 0 || loadedBill.current === billId) return;
    loadedBill.current = billId;
    fetchLocalBill(billId)
      .then((bill) => applyBill(bill, products))
      .catch((err) => Alert.alert('Could not open bill', apiError(err, 'Try from recent bills.')));
  }, [route.params?.billId, products, applyBill]);

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

  const add = (product: Product, variantId?: number, unitPrice?: number) => {
    const price = unitPrice ?? unitPriceOf(product, variantId);
    setLines((prev) => {
      const existing = prev.find((line) => line.product.id === product.id && line.variantId === variantId);
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id && line.variantId === variantId ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...prev, { product, quantity: 1, variantId, unitPrice: price }];
    });
    setQuery('');
  };

  const addScanned = (code: string) => {
    const match = findProductByCode(products, code);
    if (!match) {
      Alert.alert('Not in this shop', `${code} is not on a product. Create or attach a barcode from More → Barcodes.`);
      setQuery(code);
      return;
    }
    add(match.product, match.variantId);
  };

  const changeQty = (id: number, delta: number, variantId?: number) => {
    setLines((prev) =>
      prev
        .map((line) => (line.product.id === id && line.variantId === variantId ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0),
    );
  };

  const changePrice = (id: number, variantId: number | undefined, raw: string) => {
    const next = Number(raw);
    setLines((prev) => prev.map((line) => (
      line.product.id === id && line.variantId === variantId
        ? { ...line, unitPrice: Number.isFinite(next) && next >= 0 ? next : line.unitPrice }
        : line
    )));
  };

  const removeLine = (id: number, variantId?: number) => {
    setLines((prev) => prev.filter((line) => !(line.product.id === id && line.variantId === variantId)));
  };

  const resetBill = () => {
    setLines([]);
    setCustomerName('');
    setCustomerPhone('');
    setUsePoints(false);
    setLoyaltyBalance(0);
    setEditingBillId(null);
    setEditingBillLabel('');
    setSplitCash('');
    setSplitUpi('');
    loadedBill.current = null;
  };

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  const payload = () => ({
    customer_name: customerName.trim() || 'Walk-in Customer',
    customer_phone: customerPhone.trim(),
    items: lines.map((line) => ({
      id: line.product.id,
      variant_id: line.variantId,
      quantity: line.quantity,
      price: line.unitPrice,
    })),
    payment_method: paymentMethod,
    payments: paymentMethod === 'SPLIT' ? [
      Number(splitCash) > 0 ? { method: 'CASH', amount: Number(splitCash) } : null,
      Number(splitUpi) > 0 ? { method: 'UPI', amount: Number(splitUpi) } : null,
    ].filter((row): row is { method: string; amount: number } => Boolean(row)) : undefined,
    loyalty_points: usePoints ? Math.min(loyaltyBalance, Math.floor(total)) : undefined,
  });

  const offerBillActions = (snapshot: BillSnapshot) => {
    Alert.alert(
      snapshot.queued ? 'Saved on this phone' : `Bill ${snapshot.billId}`,
      snapshot.queued
        ? 'Print or save a PDF from this phone. It will sync when you are online.'
        : 'Print opens the printer dialog. Save PDF lets you download or share the bill with shop details.',
      [
        {
          text: 'Print',
          onPress: () => {
            void printBill(snapshot).catch((err) => Alert.alert('Print failed', apiError(err, 'Try Save PDF instead.')));
          },
        },
        {
          text: 'Save PDF',
          onPress: () => {
            void saveBillPdf(snapshot).catch((err) => Alert.alert('PDF failed', apiError(err, 'Try Print and choose Save as PDF.')));
          },
        },
        { text: 'Done', style: 'cancel' },
      ],
    );
  };

  const checkout = async () => {
    if (lines.length === 0) {
      Alert.alert('Empty bill', 'Add at least one product.');
      return;
    }
    if (lines.some((line) => !line.product.id)) {
      Alert.alert('Missing product', 'One line is no longer in this shop. Remove it and add the product again.');
      return;
    }
    if (!requireLocalBilling()) return;
    if (editingBillId && !requireOnline('Editing a saved bill')) return;
    setSaving(true);
    try {
      let result: LocalBill;
      if (editingBillId) {
        try {
          result = await updateLocalBill(editingBillId, payload());
        } catch (err) {
          if (httpStatus(err) === 404) {
            result = await createLocalBill(payload(), { queueIfOffline: true, forceQueue: mode === 'offline_grace' });
            Alert.alert('Saved as a new bill', 'This shop API cannot edit an old bill yet, so a new bill was created instead.');
          } else {
            throw err;
          }
        }
      } else {
        result = await createLocalBill(payload(), {
          forceQueue: mode === 'offline_grace',
          queueIfOffline: true,
        });
      }
      const snapshot = snapshotFromBill(result, lines.map((line) => ({
        name: line.product.name,
        quantity: line.quantity,
        amount: line.unitPrice * line.quantity,
      })), {
        customerName: customerName.trim() || 'Walk-in',
        customerPhone: customerPhone.trim(),
        paymentMethod,
        total: Number(result.total_amount ?? total),
      });
      resetBill();
      await load();
      offerBillActions(snapshot);
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
        title={editingBillId ? 'Edit bill' : 'Local bill'}
        subtitle={
          editingBillLabel
            ? `Editing ${editingBillLabel}`
            : mode === 'offline_grace' ? 'Saved on this phone, syncs in 3 days' : 'Scan, then print or save PDF'
        }
        onBack={() => navigation.goBack()}
        action={{
          icon: 'scan-outline',
          accessibilityLabel: 'Scan a product barcode',
          onPress: () => setScanner(true),
        }}
      />
      <View style={styles.content}>
        {loading && products.length === 0 ? <LoadingState message="Loading products…" /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {editingBillId ? (
          <Notice
            tone="info"
            title="This bill is editable"
            message="Change quantity or price, scan more items, then save. Stock is corrected on the same bill number."
          />
        ) : null}
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
        <Button label="Scan with camera" variant="secondary" icon="scan-outline" onPress={() => setScanner(true)} />
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
            <TouchableOpacity
              key={`${product.id}-${variant.id}`}
              onPress={() => add(product, variant.id, Number(variant.selling_price ?? variant.price ?? product.price))}
              style={styles.suggest}
            >
              <Text style={styles.suggestName}>{product.name} ({variant.name})</Text>
              <Text style={styles.suggestMeta}>{formatInr(variant.selling_price ?? variant.price ?? product.price)} · stock {variant.total_stock}</Text>
            </TouchableOpacity>
          ));
        })}

        {lines.length === 0 ? (
          <EmptyState icon="cart-outline" title="Bill is empty" message="Scan a packet or search and tap a product." />
        ) : (
          <Card>
            {lines.map((line) => (
              <View key={`${line.product.id}-${line.variantId || 0}`} style={styles.lineBlock}>
                <View style={styles.line}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestName}>{line.product.name}</Text>
                    <Text style={styles.suggestMeta}>{formatInr(line.unitPrice * line.quantity)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => changeQty(line.product.id, -1, line.variantId)} style={styles.step}>
                    <Text style={styles.stepText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qty}>{line.quantity}</Text>
                  <TouchableOpacity onPress={() => changeQty(line.product.id, 1, line.variantId)} style={styles.step}>
                    <Text style={styles.stepText}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.editRow}>
                  <Text style={styles.priceLabel}>Unit ₹</Text>
                  <TextInput
                    value={String(line.unitPrice)}
                    onChangeText={(text) => changePrice(line.product.id, line.variantId, text)}
                    keyboardType="decimal-pad"
                    style={styles.priceInput}
                    accessibilityLabel={`Unit price for ${line.product.name}`}
                  />
                  <TouchableOpacity onPress={() => removeLine(line.product.id, line.variantId)} style={styles.remove}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={styles.total}>Total {formatInr(total)}</Text>
          </Card>
        )}

        <Button
          label={
            editingBillId
              ? 'Save bill changes'
              : mode === 'offline_grace' ? 'Save bill on this phone' : 'Create bill'
          }
          onPress={checkout}
          loading={saving}
          disabled={saving || lines.length === 0}
        />
        {editingBillId ? (
          <Button label="Start a new bill" variant="ghost" onPress={resetBill} disabled={saving} />
        ) : null}

        {recent.length > 0 ? (
          <>
            <Text style={styles.section}>Recent bills</Text>
            <Text style={styles.meta}>Tap a bill to edit. Print or save PDF without changing it.</Text>
            {recent.slice(0, 8).map((bill) => (
              <View key={String(bill.id || bill.bill_id)} style={styles.recent}>
                <TouchableOpacity
                  onPress={() => {
                    if (!bill.id) {
                      Alert.alert('Not on the server yet', 'This bill is still only on this phone.');
                      return;
                    }
                    loadedBill.current = bill.id;
                    applyBill(bill, products);
                  }}
                >
                  <Text style={styles.suggestName}>{bill.bill_id || bill.bill_number}</Text>
                  <Text style={styles.suggestMeta}>
                    {formatInr(bill.total_amount)} · {bill.customer_name || 'Walk-in'} · {formatDate(bill.created_at)}
                  </Text>
                </TouchableOpacity>
                <View style={styles.recentActions}>
                  <TouchableOpacity
                    onPress={() => {
                      void printBill(snapshotFromBill(bill)).catch((err) => Alert.alert('Print failed', apiError(err, 'Try Save PDF instead.')));
                    }}
                    style={styles.recentAction}
                    accessibilityRole="button"
                    accessibilityLabel={`Print ${bill.bill_id || 'bill'}`}
                  >
                    <Text style={styles.recentActionText}>Print</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      void saveBillPdf(snapshotFromBill(bill)).catch((err) => Alert.alert('PDF failed', apiError(err, 'Try Print and choose Save as PDF.')));
                    }}
                    style={styles.recentAction}
                    accessibilityRole="button"
                    accessibilityLabel={`Save PDF for ${bill.bill_id || 'bill'}`}
                  >
                    <Text style={styles.recentActionText}>PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ) : null}
      </View>
      <BarcodeScannerModal
        visible={scanner}
        title="Scan to add to bill"
        continuous
        onClose={() => setScanner(false)}
        onScan={addScanned}
      />
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
  lineBlock: { marginBottom: SPACING.md },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
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
  editRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
  priceLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  priceInput: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.textPrimary,
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 88,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
  },
  remove: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  removeText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.error },
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
  section: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, marginTop: SPACING.md },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  recent: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.inputBorder,
  },
  recentActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xs },
  recentAction: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  recentActionText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.primary },
});
