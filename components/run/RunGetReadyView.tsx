import { GET_READY_DURATION, getImageSource } from '@/constants/exercises';
import { WorkoutExercise } from '@/types/interfaces';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

interface RunGetReadyViewProps {
  workoutName: string;
  currentExerciseIndex: number;
  totalExercises: number;
  currentExercise: WorkoutExercise;
  timeRemaining: number;
  backgroundColor: string;
  onSkip: () => void;
  onCancel: () => void;
}

export function RunGetReadyView({
  workoutName,
  currentExerciseIndex,
  totalExercises,
  currentExercise,
  timeRemaining,
  backgroundColor,
  onSkip,
  onCancel,
}: RunGetReadyViewProps) {
  const isLightBackground = isLightColor(backgroundColor);
  const primaryTextColor = isLightBackground ? '#111827' : '#ffffff';
  const secondaryTextColor = isLightBackground ? '#4b5563' : '#e5e7eb';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isLightBackground ? 'dark' : 'light'} />
      <View style={styles.workoutScreen}>
        <View style={styles.roundInfo}>
          <Text style={[styles.roundText, { color: secondaryTextColor }]}>
            {workoutName} • Übung {currentExerciseIndex + 1} /{' '}
            {totalExercises}
          </Text>
        </View>

        {/* Übungsbild */}
        <Image
          source={getImageSource(currentExercise.name, currentExercise.image)}
          style={styles.exerciseImage}
          resizeMode="cover"
        />
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color: primaryTextColor }]}>
            {timeRemaining}
          </Text>
        </View>

        <View style={styles.exerciseDisplay}>
          <Text style={[styles.getReadyText, { color: primaryTextColor }]}>
            GET READY
          </Text>
          <Text style={[styles.nextExerciseText, { color: secondaryTextColor }]}>
            Nächste Übung:
          </Text>
          <Text style={[styles.nextExerciseName, { color: primaryTextColor }]}>
            {currentExercise.name}
          </Text>
          {currentExercise.type === 'duration' ? (
            <Text style={[styles.nextExerciseInfo, { color: secondaryTextColor }]}>
              {currentExercise.amount}s
            </Text>
          ) : (
            <Text style={[styles.nextExerciseInfo, { color: secondaryTextColor }]}>
              {currentExercise.amount} x
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text
              style={[
                styles.cancelButtonText,
                { color: primaryTextColor },
              ]}>
              ABBRECHEN
            </Text>
          </Pressable>
          <Pressable style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  workoutScreen: {
    flex: 1,
    padding: 24,
    paddingBottom: 20,
  },
  roundInfo: {
    marginTop: 20,
  },
  roundText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    opacity: 0.9,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
  },
  exerciseDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  getReadyText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 4,
  },
  nextExerciseText: {
    fontSize: 20,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 12,
  },
  nextExerciseName: {
    fontSize: 36,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  nextExerciseInfo: {
    fontSize: 24,
    color: '#ffffff',
    opacity: 0.7,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  skipButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d97706',
    minWidth: 80,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#3a3a3a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#555555',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 1,
  },
  exerciseImage: {
    width: 300,
    height: 200,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: '#2a2a2a',
    alignSelf: 'center',
    overflow: 'hidden',
  },
});


