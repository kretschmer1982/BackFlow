import { RunCompletedView } from '@/components/run/RunCompletedView';
import { RunExerciseView } from '@/components/run/RunExerciseView';
import { RunGetReadyView } from '@/components/run/RunGetReadyView';
import { useRunWorkout } from '@/hooks/useRunWorkout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function RunWorkoutScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const {
    workout,
    backgroundColor,
    workoutState,
    currentExercise,
    currentExerciseIndex,
    timeRemaining,
    elapsedTime,
    handleExerciseComplete,
    handleSkip,
  } = useRunWorkout({
    workoutId,
    onWorkoutNotFound: () => router.back(),
  });

  if (!workout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Lade Workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Completion Screen
  if (workoutState === 'completed') {
    return (
      <RunCompletedView
        workout={workout}
        backgroundColor={backgroundColor}
        onGoHome={() => router.push('/')}
      />
    );
  }

  if (!currentExercise) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Keine Übungen gefunden</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get Ready Screen
  if (workoutState === 'getReady') {
    return (
      <RunGetReadyView
        workoutName={workout.name}
        currentExerciseIndex={currentExerciseIndex}
        totalExercises={workout.exercises.length}
        currentExercise={currentExercise}
        timeRemaining={timeRemaining}
        backgroundColor={backgroundColor}
        onSkip={handleSkip}
        onCancel={() => router.back()}
      />
    );
  }

  // Exercise Screen
  return (
    <RunExerciseView
      workoutName={workout.name}
      currentExerciseIndex={currentExerciseIndex}
      totalExercises={workout.exercises.length}
      currentExercise={currentExercise}
      timeRemaining={timeRemaining}
      elapsedTime={elapsedTime}
      backgroundColor={backgroundColor}
      onExerciseTap={handleExerciseComplete}
      onSkip={handleSkip}
      onCancel={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
  },
});
