// @ts-nocheck
import {
  sharedRunLayoutStyles,
  sharedRunTextStyles,
} from '@/components/run/sharedRunStyles';
import { getImageSource } from '@/constants/exercises';
import { APP_THEME_COLORS, isLightColor } from '@/constants/theme';
import { WorkoutExercise } from '@/types/interfaces';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
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
  onPause: () => void;
  isPaused: boolean;
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
  onPause,
  isPaused,
}: RunExerciseViewProps) {
  const isRepsExercise = currentExercise.type === 'reps';
  const windowHeight = Dimensions.get('window').height;
  const imageSize = windowHeight * 0.35;

  const isDark = useMemo(() => !isLightColor(backgroundColor), [backgroundColor]);
  const textColor = isDark ? APP_THEME_COLORS.dark.text : APP_THEME_COLORS.light.text;
  const subTextColor = isDark ? APP_THEME_COLORS.dark.subtext : APP_THEME_COLORS.light.subtext;
  const timerColor = isDark ? APP_THEME_COLORS.dark.text : APP_THEME_COLORS.light.text;
  const cardBg = isDark ? APP_THEME_COLORS.dark.cardBackground : APP_THEME_COLORS.light.cardBackground;
  const deleteColor = isDark ? APP_THEME_COLORS.dark.delete : APP_THEME_COLORS.light.delete;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCancelPress = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    onCancel();
  };

  const handleDismissCancel = () => {
    setShowCancelModal(false);
  };

  const durationInfo =
    currentExercise.type === 'duration'
      ? `${currentExercise.amount}s`
      : `${currentExercise.amount} x`;
  const exerciseHeading = `${currentExercise.name} • ${durationInfo}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.workoutScreen}>
        <View style={styles.contentWrapper}>
          <TouchableOpacity
            style={[styles.touchableArea, styles.touchableExercise]}
            activeOpacity={1}
            onPress={isRepsExercise ? onExerciseTap : undefined}
            disabled={!isRepsExercise}>
            <View style={[sharedRunLayoutStyles.roundRow, styles.roundInfoRow]}>
              <Text style={[sharedRunTextStyles.roundLine, { color: textColor }]}>
                {workoutName} • Übung {currentExerciseIndex + 1} / {totalExercises}
              </Text>
              {isRepsExercise && (
                <Text style={[sharedRunTextStyles.countdown, { color: textColor }]}>
                  {formatTime(elapsedTime)}
                </Text>
              )}
            </View>

            <View style={[sharedRunLayoutStyles.headerRow, styles.headerRow]}>
              <Text style={[sharedRunTextStyles.headerLabel, { color: textColor }]}>
                LET&apos;S GO:
              </Text>
              {!isRepsExercise && (
                <Text style={[sharedRunTextStyles.timerText, { color: timerColor }]}>
                  {`${timeRemaining}s`}
                </Text>
              )}
            </View>

            <Text style={[sharedRunTextStyles.exerciseTitle, { color: textColor }]}>
              {exerciseHeading}
            </Text>

            <Image
              source={getImageSource(currentExercise)}
              style={[styles.exerciseImage, { width: imageSize, height: imageSize }]}
              resizeMode="contain"
            />

            <Text
              style={[sharedRunTextStyles.instructions, { color: subTextColor }]}>
              {currentExercise.instructions}
            </Text>
          </TouchableOpacity>
          {isRepsExercise && (
            <View style={styles.tapHintWrapper}>
              <Text style={[styles.tapHint, { color: subTextColor }]}>Tippe zum Abschließen</Text>
            </View>
          )}
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

      <Modal
        transparent
        visible={showCancelModal}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleDismissCancel}>
        <View style={styles.modalOverlay}>
          <View style={[styles.cancelModal, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Training abbrechen</Text>
            <Text style={[styles.modalMessage, { color: subTextColor }]}>
              Möchtest du das Training wirklich abbrechen?
            </Text>
            <View style={styles.modalButtonsRow}>
              <Pressable style={styles.modalButton} onPress={handleDismissCancel}>
                <Text style={[styles.modalButtonText, { color: textColor }]}>Nein</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: deleteColor }]}
                onPress={handleConfirmCancel}>
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Ja, abbrechen</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
  },
  touchableArea: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  touchableExercise: {
    justifyContent: 'flex-start',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    gap: 12,
  },
  tapHintWrapper: {
    width: '100%',
    paddingVertical: 6,
  },
  roundInfoRow: {
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  headerRow: {
    width: '100%',
  },
  tapHint: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 20,
    fontStyle: 'italic',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cancelModal: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
});
