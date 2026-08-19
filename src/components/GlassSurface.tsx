import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { GLASS, RADIUS } from '../theme';

export type GlassLevel = keyof typeof GLASS.intensity;

/**
 * Global kill switch for Liquid Glass. Blur is a progressive enhancement, so
 * flipping this to `false` must leave every screen fully readable — each
 * surface falls back to a solid translucent fill of the same weight.
 */
export const GLASS_ENABLED = true;

type Props = ViewProps & {
  level?: GlassLevel;
  enabled?: boolean;
  /** Draws the hairline highlight that gives the glass its edge. */
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export default function GlassSurface({
  level = 'medium',
  enabled = GLASS_ENABLED,
  bordered = true,
  style,
  children,
  ...rest
}: Props) {
  const border = bordered ? styles.border : null;

  // SDK 55's dimezisBlurView needs a blurTarget. Until screens wrap a target,
  // Android uses the solid fallback so Expo Go stays readable without warnings.
  if (!enabled || Platform.OS === 'android') {
    return (
      <View
        style={[{ backgroundColor: GLASS.fallback[level] }, border, style]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={GLASS.intensity[level]}
      tint={GLASS.tint}
      style={[styles.clip, border, style]}
      {...rest}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  // Blur bleeds past rounded corners on Android without an explicit clip.
  clip: { overflow: 'hidden', borderRadius: RADIUS.lg },
  border: { borderWidth: StyleSheet.hairlineWidth, borderColor: GLASS.border },
});
