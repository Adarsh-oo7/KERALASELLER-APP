import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, Chip, Header, Input, LoadingState, Notice, Screen } from '../../components';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, SPACING, TYPOGRAPHY } from '../../theme';
import {
  createDeliverySlab,
  deleteDeliverySlab,
  fetchDeliveryConfig,
  fetchDeliverySlabs,
  previewDeliveryCharge,
  saveDeliveryConfig,
  updateDeliverySlab,
  type DeliveryConfig,
  type WeightSlab,
} from '../../api/seller';
import { apiError } from '../../lib/format';
import type { MainStackScreenProps } from '../../navigation/types';

type ChargeMode = 'flat' | 'weight';

const EASY_BANDS = [
  { key: 'light', title: 'Light', hint: 'Up to 1 kg', min: 0, max: 1, defaultPrice: 50 },
  { key: 'medium', title: 'Medium', hint: '1 kg to 3 kg', min: 1, max: 3, defaultPrice: 80 },
  { key: 'heavy', title: 'Heavy', hint: 'Above 3 kg', min: 3, max: null, defaultPrice: 120 },
] as const;

function numText(value: unknown): string {
  if (value == null || value === '') return '';
  return String(value);
}

function toNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isOpenEnded(slab: WeightSlab): boolean {
  return slab.max_weight_kg == null || slab.max_weight_kg === '';
}

function detectMode(slabs: WeightSlab[]): ChargeMode {
  if (
    slabs.length === 1 &&
    toNum(slabs[0].min_weight_kg) === 0 &&
    isOpenEnded(slabs[0]) &&
    slabs[0].pricing_type === 'FIXED'
  ) {
    return 'flat';
  }
  return 'weight';
}

function flatSlab(price: number, existing?: WeightSlab): WeightSlab {
  return {
    id: typeof existing?.id === 'number' ? existing.id : `temp_flat_${Date.now()}`,
    min_weight_kg: 0,
    max_weight_kg: null,
    pricing_type: 'FIXED',
    fixed_price: price,
    price_per_kg: 0,
    base_fee: 0,
    is_new: typeof existing?.id !== 'number',
  };
}

function weightSlabs(prices: number[], existing: WeightSlab[] = []): WeightSlab[] {
  return EASY_BANDS.map((band, index) => {
    const match =
      existing.find((slab) => toNum(slab.min_weight_kg) === band.min) ||
      existing[index];
    return {
      id: typeof match?.id === 'number' ? match.id : `temp_band_${band.key}_${Date.now()}`,
      min_weight_kg: band.min,
      max_weight_kg: band.max,
      pricing_type: 'FIXED' as const,
      fixed_price: prices[index] ?? band.defaultPrice,
      price_per_kg: 0,
      base_fee: 0,
      is_new: typeof match?.id !== 'number',
    };
  });
}

function pricesFromSlabs(slabs: WeightSlab[]): number[] {
  return EASY_BANDS.map((band, index) => {
    const match = slabs.find((slab) => toNum(slab.min_weight_kg) === band.min) || slabs[index];
    const price = toNum(match?.fixed_price, band.defaultPrice);
    return price > 0 ? price : band.defaultPrice;
  });
}

