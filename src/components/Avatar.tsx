import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONT_SCALE, TYPOGRAPHY } from '../theme';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  name?: string;
  size?: Size;
};

const SIZES: Record<Size, number> = { sm: 36, md: 48, lg: 72 };

function initialsFor(name?: string) {
  if (!name?.trim()) return 'K';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'K';
}

export default function Avatar({ name, size = 'md' }: Props) {
  const dim = SIZES[size];
  const fontSize = size === 'lg' ? 28 : size === 'md' ? 18 : 14;

  return (
    <LinearGradient
      colors={COLORS.gradientPrimary}
      style={[styles.circle, { width: dim, height: dim, borderRadius: dim / 2 }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name ? `Avatar for ${name}` : 'Kerala Sellers logo'}
    >
      <Text
        style={[styles.letter, { fontSize, lineHeight: fontSize + 4 }]}
        maxFontSizeMultiplier={FONT_SCALE.heading}
      >
        {initialsFor(name)}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    ...TYPOGRAPHY.heading,
    color: COLORS.onPrimary,
    fontWeight: '700',
  },
});
