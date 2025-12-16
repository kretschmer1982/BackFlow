import { useMemo } from 'react';

export function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

export function useThemeColors(backgroundColor: string) {
  return useMemo(() => {
    const isLight = isLightColor(backgroundColor);

    if (isLight) {
      // Light Mode Colors (High Contrast)
      return {
        isLight: true,
        text: '#111827',           // Sehr dunkles Grau (fast Schwarz)
        subtext: '#4b5563',        // Dunkles Grau
        cardBackground: '#ffffff', // Weiß für Karten
        cardBorder: '#d1d5db',     // Hellgrauer Border
        inputBackground: '#f3f4f6',// Sehr helles Grau für Inputs
        inputBorder: '#d1d5db',
        inputPlaceholder: '#6b7280',
        danger: '#dc2626',         // Dunkleres Rot
        success: '#16a34a',        // Dunkleres Grün
        tint: '#0284c7',           // Kräftiges Blau
        icon: '#4b5563',
        onTint: '#ffffff',
      };
    } else {
      // Dark Mode Colors
      return {
        isLight: false,
        text: '#ffffff',
        subtext: '#aaaaaa',
        cardBackground: '#2a2a2a',
        cardBorder: '#333333',
        inputBackground: '#1a1a1a', // Oder '#2a2a2a' je nach Kontext
        inputBorder: '#333333',
        inputPlaceholder: '#666666',
        danger: '#ff4444',
        success: '#4ade80',
        tint: '#4ade80',
        icon: '#ffffff',
        onTint: '#1a1a1a',
      };
    }
  }, [backgroundColor]);
}

