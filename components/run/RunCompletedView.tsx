import { IconSymbol } from '@/components/ui/icon-symbol';
import { Workout } from '@/types/interfaces';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function parseHexColor(hex: string) {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);
  return { r, g, b };
}

function isDarkColor(hex: string) {
  const { r, g, b } = parseHexColor(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

interface RunCompletedViewProps {
  workout: Workout;
  backgroundColor: string;
  onContinueWorkout: () => void;
  onViewStats: () => void;
}

const HAPPY_AVATAR = require('../../assets/images/avatar_happy.png');

export function RunCompletedView({
  workout,
  backgroundColor,
  onContinueWorkout,
  onViewStats,
}: RunCompletedViewProps) {
  const isDark = useMemo(() => isDarkColor(backgroundColor), [backgroundColor]);
  const textColor = isDark ? '#ffffff' : '#111827';
  const captionColor = isDark ? '#cbd5f5' : '#6b7280';
  const buttonBg = isDark ? '#131a24' : '#f5f6fb';
  const iconColor = isDark ? '#f1f5f9' : '#111827';

  const { width } = useWindowDimensions();
  const actions: Array<{
    key: string;
    icon: 'figure.run' | 'chart.bar';
    label: string;
    onPress: () => void;
  }> = [
    { key: 'workout', icon: 'figure.run', label: 'Weiteres Workout', onPress: onContinueWorkout },
    { key: 'stats', icon: 'chart.bar', label: 'Statistik', onPress: onViewStats },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.completedScreen}>
        <View style={styles.completedContent}>
          <Image
            source={HAPPY_AVATAR}
            style={[
              styles.avatarImage,
              { width: width - 48, height: width - 48, maxWidth: 420, maxHeight: 420 },
            ]}
            resizeMode="contain"
          />
          <Text style={[styles.avatarCaption, { color: captionColor }]} numberOfLines={1}>
            {workout.name}
          </Text>
        </View>
        <View style={styles.actionsRow}>
          {actions.map((action) => (
            <Pressable
              key={action.key}
              style={[styles.actionButton, { backgroundColor: buttonBg }]}
              onPress={action.onPress}>
              <IconSymbol name={action.icon as any} size={32} color={iconColor} />
              <Text style={[styles.actionLabel, { color: textColor }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  completedScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completedContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarImage: {
    width: 220,
    height: 220,
    borderRadius: 120,
    marginBottom: 16,
  },
  avatarCaption: {
    fontSize: 18,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    marginHorizontal: 8,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});
