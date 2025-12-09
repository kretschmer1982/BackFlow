import { getSettings, updateSettings } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Pressable,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';

const DAYS = [
  { key: 'mon', label: 'Mo' },
  { key: 'tue', label: 'Di' },
  { key: 'wed', label: 'Mi' },
  { key: 'thu', label: 'Do' },
  { key: 'fri', label: 'Fr' },
  { key: 'sat', label: 'Sa' },
  { key: 'sun', label: 'So' },
];

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

export default function ReminderSettingsScreen() {
  const router = useRouter();
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [enableReminders, setEnableReminders] = useState<boolean>(false);
  const [reminderDays, setReminderDays] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const settings = await getSettings();
      setBackgroundColor(settings.appBackgroundColor);
      setEnableReminders(settings.enableReminders);
      setReminderDays(settings.reminderDays || []);
    };
    load();
  }, []);

  const handleToggleReminders = async (value: boolean) => {
    setEnableReminders(value);
    const newDays = value ? reminderDays : [];
    if (!value) {
      setReminderDays([]);
    }
    await updateSettings({
      enableReminders: value,
      reminderDays: newDays,
    });
  };

  const toggleDay = async (dayKey: string) => {
    const isSelected = reminderDays.includes(dayKey);
    let nextDays: string[];
    if (isSelected) {
      nextDays = reminderDays.filter((d) => d !== dayKey);
    } else {
      nextDays = [...reminderDays, dayKey];
    }
    setReminderDays(nextDays);
    await updateSettings({
      enableReminders: true,
      reminderDays: nextDays,
    });
    setEnableReminders(true);
  };

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
          Erinnerungen
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextContainer}>
            <Text
              style={[
                styles.sectionTitle,
                isLightBackground && styles.sectionTitleOnLight,
              ]}>
              Trainings-Erinnerungen
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                isLightBackground && styles.sectionSubtitleOnLight,
              ]}>
              Sende mir Erinnerungen an Trainingstagen.
            </Text>
          </View>
          <Switch
            value={enableReminders}
            onValueChange={handleToggleReminders}
            thumbColor={enableReminders ? '#4ade80' : '#f4f3f4'}
            trackColor={{ false: '#4b5563', true: '#15803d' }}
          />
        </View>

        {enableReminders && (
          <View style={styles.daysSection}>
            <Text
              style={[
                styles.daysTitle,
                isLightBackground && styles.daysTitleOnLight,
              ]}>
              Tage auswählen
            </Text>
            <View style={styles.daysRow}>
              {DAYS.map((day) => {
                const selected = reminderDays.includes(day.key);
                return (
                  <Pressable
                    key={day.key}
                    style={[
                      styles.dayChip,
                      selected && styles.dayChipSelected,
                    ]}
                    onPress={() => toggleDay(day.key)}>
                    <Text
                      style={[
                        styles.dayChipText,
                        selected && styles.dayChipTextSelected,
                      ]}>
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={styles.testButton}
              onPress={() => {
                // Platzhalter: in Expo Go funktionieren Push-Benachrichtigungen nicht.
                // Dieser Button wird in einem Development Build echte Benachrichtigungen auslösen.
                alert('Test-Benachrichtigung wird im Development Build funktionieren.');
              }}>
              <Text style={styles.testButtonText}>Test-Benachrichtigung senden</Text>
            </Pressable>
          </View>
        )}
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: 12,
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
  },
  sectionSubtitleOnLight: {
    color: '#4b5563',
  },
  daysSection: {
    marginTop: 8,
  },
  daysTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  daysTitleOnLight: {
    color: '#111827',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4b5563',
    backgroundColor: 'transparent',
  },
  dayChipSelected: {
    backgroundColor: '#4ade80',
    borderColor: '#22c55e',
  },
  dayChipText: {
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  dayChipTextSelected: {
    color: '#111827',
  },
  testButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#4ade80',
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});


