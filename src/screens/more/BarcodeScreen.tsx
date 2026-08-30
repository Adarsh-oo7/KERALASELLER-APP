import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { BarcodeMark, BarcodeScannerModal, Button, Card, EmptyState, Header, Input, LoadingState, Screen } from '../../components';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchProduct, fetchProducts, lookupProductByCode, saveProduct, type Product } from '../../api/seller';
import { apiError } from '../../lib/format';
import {
  barcodeIsLocked,
  codesFromProduct,
  findProductByCode,
  generateShopBarcode,
  sanitizeBarcode,
  storedBarcode,
} from '../../lib/barcode';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import { isNetworkError } from '../../lib/offlineWindow';
import type { MainStackScreenProps } from '../../navigation/types';

type Draft = { id: number; name: string; code: string };

export default function BarcodeScreen({ navigation }: MainStackScreenProps<'Barcodes'>) {
  const { requireOnline } = useOnlineGuard();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [scanner, setScanner] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [unlockedId, setUnlockedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await fetchProducts({ page_size: 200, fresh: true });
      setProducts(list);
      setSelected((current) => {
        if (!current) return null;
        return list.find((row) => row.id === current.id) || current;
      });
    } catch (err) {
      Alert.alert(
        'Could not load products',
        apiError(err, isNetworkError(err)
          ? 'Check your internet and try again.'
          : 'Try again.'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const taken = useMemo(
    () => products.flatMap((product) => codesFromProduct(product)),
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? products
      : products.filter((product) =>
          product.name.toLowerCase().includes(q)
          || codesFromProduct(product).some((code) => code.includes(q)),
        );
    return [...list].sort((a, b) => Number(Boolean(a.barcode)) - Number(Boolean(b.barcode)));
  }, [products, query]);

  const busy = savingId != null;

  const applySaved = (product: Product, code: string) => {
    const barcode = storedBarcode(String(product.barcode || code));
    const next = { ...product, barcode };
    setProducts((prev) => prev.map((item) => (item.id === next.id ? { ...item, ...next } : item)));
    setSelected(next);
    setDraft(null);
    setUnlockedId(null);
  };

  const saveBarcode = async (product: Product, code: string) => {
    const value = storedBarcode(code);
    if (!value) {
      Alert.alert('Missing code', 'Create or scan a barcode, then tap Save.');
      return;
    }
    if (!requireOnline('Saving a barcode')) return;
    const duplicate = findProductByCode(products, value);
    if (duplicate && duplicate.product.id !== product.id) {
      Alert.alert('Code already used', `This barcode is already on ${duplicate.product.name}. Unlock that product first if you need to move it.`);
      return;
    }
    setSavingId(product.id);
    try {
      const saved = await saveProduct({ barcode: value }, product.id);
      const confirmed = await fetchProduct(product.id).catch(() => saved);
      const kept = storedBarcode(String(confirmed.barcode || saved.barcode || ''));
      if (!kept) {
        throw new Error('The server did not keep this barcode. Tap Save again.');
      }
      applySaved({ ...product, ...saved, ...confirmed, barcode: kept }, kept);
      Alert.alert('Barcode saved', `${kept} is locked on ${product.name}. Unlock it to change or remove.`);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      Alert.alert(
        'Could not save barcode',
        apiError(err, isNetworkError(err)
          ? 'Check your internet and try again. The code was not saved yet.'
          : status === 403
            ? 'This login cannot edit products. Ask the shop owner to save the barcode.'
            : 'The code was not saved yet. Tap Save again.'),
      );
    } finally {
      setSavingId(null);
    }
  };

  const clearBarcode = async (product: Product) => {
    if (!requireOnline('Removing a barcode')) return;
    setSavingId(product.id);
    try {
      await saveProduct({ barcode: '' }, product.id);
      const next = { ...product, barcode: '' };
      setProducts((prev) => prev.map((item) => (item.id === next.id ? next : item)));
      setSelected(next);
      setDraft(null);
      setUnlockedId(product.id);
    } catch (err) {
      Alert.alert('Could not remove barcode', apiError(err, 'Try again while online.'));
    } finally {
      setSavingId(null);
    }
  };

  const startCreate = (product: Product) => {
    if (busy) return;
    if (barcodeIsLocked(Boolean(product.barcode), unlockedId === product.id)) {
      Alert.alert('Barcode is locked', 'Unlock this product first to change or replace the code.');
      return;
    }
    setSelected(product);
    setDraft({
      id: product.id,
      name: product.name,
      code: generateShopBarcode([...taken, product.sku || '', product.barcode || '']),
    });
  };

  const onScan = async (code: string) => {
    setScanner(false);
    const value = storedBarcode(code);
    if (!value) return;
    const target = selected || (draft ? products.find((row) => row.id === draft.id) : null);
    if (target && !barcodeIsLocked(Boolean(target.barcode), unlockedId === target.id)) {
      setDraft({ id: target.id, name: target.name, code: value });
      return;
    }
    const local = findProductByCode(products, value);
    if (local) {
      setSelected(local.product);
      setQuery(value);
      setDraft(null);
      return;
    }
    try {
      const remote = await lookupProductByCode(value);
      if (remote) {
        applySaved(remote.product, value);
        setQuery(value);
        return;
      }
    } catch (err) {
      Alert.alert(
        'Could not check barcode',
        apiError(err, 'Check your internet and try again.'),
      );
      return;
    }
    Alert.alert(
      'No product for this code',
      `${value} is not saved on a shop product yet. Save it on a product, then scan again at the till.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add product', onPress: () => navigation.navigate('ProductForm', { barcode: value }) },
        ...(target && !barcodeIsLocked(Boolean(target.barcode), unlockedId === target.id) ? [{
          text: `Save on ${target.name}`,
          onPress: () => { void saveBarcode(target, value); },
        }] : []),
      ],
    );
  };

  const shareCode = async (product: Product) => {
    const code = sanitizeBarcode(product.barcode || '');
    if (!code) return;
    await Share.share({
      message: `${product.name}\nBarcode: ${code}`,
    });
  };

  const draftProduct = draft ? products.find((row) => row.id === draft.id) : null;
  const selectedLocked = selected
    ? barcodeIsLocked(Boolean(selected.barcode), unlockedId === selected.id)
    : false;

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Barcodes"
        subtitle="Create or scan a code, tap Save, then lock it. Unlock to change or remove."
        onBack={() => navigation.goBack()}
        action={{
          icon: 'scan-outline',
          accessibilityLabel: 'Scan a barcode',
          onPress: () => setScanner(true),
        }}
      />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading products…" /> : null}
        <Input
          label="Find a product"
          value={query}
          onChangeText={setQuery}
          placeholder="Name, SKU, or barcode"
        />
        <Button label="Scan barcode" icon="scan-outline" onPress={() => setScanner(true)} disabled={busy} />

        {draft && draftProduct ? (
          <Card>
            <Text style={styles.name}>{draft.name}</Text>
            <Text style={styles.meta}>Not saved yet. Tap Save so the till can find this code.</Text>
            <Input
              label="Barcode"
              value={draft.code}
              onChangeText={(text) => setDraft({ ...draft, code: storedBarcode(text) })}
              placeholder="Scan or type the packet code"
              editable={!busy}
            />
            <BarcodeMark value={draft.code} />
            <View style={styles.actions}>
              <Button
                label="Save"
                size="sm"
                fullWidth={false}
                onPress={() => saveBarcode(draftProduct, draft.code)}
                loading={savingId === draft.id}
                disabled={busy}
              />
              <Button
                label="Cancel"
                size="sm"
                variant="secondary"
                fullWidth={false}
                onPress={() => setDraft(null)}
                disabled={busy}
              />
            </View>
          </Card>
        ) : null}

        {selected?.barcode && !draft ? (
          <Card>
            <Text style={styles.name}>{selected.name}</Text>
            <Text style={styles.meta}>
              {selectedLocked ? 'Locked. Unlock to change or remove this code.' : 'Unlocked. Change, scan a new code, or remove, then Save.'}
            </Text>
            <BarcodeMark value={selected.barcode} />
            <View style={styles.actions}>
              {selectedLocked ? (
                <Button
                  label="Unlock"
                  size="sm"
                  fullWidth={false}
                  onPress={() => setUnlockedId(selected.id)}
                  disabled={busy}
                />
              ) : (
                <Button
                  label="Lock"
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  onPress={() => { setUnlockedId(null); setDraft(null); }}
                  disabled={busy}
                />
              )}
              <Button label="Share" size="sm" variant="secondary" fullWidth={false} onPress={() => shareCode(selected)} disabled={busy} />
            </View>
            {selectedLocked ? null : (
              <View style={styles.actions}>
                <Button label="New code" size="sm" fullWidth={false} onPress={() => startCreate(selected)} disabled={busy} />
                <Button
                  label="Scan replace"
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  onPress={() => setScanner(true)}
                  disabled={busy}
                />
                <Button
                  label="Remove"
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  onPress={() => {
                    Alert.alert('Remove barcode', `Remove ${selected.barcode} from ${selected.name}?`, [
                      { text: 'Keep', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => { void clearBarcode(selected); } },
                    ]);
                  }}
                  disabled={busy}
                />
              </View>
            )}
          </Card>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState icon="barcode-outline" title="No products" message="Add a shop product, then create a barcode for its sticker." />
        ) : filtered.map((product) => {
          const locked = barcodeIsLocked(Boolean(product.barcode), unlockedId === product.id);
          return (
            <TouchableOpacity
              key={product.id}
              onPress={() => { if (!busy) { setSelected(product); setDraft(null); } }}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={product.name}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name} maxFontSizeMultiplier={FONT_SCALE.body}>{product.name}</Text>
                <Text style={styles.meta}>
                  {product.barcode ? `${product.barcode}${locked ? ' · Locked' : ' · Unlocked'}` : 'No barcode yet'}
                  {product.sku ? ` · SKU ${product.sku}` : ''}
                </Text>
              </View>
              {product.barcode ? (
                locked ? (
                  <Button
                    label="Unlock"
                    size="sm"
                    variant="ghost"
                    onPress={() => { setSelected(product); setUnlockedId(product.id); setDraft(null); }}
                    disabled={busy}
                  />
                ) : (
                  <View style={styles.actions}>
                    <Button label="Change" size="sm" fullWidth={false} onPress={() => startCreate(product)} disabled={busy} />
                    <Button
                      label="Lock"
                      size="sm"
                      variant="ghost"
                      fullWidth={false}
                      onPress={() => { setSelected(product); setUnlockedId(null); setDraft(null); }}
                      disabled={busy}
                    />
                  </View>
                )
              ) : (
                <View style={styles.actions}>
                  <Button
                    label="Create"
                    size="sm"
                    fullWidth={false}
                    onPress={() => startCreate(product)}
                    disabled={busy}
                  />
                  <Button
                    label="Scan"
                    size="sm"
                    variant="secondary"
                    fullWidth={false}
                    onPress={() => {
                      setSelected(product);
                      setScanner(true);
                    }}
                    disabled={busy}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <BarcodeScannerModal
        visible={scanner}
        title="Scan a packet barcode"
        onClose={() => setScanner(false)}
        onScan={(code) => { void onScan(code); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  name: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  row: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.inputBorder,
  },
  actions: { flexDirection: 'row', gap: SPACING.xs, alignItems: 'center', flexWrap: 'wrap' },
});
