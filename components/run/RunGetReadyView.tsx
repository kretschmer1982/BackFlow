import { getImageSource } from '@/constants/exercises';
import { APP_THEME_COLORS, isLightColor } from '@/constants/theme';
import { WorkoutExercise } from '@/types/interfaces';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RunGetReadyViewProps {
  workoutName: string;
  currentExerciseIndex: number;
  totalExercises: number;
  currentExercise: WorkoutExercise;
  timeRemaining: number;
  backgroundColor: string;
  onSkip: () => void;
  onCancel: () => void;
  onPause: () => void;
  isPaused: boolean;
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
  onPause,
  isPaused,
}: RunGetReadyViewProps) {
  const windowHeight = Dimensions.get('window').height;
  const imageSize = windowHeight * 0.35;

  const isDark = useMemo(() => !isLightColor(backgroundColor), [backgroundColor]);
  const textColor = isDark ? APP_THEME_COLORS.dark.text : APP_THEME_COLORS.light.text;
  const subTextColor = isDark ? APP_THEME_COLORS.dark.subtext : APP_THEME_COLORS.light.subtext;
  const timerColor = isDark ? APP_THEME_COLORS.dark.text : APP_THEME_COLORS.light.text;
  const accentColor = isDark ? APP_THEME_COLORS.dark.accent : APP_THEME_COLORS.light.accent;
  const cardBg = isDark ? APP_THEME_COLORS.dark.cardBackground : APP_THEME_COLORS.light.cardBackground;
  const deleteColor = isDark ? APP_THEME_COLORS.dark.delete : APP_THEME_COLORS.light.delete;

  const handleCancelPress = () => {
    Alert.alert(
      'Training abbrechen',
      'Möchtest du das Training wirklich abbrechen?',
      [
        {
          text: 'Nein',
          style: 'cancel',
        },
        {
          text: 'Ja, abbrechen',
          style: 'destructive',
          onPress: onCancel,
        },
      ]
    );
  };

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

        <Image
          source={getImageSource(currentExercise)}
          style={[styles.exerciseImage, { width: imageSize, height: imageSize }]}
          resizeMode="contain"
        />

        <View style={styles.headerRow}>
          <Text style={[styles.getReadyText, { color: textColor }]}>GET READY:</Text>
          <Text style={[styles.timerText, { color: timerColor }]}>{timeRemaining}</Text>
        </View>

        <View style={styles.exerciseDisplay}>
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

          <Text style={[styles.instructionsText, { color: subTextColor }]}>
            {currentExercise.instructions}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: cardBg }]}
            onPress={handleCancelPress}>
            <Text style={[styles.actionButtonText, { color: deleteColor }]}>×</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: cardBg }]}
            onPress={onPause}>
            <Text style={[styles.actionButtonText, { color: textColor }]}>
              {isPaused ? 'Fortsetzen' : 'Pause'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: cardBg }]}
            onPress={onSkip}>
            <Text style={[styles.actionButtonText, { color: textColor }]}>Skip</Text>
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
    marginTop: 10,
    marginBottom: 10,
  },
  roundText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20,
  },
  timerText: {
    fontSize: 32,
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
    letterSpacing: 2,
  },
  nextExerciseName: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
  },
  nextExerciseInfo: {
    fontSize: 24,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 24,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    height: 50,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    gap: 12,
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
