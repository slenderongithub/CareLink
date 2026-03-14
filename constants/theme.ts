export const LIGHT_COLORS = {
  primary: '#3AAFA9',
  background: '#F8FAF9',
  accent: '#FF7A7A',
  textPrimary: '#1E2930',
  textSecondary: '#6B7B83',
  card: '#FFFFFF',
  success: '#64C7A5',
  border: '#DDEAE7',
  mutedSurface: '#EAF7F6',
  alertSurface: '#FFF4F3',
  timeline: '#DCE9E6',
  progressTrack: '#E2EEEB',
  scoreBadge: '#E7F6F5',
  doneBadge: '#DDF4EA',
  doneBadgeText: '#2E8E6B',
  pendingBadge: '#FFF1F1',
  pendingBorder: '#CBEADF',
  pendingSurface: '#EDF9F5',
  white: '#FFFFFF',
};

export const DARK_COLORS = {
  primary: '#3AAFA9',
  background: '#121A1E',
  accent: '#FF7A7A',
  textPrimary: '#EAF4F3',
  textSecondary: '#93AAA7',
  card: '#1A252B',
  success: '#64C7A5',
  border: '#29353B',
  mutedSurface: '#203137',
  alertSurface: '#2C2022',
  timeline: '#33444B',
  progressTrack: '#2B3A3F',
  scoreBadge: '#22353B',
  doneBadge: '#244136',
  doneBadgeText: '#8EE2BF',
  pendingBadge: '#3A2A2D',
  pendingBorder: '#355047',
  pendingSurface: '#1F332F',
  white: '#FFFFFF',
};

export const COLORS = LIGHT_COLORS;

export type AppColorPalette = typeof LIGHT_COLORS;
export type ThemeMode = 'light' | 'dark';

export const SPACING = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
};

export const RADIUS = {
  sm: 12,
  md: 18,
  lg: 24,
  full: 999,
};

export const SHADOW = {
  card: {
    shadowColor: '#0B4A47',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
  },
};

export const DARK_SHADOW = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
};

export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
