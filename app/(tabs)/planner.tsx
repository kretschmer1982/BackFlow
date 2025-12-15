import { Workout } from '@/types/interfaces';
import { rescheduleTrainingReminders } from '@/utils/notifications';
import {
    getPlannedWorkouts,
    getPlannerSettings,
    getSettings,
    getWorkouts,
    normalizePlannedValueToEntries,
    PlannedWorkoutEntry,
    PlannedWorkoutsMap,
    PlannedWorkoutsStoredValue,
    PlannerSettings,
    savePlannedWorkout,
} from '@/utils/storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatDateRange = (date: Date) => {
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
};

const NAV_TO_LIST_GAP = 16;

const addDays = (d: Date, deltaDays: number) => {
  const next = new Date(d);
  next.setDate(d.getDate() + deltaDays);
  return next;
};

const getNext7Days = (startDate: Date) => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
};

const toLocalDateKey = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const toUtcDateKey = (d: Date) => d.toISOString().slice(0, 10);

export default function PlannerScreen() {
  const router = useRouter();
  const [currentStartDate, setCurrentStartDate] = useState(new Date());
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const todayKey = toLocalDateKey(new Date());
  const weekPagerRef = useRef<ScrollView | null>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [navHeight, setNavHeight] = useState(0);

  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkoutsMap>({});
  const [plannerSettings, setPlannerSettings] = useState<PlannerSettings>({ defaultSchedule: {} });

  const [workoutPickerVisible, setWorkoutPickerVisible] = useState(false);
  const [selectedDateForPicker, setSelectedDateForPicker] = useState<Date | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDate, setEditDate] = useState<Date | null>(null);

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsDate, setDetailsDate] = useState<Date | null>(null);
  const [detailsWorkoutId, setDetailsWorkoutId] = useState<string | null>(null);
  const [detailsCompleted, setDetailsCompleted] = useState<boolean>(false);
  const [detailsDurationMinutes, setDetailsDurationMinutes] = useState<string>('');
  const [editEntryIndex, setEditEntryIndex] = useState<number | null>(null);

  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [dayMoveFromDate, setDayMoveFromDate] = useState<Date | null>(null);
  const [dayMoveWorkoutId, setDayMoveWorkoutId] = useState<string | null>(null);

  const days = useMemo(() => getNext7Days(currentStartDate), [currentStartDate]);
  const prevWeekStart = useMemo(() => addDays(currentStartDate, -7), [currentStartDate]);
  const nextWeekStart = useMemo(() => addDays(currentStartDate, 7), [currentStartDate]);
  const weekPages = useMemo(() => [prevWeekStart, currentStartDate, nextWeekStart], [prevWeekStart, currentStartDate, nextWeekStart]);

  const jumpToMiddleWeek = useCallback(() => {
    requestAnimationFrame(() => {
      weekPagerRef.current?.scrollTo({ x: screenWidth, animated: false });
    });
  }, [screenWidth]);

  useEffect(() => {
    // immer auf die mittlere Seite (aktuelle Woche) zurücksetzen
    jumpToMiddleWeek();
  }, [jumpToMiddleWeek, currentStartDate]);

  const rowLayout = useMemo(() => {
    const rows = 8; // 7 Tage + Routinetage
    const maxRowH = 62;
    const minRowH = 44;
    const maxGap = 10;
    const minGap = 6;

    // Verfügbarer Bereich: Screen - Header - Nav - Bottom SafeArea/Padding
    const bottomPadding = 12;
    const topGap = NAV_TO_LIST_GAP; // Abstand unter der NavBar
    const available = Math.max(0, screenHeight - headerHeight - navHeight - topGap - bottomPadding);

    // Erst versuchen: Standard-Gap, Row-H über available berechnen
    let gap = maxGap;
    let rowH = Math.floor((available - (rows - 1) * gap) / rows);

    // Clamp row height
    rowH = Math.max(minRowH, Math.min(maxRowH, rowH));

    // Falls es trotzdem nicht passt: Gap reduzieren
    const used = rows * rowH + (rows - 1) * gap;
    if (used > available) {
      const remainingForGaps = available - rows * rowH;
      gap = Math.floor(remainingForGaps / (rows - 1));
      gap = Math.max(4, Math.min(maxGap, gap));
    } else {
      gap = Math.max(minGap, Math.min(maxGap, gap));
    }

    const usedFinal = rows * rowH + (rows - 1) * gap;
    const canCenter = usedFinal <= available;

    return { rowH, gap, canCenter };
  }, [headerHeight, navHeight, screenHeight]);

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
    newDate.setDate(currentStartDate.getDate() - 7);
    setCurrentStartDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(currentStartDate.getDate() + 7);
    setCurrentStartDate(newDate);
  };

  const handleToday = () => {
    setCurrentStartDate(new Date());
  };

  const getWorkoutIdsForDate = (date: Date): string[] => {
    const localKey = toLocalDateKey(date);
    const utcKey = toUtcDateKey(date);
    const manual: any = plannedWorkouts[localKey] ?? plannedWorkouts[utcKey];

    // Manual override exists
    if (manual !== undefined) {
      // Pause (''), leere Liste oder ungültige Werte -> keine Trainings
      const entries = normalizePlannedValueToEntries(manual as PlannedWorkoutsStoredValue);
      const validIds = entries
        .map((e) => e.workoutId)
        .filter((id) => workouts.some((w) => w.id === id));
      return validIds.slice(0, 3);
    }

    // Vergangenheit: NICHT automatisch via Wochenplan füllen/umplanen
    // (später für Statistiken: durchgeführt vs nicht durchgeführt)
    if (localKey < todayKey) return [];

    // Default schedule
    const dayOfWeek = date.getDay();
    const defaultIds = Array.isArray(plannerSettings.defaultSchedule[dayOfWeek])
      ? plannerSettings.defaultSchedule[dayOfWeek]
      : [];
    return defaultIds.slice(0, 3);
  };

  const getEntriesForDate = (date: Date): PlannedWorkoutEntry[] => {
    const localKey = toLocalDateKey(date);
    const utcKey = toUtcDateKey(date);
    const manual = plannedWorkouts[localKey] ?? plannedWorkouts[utcKey];

    if (manual !== undefined) {
      return normalizePlannedValueToEntries(manual as PlannedWorkoutsStoredValue)
        .slice(0, 3);
    }

    const dow = date.getDay();
    const defaultIds = Array.isArray(plannerSettings.defaultSchedule[dow]) ? plannerSettings.defaultSchedule[dow] : [];
    return defaultIds.slice(0, 3).map((id) => ({ workoutId: id }));
  };

  const getWorkoutById = (id: string): Workout | null => workouts.find((w) => w.id === id) ?? null;

  const openWorkoutPickerForDate = (date: Date) => {
    setSelectedDateForPicker(date);
    setWorkoutPickerVisible(true);
  };

  const openDayPickerForMove = (fromDate: Date, workoutId: string) => {
    if (toLocalDateKey(fromDate) < todayKey) {
      Alert.alert('Vergangene Tage', 'Vergangene Tage können nicht bearbeitet werden.');
      return;
    }
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

    const fromKey = toLocalDateKey(dayMoveFromDate);
    const toKey = toLocalDateKey(toDate);
    if (toKey < todayKey) {
      Alert.alert('Vergangene Tage', 'Vergangene Tage können nicht bearbeitet werden.');
      return;
    }

    if (fromKey === toKey) {
      closeDayPicker();
      return;
    }

    const targetEntries = getEntriesForDate(toDate);
    if (targetEntries.length >= 3) {
      Alert.alert('Warnung', 'An diesem Tag sind bereits 3 Trainings geplant.');
      return;
    }

    // Quelle: entferne das Training (oder setze Pause, wenn es ein Single war)
    const fromVal: any = plannedWorkouts[fromKey] ?? plannedWorkouts[toUtcDateKey(dayMoveFromDate)];
    const fromEntries = normalizePlannedValueToEntries(fromVal as any);
    const remaining = fromEntries.filter((e) => e.workoutId !== dayMoveWorkoutId);
    await savePlannedWorkout(fromKey, remaining.length === 0 ? '' : remaining);

    // Ziel: anhängen
    const toVal: any = plannedWorkouts[toKey] ?? plannedWorkouts[toUtcDateKey(toDate)];
    const toEntries = normalizePlannedValueToEntries(toVal as any);
    await savePlannedWorkout(toKey, [...toEntries, { workoutId: dayMoveWorkoutId }].slice(0, 3));

    await loadData();
    await rescheduleTrainingReminders();
    closeDayPicker();
  };

  const openEditForEntry = (date: Date, entryIndex: number) => {
    setEditEntryIndex(entryIndex);
    setEditDate(date);
    setEditModalVisible(true);
  };

  const handleDayPress = (date: Date) => {
    // Tap auf leeren Bereich => Training hinzufügen (wenn < 3)
    const entries = getEntriesForDate(date);
    if (entries.length >= 3) return;
    openWorkoutPickerForDate(date);
  };

  const handleSelectWorkout = async (workout: Workout) => {
    if (selectedDateForPicker) {
      const dateKey = toLocalDateKey(selectedDateForPicker);
      const isPast = dateKey < todayKey;
      if (isPast) {
        setDetailsDate(selectedDateForPicker);
        setDetailsWorkoutId(workout.id);
        setDetailsCompleted(false);
        setDetailsDurationMinutes('');
        setDetailsModalVisible(true);
      } else {
        const existing = plannedWorkouts[dateKey];
        const nextEntries = existing === undefined ? [] : normalizePlannedValueToEntries(existing as any);
        await savePlannedWorkout(dateKey, [...nextEntries, workout.id].slice(0, 3));
        await loadData();
        await rescheduleTrainingReminders();
      }
    }
    setWorkoutPickerVisible(false);
    setSelectedDateForPicker(null);
  };

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
    setDetailsDate(null);
    setDetailsWorkoutId(null);
    setDetailsCompleted(false);
    setDetailsDurationMinutes('');
  };

  const saveDetailsForPast = async () => {
    if (!detailsDate || !detailsWorkoutId) {
      closeDetailsModal();
      return;
    }

    const dateKey = toLocalDateKey(detailsDate);
    const minutes = parseInt(detailsDurationMinutes || '0', 10);
    const durationMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : undefined;

    const entry: PlannedWorkoutEntry = {
      workoutId: detailsWorkoutId,
      completed: !!detailsCompleted,
      durationMinutes,
    };

    const existing = plannedWorkouts[dateKey];
    const nextEntries = existing === undefined ? [] : normalizePlannedValueToEntries(existing as any);
    await savePlannedWorkout(dateKey, [...nextEntries, entry].slice(0, 3));
    await loadData();
    await rescheduleTrainingReminders();
    closeDetailsModal();
  };

  const renderCalendarRow = (date: Date) => {
    const entries = getEntriesForDate(date);
    const isToday = toLocalDateKey(date) === todayKey;

    return (
      <View style={[styles.dayItem, { height: rowLayout.rowH, marginBottom: rowLayout.gap }, isToday && styles.dayItemToday]}>
        <View style={[styles.dateContainer, isToday && styles.dateContainerToday]}>
          <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
            {date.toLocaleDateString('de-DE', { weekday: 'short' })}
          </Text>
          <Text style={[styles.dateText, isToday && styles.dateTextToday]}>
            {date.getDate()}.{date.getMonth() + 1}.
          </Text>
        </View>

        <View style={[styles.planRowContainer, isToday && styles.planContainerToday]}>
          {entries.length === 0 ? (
            <TouchableOpacity style={styles.singleAdd} onPress={() => handleDayPress(date)} activeOpacity={0.85}>
              <Text style={styles.emptyPlanText}>+ Training planen</Text>
            </TouchableOpacity>
          ) : entries.length === 1 ? (
            <View style={styles.multiContainer}>
              {(() => {
                const e = entries[0];
                const w = getWorkoutById(e.workoutId);
                const done = !!e.completed;
                return (
                  <TouchableOpacity
                    style={[styles.trainingChip, styles.trainingChipFullHeight]}
                    onPress={() => openEditForEntry(date, 0)}
                    activeOpacity={0.85}>
                    <Text style={styles.workoutName} numberOfLines={1}>
                      {w ? w.name : 'Gelöschtes Workout'} {done ? '✓' : ''}
                    </Text>
                    <Text style={styles.workoutDetails} numberOfLines={1}>
                      {typeof e.durationMinutes === 'number'
                        ? `${e.durationMinutes} Min.`
                        : w
                          ? `${w.exercises.length} Übungen`
                          : '—'}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
              <TouchableOpacity
                style={[styles.trainingChipAdd, styles.trainingChipFullHeight]}
                onPress={() => handleDayPress(date)}
                activeOpacity={0.85}>
                <Text style={styles.addChipText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.multiContainer}>
              {entries.slice(0, 3).map((e, idx) => {
                const w = getWorkoutById(e.workoutId);
                const done = !!e.completed;
                return (
                  <TouchableOpacity
                    key={`${e.workoutId}-${idx}`}
                    style={styles.trainingChip}
                    onPress={() => openEditForEntry(date, idx)}
                    activeOpacity={0.85}>
                    <Text style={styles.workoutName} numberOfLines={1}>
                      {w ? w.name : 'Gelöschtes Workout'} {done ? '✓' : ''}
                    </Text>
                    <Text style={styles.workoutDetails} numberOfLines={1}>
                      {typeof e.durationMinutes === 'number'
                        ? `${e.durationMinutes} Min.`
                        : w
                          ? `${w.exercises.length} Übungen`
                          : '—'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {entries.length < 3 && (
                <TouchableOpacity style={styles.trainingChipAdd} onPress={() => handleDayPress(date)} activeOpacity={0.85}>
                  <Text style={styles.addChipText}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const editingEntries = editDate ? getEntriesForDate(editDate) : [];
  const editingEntry = editEntryIndex !== null ? editingEntries[editEntryIndex] : null;
  const editingWorkout = editingEntry ? getWorkoutById(editingEntry.workoutId) : null;
  const editingWorkoutId = editingEntry ? editingEntry.workoutId : null;
  const editingIsPast = !!(editDate && toLocalDateKey(editDate) < todayKey);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor }]}>
      <StatusBar style="light" />

      <View
        style={styles.header}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <Text style={styles.subtitle}>Planner</Text>
      </View>

      <View style={styles.navBar} onLayout={(e) => setNavHeight(e.nativeEvent.layout.height)}>
        <TouchableOpacity onPress={handlePrev} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'<'}</Text>
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={styles.dateRangeText}>
            {formatDateRange(days[0])} - {formatDateRange(days[days.length - 1])}
          </Text>
          <TouchableOpacity onPress={handleToday} style={styles.todayButton}>
            <Text style={styles.todayButtonIcon} accessibilityLabel="Heute">
              ⟲
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleNext} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.weekViewport, { paddingTop: NAV_TO_LIST_GAP, paddingBottom: 12 }]}>
        <ScrollView
          ref={(r) => {
            weekPagerRef.current = r;
          }}
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'stretch' }}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const page = Math.round(x / screenWidth);
            if (page === 0) {
              setCurrentStartDate((prev) => addDays(prev, -7));
              jumpToMiddleWeek();
            } else if (page === 2) {
              setCurrentStartDate((prev) => addDays(prev, 7));
              jumpToMiddleWeek();
            } else {
              // page === 1 -> bleibt gleich
              jumpToMiddleWeek();
            }
          }}
          scrollEventThrottle={16}>
          {weekPages.map((start, idx) => {
            const pageDays = getNext7Days(start);
            return (
              <View key={`${toLocalDateKey(start)}-${idx}`} style={[styles.weekPage, { width: screenWidth }]}>
                <View
                  style={[
                    styles.listContent,
                    { justifyContent: rowLayout.canCenter ? 'center' : 'flex-start' },
                  ]}>
                  {pageDays.map((d) => (
                    <View key={toLocalDateKey(d)}>{renderCalendarRow(d)}</View>
                  ))}

                {/* 8. Element: Routinetage setzen */}
                <View style={[styles.dayItem, { height: rowLayout.rowH, marginBottom: 0 }]}>
                  <View style={styles.dateContainer} />
                  <TouchableOpacity
                    style={[styles.planContainer, styles.routinePlanContainer]}
                    onPress={() => router.push('/planner-settings')}
                    activeOpacity={0.85}>
                    <Text style={styles.routinePlanText}>Routinetage setzen</Text>
                  </TouchableOpacity>
                </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

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

      {/* Details (Vergangenheit) */}
      <Modal visible={detailsModalVisible} transparent animationType="fade">
        <Pressable
          style={[styles.pickerOverlay, { backgroundColor: 'rgba(0,0,0,0.75)' }]}
          onPress={closeDetailsModal}>
          <Pressable style={[styles.editModalCard, { backgroundColor }]} onPress={() => {}}>
            <Text style={styles.editTitle}>Training (Vergangenheit)</Text>
            <Text style={styles.editSubtitle}>
              {detailsDate ? formatDateRange(detailsDate) : ''}
            </Text>

            <TouchableOpacity
              style={styles.editAction}
              onPress={() => setDetailsCompleted((v) => !v)}
              activeOpacity={0.85}>
              <Text style={styles.editActionText}>
                Training durchgeführt: {detailsCompleted ? 'Ja' : 'Nein'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.editAction, { paddingVertical: 10 }]}>
              <Text style={[styles.editActionText, { textAlign: 'left', marginBottom: 6 }]}>
                Gesamtzeit (Minuten)
              </Text>
              <TextInput
                value={detailsDurationMinutes}
                onChangeText={(t) => setDetailsDurationMinutes(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="z.B. 25"
                placeholderTextColor="#666666"
                style={styles.detailsInput}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.pickerCancel, { flex: 1, marginTop: 0 }]}
                onPress={closeDetailsModal}
                activeOpacity={0.85}>
                <Text style={styles.pickerCancelText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveDetailsBtn, { flex: 1 }]}
                onPress={saveDetailsForPast}
                activeOpacity={0.85}>
                <Text style={styles.saveDetailsBtnText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Training Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <Pressable
          style={[styles.pickerOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
          onPress={() => setEditModalVisible(false)}>
          <Pressable
            style={[styles.editModalCard, { backgroundColor }]}
            onPress={() => {}}>
            <Text style={styles.editTitle}>Training bearbeiten</Text>
            <Text style={styles.editSubtitle}>
              {editingWorkout ? editingWorkout.name : ''}{' '}
              {editDate ? `• ${formatDateRange(editDate)}` : ''}
            </Text>

            <TouchableOpacity
              style={styles.editAction}
              onPress={() => {
                setEditModalVisible(false);
                if (editDate && editingWorkoutId) openDayPickerForMove(editDate, editingWorkoutId);
              }}
              activeOpacity={0.85}>
              <Text style={styles.editActionText}>Tag ändern</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editAction}
              onPress={() => {
                setEditModalVisible(false);
                if (editDate) openWorkoutPickerForDate(editDate);
              }}
              activeOpacity={0.85}>
              <Text style={styles.editActionText}>Workout ändern</Text>
            </TouchableOpacity>

            {editingIsPast && (
              <TouchableOpacity
                style={styles.editAction}
                onPress={() => {
                  if (!editDate || !editingWorkoutId) return;
                  const localKey = toLocalDateKey(editDate);
                  const utcKey = toUtcDateKey(editDate);
                  const manual: any = plannedWorkouts[localKey] ?? plannedWorkouts[utcKey];
                  setDetailsDate(editDate);
                  setDetailsWorkoutId(editingWorkoutId);
                  setDetailsCompleted(!!(manual && typeof manual === 'object' && manual.completed));
                  setDetailsDurationMinutes(
                    manual && typeof manual === 'object' && typeof manual.durationMinutes === 'number'
                      ? String(manual.durationMinutes)
                      : ''
                  );
                  setEditModalVisible(false);
                  setDetailsModalVisible(true);
                }}
                activeOpacity={0.85}>
                <Text style={styles.editActionText}>Details bearbeiten</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.editAction}
              onPress={async () => {
                if (!editDate) return;
                const key = toLocalDateKey(editDate);
                const existing = plannedWorkouts[key];
                const entries = existing === undefined ? [] : normalizePlannedValueToEntries(existing as any);
                const next = editEntryIndex === null ? [] : entries.filter((_, i) => i !== editEntryIndex);
                await savePlannedWorkout(key, next.length === 0 ? '' : next);
                await loadData();
                await rescheduleTrainingReminders();
                setEditModalVisible(false);
                setEditEntryIndex(null);
              }}
              activeOpacity={0.85}>
              <Text style={styles.editDeleteText}>Training löschen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.editAction, { marginTop: 6 }]}
              onPress={() => {
                setEditModalVisible(false);
                setEditEntryIndex(null);
              }}
              activeOpacity={0.85}>
              <Text style={styles.editCancelText}>Abbrechen</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Day Picker for moving a training */}
      <Modal visible={dayPickerVisible} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={closeDayPicker}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Tag wählen</Text>
            <Text style={styles.pickerSubtitle}>
              Wähle einen Tag mit freiem Slot (max. 3 Trainings pro Tag).
            </Text>
            <FlatList
              data={days}
              keyExtractor={(d) => d.toISOString()}
              renderItem={({ item: d }) => {
                const occupied = getEntriesForDate(d).length >= 3;
                const isSame = dayMoveFromDate ? toLocalDateKey(dayMoveFromDate) === toLocalDateKey(d) : false;
                const isPast = toLocalDateKey(d) < todayKey;
                const disabled = occupied && !isSame;

                return (
                  <TouchableOpacity
                    style={[styles.dayPickItem, (disabled || isPast) && styles.dayPickItemDisabled]}
                    onPress={() => {
                      if (isPast) {
                        Alert.alert('Vergangene Tage', 'Vergangene Tage können nicht bearbeitet werden.');
                        return;
                      }
                      if (disabled) {
                        Alert.alert('Warnung', 'An diesem Tag sind bereits 3 Trainings geplant.');
                        return;
                      }
                      moveWorkoutToDate(d);
                    }}
                    activeOpacity={0.8}>
                    <Text style={styles.dayPickText}>
                      {formatDateRange(d)}
                      {isPast ? '  (vergangen)' : disabled ? '  (belegt)' : ''}
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
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
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
    paddingHorizontal: 18,
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
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderRadius: 999,
    borderWidth: 0,
  },
  todayButtonIcon: {
    color: '#e5e7eb',
    fontSize: 36,
    lineHeight: 36,
    fontWeight: '900',
  },
  dateRangeText: {
    color: '#fff',
    fontSize: 16,
  },
  listContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 0,
  },
  weekViewport: {
    flex: 1,
  },
  weekPage: {
    flex: 1,
    height: '100%',
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer: {
    width: 56,
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
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
    height: '100%',
    justifyContent: 'center',
  },
  planRowContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 0,
    borderWidth: 1,
    borderColor: '#333333',
    height: '100%',
    justifyContent: 'center',
  },
  singleAdd: {
    flex: 1,
    justifyContent: 'center',
  },
  multiContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
    padding: 0,
  },
  trainingChip: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
  },
  trainingChipFullHeight: {
    height: '100%',
  },
  trainingChipAdd: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#141414',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addChipText: {
    color: '#aaaaaa',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 20,
  },
  routinePlanContainer: {
    backgroundColor: '#171717',
    borderColor: '#2a2a2a',
    alignItems: 'flex-start',
  },
  routinePlanText: {
    color: 'rgba(134, 239, 172, 0.7)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'left',
  },
  dayItemToday: {},
  dateContainerToday: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderRadius: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
  },
  dayNameToday: {
    color: '#4ade80',
  },
  dateTextToday: {
    color: '#4ade80',
  },
  planContainerToday: {
    borderColor: 'rgba(74, 222, 128, 0.55)',
    backgroundColor: '#161a16',
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
  detailsInput: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  saveDetailsBtn: {
    marginTop: 0,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  saveDetailsBtnText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  editModalCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#333333',
  },
  editTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  editSubtitle: {
    color: '#aaaaaa',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  editAction: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 10,
  },
  editActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  editDeleteText: {
    color: '#f59e0b',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  editCancelText: {
    color: '#aaaaaa',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
