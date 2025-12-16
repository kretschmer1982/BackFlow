// @ts-nocheck
import { getImageSource } from '@/constants/exercises';
import { WorkoutExercise } from '@/types/interfaces';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo } from 'react';

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

function PlankVideo({ size }: { size: number }) {
  const player = useVideoPlayer(require('../../assets/videos/plank.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      pointerEvents="none"
      style={[styles.exerciseVideo, { width: size, height: size }]}
      contentFit="cover"
      nativeControls={false}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
      showsTimecodes={false}
    />
  );
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
  const hasVideo = currentExercise.name === 'Plank';
  const windowWidth = Dimensions.get('window').width;
  const contentWidth = windowWidth - 48; // 2 * padding 24 aus workoutScreen
  const videoSize = contentWidth * 0.8; // quadratisches Video mit 80% der Inhaltsbreite

  const isDark = useMemo(() => isDarkColor(backgroundColor), [backgroundColor]);
  const textColor = isDark ? '#ffffff' : '#111827';
  const subTextColor = isDark ? '#aaaaaa' : '#4b5563';
  const timerColor = isDark ? '#ffffff' : '#111827';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.workoutScreen}>
        <View style={styles.roundInfo}>
          <Text style={[styles.roundText, { color: textColor }]}>
            {workoutName} • Übung {currentExerciseIndex + 1} /{' '}
            {totalExercises}
          </Text>
        </View>

        {/* Übungsbild oder Video */}
        {hasVideo ? (
          <PlankVideo size={videoSize} />
        ) : (
          <Image
            source={getImageSource(currentExercise.name, currentExercise.image)}
            style={styles.exerciseImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color: timerColor }]}>{timeRemaining}</Text>
        </View>

        <View style={styles.exerciseDisplay}>
          <Text style={[styles.getReadyText, { color: textColor }]} numberOfLines={1} adjustsFontSizeToFit>
            GET READY
          </Text>
          <Text style={[styles.nextExerciseText, { color: textColor }]}>Nächste Übung:</Text>
          <Text style={[styles.nextExerciseName, { color: textColor }]}>{currentExercise.name}</Text>
          {currentExercise.type === 'duration' ? (
            <Text style={[styles.nextExerciseInfo, { color: textColor }]}>
              {currentExercise.amount}s
            </Text>
          ) : (
            <Text style={[styles.nextExerciseInfo, { color: textColor }]}>
              {currentExercise.amount} x
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Pressable 
            style={[styles.cancelButton, !isDark && { backgroundColor: '#e5e7eb', borderColor: '#d1d5db' }]} 
            onPress={onCancel}>
            <Text style={[styles.cancelButtonText, !isDark && { color: '#111827' }]}>ABBRECHEN</Text>
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
    letterSpacing: 4,
  },
  exerciseDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  getReadyText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
  },
  nextExerciseText: {
    fontSize: 20,
    opacity: 0.8,
    marginBottom: 12,
  },
  nextExerciseName: {
    fontSize: 36,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  nextExerciseInfo: {
    fontSize: 24,
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
  exerciseVideo: {
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
});