export default function DeliveryChargesScreen({ navigation }: MainStackScreenProps<'DeliveryCharges'>) {
  const [config, setConfig] = useState<DeliveryConfig>({
    enabled: false,
    fallback_flat_charge: 50,
    cod_extra_charge: 0,
    free_delivery_above: 0,
  });
  const [mode, setMode] = useState<ChargeMode>('weight');
  const [flatPrice, setFlatPrice] = useState('50');
  const [bandPrices, setBandPrices] = useState(['50', '80', '120']);
  const [savedSlabs, setSavedSlabs] = useState<WeightSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const freeDelivery = !config.enabled;

  const slabs = useMemo(() => {
    if (freeDelivery) return [];
    if (mode === 'flat') return [flatSlab(toNum(flatPrice, 50), savedSlabs[0])];
    return weightSlabs(bandPrices.map((price) => toNum(price, 0)), savedSlabs);
  }, [bandPrices, flatPrice, freeDelivery, mode, savedSlabs]);

  const load = useCallback(async () => {
    try {
      const [nextConfig, nextSlabs] = await Promise.all([fetchDeliveryConfig(), fetchDeliverySlabs()]);
      const enabled = Boolean(nextConfig.enabled);
      setConfig({
        enabled,
        fallback_flat_charge: nextConfig.fallback_flat_charge ?? 50,
        cod_extra_charge: nextConfig.cod_extra_charge ?? 0,
        free_delivery_above: nextConfig.free_delivery_above ?? 0,
      });
      setSavedSlabs(nextSlabs);
      if (!enabled) return;
      const nextMode = detectMode(nextSlabs);
      setMode(nextMode);
      if (nextMode === 'flat') {
        setFlatPrice(String(toNum(nextSlabs[0]?.fixed_price, 50)));
      } else {
        setBandPrices(pricesFromSlabs(nextSlabs).map(String));
      }
    } catch (err) {
      Alert.alert('Could not load delivery settings', apiError(err, 'Try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const setFreeDelivery = (on: boolean) => {
    setConfig((current) => ({ ...current, enabled: !on }));
    if (!on && mode === 'weight' && bandPrices.every((price) => !toNum(price))) {
      setBandPrices(EASY_BANDS.map((band) => String(band.defaultPrice)));
    }
  };

  const previews = useMemo(
    () =>
      [
        { label: 'One light item (0.5 kg)', weight: 0.5, subtotal: 400 },
        { label: 'Two items together (1.5 kg)', weight: 1.5, subtotal: 800 },
        { label: 'A heavy order (4 kg)', weight: 4, subtotal: 1500 },
      ].map((row) => ({
        ...row,
        charge: previewDeliveryCharge(row.weight, row.subtotal, false, { ...config, enabled: true }, slabs),
      })),
    [config, slabs],
  );

  const persistSlabs = async (nextSlabs: WeightSlab[]) => {
    const keepIds = new Set(nextSlabs.map((slab) => slab.id).filter((id): id is number => typeof id === 'number'));
    const existing = await fetchDeliverySlabs();
    for (const slab of existing) {
      if (typeof slab.id === 'number' && !keepIds.has(slab.id)) {
        await deleteDeliverySlab(slab.id);
      }
    }
    for (let index = 0; index < nextSlabs.length; index += 1) {
      const slab = nextSlabs[index];
      const payload = {
        min_weight_kg: toNum(slab.min_weight_kg),
        max_weight_kg: slab.max_weight_kg == null || slab.max_weight_kg === '' ? null : toNum(slab.max_weight_kg),
        pricing_type: 'FIXED' as const,
        fixed_price: toNum(slab.fixed_price),
        price_per_kg: 0,
        base_fee: 0,
        sort_order: index,
      };
      if (slab.is_new || typeof slab.id !== 'number') {
        await createDeliverySlab(payload);
      } else {
        await updateDeliverySlab(slab.id, payload);
      }
    }
  };

  const save = async () => {
    if (!freeDelivery) {
      if (mode === 'flat' && toNum(flatPrice) <= 0) {
        Alert.alert('Delivery charge', 'Enter the amount buyers should pay for delivery.');
        return;
      }
      if (mode === 'weight' && bandPrices.some((price) => toNum(price) <= 0)) {
        Alert.alert('Weight charges', 'Enter a delivery charge for light, medium, and heavy orders.');
        return;
      }
    }
    setSaving(true);
    try {
      const nextSlabs = freeDelivery ? [] : slabs;
      const fallback = mode === 'flat' ? toNum(flatPrice, 50) : toNum(bandPrices[2], 120);
      await saveDeliveryConfig({
        enabled: !freeDelivery,
        fallback_flat_charge: fallback,
        cod_extra_charge: toNum(config.cod_extra_charge, 0),
        free_delivery_above: toNum(config.free_delivery_above, 0),
      });
      if (!freeDelivery) await persistSlabs(nextSlabs);
      await load();
      Alert.alert(
        'Saved',
        freeDelivery
          ? 'Buyers are not charged extra delivery.'
          : mode === 'flat'
            ? `Every order adds ₹${toNum(flatPrice)} delivery. Several products still pay this once.`
            : 'Checkout adds every product’s packed weight, then uses light, medium, or heavy.',
      );
    } catch (err) {
      Alert.alert('Could not save', apiError(err, 'Try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading delivery settings…" />;

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Delivery settings"
        subtitle="Start with free delivery. Add a charge only if you need it."
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Card>
          <View style={styles.switchRow}>
            <View style={styles.copy}>
              <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Free delivery</Text>
              <Text style={styles.hint} maxFontSizeMultiplier={FONT_SCALE.caption}>
                Recommended. Buyers pay only for products.
              </Text>
            </View>
            <Switch
              value={freeDelivery}
              onValueChange={setFreeDelivery}
              trackColor={{ false: COLORS.inputBorder, true: COLORS.success }}
              accessibilityLabel="Free delivery"
            />
          </View>
        </Card>

        {freeDelivery ? (
          <Notice
            tone="success"
            title="No extra delivery charge"
            message="If a buyer orders one item or many items, delivery stays free until you turn this off."
          />
        ) : (
          <>
            <Text style={styles.sectionTitle}>How should buyers be charged?</Text>
            <View style={styles.chipRow}>
              <Chip
                label="One charge for all orders"
                selected={mode === 'flat'}
                onPress={() => setMode('flat')}
              />
              <Chip
                label="Charge by total weight"
                selected={mode === 'weight'}
                onPress={() => setMode('weight')}
              />
            </View>

            {mode === 'flat' ? (
              <>
                <Notice
                  tone="info"
                  title="Same charge once per order"
                  message="If a buyer buys 3 products, they still pay this delivery amount once — not 3 times."
                />
                <Input
                  label="Delivery charge"
                  helper="Added to every online order."
                  value={flatPrice}
                  onChangeText={setFlatPrice}
                  keyboardType="decimal-pad"
                  prefix="₹"
                  placeholder="50"
                />
              </>
            ) : (
              <>
                <Notice
                  tone="info"
                  title="Weight is added together"
                  message="Two 0.6 kg products become 1.2 kg, so the medium charge is used. Add packed weight on each product."
                />
                {EASY_BANDS.map((band, index) => (
                  <Input
                    key={band.key}
                    label={`${band.title} · ${band.hint}`}
                    value={bandPrices[index]}
                    onChangeText={(value) =>
                      setBandPrices((current) => current.map((price, i) => (i === index ? value : price)))
                    }
                    keyboardType="decimal-pad"
                    prefix="₹"
                    placeholder={String(band.defaultPrice)}
                  />
                ))}
              </>
            )}

            <Input
              label="Free delivery if order is above (optional)"
              helper="Leave 0 to always charge delivery."
              value={numText(config.free_delivery_above)}
              onChangeText={(free_delivery_above) => setConfig((current) => ({ ...current, free_delivery_above }))}
              keyboardType="decimal-pad"
              prefix="₹"
            />
            <Input
              label="Extra for cash on delivery (optional)"
              helper="Added only when the buyer chooses COD."
              value={numText(config.cod_extra_charge)}
              onChangeText={(cod_extra_charge) => setConfig((current) => ({ ...current, cod_extra_charge }))}
              keyboardType="decimal-pad"
              prefix="₹"
            />

            <Card>
              <Text style={styles.sectionTitle}>Example</Text>
              {previews.map((row) => (
                <View key={row.label} style={styles.previewRow}>
                  <Text style={styles.previewLabel}>{row.label}</Text>
                  <Text style={styles.previewValue}>₹{row.charge}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        <Button label={saving ? 'Saving…' : 'Save delivery settings'} onPress={save} loading={saving} disabled={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  switchRow: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  copy: { flex: 1 },
  label: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.inputBorder,
  },
  previewLabel: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, flex: 1, paddingRight: SPACING.md },
  previewValue: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
});
