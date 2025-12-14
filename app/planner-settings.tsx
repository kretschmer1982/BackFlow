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
import { useCallback, useMemo, useState } from 'react';
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
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderEnablePending, setReminderEnablePending] = useState(false);

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

    if (value) {
      // erst Modal zeigen, damit es auf den Screen passt
      setReminderEnablePending(true);
      setReminderEnabled(true);
      setReminderModalVisible(true);
      return;
    }

    await updateSettings({ trainingReminderEnabled: false });
    setReminderEnabled(false);
    setReminderEnablePending(false);
    setReminderModalVisible(false);
    try {
      await rescheduleTrainingReminders();
    } catch {
      // ignore
    }
  };

  const handleSelectReminderTime = async (time: TrainingReminderTimeOfDay) => {
    await updateSettings({ trainingReminderTimeOfDay: time, trainingReminderEnabled: true });
    setReminderTime(time);
    setReminderEnabled(true);
    setReminderEnablePending(false);
    setReminderModalVisible(false);
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

  const closeReminderModal = async () => {
    setReminderModalVisible(false);
    if (reminderEnablePending) {
      // user cancelled without choosing → keep disabled
      setReminderEnablePending(false);
      setReminderEnabled(false);
      await updateSettings({ trainingReminderEnabled: false });
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
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>{'< Zurück'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.saveHeaderButton} activeOpacity={0.85}>
            <Text style={styles.saveHeaderButtonText}>Speichern</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Wochenplan</Text>
      </View>

      <View style={styles.content}>
        {/* Oben: Wochentage */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Wochentage</Text>

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
              {reminderEnabled && (
                <Text style={styles.sectionHint}>Zeit: {humanTimeLabel(reminderTime)}</Text>
              )}
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: '#3a3a3a', true: '#4ade80' }}
              thumbColor={'#ffffff'}
            />
          </View>
        </View>
      </View>

      {renderWorkoutPicker()}

      {/* Reminder-Time Auswahl als Modal (nur wenn Toggle aktiviert wird) */}
      <Modal visible={reminderModalVisible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={closeReminderModal}>
          <View style={styles.reminderModal}>
            <Text style={styles.pickerTitle}>Erinnerung um…</Text>
            <Text style={styles.pickerEmpty}>Wähle einen Zeitpunkt für Trainings-Erinnerungen.</Text>

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

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeReminderModal} activeOpacity={0.85}>
                <Text style={styles.cancelBtnText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => handleSelectReminderTime(reminderTime)}
                activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>Übernehmen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { paddingVertical: 8, paddingHorizontal: 4 },
  backButtonText: { color: '#4ade80', fontSize: 16, fontWeight: '700' },
  saveHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333333',
  },
  saveHeaderButtonText: { color: '#4ade80', fontSize: 14, fontWeight: '800' },
  title: { color: '#ffffff', fontSize: 20, fontWeight: '900', marginTop: 4 },

  content: { flex: 1, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 12, gap: 10 },

  section: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    backgroundColor: '#151515',
    padding: 12,
  },
  sectionHeader: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  sectionHint: { color: '#aaaaaa', fontSize: 12, marginTop: 4 },

  dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, minHeight: 38 },
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
  reminderTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800' },

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

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 30 },
  pickerContainer: { backgroundColor: '#2a2a2a', borderRadius: 16, padding: 18, maxHeight: '70%' },
  pickerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  pickerEmpty: { color: '#aaaaaa', textAlign: 'center', marginVertical: 12 },
  pickerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#3a3a3a' },
  pickerItemText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },

  reminderModal: { backgroundColor: '#2a2a2a', borderRadius: 16, padding: 18, maxHeight: '70%' },
});

