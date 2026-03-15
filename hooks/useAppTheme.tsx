import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

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
  nextColors: AppColorPalette;
  shadows: typeof SHADOW;
  isDark: boolean;
  toggleToken: number;
  toggleMode: () => void;
  commitToggle: () => void;
};

const AppThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [nextMode, setNextMode] = useState<ThemeMode>('light');
  const [toggleToken, setToggleToken] = useState(0);
  const [isToggling, setIsToggling] = useState(false);

  const commitToggle = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    setIsToggling(false);
  }, []);

  const toggleMode = useCallback(() => {
    if (isToggling) return;
    const targetMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setNextMode(targetMode);
    setIsToggling(true);
    setToggleToken((prev) => prev + 1);
  }, [isToggling, mode]);

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = mode === 'dark';
    const nextIsDark = nextMode === 'dark';
    return {
      mode,
      isDark,
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      nextColors: nextIsDark ? DARK_COLORS : LIGHT_COLORS,
      shadows: isDark ? DARK_SHADOW : SHADOW,
      toggleToken,
      toggleMode,
      commitToggle,
    };
  }, [mode, nextMode, toggleToken, toggleMode, commitToggle]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }

  return context;
}