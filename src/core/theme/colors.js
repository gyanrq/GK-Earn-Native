// src/core/theme/colors.js
export const Colors = {
  primary: '#0d6efd',
  primaryDark: '#0a58ca',
  primaryLight: '#cfe2ff',
  secondary: '#6f42c1',
  success: '#198754',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#0dcaf0',
  dark: '#212529',
  gray: '#6c757d',
  lightGray: '#e9ecef',
  background: '#f0f4ff',
  white: '#ffffff',
  card: '#ffffff',
  border: '#dee2e6',
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  textLight: '#adb5bd',
  gold: '#FFD700',
  gradientStart: '#0d6efd',
  gradientEnd: '#6f42c1',
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const FontSize = {
  xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, xxxl: 32,
};

export const Radius = {
  sm: 6, md: 12, lg: 18, xl: 24, full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  md: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  lg: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
};