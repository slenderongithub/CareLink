import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import {
  AppColorPalette,
  DARK_COLORS,
  DARK_SHADOW,
  LIGHT_COLORS,
  SHADOW,
  ThemeMode,
} from '../constants/theme';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: AppColorPalette;
  shadows: typeof SHADOW;
  isDark: boolean;
  toggleMode: () => void;
};

const AppThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = mode === 'dark';
    return {
      mode,
      isDark,
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      shadows: isDark ? DARK_SHADOW : SHADOW,
      toggleMode: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
    };
  }, [mode]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }

  return context;
}