import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../theme';
import { encodeCode39 } from '../lib/barcode';

type Props = {
  value: string;
  height?: number;
};

export default function BarcodeMark({ value, height = 88 }: Props) {
  const modules = encodeCode39(value);
  if (!modules.length) {
    return <Text style={styles.empty}>Enter a barcode to preview</Text>;
  }
  return (
    <View style={styles.wrap} accessibilityLabel={`Barcode ${value}`}>
      <View style={[styles.row, { height }]}>
        {modules.map((item, index) => (
          <View
            key={`${item.kind}-${index}`}
            style={{
              width: item.width * 1.6,
              height,
              backgroundColor: item.kind === 'bar' ? COLORS.textPrimary : COLORS.surface,
            }}
          />
        ))}
      </View>
      <Text style={styles.caption} maxFontSizeMultiplier={FONT_SCALE.caption}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  caption: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, marginTop: SPACING.sm, letterSpacing: 2 },
  empty: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
});
