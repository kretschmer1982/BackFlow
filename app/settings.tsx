import { APP_THEME_COLORS, BACKGROUND_OPTIONS, isLightColor } from '@/constants/theme';
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

export default function SettingsScreen() {
  const router = useRouter();
  const [backgroundColor, setBackgroundColor] = useState<string>(APP_THEME_COLORS.dark.background);
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
  const lightTextColor = APP_THEME_COLORS.light.text;
  const lightSubtextColor = APP_THEME_COLORS.light.subtext;
  const lightBorderColor = APP_THEME_COLORS.light.borderColor;
  const darkBorderColor = APP_THEME_COLORS.dark.borderColor;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={statusBarStyle} />
      <View style={[styles.header, isLightBackground && { borderBottomColor: lightBorderColor }]}>
        <Text
          style={[
            styles.title,
            isLightBackground && { color: lightTextColor },
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
                isLightBackground && { color: lightTextColor },
              ]}>
              Hintergrund
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                isLightBackground && { color: lightSubtextColor },
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
                  // Umrandung für den hellen Kreis auf hellem Hintergrund (Text-Farbe für Kontrast)
                  isLightBackground && option.color === APP_THEME_COLORS.light.background && { borderColor: lightSubtextColor },
                  // Umrandung für den dunklen Kreis auf dunklem Hintergrund
                  !isLightBackground && option.color === APP_THEME_COLORS.dark.background && { borderColor: APP_THEME_COLORS.dark.subtext }
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
                isLightBackground && { color: lightTextColor },
              ]}>
              Signalton beim Training
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                isLightBackground && { color: lightSubtextColor },
              ]}>
              Akustische Signale (Beeps & Ansagen) ein- oder ausschalten.
            </Text>
          </View>
          <View style={styles.entryRight}>
            <Text
              style={[
                styles.reminderStatus,
                isLightBackground && { color: lightSubtextColor },
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
                isLightBackground && { color: lightTextColor },
              ]}>
              Übergang zwischen Übungen
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                isLightBackground && { color: lightSubtextColor },
              ]}>
              Dauer der „Get Ready“-Phase zwischen zwei Übungen.
            </Text>
          </View>
          <View style={styles.entryRight}>
            <Pressable
              style={[
                styles.stepButton,
                isLightBackground && {
                  backgroundColor: APP_THEME_COLORS.light.buttonBackground,
                  borderColor: lightBorderColor,
                },
              ]}
              onPress={async () => {
                const next = Math.max(0, exerciseTransitionSeconds - 5);
                setExerciseTransitionSeconds(next);
                await updateSettings({ exerciseTransitionSeconds: next } as any);
              }}>
              <Text style={[styles.stepButtonText, isLightBackground && { color: lightTextColor }]}>−</Text>
            </Pressable>
            <Text
              style={[
                styles.reminderStatus,
                isLightBackground && { color: lightSubtextColor },
              ]}>
              {exerciseTransitionSeconds}s
            </Text>
            <Pressable
              style={[
                styles.stepButton,
                isLightBackground && {
                  backgroundColor: APP_THEME_COLORS.light.buttonBackground,
                  borderColor: lightBorderColor,
                },
              ]}
              onPress={async () => {
                const next = Math.min(60, exerciseTransitionSeconds + 5);
                setExerciseTransitionSeconds(next);
                await updateSettings({ exerciseTransitionSeconds: next } as any);
              }}>
              <Text style={[styles.stepButtonText, isLightBackground && { color: lightTextColor }]}>+</Text>
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
    borderBottomColor: APP_THEME_COLORS.dark.borderColor,
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
    color: APP_THEME_COLORS.dark.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: APP_THEME_COLORS.dark.subtext,
    marginBottom: 4,
  },
  reminderStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_THEME_COLORS.dark.subtext,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: APP_THEME_COLORS.dark.buttonBackground,
    borderWidth: 1,
    borderColor: APP_THEME_COLORS.dark.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    color: APP_THEME_COLORS.dark.text,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 18,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3, // Dickerer Rand für bessere Sichtbarkeit
    borderColor: 'transparent',
    marginHorizontal: 4,
  },
  colorCircleSelected: {
    borderWidth: 4, // Noch dicker für Auswahl
    borderColor: APP_THEME_COLORS.dark.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
  }
});
