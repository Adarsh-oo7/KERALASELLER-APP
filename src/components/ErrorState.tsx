import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../theme';
import Button from './Button';

type Props = {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  retryLabel = 'Try again',
  onRetry,
}: Props) {
  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${message}`}
    >
      <View style={styles.iconWell}>
        <Ionicons name="cloud-offline-outline" size={32} color={COLORS.error} />
      </View>
      <Text style={styles.title} maxFontSizeMultiplier={FONT_SCALE.heading}>
        {title}
      </Text>
      <Text style={styles.message} maxFontSizeMultiplier={FONT_SCALE.body}>
        {message}
      </Text>
      {onRetry ? (
        <Button label={retryLabel} onPress={onRetry} variant="secondary" fullWidth={false} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  iconWell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.errorMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.heading,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
});
