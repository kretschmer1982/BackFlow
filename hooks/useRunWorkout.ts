import { GET_READY_DURATION } from '@/constants/exercises';
import { Workout, WorkoutExercise } from '@/types/interfaces';
import { useBeepPlayer } from '@/utils/sound';
import { getSettings, getWorkoutById } from '@/utils/storage';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

export type WorkoutState = 'getReady' | 'exercise' | 'completed';

function detectExerciseTitleLanguageTag(title: string): 'de-DE' | 'en-US' {
  const t = (title || '').trim();
  if (!t) return 'de-DE';

  // Harte Indikatoren für Deutsch
  if (/[äöüßÄÖÜ]/.test(t)) return 'de-DE';

  const tokens = t
    .toLowerCase()
    .replace(/[^a-zA-Zäöüß0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const germanWords = new Set([
    'links',
    'rechts',
    'zur',
    'zum',
    'im',
    'in',
    'mit',
    'ohne',
    'und',
    'knie',
    'brust',
    'rumpfrotation',
  ]);
  const englishWords = new Set([
    'plank',
    'superman',
    'bird-dog',
    'bird',
    'dog',
    'glute',
    'bridge',
    'cat-cow',
    'cat',
    'cow',
    'sit-ups',
    'sit',
    'ups',
    'side',
    'reverse',
    'dead',
    'bug',
    'childs',
    'pose',
    'hip',
    'hinge',
    'wall',
  ]);

  for (const tok of tokens) {
    if (germanWords.has(tok)) return 'de-DE';
  }
  for (const tok of tokens) {
    if (englishWords.has(tok)) return 'en-US';
  }

  // Fallback-Heuristik: nur ASCII-Buchstaben/Trenner -> eher Englisch, sonst Deutsch
  const asciiOnly = /^[\x00-\x7F]+$/.test(t);
  return asciiOnly ? 'en-US' : 'de-DE';
}

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
  setIsPaused: (value: boolean) => void;
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

    return {
      ...ex,
      type,
      amount,
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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const TOTAL_ROUNDS = 1; // Eine Runde pro Workout
  const { playBeep, playDoubleBeep } = useBeepPlayer();
  const phaseCompleteInFlightRef = useRef(false);
  const lastSpokenKeyRef = useRef<string>('');
  const lastPraiseRef = useRef<string>('');
  const lastPraiseAtRef = useRef<number>(0);
  const nextSpeakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    workoutStateRef.current = workoutState;
  }, [workoutState]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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
    if (!enableBeep) return;
    await playDoubleBeep();
  }, [enableBeep, playDoubleBeep]);

  const safeSpeakPraise = useCallback(async () => {
    if (!enableBeep) return;

    const praises = [
      'Geschafft!',
      'Großartig!',
      'Fertig!',
      'Klasse!',
      'Mega!',
      'Stark! Weiter so!',
      'Sehr gut!',
    ] as const;
    // Zufällig, aber nicht direkt wiederholen
    let next = praises[Math.floor(Math.random() * praises.length)];
    if (praises.length > 1 && next === lastPraiseRef.current) {
      next = praises[(praises.indexOf(next) + 1) % praises.length];
    }
    lastPraiseRef.current = next;
    lastPraiseAtRef.current = Date.now();

    try {
      // Standardstimme nutzen, nur schneller damit es nicht "lahm" klingt
      const rate = 1.15 + Math.random() * 0.05; // 1.15..1.20
      Speech.speak(next, { language: 'de-DE', rate });
    } catch {
      // ignore
    }
  }, [enableBeep]);

  const triggerSilentFinishSignal = useCallback(() => {
    // Nur wenn Beeps & Ansagen aus sind
    if (enableBeepRef.current) return;
    setSilentFinishSignalId(Date.now());
  }, []);

  const getCurrentExercise = useCallback((): WorkoutExercise | null => {
    if (!workout || workout.exercises.length === 0) return null;
    return normalizeExercise(workout.exercises[currentExerciseIndex]);
  }, [workout, currentExerciseIndex, normalizeExercise]);

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
    setTimeRemaining(exerciseTransitionSeconds);
    setElapsedTime(0);
  }, [currentRound, currentExerciseIndex, workout, exerciseTransitionSeconds]);

  const handlePhaseComplete = useCallback(async () => {
    if (phaseCompleteInFlightRef.current) return;
    phaseCompleteInFlightRef.current = true;

    try {
    if (workoutState === 'getReady') {
      const exercise = getCurrentExercise();
      if (!exercise) return;

      // Start der Übung: 2x Beep
      await safePlayStartSignal();

      if (exercise.type === 'duration') {
        setTimeRemaining(exercise.amount);
      } else {
        setElapsedTime(0);
        setTimeRemaining(0);
      }
      setWorkoutState('exercise');
    } else if (workoutState === 'exercise') {
      // Ende der Übung: zufälliges Lob (TTS)
      await safeSpeakPraise();
      triggerSilentFinishSignal();
      moveToNextExercise();
    }
    } finally {
      phaseCompleteInFlightRef.current = false;
    }
  }, [workoutState, getCurrentExercise, moveToNextExercise, safeSpeakPraise, safePlayStartSignal, triggerSilentFinishSignal]);

  const handleExerciseComplete = useCallback(async () => {
    const exercise = getCurrentExercise();
    if (exercise && exercise.type === 'reps') {
      // Ende der Übung: zufälliges Lob (TTS)
      await safeSpeakPraise();
      triggerSilentFinishSignal();
      moveToNextExercise();
    }
  }, [getCurrentExercise, moveToNextExercise, safeSpeakPraise, triggerSilentFinishSignal]);

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

    // Safety: altes Interval immer stoppen (auch wenn cleanup aus irgendeinem Grund nicht lief)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (workoutState === 'getReady') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const safePrev = Number.isFinite(prev) ? prev : 1;
          if (safePrev <= 1) {
            // Interval sofort stoppen, damit der Phasenwechsel nicht mehrfach getriggert wird
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            void handlePhaseComplete();
            return 0;
          }
          return safePrev - 1;
        });
      }, 1000);
    } else if (workoutState === 'exercise' && exercise.type === 'duration') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const safePrev = Number.isFinite(prev) ? prev : 1;
          if (safePrev <= 1) {
            // Interval sofort stoppen, damit der Phasenwechsel nicht mehrfach getriggert wird
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            void handlePhaseComplete();
            return 0;
          }
          return safePrev - 1;
        });
      }, 1000);
    } else if (workoutState === 'exercise' && exercise.type === 'reps') {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => (Number.isFinite(prev) ? prev + 1 : 1));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    workout,
    isPaused,
    workoutState,
    getCurrentExercise,
    handlePhaseComplete,
    currentExerciseIndex,
  ]);

  // Text-to-Speech: Name der nächsten Übung ansagen (einmal pro getReady-Phase)
  useEffect(() => {
    if (!workout) return;
    if (isPaused) return;
    if (!enableBeep) return;
    if (workoutState !== 'getReady') return;

    const exercise = getCurrentExercise();
    if (!exercise) return;

    const key = `${workout.id}:${currentRound}:${currentExerciseIndex}:${workoutState}`;
    if (lastSpokenKeyRef.current === key) return;
    lastSpokenKeyRef.current = key;

    // Bestehende geplante Ansage abbrechen
    if (nextSpeakTimeoutRef.current) {
      clearTimeout(nextSpeakTimeoutRef.current);
      nextSpeakTimeoutRef.current = null;
    }

    try {
      // 5s Abstand nach dem Lob am Übungsende, damit sich die Ansagen nicht überlappen
      const now = Date.now();
      const elapsedSincePraise = lastPraiseAtRef.current ? now - lastPraiseAtRef.current : Number.POSITIVE_INFINITY;
      const delayMs = Math.max(0, 5000 - elapsedSincePraise);

      nextSpeakTimeoutRef.current = setTimeout(() => {
        // Nur sprechen, wenn wir noch im passenden Zustand sind
        if (!enableBeepRef.current) return;
        if (isPausedRef.current) return;
        if (workoutStateRef.current !== 'getReady') return;
        if (timeRemainingRef.current <= 1) return; // kurz vor Phasenwechsel -> skip

        try {
          const lang = detectExerciseTitleLanguageTag(exercise.name);
          const rate = 1.12 + Math.random() * 0.05; // 1.12..1.17

          if (lang === 'en-US') {
            // Nur der Name wird Englisch gesprochen, Rest Deutsch.
            // Wir ketten die Ansagen, damit sie nicht überlappen.
            Speech.speak('Nächste Übung:', {
              language: 'de-DE',
              rate,
              onDone: () => {
                try {
                  Speech.speak(exercise.name, { language: 'en-US', rate });
                } catch {
                  // ignore
                }
              },
            });
          } else {
            Speech.speak(`Nächste Übung: ${exercise.name}!`, { language: 'de-DE', rate });
          }
        } catch {
          // ignore
        }
      }, delayMs);
    } catch {
      // ignore
    }

    return () => {
      if (nextSpeakTimeoutRef.current) {
        clearTimeout(nextSpeakTimeoutRef.current);
        nextSpeakTimeoutRef.current = null;
      }
    };
  }, [workout, isPaused, enableBeep, workoutState, getCurrentExercise, currentRound, currentExerciseIndex]);

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

