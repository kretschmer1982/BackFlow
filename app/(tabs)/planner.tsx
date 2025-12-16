import { DayPickerModal } from '@/components/planner/modals/DayPickerModal';
import { EditWorkoutModal } from '@/components/planner/modals/EditWorkoutModal';
import { PastWorkoutDetailsModal } from '@/components/planner/modals/PastWorkoutDetailsModal';
import { WorkoutPickerModal } from '@/components/planner/modals/WorkoutPickerModal';
import { usePlannerData } from '@/hooks/usePlannerData';
import { Workout } from '@/types/interfaces';
import { addDays, formatDateRange, getNext7Days, toLocalDateKey } from '@/utils/date';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NAV_TO_LIST_GAP = 16;

export default function PlannerScreen() {
  const router = useRouter();
  const {
    workouts,
    backgroundColor,
    todayKey,
    loadData,
    getEntriesForDate,
    getWorkoutById,
    addWorkoutToDate,
    removeWorkoutFromDate,
    updateWorkoutDetails, // Add new (past)
    updateEntryAtIndex,   // Update existing
    moveWorkout,
  } = usePlannerData();

  const [currentStartDate, setCurrentStartDate] = useState(new Date());
  const weekPagerRef = useRef<ScrollView | null>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [navHeight, setNavHeight] = useState(0);

  // --- Modal States ---
  const [workoutPickerVisible, setWorkoutPickerVisible] = useState(false);
  const [selectedDateForPicker, setSelectedDateForPicker] = useState<Date | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editEntryIndex, setEditEntryIndex] = useState<number | null>(null);

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsDate, setDetailsDate] = useState<Date | null>(null);
  // Wir merken uns, ob wir einen neuen Eintrag anlegen (WorkoutID) oder einen existierenden bearbeiten (Index)
  const [detailsWorkoutId, setDetailsWorkoutId] = useState<string | null>(null);
  const [detailsEntryIndex, setDetailsEntryIndex] = useState<number | null>(null);
  
  const [detailsCompleted, setDetailsCompleted] = useState<boolean>(false);
  const [detailsDurationMinutes, setDetailsDurationMinutes] = useState<string>('');

  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [dayMoveFromDate, setDayMoveFromDate] = useState<Date | null>(null);
  const [dayMoveWorkoutId, setDayMoveWorkoutId] = useState<string | null>(null);

  // --- Calendar Logic ---
  const days = useMemo(() => getNext7Days(currentStartDate), [currentStartDate]);
  const prevWeekStart = useMemo(() => addDays(currentStartDate, -7), [currentStartDate]);
  const nextWeekStart = useMemo(() => addDays(currentStartDate, 7), [currentStartDate]);
  const weekPages = useMemo(
    () => [prevWeekStart, currentStartDate, nextWeekStart],
    [prevWeekStart, currentStartDate, nextWeekStart]
  );

  const jumpToMiddleWeek = useCallback(() => {
    requestAnimationFrame(() => {
      weekPagerRef.current?.scrollTo({ x: screenWidth, animated: false });
    });
  }, [screenWidth]);

  useEffect(() => {
    jumpToMiddleWeek();
  }, [jumpToMiddleWeek, currentStartDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // --- Layout Calculation ---
  const rowLayout = useMemo(() => {
    const rows = 8;
    const maxRowH = 62;
    const minRowH = 44;
    const maxGap = 10;
    const minGap = 6;
    const bottomPadding = 12;
    const topGap = NAV_TO_LIST_GAP;
    const available = Math.max(0, screenHeight - headerHeight - navHeight - topGap - bottomPadding);

    let gap = maxGap;
    let rowH = Math.floor((available - (rows - 1) * gap) / rows);
    rowH = Math.max(minRowH, Math.min(maxRowH, rowH));

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

  // --- Handlers ---

  const handlePrev = () => setCurrentStartDate((d) => addDays(d, -7));
  const handleNext = () => setCurrentStartDate((d) => addDays(d, 7));
  const handleToday = () => setCurrentStartDate(new Date());

  // Picker
  const handleDayPress = (date: Date) => {
    const entries = getEntriesForDate(date);
    if (entries.length >= 3) return;
    setSelectedDateForPicker(date);
    setWorkoutPickerVisible(true);
  };

  const onWorkoutSelected = async (workout: Workout) => {
    if (selectedDateForPicker) {
      const dateKey = toLocalDateKey(selectedDateForPicker);
      const isPast = dateKey < todayKey;
      
      if (isPast) {
        // Hinzufügen für Vergangenheit -> Details Modal öffnen (New Entry Mode)
        setDetailsDate(selectedDateForPicker);
        setDetailsWorkoutId(workout.id);
        setDetailsEntryIndex(null); // New entry
        setDetailsCompleted(false);
        setDetailsDurationMinutes('');
        setDetailsModalVisible(true);
      } else {
        // Direkt hinzufügen
        await addWorkoutToDate(selectedDateForPicker, workout.id);
      }
    }
    setWorkoutPickerVisible(false);
    setSelectedDateForPicker(null);
  };

  // Move
  const openDayPickerForMove = (fromDate: Date, workoutId: string) => {
    if (toLocalDateKey(fromDate) < todayKey) {
      Alert.alert('Vergangene Tage', 'Vergangene Tage können nicht bearbeitet werden.');
      return;
    }
    setDayMoveFromDate(fromDate);
    setDayMoveWorkoutId(workoutId);
    setDayPickerVisible(true);
  };

  const onDaySelectedForMove = async (toDate: Date) => {
    if (!dayMoveFromDate || !dayMoveWorkoutId) return;

    try {
      await moveWorkout(dayMoveFromDate, toDate, dayMoveWorkoutId);
      setDayPickerVisible(false);
      setDayMoveFromDate(null);
      setDayMoveWorkoutId(null);
    } catch (e: any) {
      if (e.message === 'TARGET_FULL') {
        Alert.alert('Warnung', 'An diesem Tag sind bereits 3 Trainings geplant.');
      } else {
        console.error(e);
      }
    }
  };

  // Edit Menu
  const openEditForEntry = (date: Date, entryIndex: number) => {
    setEditEntryIndex(entryIndex);
    setEditDate(date);
    setEditModalVisible(true);
  };

  const editingEntries = editDate ? getEntriesForDate(editDate) : [];
  const editingEntry = editEntryIndex !== null ? editingEntries[editEntryIndex] : null;
  const editingWorkout = editingEntry ? getWorkoutById(editingEntry.workoutId) : null;
  const editingWorkoutId = editingEntry ? editingEntry.workoutId : null;
  const editingIsPast = !!(editDate && toLocalDateKey(editDate) < todayKey);

  // Edit Details (Past)
  const onEditDetails = () => {
    if (!editDate || editEntryIndex === null || !editingEntry) return;
    
    setDetailsDate(editDate);
    setDetailsEntryIndex(editEntryIndex); // Existing entry
    setDetailsWorkoutId(editingWorkoutId); // Fallback
    setDetailsCompleted(!!editingEntry.completed);
    setDetailsDurationMinutes(
      typeof editingEntry.durationMinutes === 'number' ? String(editingEntry.durationMinutes) : ''
    );
    
    setEditModalVisible(false);
    setDetailsModalVisible(true);
  };

  const onSaveDetails = async () => {
    if (!detailsDate) return;
    
    const minutes = parseInt(detailsDurationMinutes || '0', 10);
    const durationMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : undefined;

    if (detailsEntryIndex !== null) {
      // Update existing
      await updateEntryAtIndex(detailsDate, detailsEntryIndex, {
        completed: !!detailsCompleted,
        durationMinutes
      });
    } else if (detailsWorkoutId) {
      // Add new
      await updateWorkoutDetails(detailsDate, detailsWorkoutId, !!detailsCompleted, durationMinutes);
    }
    
    setDetailsModalVisible(false);
    setDetailsDate(null);
    setDetailsWorkoutId(null);
    setDetailsEntryIndex(null);
    setDetailsCompleted(false);
    setDetailsDurationMinutes('');
  };

  const onDeleteEntry = async () => {
    if (editDate && editEntryIndex !== null) {
      await removeWorkoutFromDate(editDate, editEntryIndex);
      setEditModalVisible(false);
      setEditEntryIndex(null);
    }
  };

  // --- Render Helpers ---

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
          ref={(r) => { weekPagerRef.current = r; }}
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
              jumpToMiddleWeek();
            }
          }}
          scrollEventThrottle={16}>
          {weekPages.map((start, idx) => {
            const pageDays = getNext7Days(start);
            return (
              <View key={`${toLocalDateKey(start)}-${idx}`} style={[styles.weekPage, { width: screenWidth }]}>
                <View style={[styles.listContent, { justifyContent: rowLayout.canCenter ? 'center' : 'flex-start' }]}>
                  {pageDays.map((d) => (
                    <View key={toLocalDateKey(d)}>{renderCalendarRow(d)}</View>
                  ))}
                  {/* Routinetage Button */}
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

      <WorkoutPickerModal
        visible={workoutPickerVisible}
        onClose={() => setWorkoutPickerVisible(false)}
        workouts={workouts}
        onSelect={onWorkoutSelected}
      />

      <DayPickerModal
        visible={dayPickerVisible}
        onClose={() => setDayPickerVisible(false)}
        days={days}
        currentDate={dayMoveFromDate}
        todayKey={todayKey}
        isDayFull={(d) => getEntriesForDate(d).length >= 3}
        onSelect={onDaySelectedForMove}
      />

      <EditWorkoutModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        workoutName={editingWorkout?.name ?? ''}
        date={editDate}
        isPast={editingIsPast}
        backgroundColor={backgroundColor}
        onDelete={onDeleteEntry}
        onChangeDay={() => {
            setEditModalVisible(false);
            if (editDate && editingWorkoutId) openDayPickerForMove(editDate, editingWorkoutId);
        }}
        onChangeWorkout={() => {
            setEditModalVisible(false);
            if (editDate) {
                setSelectedDateForPicker(editDate);
                setWorkoutPickerVisible(true);
                // Achtung: Wenn wir hier ein Workout wählen, wird 'onWorkoutSelected' aufgerufen.
                // Das fügt aktuell hinzu (addWorkoutToDate).
                // Wir wollen aber "Ersetzen"?
                // Das Original (Line 314) macht: savePlannedWorkout(dateKey, [...nextEntries, workout.id]) -> also HINZUFÜGEN.
                // Wenn man "Workout ändern" will, müsste man das alte löschen und das neue hinzufügen.
                // Im Original war das Verhalten: Es fügt einfach ein weiteres hinzu (sofern <3).
                // Falls voll -> Pech.
                // Ich lasse das Verhalten so, aber idealerweise wäre es "Replace".
                // TODO: Replace Logic implementieren? Ich lasse es wie Original.
            }
        }}
        onEditDetails={onEditDetails}
      />

      <PastWorkoutDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        date={detailsDate}
        completed={detailsCompleted}
        onToggleCompleted={() => setDetailsCompleted(v => !v)}
        durationMinutes={detailsDurationMinutes}
        onChangeDuration={setDetailsDurationMinutes}
        onSave={onSaveDetails}
        backgroundColor={backgroundColor}
      />

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
});




