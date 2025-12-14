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
    updatePlannerSettings,
    updateSettings,
} from '@/utils/storage';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PlannerSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  workouts: Workout[];
  onUpdate: () => void;
}

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// Display order: Mo(1), Di(2), ..., Sa(6), So(0)
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function PlannerSettingsModal({
  visible,
  onClose,
  workouts,
  onUpdate,
}: PlannerSettingsModalProps) {
  const [schedule, setSchedule] = useState<PlannerSettings['defaultSchedule']>({});
  const [selectingDay, setSelectingDay] = useState<number | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<TrainingReminderTimeOfDay>('morning');

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    const settings = await getPlannerSettings();
    setSchedule(settings.defaultSchedule);

    const appSettings = await getSettings();
    setReminderEnabled(!!appSettings.trainingReminderEnabled);
    setReminderTime(appSettings.trainingReminderTimeOfDay || 'morning');
  };

  const handleSave = async () => {
    await updatePlannerSettings({ defaultSchedule: schedule });
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
    onUpdate();
    onClose();
  };

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      const granted = await ensureNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Benachrichtigungen deaktiviert',
          'Bitte erlaube Benachrichtigungen in den System-Einstellungen, um Trainings-Erinnerungen zu erhalten.'
        );
        setReminderEnabled(false);
        await updateSettings({ trainingReminderEnabled: false });
        return;
      }
    }

    setReminderEnabled(value);
    await updateSettings({ trainingReminderEnabled: value });
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
    setReminderTime(time);
    await updateSettings({ trainingReminderTimeOfDay: time, trainingReminderEnabled: true });
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

  const toggleDay = (dayIndex: number, value: boolean) => {
    setSchedule((prev) => {
      const newSchedule = { ...prev };
      if (!value) {
        newSchedule[dayIndex] = null;
      } else {
        // Default to first workout if available, or stay null until selected
        if (!newSchedule[dayIndex] && workouts.length > 0) {
           newSchedule[dayIndex] = workouts[0].id;
        }
      }
      return newSchedule;
    });
  };

  const selectWorkout = (dayIndex: number, workoutId: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayIndex]: workoutId,
    }));
    setSelectingDay(null);
  };

  const renderWorkoutPicker = () => {
    if (selectingDay === null) return null;

    return (
      <Modal visible={true} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={() => setSelectingDay(null)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Workout wählen</Text>
            <FlatList
              data={workouts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => selectWorkout(selectingDay, item.id)}>
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Wochenplan Einstellungen</Text>
          <Text style={styles.subtitle}>Standard-Trainingstage festlegen</Text>

          <ScrollView style={styles.daysList} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>Erinnerungen</Text>
              <View style={styles.reminderRow}>
                <View style={styles.reminderTextContainer}>
                  <Text style={styles.sectionLabel}>Trainings-Erinnerungen</Text>
                  <Text style={styles.sectionHint}>
                    Optional: Erinnerung an Tagen mit geplantem Training.
                  </Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={handleToggleReminder}
                  trackColor={{ false: '#3a3a3a', true: '#4ade80' }}
                  thumbColor={'#ffffff'}
                />
              </View>

              {reminderEnabled && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.sectionHint}>Zeitpunkt wählen</Text>
                  <View style={styles.timeRow}>
                    <Pressable
                      style={[styles.timeChip, reminderTime === 'morning' && styles.timeChipSelected]}
                      onPress={() => handleSelectReminderTime('morning')}>
                      <Text
                        style={[
                          styles.timeChipText,
                          reminderTime === 'morning' && styles.timeChipTextSelected,
                        ]}>
                        morgens (7:00)
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.timeChip, reminderTime === 'noon' && styles.timeChipSelected]}
                      onPress={() => handleSelectReminderTime('noon')}>
                      <Text
                        style={[
                          styles.timeChipText,
                          reminderTime === 'noon' && styles.timeChipTextSelected,
                        ]}>
                        mittags (12:00)
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.timeChip, reminderTime === 'evening' && styles.timeChipSelected]}
                      onPress={() => handleSelectReminderTime('evening')}>
                      <Text
                        style={[
                          styles.timeChipText,
                          reminderTime === 'evening' && styles.timeChipTextSelected,
                        ]}>
                        abends (17:00)
                      </Text>
                    </Pressable>
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
                    activeOpacity={0.8}>
                    <Text style={styles.testButtonText}>Test-Benachrichtigung (10s)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>Wochentage</Text>
              {DISPLAY_ORDER.map((dayIndex) => {
                const workoutId = schedule[dayIndex];
                const isEnabled = !!workoutId;

                const selectedWorkout = workouts.find((w) => w.id === workoutId);

                return (
                  <View key={dayIndex} style={styles.dayRow}>
                    <View style={styles.dayLabelContainer}>
                      <Text style={styles.dayName}>{DAYS[dayIndex]}</Text>
                    </View>

                    <Switch
                      value={isEnabled}
                      onValueChange={(val) => toggleDay(dayIndex, val)}
                      trackColor={{ false: '#3a3a3a', true: '#4ade80' }}
                      thumbColor={'#ffffff'}
                    />

                    {isEnabled && (
                      <TouchableOpacity
                        style={styles.workoutSelector}
                        onPress={() => setSelectingDay(dayIndex)}>
                        <Text style={styles.workoutSelectorText} numberOfLines={1}>
                          {selectedWorkout ? selectedWorkout.name : 'Workout wählen'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {renderWorkoutPicker()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    maxHeight: '90%', // Etwas mehr Platz geben
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaaaaa',
    marginBottom: 24,
    textAlign: 'center',
  },
  daysList: {
    marginBottom: 20,
  },
  sectionBox: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#151515',
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reminderTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  sectionLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHint: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4b5563',
    backgroundColor: 'transparent',
  },
  timeChipSelected: {
    backgroundColor: '#4ade80',
    borderColor: '#22c55e',
  },
  timeChipText: {
    fontSize: 13,
    color: '#e5e7eb',
    fontWeight: '600',
  },
  timeChipTextSelected: {
    color: '#111827',
  },
  testButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  testButtonText: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '700',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 50,
  },
  dayLabelContainer: {
    width: 40,
  },
  dayName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  workoutSelector: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: '#3a3a3a',
    padding: 10,
    borderRadius: 8,
  },
  workoutSelectorText: {
    color: '#ffffff',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#4ade80',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 40,
  },
  pickerContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  pickerItemText: {
    color: '#ffffff',
    fontSize: 18,
  },
});
