import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, RADIUS, SPACING, TYPOGRAPHY } from '../theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  helper?: string;
  error?: string;
  /** Static text pinned inside the field, e.g. a `+91` dial code. */
  prefix?: string;
  /** Renders a show/hide control and manages `secureTextEntry`. */
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function Input({
  label,
  helper,
  error,
  prefix,
  secure = false,
  containerStyle,
  editable = true,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const hasError = Boolean(error);

  return (
    <View style={[styles.group, containerStyle]}>
      <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>
        {label}
      </Text>

      <View
        style={[
          styles.field,
          inputProps.multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          hasError && styles.fieldError,
          !editable && styles.fieldDisabled,
        ]}
      >
        {prefix ? (
          <Text style={styles.prefix} maxFontSizeMultiplier={FONT_SCALE.body}>
            {prefix}
          </Text>
        ) : null}

        <TextInput
          {...inputProps}
          editable={editable}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={COLORS.textTertiary}
          style={[styles.input, inputProps.multiline && styles.inputMultiline]}
          maxFontSizeMultiplier={FONT_SCALE.body}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          accessibilityLabel={label}
          // Screen readers should hear the problem, not just the field name.
          accessibilityHint={error ?? helper}
        />

        {secure ? (
          <TouchableOpacity
            onPress={() => setRevealed((v) => !v)}
            style={styles.reveal}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            accessibilityState={{ selected: revealed }}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {hasError ? (
        <Text style={styles.error} maxFontSizeMultiplier={FONT_SCALE.caption}>
          {error}
        </Text>
      ) : helper ? (
        <Text style={styles.helper} maxFontSizeMultiplier={FONT_SCALE.caption}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: SPACING.lg },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs + 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET + 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: SPACING.md,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    minHeight: 140,
    paddingVertical: SPACING.sm,
  },
  fieldFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.inputBackgroundFocused,
  },
  fieldError: { borderColor: COLORS.error },
  fieldDisabled: { backgroundColor: COLORS.surfaceSecondary, opacity: 0.7 },
  prefix: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },
  reveal: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -SPACING.sm,
  },
  helper: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
});
