import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { SHADOWS } from '../theme';

const LOGO = require('../../assets/logo.png');

const SIZES = {
  sm: 56,
  md: 132,
  lg: 176,
} as const;

type Props = {
  size?: keyof typeof SIZES;
};

export default function Logo({ size = 'lg' }: Props) {
  const dim = SIZES[size];

  return (
    <View style={[SHADOWS.sm, { width: dim, height: dim }]}>
      <Image
        source={LOGO}
        style={{ width: dim, height: dim }}
        resizeMode="contain"
        accessible
        accessibilityRole="image"
        accessibilityLabel="Kerala Sellers"
      />
    </View>
  );
}
