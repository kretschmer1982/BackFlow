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
  TouchableOpacity,
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

  const isDark = useMemo(() => isDarkColor(backgroundColor), [backgroundColor]);
  const textColor = isDark ? '#ffffff' : '#111827';
  const subTextColor = isDark ? '#aaaaaa' : '#4b5563';
  const timerColor = isDark ? '#ffffff' : '#111827';

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.workoutScreen}>
        <TouchableOpacity
          style={styles.touchableArea}
          activeOpacity={1}
          onPress={isRepsExercise ? onExerciseTap : undefined}
          disabled={!isRepsExercise}>
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
              <Text style={[styles.repsText, { color: timerColor }]}>{currentExercise.amount} x</Text>
            ) : (
              <Text style={[styles.timerText, { color: timerColor }]}>
                {formatTime(timeRemaining)}
              </Text>
            )}
            {isRepsExercise && (
              <Text style={[styles.stopwatchText, { color: textColor }]}>
                {formatTime(elapsedTime)}
              </Text>
            )}
          </View>

          <View style={styles.exerciseDisplay}>
            <Text style={[styles.currentExerciseText, { color: textColor }]}>
              {currentExercise.name}
            </Text>
            <Text style={[styles.instructionsText, { color: textColor }]}>
              {currentExercise.instructions}
            </Text>
            {isRepsExercise && (
              <Text style={[styles.tapHint, { color: subTextColor }]}>Tippe zum Abschließen</Text>
            )}
          </View>
        </TouchableOpacity>

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
  repsText: {
    fontSize: 80,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  stopwatchText: {
    fontSize: 32,
    fontWeight: '600',
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
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 20,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
    lineHeight: 28,
  },
  tapHint: {
    fontSize: 18,
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
