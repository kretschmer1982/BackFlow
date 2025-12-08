import ExerciseList from '@/components/ExerciseList';
import WorkoutScreen from '@/components/WorkoutScreen';
import { EXERCISE_DURATION, REST_DURATION, TOTAL_ROUNDS } from '@/constants/exercises';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const startWorkout = () => {
    setIsWorkoutActive(true);
    // Sound: playStartSound(); // Vorbereitet für später
  };

  const cancelWorkout = () => {
    setIsWorkoutActive(false);
    // Sound: playCancelSound(); // Vorbereitet für später
  };

  // Workout-Modus
  if (isWorkoutActive) {
    return <WorkoutScreen onCancel={cancelWorkout} />;
  }

  // Startseite
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.startScreen}>
        <Text style={styles.title}>BackFlow</Text>
        
        <ExerciseList />

        <View style={styles.workoutInfo}>
          <Text style={styles.infoText}>
            {TOTAL_ROUNDS} Runden • {EXERCISE_DURATION}s Übung • {REST_DURATION}s Pause
          </Text>
        </View>

        <Pressable style={styles.startButton} onPress={startWorkout}>
          <Text style={styles.startButtonText}>START WORKOUT</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a', // Dunkelgrauer Hintergrund
  },
  startScreen: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 100, // Extra Platz für Tab-Bar
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 40,
    letterSpacing: 2,
  },
  workoutInfo: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#aaaaaa',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#4ade80', // Hellgrün
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 280,
    alignItems: 'center',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
});
