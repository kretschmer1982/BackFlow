// @ts-nocheck
import { getImageSource } from '@/constants/exercises';
import { APP_THEME_COLORS, isLightColor } from '@/constants/theme';
import { WorkoutExercise } from '@/types/interfaces';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
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
  const windowHeight = Dimensions.get('window').height;
  const imageSize = windowHeight * 0.35;

  const isDark = useMemo(() => !isLightColor(backgroundColor), [backgroundColor]);
  const textColor = isDark ? APP_THEME_COLORS.dark.text : APP_THEME_COLORS.light.text;
  const subTextColor = isDark ? APP_THEME_COLORS.dark.subtext : APP_THEME_COLORS.light.subtext;
  const timerColor = isDark ? APP_THEME_COLORS.dark.text : APP_THEME_COLORS.light.text;
  const accentColor = isDark ? APP_THEME_COLORS.dark.accent : APP_THEME_COLORS.light.accent;
  const cardBg = isDark ? APP_THEME_COLORS.dark.cardBackground : APP_THEME_COLORS.light.cardBackground;
  const deleteColor = isDark ? APP_THEME_COLORS.dark.delete : APP_THEME_COLORS.light.delete;

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

          <Image
            source={getImageSource(
              currentExercise.name,
              currentExercise.image
            )}
            style={[styles.exerciseImage, { width: imageSize, height: imageSize }]}
            resizeMode="contain"
          />
          
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
            style={[styles.cancelButton, { backgroundColor: cardBg }]} 
            onPress={onCancel}>
            <Text style={[styles.cancelButtonText, { color: deleteColor }]}>×</Text>
          </Pressable>
          <Pressable 
            style={[styles.skipButton, { backgroundColor: accentColor, borderColor: accentColor }]} 
            onPress={onSkip}>
            <Text style={[styles.skipButtonText, { color: isDark ? '#1a1a1a' : '#ffffff' }]}>Skip</Text>
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
    marginTop: 10,
  },
  roundInfo: {
    marginTop: 10,
    marginBottom: 10,
  },
  roundText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  timerText: {
    fontSize: 32, // Reduziert von 72
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  repsText: {
    fontSize: 32, // Reduziert von 80
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 24,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  tapHint: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 20,
    fontStyle: 'italic',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  cancelButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 34,
  },
  exerciseImage: {
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
});
