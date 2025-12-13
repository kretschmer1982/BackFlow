import PlannerSettingsModal from '@/components/PlannerSettingsModal';
import { Workout } from '@/types/interfaces';
import {
    PlannerSettings,
    getPlannedWorkouts,
    getPlannerSettings,
    getSettings,
    getWorkouts,
    savePlannedWorkout,
} from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const formatDateRange = (date: Date) => {
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
};

const getNext10Days = (startDate: Date) => {
  const days: Date[] = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
};

const toDateKey = (d: Date) => d.toISOString().split('T')[0];

export default function PlannerScreen() {
  const [currentStartDate, setCurrentStartDate] = useState(new Date());
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const [plannedWorkouts, setPlannedWorkouts] = useState<{ [date: string]: string }>({});
  const [plannerSettings, setPlannerSettings] = useState<PlannerSettings>({ defaultSchedule: {} });

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [workoutPickerVisible, setWorkoutPickerVisible] = useState(false);
  const [selectedDateForPicker, setSelectedDateForPicker] = useState<Date | null>(null);

  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [dayMoveFromDate, setDayMoveFromDate] = useState<Date | null>(null);
  const [dayMoveWorkoutId, setDayMoveWorkoutId] = useState<string | null>(null);

  const days = useMemo(() => getNext10Days(currentStartDate), [currentStartDate]);

  const loadData = useCallback(async () => {
    const settings = await getSettings();
    setBackgroundColor(settings.appBackgroundColor);

    const loadedWorkouts = await getWorkouts();
    setWorkouts(loadedWorkouts);

    const planned = await getPlannedWorkouts();
    setPlannedWorkouts(planned);

    const pSettings = await getPlannerSettings();
    setPlannerSettings(pSettings);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePrev = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(currentStartDate.getDate() - 10);
    setCurrentStartDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(currentStartDate.getDate() + 10);
    setCurrentStartDate(newDate);
  };

  const handleToday = () => {
    setCurrentStartDate(new Date());
  };

  const getWorkoutIdForDate = (date: Date): string | null => {
    const dateKey = toDateKey(date);
    const manual = plannedWorkouts[dateKey];

    // Manual override exists
    if (manual !== undefined) {
      return manual === '' ? null : manual;
    }

    // Default schedule
    const dayOfWeek = date.getDay();
    const defaultId = plannerSettings.defaultSchedule[dayOfWeek];
    return defaultId ?? null;
  };

  const getWorkoutForDate = (date: Date): Workout | null => {
    const id = getWorkoutIdForDate(date);
    if (!id) return null;
    return workouts.find((w) => w.id === id) ?? null;
  };

  const openWorkoutPickerForDate = (date: Date) => {
    setSelectedDateForPicker(date);
    setWorkoutPickerVisible(true);
  };

  const openDayPickerForMove = (fromDate: Date, workoutId: string) => {
    setDayMoveFromDate(fromDate);
    setDayMoveWorkoutId(workoutId);
    setDayPickerVisible(true);
  };

  const closeDayPicker = () => {
    setDayPickerVisible(false);
    setDayMoveFromDate(null);
    setDayMoveWorkoutId(null);
  };

  const moveWorkoutToDate = async (toDate: Date) => {
    if (!dayMoveFromDate || !dayMoveWorkoutId) {
      closeDayPicker();
      return;
    }

    const fromKey = toDateKey(dayMoveFromDate);
    const toKey = toDateKey(toDate);

    if (fromKey === toKey) {
      closeDayPicker();
      return;
    }

    const targetWorkoutId = getWorkoutIdForDate(toDate);
    if (targetWorkoutId) {
      Alert.alert('Warnung', 'An diesem Tag ist bereits ein Training geplant.');
      return;
    }

    // Quelle auf "Pause" setzen (überschreibt ggf. Default)
    await savePlannedWorkout(fromKey, '');
    // Ziel mit Workout belegen
    await savePlannedWorkout(toKey, dayMoveWorkoutId);

    await loadData();
    closeDayPicker();
  };

  const handleDayPress = (date: Date) => {
    const workoutId = getWorkoutIdForDate(date);
    const workout = getWorkoutForDate(date);

    if (workout && workoutId) {
      Alert.alert('Training bearbeiten', `${workout.name} am ${formatDateRange(date)}`, [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Tag ändern',
          onPress: () => openDayPickerForMove(date, workoutId),
        },
        {
          text: 'Workout ändern',
          onPress: () => openWorkoutPickerForDate(date),
        },
        {
          text: 'Löschen / Pause',
          style: 'destructive',
          onPress: async () => {
            await savePlannedWorkout(toDateKey(date), '');
            await loadData();
          },
        },
      ]);
      return;
    }

    openWorkoutPickerForDate(date);
  };

  const handleSelectWorkout = async (workout: Workout) => {
    if (selectedDateForPicker) {
      const dateKey = toDateKey(selectedDateForPicker);
      await savePlannedWorkout(dateKey, workout.id);
      await loadData();
    }
    setWorkoutPickerVisible(false);
    setSelectedDateForPicker(null);
  };

  const renderCalendarRow = ({ item }: { item: Date }) => {
    const workout = getWorkoutForDate(item);

    return (
      <View style={styles.dayItem}>
        <View style={styles.dateContainer}>
          <Text style={styles.dayName}>{item.toLocaleDateString('de-DE', { weekday: 'short' })}</Text>
          <Text style={styles.dateText}>
            {item.getDate()}.{item.getMonth() + 1}.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.planContainer}
          onPress={() => handleDayPress(item)}
          activeOpacity={0.8}>
          {workout ? (
            <View>
              <Text style={styles.workoutName}>{workout.name}</Text>
              <Text style={styles.workoutDetails}>{workout.exercises.length} Übungen</Text>
            </View>
          ) : (
            <Text style={styles.emptyPlanText}>+ Training planen</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.subtitle}>Planner</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsModalVisible(true)}
            activeOpacity={0.8}>
            <Text style={styles.settingsButtonText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity onPress={handlePrev} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'<'}</Text>
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={styles.dateRangeText}>
            {formatDateRange(days[0])} - {formatDateRange(days[days.length - 1])}
          </Text>
          <TouchableOpacity onPress={handleToday} style={styles.todayButton}>
            <Text style={styles.todayButtonText}>Heute</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleNext} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={days}
        keyExtractor={(d) => d.toISOString()}
        renderItem={renderCalendarRow}
        contentContainerStyle={styles.listContent}
      />

      <PlannerSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        workouts={workouts}
        onUpdate={loadData}
      />

      {/* Workout Picker */}
      <Modal visible={workoutPickerVisible} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={() => setWorkoutPickerVisible(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Workout wählen</Text>
            {workouts.length === 0 ? (
              <Text style={styles.emptyText}>Keine Workouts vorhanden.</Text>
            ) : (
              <FlatList
                data={workouts}
                keyExtractor={(w) => w.id}
                renderItem={({ item: w }) => (
                  <TouchableOpacity style={styles.pickerItem} onPress={() => handleSelectWorkout(w)}>
                    <Text style={styles.pickerItemText}>{w.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity style={styles.pickerCancel} onPress={() => setWorkoutPickerVisible(false)}>
              <Text style={styles.pickerCancelText}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Day Picker for moving a training */}
      <Modal visible={dayPickerVisible} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={closeDayPicker}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Tag wählen</Text>
            <Text style={styles.pickerSubtitle}>
              Wähle einen freien Tag. Belegte Tage sind nicht auswählbar.
            </Text>
            <FlatList
              data={days}
              keyExtractor={(d) => d.toISOString()}
              renderItem={({ item: d }) => {
                const occupied = !!getWorkoutIdForDate(d);
                const isSame = dayMoveFromDate ? toDateKey(dayMoveFromDate) === toDateKey(d) : false;
                const disabled = occupied && !isSame;

                return (
                  <TouchableOpacity
                    style={[styles.dayPickItem, disabled && styles.dayPickItemDisabled]}
                    onPress={() => {
                      if (disabled) {
                        Alert.alert('Warnung', 'An diesem Tag ist bereits ein Training geplant.');
                        return;
                      }
                      moveWorkoutToDate(d);
                    }}
                    activeOpacity={0.8}>
                    <Text style={styles.dayPickText}>
                      {formatDateRange(d)}
                      {disabled ? '  (belegt)' : ''}
                      {isSame ? '  (aktueller Tag)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.pickerCancel} onPress={closeDayPicker}>
              <Text style={styles.pickerCancelText}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  navCenter: {
    alignItems: 'center',
  },
  navButton: {
    padding: 10,
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    width: 44,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  todayButton: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  todayButtonText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateRangeText: {
    color: '#fff',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  dayItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    height: 70,
  },
  dateContainer: {
    width: 60,
    alignItems: 'center',
    marginRight: 12,
  },
  dayName: {
    color: '#aaaaaa',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    height: '100%',
    justifyContent: 'center',
  },
  workoutName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  workoutDetails: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  emptyPlanText: {
    color: '#555',
    fontSize: 14,
    fontStyle: 'italic',
  },
  settingsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#555555',
  },
  settingsButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
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
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  pickerSubtitle: {
    color: '#aaaaaa',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
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
  dayPickItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  dayPickItemDisabled: {
    opacity: 0.45,
  },
  dayPickText: {
    color: '#ffffff',
    fontSize: 16,
  },
  pickerCancel: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
  },
  pickerCancelText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
});
