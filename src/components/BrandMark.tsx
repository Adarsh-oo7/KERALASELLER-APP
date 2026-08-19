import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../theme';
import Logo from './Logo';

type Props = {
  tagline?: string;
  compact?: boolean;
};

export default function BrandMark({ tagline, compact = false }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]} accessible accessibilityRole="header">
      <Logo size={compact ? 'md' : 'lg'} />
      {tagline ? (
        <Text style={styles.tagline} maxFontSizeMultiplier={FONT_SCALE.caption}>
          {tagline}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  wrapCompact: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  tagline: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
