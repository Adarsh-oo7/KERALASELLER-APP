import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { BarcodeMark, BarcodeScannerModal, Button, Card, EmptyState, Header, Input, LoadingState, Screen } from '../../components';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchProducts, saveProduct, type Product } from '../../api/seller';
import { apiError } from '../../lib/format';
import { codesFromProduct, findProductByCode, generateShopBarcode, sanitizeBarcode } from '../../lib/barcode';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import type { MainStackScreenProps } from '../../navigation/types';

export default function BarcodeScreen({ navigation }: MainStackScreenProps<'Barcodes'>) {
  const { requireOnline } = useOnlineGuard();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [scanner, setScanner] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setProducts(await fetchProducts({ page_size: 200 }));
    } catch (err) {
      Alert.alert('Could not load products', apiError(err, 'Try again.'));
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

  const onScan = (code: string) => {
    setScanner(false);
    const match = findProductByCode(products, code);
    if (match) {
      setSelected(match.product);
      setQuery(code);
      return;
    }
    Alert.alert(
      'No product for this code',
      `${code} is not on a shop product yet. Open a product and save this barcode there.`,
      [
        { text: 'OK' },
        { text: 'Add product', onPress: () => navigation.navigate('ProductForm', {}) },
      ],
    );
  };

  const createFor = async (product: Product) => {
    if (!requireOnline('Saving a barcode')) return;
    const code = generateShopBarcode(taken);
    setSavingId(product.id);
    try {
      const saved = await saveProduct({ barcode: code }, product.id);
      setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, ...saved, barcode: code } : item)));
      setSelected({ ...product, ...saved, barcode: code });
    } catch (err) {
      Alert.alert('Could not save barcode', apiError(err, 'Try again.'));
    } finally {
      setSavingId(null);
    }
  };

  const shareCode = async (product: Product) => {
    const code = sanitizeBarcode(product.barcode || '');
    if (!code) return;
    await Share.share({
      message: `${product.name}\nBarcode: ${code}`,
    });
  };

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Barcodes"
        subtitle="Create stickers and scan at the till"
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
        <Button label="Scan barcode" icon="scan-outline" onPress={() => setScanner(true)} />

        {selected?.barcode ? (
          <Card>
            <Text style={styles.name}>{selected.name}</Text>
            <BarcodeMark value={selected.barcode} />
            <Button label="Share code" variant="secondary" onPress={() => shareCode(selected)} />
          </Card>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState icon="barcode-outline" title="No products" message="Add a shop product, then create a barcode for its sticker." />
        ) : filtered.map((product) => (
          <TouchableOpacity
            key={product.id}
            onPress={() => setSelected(product)}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={product.name}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.name} maxFontSizeMultiplier={FONT_SCALE.body}>{product.name}</Text>
              <Text style={styles.meta}>
                {product.barcode ? product.barcode : 'No barcode yet'}
                {product.sku ? ` · SKU ${product.sku}` : ''}
              </Text>
            </View>
            {product.barcode ? (
              <Button label="Show" size="sm" variant="ghost" onPress={() => setSelected(product)} />
            ) : (
              <Button
                label="Create"
                size="sm"
                onPress={() => createFor(product)}
                loading={savingId === product.id}
                disabled={savingId != null}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
      <BarcodeScannerModal
        visible={scanner}
        title="Scan to find a product"
        onClose={() => setScanner(false)}
        onScan={onScan}
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
});
