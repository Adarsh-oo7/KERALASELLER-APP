export const COLORS = {
    // Military Green Primary Palette
    primary: '#2B4B39',        // Deep Military Green
    primaryLight: '#3A5D47',   // Lighter Military Green
    primaryDark: '#1C3228',    // Darker Military Green
    
    // Complementary Greens
    secondary: '#4A6B52',      // Sage Military Green
    accent: '#6B8E73',         // Light Military Green
    accentLight: '#8FA896',    // Very Light Military Green
    
    // Apple Liquid Glass Neutrals
    background: '#F8F9FA',     // Apple Light Background
    surface: '#FFFFFF',        // Pure White Surface
    surfaceSecondary: '#F1F3F4', // Secondary Surface
    
    // Glass Effect Colors
    glassLight: 'rgba(255, 255, 255, 0.9)',
    glassMedium: 'rgba(255, 255, 255, 0.7)',
    glassDark: 'rgba(255, 255, 255, 0.5)',
    glassOverlay: 'rgba(43, 75, 57, 0.1)', // Military green tint
    
    // Text Colors (Apple Style)
    textPrimary: '#1D1D1F',   // Apple Dark Text
    textSecondary: '#86868B', // Apple Gray Text
    textTertiary: '#C7C7CC',  // Apple Light Gray
    
    // Status Colors with Military Theme
    success: '#4A6B52',       // Military Success Green
    warning: '#D4A574',       // Muted Military Orange
    error: '#B85450',         // Muted Military Red
    info: '#5B7A87',          // Military Blue-Gray
    
    // Input & Interactive
    inputBackground: 'rgba(255, 255, 255, 0.8)',
    inputBackgroundFocused: 'rgba(255, 255, 255, 0.95)',
    inputBorder: 'rgba(43, 75, 57, 0.1)',
    inputBorderFocused: 'rgba(43, 75, 57, 0.3)',
    
    // Shadows & Effects
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    shadowMedium: 'rgba(0, 0, 0, 0.1)',
    shadowHeavy: 'rgba(0, 0, 0, 0.15)',
    shadowColored: 'rgba(43, 75, 57, 0.2)',
    
    // Button States
    buttonDisabled: '#C7C7CC',
    buttonPressed: '#1C3228',
    
    // Gradients
    gradientPrimary: ['#2B4B39', '#3A5D47'],
    gradientSecondary: ['#4A6B52', '#6B8E73'],
    gradientBackground: ['#F8F9FA', '#FFFFFF'],
    gradientGlass: [
      'rgba(255, 255, 255, 0.9)',
      'rgba(255, 255, 255, 0.6)',
      'rgba(255, 255, 255, 0.3)'
    ],
  } as const;
  