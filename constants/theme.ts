/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const APP_THEME_COLORS = {
  dark: {
    background: '#2a2a2a',
    text: '#ffffff',
    subtext: '#aaaaaa',
    cardBackground: '#0F0F0F', // oder minimal heller/dunkler, aber im Einklang
    borderColor: '#333333',
    inputBackground: '#151515',
    inputPlaceholder: '#666666',
    buttonBackground: '#3a3a3a',
    buttonBorder: '#555555',
    accent: '#C1FFC1', // sea green
    delete: '#ff4444',
  },
  light: {
    background: '#EED5D2',
    text: '#111827',
    subtext: '#4b5563',
    cardBackground: '#CDB7B5',
    borderColor: '#e5e7eb',
    inputBackground: '#f9fafb',
    inputPlaceholder: '#9ca3af',
    buttonBackground: '#e5e7eb',
    buttonBorder: '#d1d5db',
    accent: '#ec4899', // Pink
    delete: '#dc2626',
  },
};

export function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

export function getThemeFromBackground(backgroundColor: string) {
  return isLightColor(backgroundColor) ? APP_THEME_COLORS.light : APP_THEME_COLORS.dark;
}

export const BACKGROUND_OPTIONS = [
  { name: 'Dark Mode', color: APP_THEME_COLORS.dark.background },
  { name: 'Light Mode', color: APP_THEME_COLORS.light.background },
];

// Veraltete Konstanten für Expo-Router Template (falls noch irgendwo genutzt)
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
