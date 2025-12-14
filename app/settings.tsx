import { getSettings, updateSettings } from '@/utils/storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [enableBeep, setEnableBeep] = useState<boolean>(true);

  const loadSettings = useCallback(async () => {
    const settings = await getSettings();
    setBackgroundColor(settings.appBackgroundColor);
    setEnableBeep(
      typeof settings.enableBeep === 'boolean' ? settings.enableBeep : true
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const isLightBackground = isLightColor(backgroundColor);
  const statusBarStyle = isLightBackground ? 'dark' : 'light';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={statusBarStyle} />
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            isLightBackground && styles.titleOnLight,
          ]}>
          Einstellungen
        </Text>
      </View>

      <View style={styles.section}>
        <Pressable
          style={styles.entryRow}
          onPress={() => router.push('/settings/background')}>
          <View style={styles.entryTextContainer}>
            <Text
              style={[
                styles.sectionTitle,
                isLightBackground && styles.sectionTitleOnLight,
              ]}>
              Hintergrund
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                isLightBackground && styles.sectionSubtitleOnLight,
              ]}>
              Lege die Hintergrundfarbe für die gesamte App fest.
            </Text>
          </View>
          <View style={styles.entryRight}>
            <View style={[styles.previewDot, { backgroundColor }]} />
          </View>
        </Pressable>

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
                isLightBackground && styles.sectionTitleOnLight,
              ]}>
              Signalton beim Training
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                isLightBackground && styles.sectionSubtitleOnLight,
              ]}>
              Piepton bei Countdown und Phasenwechsel ein- oder ausschalten.
            </Text>
          </View>
          <View style={styles.entryRight}>
            <Text
              style={[
                styles.reminderStatus,
                isLightBackground && styles.reminderStatusOnLight,
              ]}>
              {enableBeep ? 'An' : 'Aus'}
            </Text>
          </View>
        </Pressable>
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
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4ade80',
    fontWeight: '600',
  },
  backButtonTextOnLight: {
    color: '#15803d',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  titleOnLight: {
    color: '#111827',
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
  sectionTitleOnLight: {
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#aaaaaa',
    marginBottom: 4,
  },
  sectionSubtitleOnLight: {
    color: '#4b5563',
  },
  previewDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111827',
  },
  reminderStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  reminderStatusOnLight: {
    color: '#4b5563',
  },
});


