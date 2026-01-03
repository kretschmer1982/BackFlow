import { sharedRunTextStyles } from '@/components/run/sharedRunStyles';
import { Exercise } from '@/constants/exercises';
import { APP_THEME_COLORS, isLightColor } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Dimensions, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const warmupImage = require('../../assets/images/warmup.png');

interface RunWarmupViewProps {
  segment: Exercise;
  backgroundColor: string;
  onPause: () => void;
  onSkip: () => void;
  onCancel: () => void;
  isPaused: boolean;
}

export function RunWarmupView({
  segment,
  backgroundColor,
  onPause,
  onSkip,
  onCancel,
  isPaused,
}: RunWarmupViewProps) {
  const windowHeight = Dimensions.get('window').height;
  const imageSize = Math.min(windowHeight * 0.35, 320);
  const isDark = useMemo(() => !isLightColor(backgroundColor), [backgroundColor]);
  const textColor = isDark ? APP_THEME_COLORS.dark.text : APP_THEME_COLORS.light.text;
  const subTextColor = isDark ? APP_THEME_COLORS.dark.subtext : APP_THEME_COLORS.light.subtext;
  const cardBg = isDark ? APP_THEME_COLORS.dark.cardBackground : APP_THEME_COLORS.light.cardBackground;
  const deleteColor = isDark ? APP_THEME_COLORS.dark.delete : APP_THEME_COLORS.light.delete;

  const summaryText = (segment.summary ?? segment.instructions)?.trim();
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.workoutScreen}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.segmentTitle, { color: textColor }]} numberOfLines={2}>
            Warm up 1
          </Text>
          <Image
            source={warmupImage}
            style={[styles.exerciseImage, { width: imageSize, height: imageSize }]}
            resizeMode="contain"
          />
          {summaryText ? (
            <Text style={[sharedRunTextStyles.instructions, { color: subTextColor }]}>{summaryText}</Text>
          ) : null}
          <View style={styles.emptyBottomSpace} />
        </View>

        <View style={styles.buttonContainer}>
          <Pressable style={[styles.actionButton, { backgroundColor: cardBg }]} onPress={handleCancelPress}>
            <Text style={[styles.actionButtonText, { color: deleteColor }]}>×</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: cardBg }]} onPress={onPause}>
            <Text style={[styles.actionButtonText, { color: textColor }]}>
              {isPaused ? 'Fortsetzen' : 'Pause'}
            </Text>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: cardBg }]} onPress={onSkip}>
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
              <Text style={[styles.modalTitle, { color: textColor }]}>Warm-up abbrechen</Text>
              <Text style={[styles.modalMessage, { color: subTextColor }]}>
                Möchtest du das Warm-up wirklich abbrechen?
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
    paddingBottom: 90,
  },
  segmentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 16,
  },
  exerciseImage: {
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    gap: 12,
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
  emptyBottomSpace: {
    width: '100%',
    height: 90,
  },
});

