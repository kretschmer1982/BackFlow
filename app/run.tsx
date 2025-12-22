import { RunCompletedView } from '@/components/run/RunCompletedView';
import { RunExerciseView } from '@/components/run/RunExerciseView';
import { RunGetReadyView } from '@/components/run/RunGetReadyView';
import { useRunWorkout } from '@/hooks/useRunWorkout';
import { PlannedWorkoutEntry, getPlannedWorkouts, normalizePlannedValueToEntries, savePlannedWorkout } from '@/utils/storage';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function toLocalDateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseHexColor(hex: string) {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);
  return { r, g, b };
}

function isDarkColor(hex: string) {
  const { r, g, b } = parseHexColor(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

async function markWorkoutCompletedToday(workoutId: string, durationMinutes: number) {
  const key = toLocalDateKey(new Date());
  const planned = await getPlannedWorkouts();
  const existing = planned[key];
  const entries = existing === undefined ? [] : normalizePlannedValueToEntries(existing as any);

  // Wenn es heute bereits dieses Workout gibt: markiere als durchgeführt
  const idx = entries.findIndex((e) => e.workoutId === workoutId);
  if (idx >= 0) {
    entries[idx] = { ...entries[idx], completed: true, durationMinutes };
  } else {
    const entry: PlannedWorkoutEntry = { workoutId, completed: true, durationMinutes };
    entries.push(entry);
  }

  await savePlannedWorkout(key, entries.slice(0, 3));
}

export default function RunWorkoutScreen() {
  useKeepAwake();
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
    sessionDurationMinutes,
    silentFinishSignalId,
    startSignalId,
    handleExerciseComplete,
    handleSkip,
    isPaused,
    setIsPaused,
  } = useRunWorkout({
    workoutId,
    onWorkoutNotFound: () => router.back(),
  });

  const [flashVisible, setFlashVisible] = useState(false);
  const flashTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [completionMarked, setCompletionMarked] = useState(false);

  const isDark = useMemo(() => isDarkColor(backgroundColor), [backgroundColor]);
  const textColor = isDark ? '#ffffff' : '#111827';
  const handlePauseToggle = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, [setIsPaused]);

  useEffect(() => {
    if (!startSignalId) return;

    // Vorherige Timer abbrechen
    flashTimeoutsRef.current.forEach((t) => clearTimeout(t));
    flashTimeoutsRef.current = [];

    // 1x Vollbild weiß blinken
    const ON_MS = 500;

    setFlashVisible(true);
    flashTimeoutsRef.current.push(setTimeout(() => setFlashVisible(false), ON_MS));

    // Einmal vibrieren
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press).catch(() => {});
      try {
        Vibration.vibrate(ON_MS, false);
      } catch {
        // ignore
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    return () => {
      flashTimeoutsRef.current.forEach((x) => clearTimeout(x));
      flashTimeoutsRef.current = [];
    };
  }, [startSignalId]);

  useEffect(() => {
    if (!silentFinishSignalId) return;

    // Vorherige Timer abbrechen
    flashTimeoutsRef.current.forEach((t) => clearTimeout(t));
    flashTimeoutsRef.current = [];

    // 3x Vollbild weiß blinken (via Modal, damit es keinen Einfluss auf Layout/Timer hat)
    // Spezifikation: 0,5s an, kurze Pause, insgesamt 3x
    const ON_MS = 500;
    const GAP_MS = 200;
    const t1Off = ON_MS;
    const t2On = ON_MS + GAP_MS;
    const t2Off = ON_MS + GAP_MS + ON_MS;
    const t3On = ON_MS + GAP_MS + ON_MS + GAP_MS;
    const t3Off = ON_MS + GAP_MS + ON_MS + GAP_MS + ON_MS;

    setFlashVisible(true); // Flash 1 an
    flashTimeoutsRef.current.push(setTimeout(() => setFlashVisible(false), t1Off)); // Flash 1 aus
    flashTimeoutsRef.current.push(setTimeout(() => setFlashVisible(true), t2On)); // Flash 2 an
    flashTimeoutsRef.current.push(setTimeout(() => setFlashVisible(false), t2Off)); // Flash 2 aus
    flashTimeoutsRef.current.push(setTimeout(() => setFlashVisible(true), t3On)); // Flash 3 an
    flashTimeoutsRef.current.push(setTimeout(() => setFlashVisible(false), t3Off)); // Flash 3 aus

    // Stark vibrieren (3 Pulse, passend zu den Blinks)
    if (Platform.OS === 'android') {
      // Pixel/Android: ein klarer Vibrationsaufruf pro Blink ist am zuverlässigsten.
      // (Mehrere Vibration.vibrate() Varianten können sich gegenseitig abbrechen/überlagern.)
      const pulse = () => {
        // Android-Haptics (benötigt keine VIBRATE-Permission, funktioniert i.d.R. auch in Expo Go zuverlässiger)
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press).catch(() => {});
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject).catch(() => {});

        try {
          Vibration.vibrate(ON_MS, false);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Vibration.vibrate failed', e);
        }
        // Optionales zusätzliches Haptics-Feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      };

      // Pulse 1 sofort
      pulse();
      flashTimeoutsRef.current.push(
        setTimeout(() => {
          pulse();
        }, t2On)
      );
      flashTimeoutsRef.current.push(
        setTimeout(() => {
          pulse();
        }, t3On)
      );
    } else {
      // iOS: kein frei definierbares Vibrationsmuster -> starke Haptik 3x
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      flashTimeoutsRef.current.push(
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), t2On)
      );
      flashTimeoutsRef.current.push(
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), t3On)
      );
    }
    return () => {
      flashTimeoutsRef.current.forEach((x) => clearTimeout(x));
      flashTimeoutsRef.current = [];
    };
  }, [silentFinishSignalId]);

  type CompletionTarget = '/(tabs)' | '/(tabs)/profile';
  const handleCompletionNavigation = async (target: CompletionTarget) => {
    if (!workout) return;
    if (!completionMarked) {
      try {
        await markWorkoutCompletedToday(workout.id, sessionDurationMinutes ?? 0);
      } catch {
        // ignore
      }
      setCompletionMarked(true);
    }
    router.push(target);
  };

  let content: ReactNode;

  if (!workout) {
    content = (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>Lade Workout...</Text>
        </View>
      </SafeAreaView>
    );
  } else if (workoutState === 'completed') {
    content = (
      <RunCompletedView
        workout={workout}
        backgroundColor={backgroundColor}
        onContinueWorkout={() => handleCompletionNavigation('/(tabs)')}
        onViewStats={() => handleCompletionNavigation('/(tabs)/profile')}
      />
    );
  } else if (!currentExercise) {
    content = (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>Keine Übungen gefunden</Text>
        </View>
      </SafeAreaView>
    );
  } else if (workoutState === 'getReady') {
    // Get Ready Screen
    content = (
      <RunGetReadyView
        workoutName={workout.name}
        currentExerciseIndex={currentExerciseIndex}
        totalExercises={workout.exercises.length}
        currentExercise={currentExercise}
        timeRemaining={timeRemaining}
        backgroundColor={backgroundColor}
        onSkip={handleSkip}
        onCancel={() => router.back()}
        onPause={handlePauseToggle}
        isPaused={isPaused}
      />
    );
  } else {
    // Exercise Screen
    content = (
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
        onPause={handlePauseToggle}
        isPaused={isPaused}
      />
    );
  }

  return (
    <>
      {content}
      <Modal
        transparent
        visible={flashVisible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setFlashVisible(false)}>
        <View pointerEvents="none" style={styles.silentFinishOverlay} />
      </Modal>
    </>
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
  },
  silentFinishOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
  },
});
