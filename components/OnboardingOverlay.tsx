import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OnboardingOverlayProps {
  visible: boolean;
  onFinish: () => void;
}

const STEPS = [
  {
    title: 'Willkommen bei BackFlow',
    description: 'Dein persönlicher Begleiter für einen starken Rücken und eine gesunde Routine. Lass uns gemeinsam starten!',
    icon: '👋',
    color: '#4ade80', // green
  },
  {
    title: 'Dein Dashboard',
    description: 'Auf dem Home-Screen siehst du deine nächsten geplanten Workouts und deinen aktuellen Fortschritt auf einen Blick.',
    icon: '🏠',
    color: '#60a5fa', // blue
  },
  {
    title: 'Workouts erstellen',
    description: 'Stelle dir individuelle Trainings aus vielen Übungen zusammen oder passe bestehende Workouts an deine Bedürfnisse an.',
    icon: '💪',
    color: '#f472b6', // pink
  },
  {
    title: 'Wochenplaner',
    description: 'Plane deine Woche im Voraus. Feste Zeiten und Routine sind der Schlüssel zu einem schmerzfreien Rücken.',
    icon: '📅',
    color: '#a78bfa', // purple
  },
  {
    title: 'Fokussiert trainieren',
    description: 'Der geführte Trainings-Modus mit Timer, Sprachausgabe und Video-Anleitung hilft dir, die Übungen korrekt auszuführen.',
    icon: '▶️',
    color: '#fbbf24', // yellow
  },
];

export function OnboardingOverlay({ visible, onFinish }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const currentStep = STEPS[step];

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Überspringen</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={[styles.iconCircle, { borderColor: currentStep.color }]}>
              <Text style={styles.icon}>{currentStep.icon}</Text>
            </View>
            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.description}>{currentStep.description}</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {STEPS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === step ? { backgroundColor: currentStep.color, width: 24 } : { backgroundColor: '#333' },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: currentStep.color }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {step === STEPS.length - 1 ? 'Los geht\'s!' : 'Weiter'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)', // Fast schwarz, leicht transparent
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'flex-end',
    paddingTop: 16,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    backgroundColor: '#1a1a1a',
  },
  icon: {
    fontSize: 50,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },
  footer: {
    gap: 30,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

