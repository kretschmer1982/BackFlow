import { APP_THEME_COLORS, isLightColor } from '@/constants/theme';
import { useMemo } from 'react';

export function useThemeColors(backgroundColor: string) {
  return useMemo(() => {
    const isLight = isLightColor(backgroundColor);
    return {
      isLight,
      ...(isLight ? APP_THEME_COLORS.light : APP_THEME_COLORS.dark),
    };
  }, [backgroundColor]);
}

