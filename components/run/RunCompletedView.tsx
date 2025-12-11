import { Workout } from '@/types/interfaces';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
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
  const isLightBackground = isLightColor(backgroundColor);
  const primaryTextColor = isLightBackground ? '#111827' : '#ffffff';
  const secondaryTextColor = isLightBackground ? '#4b5563' : '#aaaaaa';
  const accentColor = isLightBackground ? '#16a34a' : '#4ade80';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isLightBackground ? 'dark' : 'light'} />
      <View style={styles.completedScreen}>
        <View style={styles.completedContent}>
          <Text style={styles.completedTitle}>🎉</Text>
          <Text style={[styles.completedText, { color: primaryTextColor }]}>
            Glückwunsch!
          </Text>
          <Text style={[styles.completedSubtext, { color: secondaryTextColor }]}>
            Workout beendet
          </Text>
          <Text style={[styles.completedWorkoutName, { color: accentColor }]}>
            {workout.name}
          </Text>
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
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  completedSubtext: {
    fontSize: 24,
    color: '#aaaaaa',
    marginBottom: 24,
    textAlign: 'center',
  },
  completedWorkoutName: {
    fontSize: 20,
    color: '#4ade80',
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


