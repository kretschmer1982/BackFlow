import { getSettings, updateSettings } from '@/utils/storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

// Verfügbare Hintergrundoptionen
const BACKGROUND_OPTIONS = [
  { name: 'Dark Mode', color: '#2a2a2a' }, // Mehr grau
  { name: 'Light Mode', color: '#DBEAFE' }, // Mehr bläulich
];

export default function SettingsScreen() {
  const router = useRouter();
  const [backgroundColor, setBackgroundColor] = useState<string>('#2a2a2a');
  const [enableBeep, setEnableBeep] = useState<boolean>(true);
  const [exerciseTransitionSeconds, setExerciseTransitionSeconds] = useState<number>(15);

  const loadSettings = useCallback(async () => {
    const settings = await getSettings();
    setBackgroundColor(settings.appBackgroundColor);
    setEnableBeep(
      typeof settings.enableBeep === 'boolean' ? settings.enableBeep : true
    );
    setExerciseTransitionSeconds(
      typeof (settings as any).exerciseTransitionSeconds === 'number' && Number.isFinite((settings as any).exerciseTransitionSeconds)
        ? Math.max(0, Math.min(60, Math.round((settings as any).exerciseTransitionSeconds)))
        : 15
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleSelectColor = async (color: string) => {
    setBackgroundColor(color);
    await updateSettings({ appBackgroundColor: color });
  };

  const isLightBackground = isLightColor(backgroundColor);
  const statusBarStyle = isLightBackground ? 'dark' : 'light';
  
  const textColorOnLight = '#111827';
  const subtextColorOnLight = '#4b5563';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, isLightBackground && { borderBottomColor: '#e5e7eb' }]}>
        <Text
          style={[
            styles.title,
            isLightBackground && { color: textColorOnLight },
          ]}>
          Einstellungen
        </Text>
      </View>

      <View style={styles.section}>
        
        {/* Hintergrund Auswahl */}
        <View style={styles.entryRow}>
          <View style={styles.entryTextContainer}>
            <Text
              style={[
                styles.sectionTitle,
                isLightBackground && { color: textColorOnLight },
              ]}>
              Hintergrund
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                isLightBackground && { color: subtextColorOnLight },
              ]}>
              Wähle dein bevorzugtes Design.
            </Text>
          </View>
          <View style={styles.entryRight}>
            {BACKGROUND_OPTIONS.map((option) => (
              <Pressable
                key={option.color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: option.color },
                  backgroundColor.toLowerCase() === option.color.toLowerCase() && styles.colorCircleSelected,
                  // Umrandung für den hellen Kreis auf hellem Hintergrund
                  isLightBackground && option.color === '#DBEAFE' && { borderColor: '#d1d5db' },
                  // Umrandung für den dunklen Kreis auf dunklem Hintergrund
                  !isLightBackground && option.color === '#2a2a2a' && { borderColor: '#333333' }
                ]}
                onPress={() => handleSelectColor(option.color)}
              />
            ))}
          </View>
        </View>

        {/* Signalton Toggle */}
        <Pressable
          style={styles.entryRow}
          onPress={async () => {
            const next = !enableBeep;
            setEnableBeep(next);
            await updateSettings({ enableBeep: next });
          }}>
          <View style={styles.entryTextContainer}>
            <Text
              style={[
                styles.sectionTitle,
                isLightBackground && { color: textColorOnLight },
              ]}>
              Signalton beim Training
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                isLightBackground && { color: subtextColorOnLight },
              ]}>
              Akustische Signale (Beeps & Ansagen) ein- oder ausschalten.
            </Text>
          </View>
          <View style={styles.entryRight}>
            <Text
              style={[
                styles.reminderStatus,
                isLightBackground && { color: subtextColorOnLight },
              ]}>
              {enableBeep ? 'An' : 'Aus'}
            </Text>
          </View>
        </Pressable>

        {/* Übergangsdauer */}
        <View style={styles.entryRow}>
          <View style={styles.entryTextContainer}>
            <Text
              style={[
                styles.sectionTitle,
                isLightBackground && { color: textColorOnLight },
              ]}>
              Übergang zwischen Übungen
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                isLightBackground && { color: subtextColorOnLight },
              ]}>
              Dauer der „Get Ready“-Phase zwischen zwei Übungen.
            </Text>
          </View>
          <View style={styles.entryRight}>
            <Pressable
              style={[styles.stepButton, isLightBackground && { backgroundColor: '#e5e7eb', borderColor: '#d1d5db' }]}
              onPress={async () => {
                const next = Math.max(0, exerciseTransitionSeconds - 5);
                setExerciseTransitionSeconds(next);
                await updateSettings({ exerciseTransitionSeconds: next } as any);
              }}>
              <Text style={[styles.stepButtonText, isLightBackground && { color: textColorOnLight }]}>−</Text>
            </Pressable>
            <Text
              style={[
                styles.reminderStatus,
                isLightBackground && { color: subtextColorOnLight },
              ]}>
              {exerciseTransitionSeconds}s
            </Text>
            <Pressable
              style={[styles.stepButton, isLightBackground && { backgroundColor: '#e5e7eb', borderColor: '#d1d5db' }]}
              onPress={async () => {
                const next = Math.min(60, exerciseTransitionSeconds + 5);
                setExerciseTransitionSeconds(next);
                await updateSettings({ exerciseTransitionSeconds: next } as any);
              }}>
              <Text style={[styles.stepButtonText, isLightBackground && { color: textColorOnLight }]}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 12,
  },
  entryTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#aaaaaa',
    marginBottom: 4,
  },
  reminderStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 18,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent', // Standardmäßig transparent, wird dynamisch überschrieben
    marginHorizontal: 4,
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#4ade80', // Grüner Rand für ausgewählten Modus
    width: 36, // Etwas größer
    height: 36,
    borderRadius: 18,
  }
});
