import { getImageSource } from '@/constants/exercises';
import { WorkoutExercise } from '@/types/interfaces';
import { Video } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface RunExerciseViewProps {
  workoutName: string;
  currentExerciseIndex: number;
  totalExercises: number;
  currentExercise: WorkoutExercise;
  timeRemaining: number;
  elapsedTime: number;
  backgroundColor: string;
  onExerciseTap: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function RunExerciseView({
  workoutName,
  currentExerciseIndex,
  totalExercises,
  currentExercise,
  timeRemaining,
  elapsedTime,
  backgroundColor,
  onExerciseTap,
  onSkip,
  onCancel,
}: RunExerciseViewProps) {
  const isRepsExercise = currentExercise.type === 'reps';
  const hasVideo = currentExercise.name === 'Plank';
  const windowWidth = Dimensions.get('window').width;
  const contentWidth = windowWidth - 48; // 2 * padding 24 aus workoutScreen
  const videoSize = contentWidth * 0.8; // quadratisches Video mit 80% der Inhaltsbreite

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style="light" />
      <View style={styles.workoutScreen}>
        <TouchableOpacity
          style={styles.touchableArea}
          activeOpacity={1}
          onPress={isRepsExercise ? onExerciseTap : undefined}
          disabled={!isRepsExercise}>
          <View style={styles.roundInfo}>
            <Text style={styles.roundText}>
              {workoutName} • Übung {currentExerciseIndex + 1} /{' '}
              {totalExercises}
            </Text>
          </View>

          {/* Übungsbild oder Video */}
          {hasVideo ? (
            <Video
              source={require('../../assets/videos/plank.mp4')}
              style={[styles.exerciseVideo, { width: videoSize, height: videoSize }]}
              resizeMode="cover"
              isLooping
              shouldPlay
              isMuted
            />
          ) : (
            <Image
              source={getImageSource(
                currentExercise.name,
                currentExercise.image
              )}
              style={styles.exerciseImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.timerContainer}>
            {isRepsExercise ? (
              <Text style={styles.repsText}>{currentExercise.amount} x</Text>
            ) : (
              <Text style={styles.timerText}>
                {formatTime(timeRemaining)}
              </Text>
            )}
            {isRepsExercise && (
              <Text style={styles.stopwatchText}>
                {formatTime(elapsedTime)}
              </Text>
            )}
          </View>

          <View style={styles.exerciseDisplay}>
            <Text style={styles.currentExerciseText}>
              {currentExercise.name}
            </Text>
            <Text style={styles.instructionsText}>
              {currentExercise.instructions}
            </Text>
            {isRepsExercise && (
              <Text style={styles.tapHint}>Tippe zum Abschließen</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>ABBRECHEN</Text>
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
  touchableArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
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
  repsText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
  },
  stopwatchText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.7,
    marginTop: 8,
  },
  exerciseDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  currentExerciseText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
    lineHeight: 28,
  },
  tapHint: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 24,
    fontStyle: 'italic',
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
  exerciseVideo: {
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
});


