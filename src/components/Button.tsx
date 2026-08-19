import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Defaults to `label`; set when the label alone lacks context. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

const HEIGHTS: Record<ButtonSize, number> = {
  sm: MIN_TOUCH_TARGET,
  md: 50,
  lg: 56,
};

const LABEL_STYLES: Record<ButtonSize, TextStyle> = {
  sm: TYPOGRAPHY.label,
  md: TYPOGRAPHY.bodyStrong,
  lg: TYPOGRAPHY.bodyStrong,
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props) {
  const isInactive = disabled || loading;
  const height = HEIGHTS[size];
  const foreground = variant === 'primary' || variant === 'destructive'
    ? COLORS.onPrimary
    : COLORS.primary;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={foreground} />
      )}
      <Text
        style={[LABEL_STYLES[size], { color: foreground }]}
        maxFontSizeMultiplier={FONT_SCALE.heading}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  const gradient: readonly [string, string] = variant === 'destructive'
    ? [COLORS.error, '#D46A62']
    : COLORS.gradientPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={[
        variant !== 'ghost' && SHADOWS.sm,
        fullWidth && styles.fullWidth,
        isInactive && styles.inactive,
        style,
      ]}
    >
      <View style={[styles.base, { minHeight: height }]}>
      {variant === 'primary' || variant === 'destructive' ? (
        <LinearGradient
          colors={isInactive ? [COLORS.buttonDisabled, COLORS.buttonDisabled] : gradient}
          style={[styles.fill, { minHeight: height }]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.fill,
            { minHeight: height },
            variant === 'secondary' && styles.secondary,
          ]}
        >
          {content}
        </View>
      )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: RADIUS.md, overflow: 'hidden' },
  fullWidth: { alignSelf: 'stretch' },
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.inputBorderFocused,
    borderRadius: RADIUS.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  inactive: { opacity: 0.6 },
});
