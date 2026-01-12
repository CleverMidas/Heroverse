import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@app_theme';

const colors = {
  light: {
    background: '#F8FAFC', surface: '#FFFFFF', surfaceSecondary: '#F1F5F9', card: '#FFFFFF', cardBorder: '#E2E8F0',
    text: '#0F172A', textSecondary: '#64748B', textMuted: '#94A3B8', primary: '#FBBF24', primaryDark: '#D97706',
    success: '#22C55E', successLight: 'rgba(34, 197, 94, 0.15)', error: '#EF4444', errorLight: 'rgba(239, 68, 68, 0.15)',
    info: '#3B82F6', infoLight: 'rgba(59, 130, 246, 0.15)', purple: '#8B5CF6', purpleLight: 'rgba(139, 92, 246, 0.15)',
    overlay: 'rgba(15, 23, 42, 0.6)', modalBackground: '#FFFFFF', inputBackground: '#F1F5F9', divider: '#E2E8F0',
    shadow: 'rgba(0, 0, 0, 0.1)', tabBar: '#FFFFFF', tabBarBorder: '#E2E8F0', activeTab: '#FBBF24', inactiveTab: '#94A3B8',
  },
  dark: {
    background: '#0A0F1E', surface: '#1E293B', surfaceSecondary: '#0F172A', card: '#1E293B', cardBorder: 'rgba(100, 116, 139, 0.3)',
    text: '#FFFFFF', textSecondary: '#94A3B8', textMuted: '#64748B', primary: '#FBBF24', primaryDark: '#D97706',
    success: '#22C55E', successLight: 'rgba(34, 197, 94, 0.15)', error: '#EF4444', errorLight: 'rgba(239, 68, 68, 0.15)',
    info: '#3B82F6', infoLight: 'rgba(59, 130, 246, 0.15)', purple: '#8B5CF6', purpleLight: 'rgba(139, 92, 246, 0.15)',
    overlay: 'rgba(0, 0, 0, 0.8)', modalBackground: '#1E293B', inputBackground: '#0F172A', divider: 'rgba(100, 116, 139, 0.3)',
    shadow: 'rgba(0, 0, 0, 0.3)', tabBar: '#0F172A', tabBarBorder: 'rgba(100, 116, 139, 0.2)', activeTab: '#FBBF24', inactiveTab: '#64748B',
  },
};

const gradients = {
  light: {
    primary: ['#FCD34D', '#F59E0B'] as [string, string],
    success: ['#4ADE80', '#22C55E'] as [string, string],
    card: ['#FFFFFF', '#F8FAFC'] as [string, string],
    hero: ['transparent', 'rgba(0,0,0,0.7)'] as [string, string],
  },
  dark: {
    primary: ['#FBBF24', '#D97706'] as [string, string],
    success: ['#22C55E', '#16A34A'] as [string, string],
    card: ['#1E293B', '#0F172A'] as [string, string],
    hero: ['transparent', 'rgba(0,0,0,0.95)'] as [string, string],
  },
};

export const lightTheme = { mode: 'light' as const, colors: colors.light, gradients: gradients.light };
export const darkTheme = { mode: 'dark' as const, colors: colors.dark, gradients: gradients.dark };
export type Theme = typeof lightTheme | typeof darkTheme;

interface ThemeContextType { theme: Theme; isDark: boolean; toggleTheme: () => void; setTheme: (mode: 'light' | 'dark') => void; }

const ThemeContext = createContext<ThemeContextType>({ theme: darkTheme, isDark: true, toggleTheme: () => {}, setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(saved => { if (saved) setIsDark(saved === 'dark'); }).catch(() => {});
  }, []);

  const saveTheme = useCallback((mode: 'light' | 'dark') => {
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newMode = !prev;
      saveTheme(newMode ? 'dark' : 'light');
      return newMode;
    });
  }, [saveTheme]);

  const setTheme = useCallback((mode: 'light' | 'dark') => {
    setIsDark(mode === 'dark');
    saveTheme(mode);
  }, [saveTheme]);

  const value = useMemo(() => ({
    theme: isDark ? darkTheme : lightTheme,
    isDark,
    toggleTheme,
    setTheme,
  }), [isDark, toggleTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
