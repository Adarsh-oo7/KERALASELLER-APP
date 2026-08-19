import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Badge, Button, Card, EmptyState, ErrorState, Header, Input, LoadingState, Notice, Screen } from '../../components';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import { deleteProduct, fetchProducts, fetchSellingStatus, type Product } from '../../api/seller';
import { apiError, formatInr } from '../../lib/format';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import type { MainTabScreenProps } from '../../navigation/types';

export default function ProductsScreen({ navigation }: MainTabScreenProps<'Products'>) {
  const { requireOnline } = useOnlineGuard();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(true);
  const blockedMessage = 'Finish store profile, Razorpay, and subscription before adding products.';

  const goAdd = () => {
    if (!requireOnline('Adding a product')) return;
    if (!ready) {
      Alert.alert('Shop not live yet', blockedMessage);
      return;
    }
    navigation.navigate('ProductForm', {});
  };

  const load = useCallback(async () => {
    setError('');
    try {
      const [list, selling] = await Promise.all([
        fetchProducts(),
        fetchSellingStatus().catch(() => null),
      ]);
      setProducts(list);
      setReady(Boolean(selling?.is_ready_to_sell));
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.name} ${p.model_name ?? ''}`.toLowerCase().includes(q),
    );
  }, [products, query]);

  const onDelete = (product: Product) => {
    Alert.alert('Delete product', `Remove ${product.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!requireOnline('Deleting a product')) return;
          try {
            await deleteProduct(product.id);
            setProducts((prev) => prev.filter((item) => item.id !== product.id));
          } catch (err) {
            Alert.alert('Could not delete', apiError(err, 'Try again.'));
          }
        },
      },
    ]);
  };

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Products"
        subtitle="Your catalogue"
        action={{
          icon: 'add',
          onPress: goAdd,
          accessibilityLabel: 'Add product',
        }}
      />
      <View style={styles.content}>
        {!ready ? (
          <Notice
            tone="warning"
            title="Shop not live yet"
            message={blockedMessage}
          />
        ) : null}
        <Input
          label="Search"
          placeholder="Name or model"
          value={query}
          onChangeText={setQuery}
        />
        {loading ? <LoadingState message="Loading products…" /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && filtered.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No products yet"
            message={ready ? 'Add your first item after setup is complete.' : blockedMessage}
            actionLabel={ready ? 'Add product' : 'Finish setup'}
            onAction={ready ? goAdd : () => navigation.navigate('Settings')}
          />
        ) : null}
        {filtered.map((product) => (
          <Card key={product.id}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProductForm', { productId: product.id })}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${product.name}`}
            >
              <View style={styles.row}>
                {product.thumbnail_url || product.main_image_url ? (
                  <Image
                    source={{ uri: product.thumbnail_url || product.main_image_url || undefined }}
                    style={styles.thumb}
                  />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]} />
                )}
                <View style={styles.copy}>
                  <Text style={styles.name} maxFontSizeMultiplier={FONT_SCALE.body}>
                    {product.name}
                  </Text>
                  {product.model_name ? (
                    <Text style={styles.meta} maxFontSizeMultiplier={FONT_SCALE.caption}>
                      {product.model_name}
                    </Text>
                  ) : null}
                  <Text style={styles.price} maxFontSizeMultiplier={FONT_SCALE.body}>
                    {formatInr(product.price)}
                  </Text>
                  <View style={styles.chips}>
                    <Badge
                      label={`Shop ${product.total_stock}`}
                      tone={product.total_stock > 0 ? 'success' : 'error'}
                    />
                    <Badge
                      label={`Online ${product.online_stock}`}
                      tone={product.online_stock > 0 ? 'info' : 'warning'}
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.actions}>
              <Button
                label="Edit"
                size="sm"
                variant="secondary"
                onPress={() => navigation.navigate('ProductForm', { productId: product.id })}
              />
              <Button
                label="Delete"
                size="sm"
                variant="destructive"
                onPress={() => onDelete(product)}
              />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  row: { flexDirection: 'row', gap: SPACING.md },
  thumb: { width: 64, height: 64, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceSecondary },
  thumbEmpty: { backgroundColor: COLORS.glassOverlay },
  copy: { flex: 1 },
  name: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  price: { ...TYPOGRAPHY.heading, color: COLORS.primary, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
