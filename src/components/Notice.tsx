import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONT_SCALE, RADIUS, SPACING, TYPOGRAPHY } from '../theme';

type Tone = 'info' | 'warning' | 'success';

type Props = {
  title: string;
  message: string;
  tone?: Tone;
};

const TONES: Record<Tone, { bg: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }> = {
  info: {
    bg: COLORS.infoMuted,
    icon: 'information-circle-outline',
    iconColor: COLORS.info,
  },
  warning: {
    bg: COLORS.warningMuted,
    icon: 'alert-circle-outline',
    iconColor: COLORS.warning,
  },
  success: {
    bg: COLORS.successMuted,
    icon: 'checkmark-circle-outline',
    iconColor: COLORS.success,
  },
};

export default function Notice({ title, message, tone = 'info' }: Props) {
  const t = TONES[tone];
  return (
    <View
      style={[styles.wrap, { backgroundColor: t.bg }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${message}`}
    >
      <Ionicons name={t.icon} size={22} color={t.iconColor} />
      <View style={styles.copy}>
        <Text style={styles.title} maxFontSizeMultiplier={FONT_SCALE.body}>
          {title}
        </Text>
        <Text style={styles.message} maxFontSizeMultiplier={FONT_SCALE.body}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  copy: { flex: 1, gap: 2 },
  title: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.textPrimary,
  },
  message: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
