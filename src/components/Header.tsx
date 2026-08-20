import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, RADIUS, SPACING, TYPOGRAPHY } from '../theme';

type Action = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** Required: icon-only controls are invisible to screen readers without it. */
  accessibilityLabel: string;
  accessibilityHint?: string;
  showBadge?: boolean;
};

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Tinted headers sit on the brand gradient with light text. */
  tone?: 'brand' | 'plain';
  onBack?: () => void;
  action?: Action;
  children?: React.ReactNode;
};

export default function Header({
  title,
  subtitle,
  eyebrow,
  tone = 'plain',
  onBack,
  action,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const brand = tone === 'brand';
  const fg = brand ? COLORS.onPrimary : COLORS.textPrimary;
  const muted = brand ? 'rgba(255,255,255,0.88)' : COLORS.textSecondary;

  const body = (
    <View style={[styles.inner, { paddingTop: insets.top + SPACING.md }]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={fg} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titles}>
          {eyebrow ? (
            <Text
              style={[TYPOGRAPHY.caption, { color: muted }]}
              maxFontSizeMultiplier={FONT_SCALE.caption}
            >
              {eyebrow}
            </Text>
          ) : null}
          <Text
            style={[TYPOGRAPHY.title, { color: fg }]}
            maxFontSizeMultiplier={FONT_SCALE.heading}
            numberOfLines={2}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[TYPOGRAPHY.callout, { color: muted }]}
              maxFontSizeMultiplier={FONT_SCALE.body}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {action ? (
          <TouchableOpacity
            onPress={action.onPress}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            accessibilityHint={action.accessibilityHint}
          >
            <Ionicons name={action.icon} size={24} color={fg} />
            {action.showBadge ? <View style={styles.badge} /> : null}
          </TouchableOpacity>
        ) : null}
      </View>

      {children}
    </View>
  );

  if (!brand) {
    return <View style={styles.plain}>{body}</View>;
  }

  return (
    <LinearGradient colors={COLORS.gradientPrimary} style={styles.brand}>
      {body}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  plain: { backgroundColor: 'transparent' },
  brand: {
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  inner: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  titles: { flex: 1 },
  iconButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.error,
  },
});
