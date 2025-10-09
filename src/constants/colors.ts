export const COLORS = {
  // Primary Brand Colors (Based on Logo)
  primary: '#4A7C4F',         // Fresh forest green from logo
  primaryLight: '#6B9B6F',    // Lighter green variant  
  primaryDark: '#2D4A32',     // Deeper forest green
  primarySoft: '#E8F5E9',     // Very light green tint
  
  // Secondary Brand Colors  
  secondary: '#8B7355',       // Warm brown from shopping bag in logo
  secondaryLight: '#A68B6A',  // Light brown accent
  secondaryDark: '#6D5940',   // Deep brown
  secondarySoft: '#F5F2EE',   // Warm cream background
  
  // Modern Neutral Palette
  background: '#FAFBFA',      // Ultra-light green-tinted white
  surface: '#FFFFFF',         // Pure white for cards/containers
  surfaceElevated: 'rgba(255, 255, 255, 0.95)', // Elevated surfaces
  surfaceOverlay: 'rgba(74, 124, 79, 0.05)',    // Subtle green overlay
  
  // Text Hierarchy (Modern & Accessible)
  textPrimary: '#1A1D1A',     // Almost black with green undertone
  textSecondary: '#5F6B5F',   // Medium green-gray
  textTertiary: '#9CA59C',    // Light green-gray
  textDisabled: '#C4CCC4',    // Very light green-gray
  
  // Status Colors (Harmonized with Brand)
  success: '#4A7C4F',         // Primary green for success
  successLight: '#E8F5E9',    // Light success background
  warning: '#D4941E',         // Warm amber
  warningLight: '#FEF5E7',    // Light warning background
  error: '#D84315',           // Warm red-orange
  errorLight: '#FFEBE8',      // Light error background
  info: '#1976D2',            // Professional blue
  infoLight: '#E3F2FD',       // Light info background
  
  // Interactive Elements
  inputBackground: 'rgba(255, 255, 255, 0.9)',
  inputBackgroundFocused: '#FFFFFF',
  inputBorder: 'rgba(74, 124, 79, 0.15)',
  inputBorderFocused: 'rgba(74, 124, 79, 0.4)',
  inputPlaceholder: '#9CA59C',
  
  // Button States
  buttonPrimary: '#4A7C4F',
  buttonPrimaryHover: '#3E6A43',
  buttonPrimaryPressed: '#2D4A32',
  buttonPrimaryDisabled: '#C4CCC4',
  buttonSecondary: 'rgba(74, 124, 79, 0.1)',
  buttonSecondaryHover: 'rgba(74, 124, 79, 0.15)',
  
  // Shadows & Effects
  shadowLight: 'rgba(26, 29, 26, 0.04)',
  shadowMedium: 'rgba(26, 29, 26, 0.08)',
  shadowHeavy: 'rgba(26, 29, 26, 0.12)',
  shadowColored: 'rgba(74, 124, 79, 0.15)',
  
  // Modern Glass/Blur Effects
  glass: {
    light: 'rgba(255, 255, 255, 0.85)',
    medium: 'rgba(255, 255, 255, 0.65)',
    dark: 'rgba(255, 255, 255, 0.45)',
    tinted: 'rgba(74, 124, 79, 0.08)',
  },
  
  // Gradient Collections  
  gradients: {
    primary: ['#4A7C4F', '#6B9B6F'],
    secondary: ['#8B7355', '#A68B6A'],
    background: ['#FAFBFA', '#FFFFFF'],
    glass: [
      'rgba(255, 255, 255, 0.9)',
      'rgba(255, 255, 255, 0.6)',
      'rgba(255, 255, 255, 0.3)'
    ],
    accent: ['#E8F5E9', '#FAFBFA'],
    // ✅ ADDED: Instagram-style gradients for modern look
    instagram: ['#405DE6', '#5851DB', '#833AB4', '#C13584', '#E1306C', '#FD1D1D'],
    facebook: ['#1877F2', '#42A5F5'],
    kerala: ['#4A7C4F', '#8B7355'], // Your logo colors combined
  },
  
  // Modern Accent Colors
  accent: {
    mint: '#B8E6B8',      // Fresh mint green
    sage: '#C8D5C8',      // Sage green
    cream: '#F5F2EE',     // Warm cream
    gold: '#E6D19C',      // Soft gold accent
  },
  
  // ✅ ADDED: Additional modern colors for social media style
  facebook: '#1877F2',
  facebookLight: '#E7F3FF',
  instagram: '#E4405F',
  instagramLight: '#FCE4EC',
  linkedin: '#0A66C2',
  linkedinLight: '#E3F2FD',
  
  // ✅ ADDED: Borders and dividers
  border: 'rgba(74, 124, 79, 0.12)',
  borderLight: 'rgba(74, 124, 79, 0.06)',
  divider: 'rgba(74, 124, 79, 0.08)',
  
  // ✅ ADDED: Overlay colors for modals/sidebars
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
} as const;

// ✅ ADDED: Type for better TypeScript support
export type ColorKey = keyof typeof COLORS;
export type GradientKey = keyof typeof COLORS.gradients;
export type AccentKey = keyof typeof COLORS.accent;
export type GlassKey = keyof typeof COLORS.glass;

// ✅ ADDED: Helper function to get colors with fallback
export const getColor = (key: string, fallback: string = COLORS.textPrimary): string => {
  const keys = key.split('.');
  let current: any = COLORS;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return fallback;
    }
  }
  
  return typeof current === 'string' ? current : fallback;
};

// ✅ ADDED: Helper functions for common operations
export const colorHelpers = {
  // Get gradient array
  getGradient: (name: GradientKey): string[] => {
    return COLORS.gradients[name] || COLORS.gradients.primary;
  },
  
  // Get accent color
  getAccent: (name: AccentKey): string => {
    return COLORS.accent[name] || COLORS.accent.mint;
  },
  
  // Get glass effect color
  getGlass: (opacity: GlassKey): string => {
    return COLORS.glass[opacity] || COLORS.glass.light;
  },
  
  // Add alpha to any color
  addAlpha: (color: string, alpha: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
};

export default COLORS;
