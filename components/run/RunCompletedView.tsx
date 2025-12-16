import { Workout } from '@/types/interfaces';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo } from 'react';

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
  onGoHome: () => void;
}

export function RunCompletedView({
  workout,
  backgroundColor,
  onGoHome,
}: RunCompletedViewProps) {
  const isDark = useMemo(() => isDarkColor(backgroundColor), [backgroundColor]);
  const textColor = isDark ? '#ffffff' : '#111827';
  const subTextColor = isDark ? '#aaaaaa' : '#4b5563';
  const accentColor = isDark ? '#4ade80' : '#16a34a';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.completedScreen}>
        <View style={styles.completedContent}>
          <Text style={styles.completedTitle}>🎉</Text>
          <Text style={[styles.completedText, { color: textColor }]}>Glückwunsch!</Text>
          <Text style={[styles.completedSubtext, { color: subTextColor }]}>Workout beendet</Text>
          <Text style={[styles.completedWorkoutName, { color: accentColor }]}>{workout.name}</Text>
        </View>
        <Pressable style={styles.homeButton} onPress={onGoHome}>
          <Text style={styles.homeButtonText}>🏠</Text>
        </Pressable>
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
    marginBottom: 60,
  },
  completedTitle: {
    fontSize: 80,
    marginBottom: 24,
  },
  completedText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  completedSubtext: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  completedWorkoutName: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  homeButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
