import { getSettings } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { markIntroSeen } from '@/utils/storage';

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

export default function InfoScreen() {
  const router = useRouter();
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setBackgroundColor(settings.appBackgroundColor);
    };
    loadSettings();
  }, []);

  const isLightBackground = isLightColor(backgroundColor);
  const statusBarStyle = isLightBackground ? 'dark' : 'light';
  const titleColor = isLightBackground ? '#111827' : '#ffffff';
  const textColor = isLightBackground ? '#111827' : '#f9fafb';
  const mutedColor = isLightBackground ? '#4b5563' : '#d1d5db';

  const handleContinue = async () => {
    await markIntroSeen();
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={statusBarStyle} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.betaBadge, { color: mutedColor, borderColor: mutedColor }]}>
          Beta-Version
        </Text>

        <Text style={[styles.title, { color: titleColor }]}>Willkommen bei BackFlow</Text>

        <Text style={[styles.paragraph, { color: textColor }]}>
          Diese Version von BackFlow ist eine <Text style={styles.bold}>Beta</Text>. Das bedeutet:
        </Text>

        <View style={styles.list}>
          <Text style={[styles.listItem, { color: textColor }]}>
            • Funktionen können sich noch ändern.
          </Text>
          <Text style={[styles.listItem, { color: textColor }]}>
            • Es kann gelegentlich zu Fehlern oder kleineren Ungenauigkeiten kommen.
          </Text>
          <Text style={[styles.listItem, { color: textColor }]}>
            • Dein Feedback hilft, BackFlow stabil und alltagstauglich zu machen.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: titleColor }]}>Wozu dient BackFlow?</Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          BackFlow unterstützt dich dabei, kurze, strukturierte Workouts für Rücken, Haltung und
          Alltag zu planen und konsequent durchzuführen.
        </Text>

        <Text style={[styles.sectionTitle, { color: titleColor }]}>Kernfunktionen</Text>
        <View style={styles.list}>
          <Text style={[styles.listItem, { color: textColor }]}>
            • Eigene Workouts mit individuellen Übungen zusammenstellen.
          </Text>
          <Text style={[styles.listItem, { color: textColor }]}>
            • Wiederholungen oder Zeit-basierten Übungen mit Countdown ausführen.
          </Text>
          <Text style={[styles.listItem, { color: textColor }]}>
            • Akustische Signale beim Countdown und beim Phasenwechsel.
          </Text>
          <Text style={[styles.listItem, { color: textColor }]}>
            • Optionale Trainings-Erinnerungen konfigurieren.
          </Text>
        </View>

        <View style={styles.footerNote}>
          <Text style={[styles.footerText, { color: mutedColor }]}>
            Hinweis: Diese App ersetzt keine medizinische Beratung. Wenn du Schmerzen oder Beschwerden
            hast, sprich bitte mit einer Fachperson.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.primaryButton} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>Los geht's</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  betaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
  },
  list: {
    marginTop: 4,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
  },
  footerNote: {
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#4ade80',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.5,
  },
});


