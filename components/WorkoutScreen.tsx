import {
    Exercise,
    EXERCISES,
    GET_READY_DURATION,
    TOTAL_ROUNDS,
} from '@/constants/exercises';
import { getSettings } from '@/utils/storage';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type WorkoutState = 'getReady' | 'exercise';

interface WorkoutScreenProps {
  onCancel: () => void;
}

export default function WorkoutScreen({ onCancel }: WorkoutScreenProps) {
  const [workoutState, setWorkoutState] = useState<WorkoutState>('getReady');
  const [currentRound, setCurrentRound] = useState(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GET_READY_DURATION);
  const [elapsedTime, setElapsedTime] = useState(0); // Für reps-Übungen (Stoppuhr)
  const [isPaused, setIsPaused] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setBackgroundColor(settings.appBackgroundColor);
    };
    loadSettings();
  }, []);

  const getCurrentExercise = (): Exercise => EXERCISES[currentExerciseIndex];
  const getNextExercise = (): Exercise => {
    const nextIndex = (currentExerciseIndex + 1) % EXERCISES.length;
    return EXERCISES[nextIndex];
  };

  const moveToNextExercise = useCallback(() => {
    const nextExerciseIndex = (currentExerciseIndex + 1) % EXERCISES.length;
    
    if (nextExerciseIndex === 0) {
      // Alle Übungen in dieser Runde durch
      const nextRound = currentRound + 1;
      if (nextRound > TOTAL_ROUNDS) {
        // Workout beendet
        onCancel();
        return;
      }
      setCurrentRound(nextRound);
    }
    
    setCurrentExerciseIndex(nextExerciseIndex);
    setWorkoutState('getReady');
    setTimeRemaining(GET_READY_DURATION);
    setElapsedTime(0);
  }, [currentRound, currentExerciseIndex, onCancel]);

  const handlePhaseComplete = useCallback(() => {
    if (workoutState === 'getReady') {
      // Get Ready beendet, starte Übung
      const exercise = getCurrentExercise();
      if (exercise.type === 'duration') {
        setTimeRemaining(exercise.amount);
      } else {
        // Bei reps: Timer auf 0 setzen (wird als Stoppuhr hochgezählt)
        setElapsedTime(0);
        setTimeRemaining(0);
      }
      setWorkoutState('exercise');
      // Sound: playExerciseSound(); // Vorbereitet für später
    } else if (workoutState === 'exercise') {
      // Übung beendet, direkt zur nächsten Get Ready Phase
      moveToNextExercise();
    }
  }, [workoutState, moveToNextExercise]);

  const handleExerciseComplete = useCallback(() => {
    // Wird bei reps-Übungen aufgerufen, wenn Nutzer tippt
    const exercise = getCurrentExercise();
    if (exercise.type === 'reps') {
      // Übung als erledigt markieren, direkt zur nächsten Get Ready Phase
      moveToNextExercise();
    }
  }, [currentExerciseIndex, moveToNextExercise]);

  const handleSkip = useCallback(() => {
    // Übung überspringen, direkt zur nächsten Get Ready Phase
    moveToNextExercise();
  }, [moveToNextExercise]);

  // Timer-Logik
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const exercise = getCurrentExercise();

    if (workoutState === 'getReady') {
      // Get Ready: Timer läuft runter
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (workoutState === 'exercise' && exercise.type === 'duration') {
      // Duration-Übung: Timer läuft runter
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (workoutState === 'exercise' && exercise.type === 'reps') {
      // Reps-Übung: Timer läuft hoch (Stoppuhr)
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workoutState, isPaused, handlePhaseComplete, currentExerciseIndex]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = getCurrentExercise();

  // Get Ready Screen
  if (workoutState === 'getReady') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar style="light" />
        <View style={styles.workoutScreen}>
          <View style={styles.roundInfo}>
            <Text style={styles.roundText}>Runde {currentRound} / {TOTAL_ROUNDS}</Text>
          </View>

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
            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>ÜBERSpringen</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>ABBRECHEN</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Exercise Screen
  const isRepsExercise = currentExercise.type === 'reps';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style="light" />
      <View style={styles.workoutScreen}>
        <TouchableOpacity
          style={styles.touchableArea}
          activeOpacity={1}
          onPress={isRepsExercise ? handleExerciseComplete : undefined}
          disabled={!isRepsExercise}>
          <View style={styles.roundInfo}>
            <Text style={styles.roundText}>Runde {currentRound} / {TOTAL_ROUNDS}</Text>
          </View>

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
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>ÜBERSpringen</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>ABBRECHEN</Text>
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
  getReadyText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 4,
  },
  pauseText: {
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
    backgroundColor: '#f59e0b', // Orange/Gelb für Skip
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d97706',
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
});
