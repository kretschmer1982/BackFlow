import { GET_READY_DURATION, getImageSource } from '@/constants/exercises';
import { Workout, WorkoutExercise } from '@/types/interfaces';
import { playBeep } from '@/utils/sound';
import { getWorkoutById } from '@/utils/storage';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type WorkoutState = 'getReady' | 'exercise' | 'completed';

export default function RunWorkoutScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [workoutState, setWorkoutState] = useState<WorkoutState>('getReady');
  const [currentRound, setCurrentRound] = useState(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GET_READY_DURATION);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const TOTAL_ROUNDS = 1; // Eine Runde pro Workout

  // Workout laden
  useEffect(() => {
    const loadWorkout = async () => {
      if (workoutId) {
        const loadedWorkout = await getWorkoutById(workoutId);
        if (loadedWorkout) {
          setWorkout(loadedWorkout);
        } else {
          alert('Workout nicht gefunden');
          router.back();
        }
      }
    };
    loadWorkout();
  }, [workoutId, router]);

  // Audio-Modus setzen
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  }, []);

  const getCurrentExercise = (): WorkoutExercise | null => {
    if (!workout || workout.exercises.length === 0) return null;
    return workout.exercises[currentExerciseIndex];
  };

  const moveToNextExercise = useCallback(() => {
    if (!workout) return;

    const nextExerciseIndex = currentExerciseIndex + 1;
    
    if (nextExerciseIndex >= workout.exercises.length) {
      // Alle Übungen durch, nächste Runde oder beendet
      const nextRound = currentRound + 1;
      if (nextRound > TOTAL_ROUNDS) {
        // Workout beendet
        setWorkoutState('completed');
        return;
      }
      setCurrentRound(nextRound);
      setCurrentExerciseIndex(0);
    } else {
      setCurrentExerciseIndex(nextExerciseIndex);
    }
    
    setWorkoutState('getReady');
    setTimeRemaining(GET_READY_DURATION);
    setElapsedTime(0);
  }, [currentRound, currentExerciseIndex, workout]);

  const handlePhaseComplete = useCallback(async () => {
    if (workoutState === 'getReady') {
      const exercise = getCurrentExercise();
      if (!exercise) return;
      
      await playBeep();
      
      if (exercise.type === 'duration') {
        setTimeRemaining(exercise.amount);
      } else {
        setElapsedTime(0);
        setTimeRemaining(0);
      }
      setWorkoutState('exercise');
    } else if (workoutState === 'exercise') {
      await playBeep();
      moveToNextExercise();
    }
  }, [workoutState, moveToNextExercise]);

  const handleExerciseComplete = useCallback(async () => {
    const exercise = getCurrentExercise();
    if (exercise && exercise.type === 'reps') {
      await playBeep();
      moveToNextExercise();
    }
  }, [currentExerciseIndex, moveToNextExercise]);

  const handleSkip = useCallback(() => {
    moveToNextExercise();
  }, [moveToNextExercise]);

  // Timer-Logik
  useEffect(() => {
    if (!workout || isPaused || workoutState === 'completed') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const exercise = getCurrentExercise();
    if (!exercise) return;

    if (workoutState === 'getReady') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if ([3,2,1].includes(prev)) playBeep();
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (workoutState === 'exercise' && exercise.type === 'duration') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if ([3,2,1].includes(prev)) playBeep();
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (workoutState === 'exercise' && exercise.type === 'reps') {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workoutState, isPaused, handlePhaseComplete, currentExerciseIndex, workout]);

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
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
      <SafeAreaView style={[styles.container, styles.completedBg]}>
        <StatusBar style="light" />
        <View style={styles.completedScreen}>
          <View style={styles.completedContent}>
            <Text style={styles.completedTitle}>🎉</Text>
            <Text style={styles.completedText}>Glückwunsch!</Text>
            <Text style={styles.completedSubtext}>Workout beendet</Text>
            <Text style={styles.completedWorkoutName}>{workout.name}</Text>
          </View>
          <Pressable style={styles.homeButton} onPress={() => router.push('/')}>
            <Text style={styles.homeButtonText}>Zum Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = getCurrentExercise();
  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
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
      <SafeAreaView style={[styles.container, styles.getReadyBg]}>
        <StatusBar style="light" />
        <View style={styles.workoutScreen}>
          <View style={styles.roundInfo}>
            <Text style={styles.roundText}>
              {workout.name} • Übung {currentExerciseIndex + 1} / {workout.exercises.length}
            </Text>
          </View>
          {/* Übungsbild */}
          <Image 
            source={getImageSource(currentExercise.name, currentExercise.image)}
            style={styles.exerciseImage}
            resizeMode="cover"
          />
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{timeRemaining}</Text>
          </View>

          <View style={styles.exerciseDisplay}>
            <Text style={styles.getReadyText}>GET READY</Text>
            <Text style={styles.nextExerciseText}>Nächste Übung:</Text>
            <Text style={styles.nextExerciseName}>{currentExercise.name}</Text>
            {currentExercise.type === 'duration' ? (
              <Text style={styles.nextExerciseInfo}>{currentExercise.amount}s</Text>
            ) : (
              <Text style={styles.nextExerciseInfo}>{currentExercise.amount} x</Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>ABBRECHEN</Text>
            </Pressable>
            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Exercise Screen
  const isRepsExercise = currentExercise.type === 'reps';

  return (
    <SafeAreaView style={[styles.container, styles.exerciseBg]}>
      <StatusBar style="light" />
      <View style={styles.workoutScreen}>
        <TouchableOpacity
          style={styles.touchableArea}
          activeOpacity={1}
          onPress={isRepsExercise ? handleExerciseComplete : undefined}
          disabled={!isRepsExercise}>
          <View style={styles.roundInfo}>
            <Text style={styles.roundText}>
              {workout.name} • Übung {currentExerciseIndex + 1} / {workout.exercises.length}
            </Text>
          </View>
          {/* Übungsbild */}
          <Image 
            source={getImageSource(currentExercise.name, currentExercise.image)}
            style={styles.exerciseImage}
            resizeMode="cover"
          />
          <View style={styles.timerContainer}>
            {isRepsExercise ? (
              <Text style={styles.repsText}>{currentExercise.amount} x</Text>
            ) : (
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            )}
            {isRepsExercise && (
              <Text style={styles.stopwatchText}>{formatTime(elapsedTime)}</Text>
            )}
          </View>

          <View style={styles.exerciseDisplay}>
            <Text style={styles.currentExerciseText}>{currentExercise.name}</Text>
            <Text style={styles.instructionsText}>{currentExercise.instructions}</Text>
            {isRepsExercise && (
              <Text style={styles.tapHint}>Tippe zum Abschließen</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>ABBRECHEN</Text>
          </Pressable>
          <Pressable style={styles.skipButton} onPress={handleSkip}>
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
    backgroundColor: '#1a1a1a',
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
  exerciseBg: {
    backgroundColor: '#166534',
  },
  getReadyBg: {
    backgroundColor: '#92400e',
  },
  completedBg: {
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#4ade80',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  exerciseImage: {
    width: 300,
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#2a2a2a',
    alignSelf: 'center',
    overflow: 'hidden',
  },
});
