import { RunWarmupView } from '@/components/run/RunWarmupView';
import { useWarmup } from '@/hooks/useWarmup';
import { getSettings, getWorkoutById } from '@/utils/storage';
import { Workout } from '@/types/interfaces';
import { WARM_UP_LIBRARY } from '@/constants/exercises';
import { isLightColor } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export const unstable_settings = {
  headerShown: false,
};

export default function WarmupScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [isLoading, setIsLoading] = useState(true);
  const isDarkBackground = useMemo(() => !isLightColor(backgroundColor), [backgroundColor]);

  useEffect(() => {
    const load = async () => {
      if (!workoutId) return;
      const [settings, foundWorkout] = await Promise.all([getSettings(), getWorkoutById(workoutId)]);
      if (!foundWorkout) {
        router.back();
        return;
      }
      setWorkout(foundWorkout);
      setBackgroundColor(settings.appBackgroundColor);
      setIsLoading(false);
    };
    load();
  }, [router, workoutId]);

  const handleWarmupComplete = useCallback(() => {
    if (!workoutId) return;
    router.replace({
      pathname: '/run',
      params: { workoutId },
    });
  }, [router, workoutId]);

  const warmupSegments = useMemo(() => {
    const warmupId = workout?.warmupId ?? (workout?.includeWarmup ? WARM_UP_LIBRARY[0]?.id : undefined);
    const definition = warmupId ? WARM_UP_LIBRARY.find((entry) => entry.id === warmupId) : WARM_UP_LIBRARY[0];
    return definition?.segments ?? [];
  }, [workout]);

  const {
    currentSegment,
    isPaused,
    handlePauseToggle,
    handleSkip,
    stopSpeech,
  } = useWarmup({
    segments: warmupSegments,
    onComplete: handleWarmupComplete,
  });

  if (isLoading || !workout || !currentSegment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar style={isDarkBackground ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDarkBackground ? '#ffffff' : '#111827' }]}>
            Lade Warm-up...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <RunWarmupView
      segment={currentSegment}
      backgroundColor={backgroundColor}
      onPause={handlePauseToggle}
      onSkip={handleSkip}
      onCancel={() => {
        stopSpeech();
        router.back();
      }}
      isPaused={isPaused}
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
    padding: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

