import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { COLORS, GLASS, RADIUS, SHADOWS, SPACING } from '../theme';
import GlassSurface, { GlassLevel } from './GlassSurface';

type Props = ViewProps & {
  /** Renders the card on frosted glass instead of an opaque surface. */
  glass?: boolean;
  glassLevel?: GlassLevel;
  elevation?: keyof typeof SHADOWS;
  padded?: boolean;
  /** Highlights the card as selected/active. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export default function Card({
  glass = false,
  glassLevel = 'medium',
  elevation = 'md',
  padded = true,
  active = false,
  style,
  children,
  ...rest
}: Props) {
  const inner = [
    styles.base,
    padded && styles.padded,
    active && styles.active,
  ];

  // Shadows must sit on a wrapper outside overflow:hidden, or BlurView clips them.
  return (
    <View style={[styles.wrap, SHADOWS[elevation], style]} {...rest}>
      {glass ? (
        <GlassSurface level={glassLevel} style={inner}>
          {children}
        </GlassSurface>
      ) : (
        <View style={[styles.opaque, ...inner]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  base: { borderRadius: RADIUS.lg },
  opaque: { backgroundColor: COLORS.surface },
  padded: { padding: SPACING.lg },
  active: { borderWidth: 1, borderColor: GLASS.borderSubtle },
});
