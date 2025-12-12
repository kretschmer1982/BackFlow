import { Workout } from '@/types/interfaces';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

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
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style="light" />
      <View style={styles.completedScreen}>
        <View style={styles.completedContent}>
          <Text style={styles.completedTitle}>🎉</Text>
          <Text style={styles.completedText}>Glückwunsch!</Text>
          <Text style={styles.completedSubtext}>Workout beendet</Text>
          <Text style={styles.completedWorkoutName}>{workout.name}</Text>
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


