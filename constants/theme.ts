export const LIGHT_COLORS = {
  primary: '#E07B00',
  background: '#FFF8F1',
  accent: '#C0392B',
  textPrimary: '#1D140E',
  textSecondary: '#4A2B1D',
  card: '#FFFFFF',
  success: '#1A7A3F',
  border: '#D7AA7A',
  mutedSurface: '#FFEBD1',
  alertSurface: '#FFE2D9',
  timeline: '#EAB891',
  progressTrack: '#F3D2B1',
  scoreBadge: '#FFE6C4',
  doneBadge: '#DAF3E2',
  doneBadgeText: '#124F2C',
  pendingBadge: '#FCE1DD',
  pendingBorder: '#E38C7F',
  pendingSurface: '#FFF1EC',
  dangerButton: '#C0392B',
  successButton: '#1A7A3F',
  white: '#FFFFFF',
};

export const DARK_COLORS = {
  primary: '#E07B00',
  background: '#180F09',
  accent: '#D14A3A',
  textPrimary: '#FFF2E8',
  textSecondary: '#E6BFA0',
  card: '#2A1A12',
  success: '#1A7A3F',
  border: '#704A2A',
  mutedSurface: '#3A261A',
  alertSurface: '#49261F',
  timeline: '#5A3624',
  progressTrack: '#4D3323',
  scoreBadge: '#4C2E1D',
  doneBadge: '#1A3323',
  doneBadgeText: '#8FDCAB',
  pendingBadge: '#492520',
  pendingBorder: '#A35B50',
  pendingSurface: '#3A2019',
  dangerButton: '#C0392B',
  successButton: '#1A7A3F',
  white: '#FFFFFF',
};

export const COLORS = LIGHT_COLORS;

export type AppColorPalette = typeof LIGHT_COLORS;
export type ThemeMode = 'light' | 'dark';

export const SPACING = {
  xs: 8,
  sm: 12,
  md: 20,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 14,
  md: 20,
  lg: 28,
  full: 999,
};

export const SHADOW = {
  card: {
    shadowColor: '#7C2D12',
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
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_700Bold',
  bold: 'DMSans_700Bold',
};
