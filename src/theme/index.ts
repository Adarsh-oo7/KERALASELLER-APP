/**
 * Single source of truth for the app's visual language.
 *
 * Colours continue to live in `src/constants/colors.ts` and are re-exported
 * here so screens only ever need one import.
 */
import { Platform, ViewStyle } from 'react-native';

import { COLORS } from '../constants/colors';

export { COLORS };

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Nothing is smaller than 12pt: below that, text stops being legible at arm's
 * length and fails contrast on the muted greys used for secondary copy.
 */
export const TYPOGRAPHY = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const;

/**
 * `elevation` is Android-only, so anything relying on it alone renders flat on
 * iOS. Every level here sets both.
 */
const shadow = (
  height: number,
  opacity: number,
  radius: number,
  elevation: number,
): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: COLORS.primaryDark,
      shadowOffset: { width: 0, height },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {},
  }) ?? {};

export const SHADOWS = {
  none: {} as ViewStyle,
  sm: shadow(1, 0.06, 3, 2),
  md: shadow(2, 0.1, 8, 4),
  lg: shadow(6, 0.14, 16, 8),
} as const;

/**
 * Liquid Glass. Treated as a progressive enhancement: every surface using it
 * also declares a solid translucent fallback so the layout stays readable when
 * blur is unavailable or disabled.
 */
export const GLASS = {
  tint: 'light' as const,
  intensity: {
    subtle: 24,
    medium: 45,
    strong: 70,
  },
  /** Used when blur is off, unsupported, or too costly on the device. */
  fallback: {
    subtle: COLORS.glassLight,
    medium: COLORS.surface,
    strong: COLORS.surface,
  },
  border: 'rgba(26, 72, 69, 0.10)',
  borderSubtle: COLORS.border,
} as const;

/** iOS HIG and Material both put the minimum comfortable target at 44pt. */
export const MIN_TOUCH_TARGET = 44;

/**
 * Caps runaway layout growth at the largest accessibility font sizes while
 * still honouring the user's preference up to a readable ceiling.
 */
export const FONT_SCALE = {
  heading: 1.4,
  body: 1.6,
  caption: 1.8,
} as const;
