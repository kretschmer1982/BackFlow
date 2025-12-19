import { EXERCISES, GET_READY_DURATION } from '@/constants/exercises';
import { Workout, WorkoutExercise } from '@/types/interfaces';
import { useBeepPlayer } from '@/utils/sound';
import { getSettings, getWorkoutById } from '@/utils/storage';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

export type WorkoutState = 'getReady' | 'exercise' | 'praising' | 'completed';

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
  sessionDurationMinutes: number;
  silentFinishSignalId: number;
  isPaused: boolean;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
  handlePhaseComplete: () => Promise<void>;
  handleExerciseComplete: () => Promise<void>;
  handleSkip: () => void;
}

export function useRunWorkout({
  workoutId,
  onWorkoutNotFound,
}: UseRunWorkoutParams): UseRunWorkoutResult {
  const normalizeExercise = useCallback((ex: any): WorkoutExercise => {
    const type: 'duration' | 'reps' = ex?.type === 'reps' ? 'reps' : 'duration';
    const rawAmount = ex?.amount;
    const num =
      typeof rawAmount === 'number'
        ? rawAmount
        : typeof rawAmount === 'string'
          ? parseInt(rawAmount, 10)
          : NaN;

    // Fallbacks für alte/kaputte Daten
    const fallback = type === 'duration' ? 40 : 10;
    const amount = Number.isFinite(num) && num > 0 ? Math.round(num) : fallback;
    const fallbackExercise =
      EXERCISES.find((std) => std.id === ex?.id) ??
      EXERCISES.find((std) => std.name === ex?.name);
    const instructions =
      typeof ex?.instructions === 'string' && ex.instructions.trim().length > 0
        ? ex.instructions
        : fallbackExercise?.instructions ?? '';

    return {
      ...ex,
      type,
      amount,
      instructions,
    } as WorkoutExercise;
  }, []);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [workoutState, setWorkoutState] =
    useState<WorkoutState>('getReady');
  const workoutStateRef = useRef<WorkoutState>('getReady');
  const [currentRound, setCurrentRound] = useState(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] =
    useState(GET_READY_DURATION);
  const [elapsedTime, setElapsedTime] = useState(0);
  const sessionStartRef = useRef<number>(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [enableBeep, setEnableBeep] = useState(true);
  const [exerciseTransitionSeconds, setExerciseTransitionSeconds] = useState<number>(GET_READY_DURATION);
  const [silentFinishSignalId, setSilentFinishSignalId] = useState(0);

  const isPausedRef = useRef<boolean>(false);
  const enableBeepRef = useRef<boolean>(true);
  const timeRemainingRef = useRef<number>(GET_READY_DURATION);
  const currentExerciseRef = useRef<WorkoutExercise | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const TOTAL_ROUNDS = 1; // Eine Runde pro Workout
  const { playLongSignal } = useBeepPlayer();
  const phaseCompleteInFlightRef = useRef(false);
  const currentSpeechCompletionRef = useRef<(() => void) | null>(null);
  const lastGetReadyAnnouncementKeyRef = useRef<string>('');
  const lastPraiseRef = useRef<string>('');

  const finishCurrentSpeech = useCallback(() => {
    const resolver = currentSpeechCompletionRef.current;
    if (!resolver) {
      return;
    }
    currentSpeechCompletionRef.current = null;
    resolver();
  }, []);

  const speakText = useCallback(
    (text: string, rateOverride?: number) => {
      if (!text?.trim() || !enableBeepRef.current) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        currentSpeechCompletionRef.current = () => {
          currentSpeechCompletionRef.current = null;
          resolve();
        };

        try {
          Speech.speak(text, {
            language: 'de-DE',
            rate: rateOverride ?? 1.25 + Math.random() * 0.05,
            onDone: finishCurrentSpeech,
            onStopped: finishCurrentSpeech,
            onError: finishCurrentSpeech,
          });
        } catch {
          finishCurrentSpeech();
        }
      });
    },
    [finishCurrentSpeech]
  );

  const cancelSpeech = useCallback(() => {
    try {
      Speech.stop();
    } catch {
      // ignore
    }
    finishCurrentSpeech();
  }, [finishCurrentSpeech]);

  useEffect(() => {
    workoutStateRef.current = workoutState;
  }, [workoutState]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) {
      cancelSpeech();
    }
  }, [isPaused, cancelSpeech]);

  useEffect(() => {
    enableBeepRef.current = enableBeep;
  }, [enableBeep]);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);


  // Workout laden
  useEffect(() => {
    const loadWorkout = async () => {
      if (!workoutId) return;

      const loadedWorkout = await getWorkoutById(workoutId);
      if (loadedWorkout) {
        // Defensive: alte gespeicherte Daten können falsche Typen/amounts enthalten
        const sanitized: Workout = {
          ...loadedWorkout,
          exercises: Array.isArray(loadedWorkout.exercises)
            ? loadedWorkout.exercises.map((ex) => normalizeExercise(ex))
            : [],
        };
        setWorkout(sanitized);
        sessionStartRef.current = Date.now();
      } else {
        alert('Workout nicht gefunden');
        onWorkoutNotFound?.();
      }
    };
    loadWorkout();
  }, [workoutId, onWorkoutNotFound, normalizeExercise]);

  // Globale Hintergrundfarbe laden
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setBackgroundColor(settings.appBackgroundColor);
      setEnableBeep(
        typeof settings.enableBeep === 'boolean' ? settings.enableBeep : true
      );
      const ts =
        typeof (settings as any).exerciseTransitionSeconds === 'number' && Number.isFinite((settings as any).exerciseTransitionSeconds)
          ? Math.max(0, Math.min(60, Math.round((settings as any).exerciseTransitionSeconds)))
          : GET_READY_DURATION;
      setExerciseTransitionSeconds(ts);
      // Wenn wir gerade in "getReady" sind und noch am Anfang stehen, passe den Countdown an.
      setTimeRemaining((prev) => (workoutStateRef.current === 'getReady' && prev === GET_READY_DURATION ? ts : prev));
    };
    loadSettings();
  }, []);

  const safePlayStartSignal = useCallback(async () => {
    if (!enableBeepRef.current) return;
    await playLongSignal();
  }, [playLongSignal]);

  const safeSpeakPraise = useCallback(async () => {
    cancelSpeech();

    const praises = [
      'Stark gemacht, geschafft!',
      'Sehr gut durchgezogen!',
      'Einfach spitze, Wahnsinn!',
      'Übung beendet, klasse!',
      'Ich bin stolz auf dich!',
      'Fokus gehalten, geschafft!',
      'Bravourös gemeistert, mega!',
      'Richtig gut gemacht!',
    ] as const;
    // Zufällig, aber nicht direkt wiederholen
    let next = praises[Math.floor(Math.random() * praises.length)];
    if (praises.length > 1 && next === lastPraiseRef.current) {
      next = praises[(praises.indexOf(next) + 1) % praises.length];
    }
    lastPraiseRef.current = next;

    const rate = 1.15 + Math.random() * 0.05;
    await speakText(next, rate);
  }, [cancelSpeech, speakText]);

  const triggerSilentFinishSignal = useCallback(() => {
    // Nur wenn Beeps & Ansagen aus sind
    if (enableBeepRef.current) return;
    setSilentFinishSignalId(Date.now());
  }, []);

  const getCurrentExercise = useCallback((): WorkoutExercise | null => {
    if (!workout || workout.exercises.length === 0) return null;
    return normalizeExercise(workout.exercises[currentExerciseIndex]);
  }, [workout, currentExerciseIndex, normalizeExercise]);

  useEffect(() => {
    currentExerciseRef.current = getCurrentExercise();
  }, [getCurrentExercise]);

  const moveToNextExercise = useCallback(() => {
    cancelSpeech();
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
    lastGetReadyAnnouncementKeyRef.current = '';
    setTimeRemaining(exerciseTransitionSeconds);
    setElapsedTime(0);
  }, [currentRound, currentExerciseIndex, workout, exerciseTransitionSeconds, cancelSpeech]);

  const startExercisePhase = useCallback(async () => {
    if (phaseCompleteInFlightRef.current) return;
    phaseCompleteInFlightRef.current = true;

    try {
      cancelSpeech();
      const exercise = getCurrentExercise();
      if (!exercise) {
        return;
      }

      await safePlayStartSignal();
      setElapsedTime(0);

      if (exercise.type === 'duration') {
        setTimeRemaining(exercise.amount);
      } else {
        setTimeRemaining(0);
      }

      setWorkoutState('exercise');
    } finally {
      phaseCompleteInFlightRef.current = false;
    }
  }, [cancelSpeech, getCurrentExercise, safePlayStartSignal]);

  const finishExercisePhase = useCallback(async () => {
    if (phaseCompleteInFlightRef.current) return;
    phaseCompleteInFlightRef.current = true;

    try {
      cancelSpeech();
      setWorkoutState('praising');
      setTimeRemaining(0);
      setElapsedTime(0);
      await safeSpeakPraise();
      triggerSilentFinishSignal();
      moveToNextExercise();
    } finally {
      phaseCompleteInFlightRef.current = false;
    }
  }, [cancelSpeech, safeSpeakPraise, triggerSilentFinishSignal, moveToNextExercise]);

  const handlePhaseComplete = useCallback(async () => {
    if (workoutState === 'getReady') {
      await startExercisePhase();
    } else if (workoutState === 'exercise') {
      await finishExercisePhase();
    }
  }, [workoutState, startExercisePhase, finishExercisePhase]);

  const handlePhaseCompleteRef = useRef(handlePhaseComplete);
  useEffect(() => {
    handlePhaseCompleteRef.current = handlePhaseComplete;
  }, [handlePhaseComplete]);

  const handleExerciseComplete = useCallback(async () => {
    const exercise = getCurrentExercise();
    if (exercise && exercise.type === 'reps') {
      await finishExercisePhase();
    }
  }, [getCurrentExercise, finishExercisePhase]);

  const handleSkip = useCallback(() => {
    cancelSpeech();
    moveToNextExercise();
  }, [moveToNextExercise, cancelSpeech]);

  // Timer-Logik
  useEffect(() => {
    if (intervalRef.current) {
      return;
    }

    intervalRef.current = setInterval(() => {
      const state = workoutStateRef.current;
      if (state === 'completed') return;
      if (isPausedRef.current) return;

      const exercise = currentExerciseRef.current;
      if (!exercise) return;

      const advanceCountdown = () => {
        setTimeRemaining((prev) => {
          const safePrev = Number.isFinite(prev) ? prev : 1;
          if (safePrev <= 1) {
            void handlePhaseCompleteRef.current?.();
            return 0;
          }
          return safePrev - 1;
        });
      };

      if (state === 'getReady' || (state === 'exercise' && exercise.type === 'duration')) {
        advanceCountdown();
      } else if (state === 'exercise' && exercise.type === 'reps') {
        setElapsedTime((prev) => (Number.isFinite(prev) ? prev + 1 : 1));
      }

    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!workout) return;
    if (isPaused) return;
    if (workoutState !== 'getReady') return;

    const exercise = getCurrentExercise();
    if (!exercise) return;

    const key = `${workout.id}:${currentRound}:${currentExerciseIndex}`;
    if (lastGetReadyAnnouncementKeyRef.current === key) {
      return;
    }

    lastGetReadyAnnouncementKeyRef.current = key;

    const instructions = exercise.instructions?.trim();
    const durationInfo =
      exercise.type === 'duration'
        ? `${exercise.amount} Sekunden`
        : `${exercise.amount} Wiederholungen`;
    const messageParts = [exercise.name, durationInfo];
    if (instructions) {
      messageParts.push(instructions);
    }
    const message = messageParts.filter(Boolean).join('. ');

    void speakText(message);
  }, [workout, isPaused, workoutState, getCurrentExercise, currentRound, currentExerciseIndex, speakText]);

  useEffect(() => {
    if (workoutState === 'getReady') return;
    lastGetReadyAnnouncementKeyRef.current = '';
  }, [workoutState]);

  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [cancelSpeech]);

  return {
    workout,
    backgroundColor,
    workoutState,
    currentRound,
    currentExerciseIndex,
    currentExercise: getCurrentExercise(),
    timeRemaining,
    elapsedTime,
    sessionDurationMinutes: Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000)),
    silentFinishSignalId,
    isPaused,
    setIsPaused,
    handlePhaseComplete,
    handleExerciseComplete,
    handleSkip,
  };
}

