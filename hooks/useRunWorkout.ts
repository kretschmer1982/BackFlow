import { GET_READY_DURATION } from '@/constants/exercises';
import { Workout, WorkoutExercise } from '@/types/interfaces';
import { playBeep } from '@/utils/sound';
import { getSettings, getWorkoutById } from '@/utils/storage';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

export type WorkoutState = 'getReady' | 'exercise' | 'completed';

interface UseRunWorkoutParams {
  workoutId?: string;
  onWorkoutNotFound?: () => void;
}

interface UseRunWorkoutResult {
  workout: Workout | null;
  backgroundColor: string;
  workoutState: WorkoutState;
  currentRound: number;
  currentExerciseIndex: number;
  currentExercise: WorkoutExercise | null;
  timeRemaining: number;
  elapsedTime: number;
  isPaused: boolean;
  setIsPaused: (value: boolean) => void;
  handlePhaseComplete: () => Promise<void>;
  handleExerciseComplete: () => Promise<void>;
  handleSkip: () => void;
}

export function useRunWorkout({
  workoutId,
  onWorkoutNotFound,
}: UseRunWorkoutParams): UseRunWorkoutResult {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [workoutState, setWorkoutState] =
    useState<WorkoutState>('getReady');
  const [currentRound, setCurrentRound] = useState(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] =
    useState(GET_READY_DURATION);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const soundRef = useRef<Audio.Sound | null>(null);
  const TOTAL_ROUNDS = 1; // Eine Runde pro Workout

  // Workout laden
  useEffect(() => {
    const loadWorkout = async () => {
      if (!workoutId) return;

      const loadedWorkout = await getWorkoutById(workoutId);
      if (loadedWorkout) {
        setWorkout(loadedWorkout);
      } else {
        alert('Workout nicht gefunden');
        onWorkoutNotFound?.();
      }
    };
    loadWorkout();
  }, [workoutId, onWorkoutNotFound]);

  // Globale Hintergrundfarbe laden
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setBackgroundColor(settings.appBackgroundColor);
    };
    loadSettings();
  }, []);

  // Audio-Modus setzen
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  }, []);

  const getCurrentExercise = useCallback((): WorkoutExercise | null => {
    if (!workout || workout.exercises.length === 0) return null;
    return workout.exercises[currentExerciseIndex];
  }, [workout, currentExerciseIndex]);

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
  }, [workoutState, getCurrentExercise, moveToNextExercise]);

  const handleExerciseComplete = useCallback(async () => {
    const exercise = getCurrentExercise();
    if (exercise && exercise.type === 'reps') {
      await playBeep();
      moveToNextExercise();
    }
  }, [getCurrentExercise, moveToNextExercise]);

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
          if ([3, 2, 1].includes(prev)) playBeep();
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
          if ([3, 2, 1].includes(prev)) playBeep();
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
  }, [
    workout,
    isPaused,
    workoutState,
    getCurrentExercise,
    handlePhaseComplete,
  ]);

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return {
    workout,
    backgroundColor,
    workoutState,
    currentRound,
    currentExerciseIndex,
    currentExercise: getCurrentExercise(),
    timeRemaining,
    elapsedTime,
    isPaused,
    setIsPaused,
    handlePhaseComplete,
    handleExerciseComplete,
    handleSkip,
  };
}


