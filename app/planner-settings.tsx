import { Workout } from '@/types/interfaces';
import {
  ensureNotificationPermissions,
  rescheduleTrainingReminders,
  scheduleTestReminderInSeconds,
} from '@/utils/notifications';
import {
  PlannerSettings,
  TrainingReminderTimeOfDay,
  getPlannerSettings,
  getSettings,
  getWorkouts,
  updatePlannerSettings,
  updateSettings,
} from '@/utils/storage';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mo..So

function humanTimeLabel(t: TrainingReminderTimeOfDay) {
  switch (t) {
    case 'morning':
      return 'morgens (7:00)';
    case 'noon':
      return 'mittags (12:00)';
    case 'evening':
      return 'abends (17:00)';
  }
}

export default function PlannerSettingsScreen() {
  const router = useRouter();
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const [schedule, setSchedule] = useState<PlannerSettings['defaultSchedule']>({});
  const [selectingDay, setSelectingDay] = useState<number | null>(null);

  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<TrainingReminderTimeOfDay>('morning');

  const load = useCallback(async () => {
    const settings = await getSettings();
    setBackgroundColor(settings.appBackgroundColor);
    setReminderEnabled(!!settings.trainingReminderEnabled);
    setReminderTime(settings.trainingReminderTimeOfDay || 'morning');

    const w = await getWorkouts();
    setWorkouts(w);

    const ps = await getPlannerSettings();
    setSchedule(ps.defaultSchedule);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleDay = (dayIndex: number, value: boolean) => {
    setSchedule((prev) => {
      const next = { ...prev };
      if (!value) {
        next[dayIndex] = null;
        return next;
      }
      // enabled
      if (!next[dayIndex]) {
        next[dayIndex] = workouts.length > 0 ? workouts[0].id : null;
      }
      return next;
    });
  };

  const selectWorkout = (dayIndex: number, workoutId: string) => {
    setSchedule((prev) => ({ ...prev, [dayIndex]: workoutId }));
    setSelectingDay(null);
  };

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      const granted = await ensureNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Benachrichtigungen deaktiviert',
          'Bitte erlaube Benachrichtigungen in den System-Einstellungen, um Trainings-Erinnerungen zu erhalten.'
        );
        await updateSettings({ trainingReminderEnabled: false });
        setReminderEnabled(false);
        return;
      }
    }

    await updateSettings({ trainingReminderEnabled: value });
    setReminderEnabled(value);
    try {
      await rescheduleTrainingReminders();
    } catch {
      Alert.alert(
        'Hinweis',
        Constants.appOwnership === 'expo'
          ? 'In Expo Go sind Benachrichtigungen auf Android nur eingeschränkt testbar. Für einen zuverlässigen Test bitte einen Development Build nutzen.'
          : 'Benachrichtigungen konnten nicht geplant werden.'
      );
    }
  };

  const handleSelectReminderTime = async (time: TrainingReminderTimeOfDay) => {
    await updateSettings({ trainingReminderTimeOfDay: time, trainingReminderEnabled: true });
    setReminderTime(time);
    setReminderEnabled(true);
    try {
      await rescheduleTrainingReminders();
    } catch {
      Alert.alert(
        'Hinweis',
        Constants.appOwnership === 'expo'
          ? 'In Expo Go sind Benachrichtigungen auf Android nur eingeschränkt testbar. Für einen zuverlässigen Test bitte einen Development Build nutzen.'
          : 'Benachrichtigungen konnten nicht geplant werden.'
      );
    }
  };

  const normalizedSchedule = useMemo(() => {
    const next: PlannerSettings['defaultSchedule'] = { ...schedule };
    for (let d = 0; d <= 6; d++) {
      if (next[d] === undefined) next[d] = null;
    }
    return next;
  }, [schedule]);

  const handleSave = async () => {
    await updatePlannerSettings({ defaultSchedule: normalizedSchedule });
    try {
      await rescheduleTrainingReminders();
    } catch {
      // ignore
    }
    router.back();
  };

  const renderWorkoutPicker = () => {
    if (selectingDay === null) return null;
    return (
      <Modal visible={true} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setSelectingDay(null)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Workout wählen</Text>
            {workouts.length === 0 ? (
              <Text style={styles.pickerEmpty}>Keine Workouts vorhanden.</Text>
            ) : (
              <FlatList
                data={workouts}
                keyExtractor={(w) => w.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => selectWorkout(selectingDay, item.id)}>
                    <Text style={styles.pickerItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>{'< Zurück'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Wochenplan</Text>
        <Text style={styles.subtitle}>Wochentage & Trainings-Erinnerungen</Text>
      </View>

      <View style={styles.content}>
        {/* Oben: Wochentage */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Wochentage</Text>
          <Text style={styles.sectionHint}>Wähle pro Tag ein Standard-Workout.</Text>

          {DISPLAY_ORDER.map((dayIndex) => {
            const workoutId = normalizedSchedule[dayIndex];
            const enabled = !!workoutId;
            const selected = workouts.find((w) => w.id === workoutId);

            return (
              <View key={dayIndex} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{DAYS[dayIndex]}</Text>
                <Switch
                  value={enabled}
                  onValueChange={(val) => toggleDay(dayIndex, val)}
                  trackColor={{ false: '#3a3a3a', true: '#4ade80' }}
                  thumbColor={'#ffffff'}
                />
                <TouchableOpacity
                  style={[styles.workoutSelect, !enabled && styles.workoutSelectDisabled]}
                  disabled={!enabled}
                  onPress={() => setSelectingDay(dayIndex)}
                  activeOpacity={0.85}>
                  <Text style={styles.workoutSelectText} numberOfLines={1}>
                    {selected ? selected.name : workouts.length > 0 ? 'Workout wählen' : 'Keine Workouts'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Darunter: Erinnerungen */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Trainings-Erinnerungen</Text>
          <View style={styles.reminderRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.reminderTitle}>Erinnerungen aktivieren</Text>
              <Text style={styles.sectionHint}>
                Erinnerung nur an Tagen mit geplantem Training (Kalender oder Wochenplan).
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: '#3a3a3a', true: '#4ade80' }}
              thumbColor={'#ffffff'}
            />
          </View>

          <View style={styles.timeRow}>
            {(['morning', 'noon', 'evening'] as TrainingReminderTimeOfDay[]).map((t) => {
              const selected = reminderTime === t;
              return (
                <Pressable
                  key={t}
                  style={[styles.timeChip, selected && styles.timeChipSelected]}
                  onPress={() => handleSelectReminderTime(t)}>
                  <Text style={[styles.timeChipText, selected && styles.timeChipTextSelected]}>
                    {humanTimeLabel(t)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              try {
                await scheduleTestReminderInSeconds(10);
              } catch {
                Alert.alert(
                  'Hinweis',
                  Constants.appOwnership === 'expo'
                    ? 'In Expo Go sind Benachrichtigungen auf Android nur eingeschränkt testbar. Für einen zuverlässigen Test bitte einen Development Build nutzen.'
                    : 'Test-Benachrichtigung konnte nicht gesendet werden.'
                );
              }
            }}
            activeOpacity={0.85}>
            <Text style={styles.testButtonText}>Test-Benachrichtigung (10s)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderWorkoutPicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  backButton: { paddingVertical: 8, paddingHorizontal: 4, alignSelf: 'flex-start' },
  backButtonText: { color: '#4ade80', fontSize: 16, fontWeight: '700' },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  subtitle: { color: '#aaaaaa', fontSize: 13, marginTop: 2 },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16, gap: 12 },

  section: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    backgroundColor: '#151515',
    padding: 12,
  },
  sectionHeader: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  sectionHint: { color: '#aaaaaa', fontSize: 12, marginTop: 4, marginBottom: 8 },

  dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, minHeight: 40 },
  dayLabel: { width: 34, color: '#ffffff', fontSize: 16, fontWeight: '800' },
  workoutSelect: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333333',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  workoutSelectDisabled: { opacity: 0.45 },
  workoutSelectText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },

  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  reminderTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4b5563',
    backgroundColor: 'transparent',
  },
  timeChipSelected: { backgroundColor: '#4ade80', borderColor: '#22c55e' },
  timeChipText: { fontSize: 12, color: '#e5e7eb', fontWeight: '700' },
  timeChipTextSelected: { color: '#111827' },

  testButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  testButtonText: { color: '#4ade80', fontSize: 13, fontWeight: '800' },

  footer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#4ade80', alignItems: 'center' },
  saveBtnText: { color: '#111827', fontSize: 15, fontWeight: '900' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 30 },
  pickerContainer: { backgroundColor: '#2a2a2a', borderRadius: 16, padding: 18, maxHeight: '70%' },
  pickerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  pickerEmpty: { color: '#aaaaaa', textAlign: 'center', marginVertical: 12 },
  pickerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#3a3a3a' },
  pickerItemText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});

