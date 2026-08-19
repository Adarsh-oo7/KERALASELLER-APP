import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Header, Screen } from '../../components';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchDeliveryConfig, fetchHomepageListing, fetchStoreProfile } from '../../api/seller';
import type { MainStackScreenProps } from '../../navigation/types';

type Row = {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function SettingsScreen({ navigation, route }: MainStackScreenProps<'Settings'>) {
  const setup = Boolean(route.params?.setup);
  const [basicHint, setBasicHint] = useState('Shop name, logo, WhatsApp, and banners');
  const [advancedHint, setAdvancedHint] = useState('Verification, home listing, and shop policies');
  const [deliveryHint, setDeliveryHint] = useState('Free delivery is the default. Turn it off to charge by weight.');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [profile, listing, delivery] = await Promise.all([
          fetchStoreProfile().catch(() => null),
          fetchHomepageListing().catch(() => null),
          fetchDeliveryConfig().catch(() => null),
        ]);
        if (cancelled) return;
        if (profile?.name) setBasicHint(profile.name);
        const status = listing?.status || profile?.homepage_listing_status || 'not_requested';
        if (status === 'approved') setAdvancedHint('Verified. Pick which products appear on the home page.');
        else if (status === 'pending') setAdvancedHint('Waiting for superuser verification.');
        else if (status === 'rejected') setAdvancedHint('Rejected. Update details and request again.');
        else setAdvancedHint('Verify the shop, then pick home page products.');
        setDeliveryHint(
          delivery?.enabled
            ? 'Charged by the total packed weight of the order.'
            : 'Free delivery is on. Open this to charge by weight.',
        );
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const rows: Row[] = [
    {
      label: 'Basic settings',
      hint: basicHint,
      icon: 'storefront-outline',
      onPress: () => navigation.navigate('BasicSettings', setup ? { setup: true } : undefined),
    },
    {
      label: 'Advanced settings',
      hint: advancedHint,
      icon: 'shield-checkmark-outline',
      onPress: () => navigation.navigate('HomepageListing'),
    },
    {
      label: 'Delivery settings',
      hint: deliveryHint,
      icon: 'bicycle-outline',
      onPress: () => navigation.navigate('DeliveryCharges'),
    },
  ];

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Store settings"
        subtitle="Choose a section"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Card padded={false}>
          {rows.map((row, index) => (
            <TouchableOpacity
              key={row.label}
              onPress={row.onPress}
              style={[styles.row, index < rows.length - 1 && styles.divider]}
              accessibilityRole="button"
              accessibilityLabel={row.label}
              accessibilityHint={row.hint}
            >
              <View style={styles.icon}>
                <Ionicons name={row.icon} size={20} color={COLORS.primary} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>
                  {row.label}
                </Text>
                <Text style={styles.hint} maxFontSizeMultiplier={FONT_SCALE.caption}>
                  {row.hint}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET + 12,
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.inputBorder },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glassOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  label: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
});
