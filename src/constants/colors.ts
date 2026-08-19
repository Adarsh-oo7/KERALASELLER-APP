/**
 * Kerala Sellers brand tokens — aligned with keralasellers.in
 * (ivory canvas #FDFFF0, deep teal-green #1A4845, Onam gold accent).
 */
export const COLORS = {
  primary: '#1A4845',
  primaryLight: '#2A6B5E',
  primaryDark: '#0F2F2D',

  secondary: '#3D6B5E',
  accent: '#C6A35A',
  accentLight: '#E2C98A',

  background: '#FDFFF0',
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F1E4',

  glassLight: 'rgba(253, 255, 240, 0.92)',
  glassMedium: 'rgba(255, 255, 255, 0.82)',
  glassDark: 'rgba(255, 255, 255, 0.58)',
  glassOverlay: '#E7F1EA',
  primaryMuted: '#E7F1EA',
  accentMuted: '#F6EED8',

  textPrimary: '#14241F',
  textSecondary: '#5C6B66',
  textTertiary: '#9AA39E',
  onPrimary: '#FFFFFF',

  success: '#0F7A5A',
  warning: '#C4842A',
  error: '#C2473D',
  info: '#2F6F7A',

  successMuted: '#E3F4EC',
  warningMuted: '#F8EBD4',
  errorMuted: '#F8E4E1',
  infoMuted: '#E2F0F3',

  border: 'rgba(26, 72, 69, 0.12)',
  inputBackground: '#FFFFFF',
  inputBackgroundFocused: '#FFFEF8',
  inputBorder: 'rgba(26, 72, 69, 0.16)',
  inputBorderFocused: '#1A4845',

  shadowLight: 'rgba(15, 47, 45, 0.06)',
  shadowMedium: 'rgba(15, 47, 45, 0.12)',
  shadowHeavy: 'rgba(15, 47, 45, 0.18)',
  shadowColored: 'rgba(26, 72, 69, 0.22)',

  buttonDisabled: '#C9D2CC',
  buttonPressed: '#0F2F2D',

  gradientPrimary: ['#1A4845', '#0F7A5A'] as const,
  gradientSecondary: ['#C6A35A', '#E2C98A'] as const,
  gradientBackground: ['#FDFFF0', '#F3F6E4'] as const,
  gradientGlass: [
    'rgba(255, 255, 255, 0.94)',
    'rgba(253, 255, 240, 0.72)',
    'rgba(231, 241, 234, 0.4)',
  ] as const,
} as const;
