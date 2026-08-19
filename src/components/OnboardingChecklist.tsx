import React from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Button from './Button';
import Card from './Card';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../theme';
import { publicShopUrl, type OnboardingStatus } from '../api/seller';

type Props = {
  status: OnboardingStatus | null;
  onOpenProfile: () => void;
  onOpenPayments: () => void;
  onOpenSubscription: () => void;
};

const STEPS: {
  key: 'store_profile' | 'payment_gateway' | 'subscription';
  title: string;
  hint: string;
}[] = [
  { key: 'store_profile', title: 'Store profile and logo', hint: 'Name, description, WhatsApp, and logo' },
  { key: 'payment_gateway', title: 'Payment gateway', hint: 'Connect Razorpay keys' },
  { key: 'subscription', title: 'Active subscription', hint: 'Coupon or paid plan' },
];

export default function OnboardingChecklist({
  status,
  onOpenProfile,
  onOpenPayments,
  onOpenSubscription,
}: Props) {
  const requirements = status?.requirements;
  const done = {
    store_profile: Boolean(requirements?.store_profile?.complete),
    payment_gateway: Boolean(requirements?.payment_gateway?.complete),
    subscription: Boolean(requirements?.subscription?.complete),
    is_live: Boolean(requirements?.is_live || status?.is_ready_to_sell || status?.shop_link_live),
  };
  const remaining = STEPS.filter((step) => !done[step.key]);
  const liveUrl = done.is_live ? publicShopUrl(status?.store_url) : null;

  const onPress = (key: (typeof STEPS)[number]['key']) => {
    if (key === 'store_profile') onOpenProfile();
    if (key === 'payment_gateway') onOpenPayments();
    if (key === 'subscription') onOpenSubscription();
  };

  const share = async () => {
    if (!liveUrl) return;
    await Share.share({ message: liveUrl, url: liveUrl });
  };

  if (remaining.length === 0 && !liveUrl) {
    return null;
  }

  return (
    <Card>
      <Text style={styles.title} maxFontSizeMultiplier={FONT_SCALE.heading}>
        {remaining.length === 0 ? "You're live" : 'Go live'}
      </Text>
      <Text style={styles.subtitle} maxFontSizeMultiplier={FONT_SCALE.caption}>
        {remaining.length === 0
          ? 'Your public shop link is ready to share.'
          : remaining.length === 1
            ? 'One step left before you can add products and share your shop.'
            : `${remaining.length} steps left before you can add products and share your shop.`}
      </Text>
      {remaining.map((step) => (
        <View key={step.key} style={styles.row}>
          <Ionicons name="ellipse-outline" size={22} color={COLORS.textSecondary} />
          <View style={styles.copy}>
            <Text style={styles.stepTitle} maxFontSizeMultiplier={FONT_SCALE.body}>
              {step.title}
            </Text>
            <Text style={styles.hint} maxFontSizeMultiplier={FONT_SCALE.caption}>
              {step.hint}
            </Text>
          </View>
          <Button label="Continue setup" size="sm" variant="secondary" onPress={() => onPress(step.key)} />
        </View>
      ))}
      {liveUrl ? (
        <View style={styles.live}>
          <Text style={styles.link} maxFontSizeMultiplier={FONT_SCALE.caption}>
            {liveUrl}
          </Text>
          <Button label="Share shop link" icon="share-outline" onPress={share} />
        </View>
      ) : remaining.length > 0 ? (
        <Text style={styles.pending} maxFontSizeMultiplier={FONT_SCALE.caption}>
          Your shop link stays private until these steps are done.
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { ...TYPOGRAPHY.heading, color: COLORS.textPrimary },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  copy: { flex: 1 },
  stepTitle: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  live: { marginTop: SPACING.md, gap: SPACING.sm },
  link: { ...TYPOGRAPHY.caption, color: COLORS.primary },
  pending: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.sm },
});
