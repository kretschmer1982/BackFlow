import { APP_THEME_COLORS, isLightColor } from '@/constants/theme';
import { Workout } from '@/types/interfaces';
import {
  ensureNotificationPermissions,
  rescheduleTrainingReminders,
} from '@/utils/notifications';
import {
  PlannerSettings,
  TrainingReminderTimeOfDay,
  deletePlannedWorkout,
  getPlannedWorkouts,
  getPlannerSettings,
  getSettings,
  getWorkouts,
  savePlannedWorkout,
  updatePlannerSettings,
  updateSettings,
} from '@/utils/storage';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mo..So

const toLocalDateKey = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const toUtcDateKey = (d: Date) => d.toISOString().slice(0, 10);

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
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

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

  const isLightTheme = useMemo(() => isLightColor(backgroundColor), [backgroundColor]);
  const theme = isLightTheme ? APP_THEME_COLORS.light : APP_THEME_COLORS.dark;
  const textColor = theme.text;
  const subtextColor = theme.subtext;
  const cardBg = theme.cardBackground;
  const borderColor = theme.borderColor;
  const accentColor = theme.accent;
  const overlayBg = isLightTheme ? 'rgba(0,0,0,0.48)' : 'rgba(0,0,0,0.72)';

  const clearConflictingOverridesForWeekday = useCallback(
    async (weekday: number) => {
      // Wenn es gespeicherte Overrides gibt, die den Wochenplan blockieren,
      // räumen wir sie auf:
      // - Pause-Overrides: '' (oder null/undefined aus alten Bugs)
      // - ungültige Workout-IDs (Workout wurde gelöscht)
      const planned = await getPlannedWorkouts();
      const validWorkoutIds = new Set(workouts.map((w) => w.id));
      const now = new Date();
      const horizonDays = 120;

      const deletes: string[] = [];
      for (let i = 0; i < horizonDays; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        if (d.getDay() !== weekday) continue;

        const localKey = toLocalDateKey(d);
        const utcKey = toUtcDateKey(d);

        const localVal: any = planned[localKey];
        const utcVal: any = planned[utcKey];

      const isInvalidValue = (v: any) =>
        v === '' ||
        v === null ||
        v === undefined ||
        (typeof v === 'string' && v !== '' && !validWorkoutIds.has(v)) ||
        (typeof v === 'object' && v && typeof v.workoutId === 'string' && v.workoutId !== '' && !validWorkoutIds.has(v.workoutId));

        // single values
        if (localVal !== undefined && !Array.isArray(localVal) && isInvalidValue(localVal)) deletes.push(localKey);
        if (utcVal !== undefined && !Array.isArray(utcVal) && isInvalidValue(utcVal)) deletes.push(utcKey);

        // arrays: filter invalid entries; if empty -> delete key, else write back
        const filterArray = (arr: any[]) => arr.filter((x) => !isInvalidValue(x));

        if (Array.isArray(localVal)) {
          const next = filterArray(localVal);
          if (next.length === 0) deletes.push(localKey);
          else if (next.length !== localVal.length) {
            // write back filtered
            await savePlannedWorkout(localKey, next);
          }
        }
        if (Array.isArray(utcVal)) {
          const next = filterArray(utcVal);
          if (next.length === 0) deletes.push(utcKey);
          else if (next.length !== utcVal.length) {
            await savePlannedWorkout(utcKey, next);
          }
        }
      }

      const unique = Array.from(new Set(deletes));
      await Promise.all(unique.map((k) => deletePlannedWorkout(k)));
    },
    [workouts]
  );

  const toggleDay = async (dayIndex: number, value: boolean) => {
    if (value && workouts.length === 0) {
      Alert.alert('Keine Workouts', 'Bitte erst ein Workout anlegen, bevor du Standard-Trainingstage setzt.');
      return;
    }

    const currentIds = Array.isArray(schedule[dayIndex]) ? schedule[dayIndex] : [];
    const nextIds = value ? (currentIds.length > 0 ? currentIds : workouts[0]?.id ? [workouts[0].id] : []) : [];
    setSchedule((prev) => ({ ...prev, [dayIndex]: nextIds }));

    // Auto-Save (damit es sofort im Planner sichtbar ist)
    await updatePlannerSettings({ defaultSchedule: { [dayIndex]: nextIds } as any });
    if (value && nextIds.length > 0) {
      await clearConflictingOverridesForWeekday(dayIndex);
    }
    try {
      if (reminderEnabled) {
        await rescheduleTrainingReminders();
      }
    } catch {
      // ignore
    }
  };

  const openMultiPicker = (dayIndex: number) => {
    const current = Array.isArray(schedule[dayIndex]) ? schedule[dayIndex] : [];
    setTempSelectedIds(current);
    setSelectingDay(dayIndex);
  };

  const applyMultiPicker = async () => {
    if (selectingDay === null) return;
    const dayIndex = selectingDay;
    const nextIds = tempSelectedIds.slice(0, 3);
    setSchedule((prev) => ({ ...prev, [dayIndex]: nextIds }));
    setSelectingDay(null);

    await updatePlannerSettings({ defaultSchedule: { [dayIndex]: nextIds } as any });
    if (nextIds.length > 0) {
      await clearConflictingOverridesForWeekday(dayIndex);
    }
    try {
      if (reminderEnabled) {
        await rescheduleTrainingReminders();
      }
    } catch {
      // ignore
    }
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
      if (next[d] === undefined || !Array.isArray(next[d])) next[d] = [];
      next[d] = next[d].filter((x) => typeof x === 'string' && x.trim() !== '').slice(0, 3);
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
        <Pressable style={[styles.overlay, { backgroundColor: overlayBg }]} onPress={() => setSelectingDay(null)}>
          <View style={[styles.pickerContainer, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.pickerTitle, { color: textColor }]}>Workouts wählen (max. 3)</Text>
            {workouts.length === 0 ? (
              <Text style={[styles.pickerEmpty, { color: subtextColor }]}>Keine Workouts vorhanden.</Text>
            ) : (
              <FlatList
                data={workouts}
                keyExtractor={(w) => w.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      { borderBottomColor: borderColor },
                      tempSelectedIds.includes(item.id) && { backgroundColor: accentColor + '20' },
                    ]}
                    onPress={() => {
                      setTempSelectedIds((prev) => {
                        const has = prev.includes(item.id);
                        if (has) return prev.filter((x) => x !== item.id);
                        if (prev.length >= 3) return prev; // limit
                        return [...prev, item.id];
                      });
                    }}>
                    <Text style={[styles.pickerItemText, { color: textColor }]}>
                      {tempSelectedIds.includes(item.id) ? '✓ ' : ''}
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { flex: 1, backgroundColor: cardBg, borderColor },
                ]}
                onPress={() => setSelectingDay(null)}
                activeOpacity={0.85}>
                <Text style={[styles.cancelBtnText, { color: textColor }]}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { flex: 1, backgroundColor: accentColor, borderColor: accentColor },
                ]}
                onPress={applyMultiPicker}
                activeOpacity={0.85}>
                <Text style={[styles.saveBtnText, { color: '#111827' }]}>Übernehmen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isLightTheme ? 'dark' : 'light'} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveHeaderButton, { backgroundColor: cardBg, borderColor }]}
            activeOpacity={0.85}>
            <Text style={[styles.saveHeaderButtonText, { color: accentColor }]}>Speichern</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: textColor }]}>Wochenplan</Text>
      </View>

      <View style={styles.content}>
        {/* Oben: Wochentage */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionHeader, { color: textColor }]}>Wochentage</Text>

          {DISPLAY_ORDER.map((dayIndex) => {
            const ids = normalizedSchedule[dayIndex] || [];
            const enabled = ids.length > 0;
            const selectedNames = ids
              .map((id) => workouts.find((w) => w.id === id)?.name)
              .filter(Boolean) as string[];

            return (
            <View key={dayIndex} style={styles.dayRow}>
                <Text style={[styles.dayLabel, { color: textColor }]}>{DAYS[dayIndex]}</Text>
                <Switch
                  value={enabled}
                  onValueChange={(val) => void toggleDay(dayIndex, val)}
                  trackColor={{ false: borderColor, true: accentColor }}
                  thumbColor={'#ffffff'}
                />
                <TouchableOpacity
                  style={[
                    styles.workoutSelect,
                    { backgroundColor: cardBg, borderColor },
                    !enabled && styles.workoutSelectDisabled,
                  ]}
                  disabled={!enabled}
                  onPress={() => openMultiPicker(dayIndex)}
                  activeOpacity={0.85}>
                  <Text style={[styles.workoutSelectText, { color: subtextColor }]} numberOfLines={1}>
                    {selectedNames.length > 0
                      ? selectedNames.join(', ')
                      : workouts.length > 0
                        ? 'Workouts wählen'
                        : 'Keine Workouts'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Darunter: Erinnerungen */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionHeader, { color: textColor }]}>Trainings-Erinnerungen</Text>
          <View style={styles.reminderRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.reminderTitle, { color: textColor }]}>Erinnerungen aktivieren</Text>
              {reminderEnabled && (
                <Text style={[styles.sectionHint, { color: subtextColor }]}>
                  Zeit: {humanTimeLabel(reminderTime)}
                </Text>
              )}
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: borderColor, true: accentColor }}
              thumbColor={'#ffffff'}
            />
          </View>
        </View>
      </View>

      {renderWorkoutPicker()}

      {/* Reminder-Time Auswahl als Modal (nur wenn Toggle aktiviert wird) */}
      <Modal visible={reminderModalVisible} transparent animationType="fade">
        <Pressable style={[styles.overlay, { backgroundColor: overlayBg }]} onPress={closeReminderModal}>
          <View style={[styles.reminderModal, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.pickerTitle, { color: textColor }]}>Erinnerung um…</Text>
            <Text style={[styles.pickerEmpty, { color: subtextColor }]}>
              Wähle einen Zeitpunkt für Trainings-Erinnerungen.
            </Text>

            <View style={styles.timeRow}>
              {(['morning', 'noon', 'evening'] as TrainingReminderTimeOfDay[]).map((t) => {
                const selected = reminderTime === t;
                return (
                  <Pressable
                    key={t}
                    style={[
                      styles.timeChip,
                      { borderColor },
                      selected && { backgroundColor: accentColor, borderColor: accentColor },
                    ]}
                    onPress={() => handleSelectReminderTime(t)}>
                    <Text
                      style={[
                        styles.timeChipText,
                        { color: selected ? '#111827' : subtextColor },
                      ]}>
                      {humanTimeLabel(t)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.cancelBtn, { flex: 1, backgroundColor: cardBg, borderColor }]}
                onPress={closeReminderModal}
                activeOpacity={0.85}>
                <Text style={[styles.cancelBtnText, { color: textColor }]}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { flex: 1, backgroundColor: accentColor, borderColor: accentColor },
                ]}
                onPress={() => handleSelectReminderTime(reminderTime)}
                activeOpacity={0.85}>
                <Text style={[styles.saveBtnText, { color: '#111827' }]}>Übernehmen</Text>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  saveHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  saveHeaderButtonText: { fontSize: 14, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '900', marginTop: 4 },

  content: { flex: 1, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 12, gap: 10 },

  section: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  sectionHeader: { fontSize: 15, fontWeight: '800' },
  sectionHint: { fontSize: 12, marginTop: 4 },

  dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, minHeight: 38 },
  dayLabel: { width: 34, fontSize: 16, fontWeight: '800' },
  workoutSelect: {
    flex: 1,
    marginLeft: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  workoutSelectDisabled: { opacity: 0.45 },
  workoutSelectText: { fontSize: 14, fontWeight: '600' },

  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  reminderTitle: { fontSize: 14, fontWeight: '800' },

  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  timeChipSelected: {},
  timeChipText: { fontSize: 12, fontWeight: '700' },
  timeChipTextSelected: {},

  overlay: { flex: 1, justifyContent: 'center', padding: 30 },
  pickerContainer: { borderRadius: 16, padding: 18, maxHeight: '70%', borderWidth: 1 },
  pickerTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  pickerEmpty: { textAlign: 'center', marginVertical: 12 },
  pickerItem: { paddingVertical: 14, borderBottomWidth: 1 },
  pickerItemText: { fontSize: 16, fontWeight: '600' },

  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '800' },

  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '900' },

  reminderModal: { borderRadius: 16, padding: 18, maxHeight: '70%', borderWidth: 1 },
});





