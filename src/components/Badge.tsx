import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT_SCALE, RADIUS, SPACING, TYPOGRAPHY } from '../theme';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

type Props = {
  label: string;
  tone?: Tone;
};

const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: COLORS.successMuted, fg: COLORS.success },
  warning: { bg: COLORS.warningMuted, fg: COLORS.warning },
  error: { bg: COLORS.errorMuted, fg: COLORS.error },
  info: { bg: COLORS.infoMuted, fg: COLORS.info },
  neutral: { bg: COLORS.surfaceSecondary, fg: COLORS.textSecondary },
};

export default function Badge({ label, tone = 'neutral' }: Props) {
  const colors = TONES[tone];
  return (
    <View
      style={[styles.base, { backgroundColor: colors.bg }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text
        style={[styles.label, { color: colors.fg }]}
        maxFontSizeMultiplier={FONT_SCALE.caption}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
});
