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
  const cardBg = isDark ? APP_THEME_COLORS.dark.cardBackground : APP_THEME_COLORS.light.cardBackground;
  const deleteColor = isDark ? APP_THEME_COLORS.dark.delete : APP_THEME_COLORS.light.delete;

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
          <View style={[sharedRunLayoutStyles.roundRow, styles.roundRowLeft]}>
            <Text style={[sharedRunTextStyles.roundLine, { color: textColor }]}>
              {workoutName} • Übung {currentExerciseIndex + 1} / {totalExercises}
            </Text>
          </View>

          <View style={[sharedRunLayoutStyles.headerRow, styles.headerRow]}>
            <Text style={[sharedRunTextStyles.headerLabel, { color: textColor }]}>GET READY:</Text>
            <Text style={[sharedRunTextStyles.timerText, { color: timerColor }]}>{timeRemaining}</Text>
          </View>

          <Text
            style={[sharedRunTextStyles.exerciseTitle, { color: textColor }]}
            numberOfLines={1}>
            {exerciseHeading}
          </Text>

          <Image
            source={getImageSource(currentExercise)}
            style={[styles.exerciseImage, { width: imageSize, height: imageSize }]}
            resizeMode="contain"
          />

          <Text style={[sharedRunTextStyles.instructions, { color: subTextColor }]}>
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
    justifyContent: 'space-between',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  roundRowLeft: {
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-start',
  },
  headerRow: {
    width: '100%',
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
});
