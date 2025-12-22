import { Workout } from '@/types/interfaces';
import { toLocalDateKey, toUtcDateKey } from '@/utils/date';
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
import { useCallback, useState } from 'react';

export function usePlannerData() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkoutsMap>({});
  const [plannerSettings, setPlannerSettings] = useState<PlannerSettings>({ defaultSchedule: {} });
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
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

  const todayKey = toLocalDateKey(new Date());

  const getEntriesForDate = useCallback(
    (date: Date): PlannedWorkoutEntry[] => {
      const localKey = toLocalDateKey(date);
      const utcKey = toUtcDateKey(date);
      const manual = plannedWorkouts[localKey] ?? plannedWorkouts[utcKey];

      const validWorkoutIds = new Set(workouts.map((w) => w.id));
      const isPast = localKey < todayKey;

      let entries: PlannedWorkoutEntry[] = [];

      if (manual !== undefined) {
        entries = normalizePlannedValueToEntries(manual as PlannedWorkoutsStoredValue);
      } else {
        const dow = date.getDay();
        const defaultIds = Array.isArray(plannerSettings.defaultSchedule[dow])
          ? plannerSettings.defaultSchedule[dow]
          : [];
        entries = defaultIds
          .filter((id): id is string => typeof id === 'string' && id.trim() !== '')
          .map((id) => ({ workoutId: id }));
      }

      const filtered = entries.filter(
        (entry) =>
          !!entry.workoutId &&
          (isPast || validWorkoutIds.has(entry.workoutId))
      );

      return filtered.slice(0, 3);
    },
    [plannedWorkouts, plannerSettings, todayKey, workouts]
  );

  const getWorkoutById = useCallback(
    (id: string): Workout | null => {
      return workouts.find((w) => w.id === id) ?? null;
    },
    [workouts]
  );

  const addWorkoutToDate = useCallback(
    async (date: Date, workoutId: string) => {
      const dateKey = toLocalDateKey(date);
      const existing = plannedWorkouts[dateKey];
      const nextEntries =
        existing === undefined ? [] : normalizePlannedValueToEntries(existing as any);
      
      // Safety check: max 3
      if (nextEntries.length >= 3) return;

      await savePlannedWorkout(dateKey, [...nextEntries, workoutId].slice(0, 3));
      await loadData();
      await rescheduleTrainingReminders();
    },
    [plannedWorkouts, loadData]
  );

  const removeWorkoutFromDate = useCallback(
    async (date: Date, entryIndex: number) => {
      const key = toLocalDateKey(date);
      const existing = plannedWorkouts[key];
      // Wir müssen sicherstellen, dass wir den "echten" manuellen Eintrag bearbeiten.
      // Falls es bisher Default war, wird es durch das Speichern zu Manual.
      // Aber removeWorkoutFromDate wird typischerweise aufgerufen, wenn man einen existierenden Eintrag löscht.
      // Wenn es ein Default-Eintrag war, müssen wir erst die Default-Liste holen und dann den einen entfernen.
      
      let entries: PlannedWorkoutEntry[] = [];
      if (existing !== undefined) {
         entries = normalizePlannedValueToEntries(existing as any);
      } else {
        // Fallback auf Default Schedule, falls noch kein manueller Eintrag existiert
        // (Das passiert, wenn man einen Default-Eintrag löscht)
        const entriesFromDefault = getEntriesForDate(date);
        entries = [...entriesFromDefault]; 
      }

      const next = entries.filter((_, i) => i !== entryIndex);
      await savePlannedWorkout(key, next.length === 0 ? '' : next); // '' bedeutet leerer Eintrag (Pause/Leer) vs undefined (Default)
      // Moment: '' speichert "Pause" (explizit leer). Das ist korrekt, wenn man alle löscht.
      
      await loadData();
      await rescheduleTrainingReminders();
    },
    [plannedWorkouts, getEntriesForDate, loadData]
  );

  const updateWorkoutDetails = useCallback(
    async (
      date: Date,
      workoutId: string,
      completed: boolean,
      durationMinutes?: number
    ) => {
      const dateKey = toLocalDateKey(date);
      
      // Wir müssen hier aufpassen: Wir wollen einen *spezifischen* Eintrag updaten oder hinzufügen?
      // Die Original-Logik war: append entry. Aber "Details bearbeiten" klingt nach Update.
      // Im Original: `saveDetailsForPast` macht `[...nextEntries, entry]`. Es fügt also hinzu!
      // Das ist etwas seltsam für "Details bearbeiten". 
      // Aber in `planner.tsx` -> `handleSelectWorkout` (für Past) -> ruft Modal auf -> saveDetailsForPast.
      // Das ist also "Add with Details".
      
      // Aber es gibt auch "Edit Details" im Edit Modal.
      // `planner.tsx` Zeile 650: `setDetailsDate(editDate)...`.
      // Dann `saveDetailsForPast`... das fügt hinzu?!
      // WARTE. Im Original `saveDetailsForPast` nimmt `plannedWorkouts[dateKey]`, normalisiert es, und pusht den neuen Entry.
      // Wenn ich einen *vorhandenen* Eintrag bearbeite, würde das Original ihn duplizieren?
      // Check Original Line 650: Es setzt State. Dann Save Button -> `saveDetailsForPast`.
      // Line 351: `[...nextEntries, entry]`.
      // JA, das Original hat einen Bug oder ich verstehe es falsch. Wenn ich einen existierenden Eintrag bearbeite, wird er angehängt?
      // Ah, das "Edit Modal" hat "Details bearbeiten" nur für `editingIsPast`.
      // Wenn man da drauf klickt, öffnet sich das Details Modal.
      // Wenn man dort speichert, wird `saveDetailsForPast` gerufen.
      // Und das macht `push`. 
      // Das sieht tatsächlich so aus, als würde es einen NEUEN Eintrag hinzufügen, statt den alten zu updaten.
      // Das würde erklären, warum man "Vergangene Tage können nicht bearbeitet werden" (Move) hat, aber Details schon.
      // Vermutlich ist die Idee: Man fügt nachträglich ein Training hinzu.
      // Aber "Details bearbeiten" an einem existierenden Eintrag sollte diesen updaten.
      
      // Ich werde versuchen, es "richtig" zu machen: Update, wenn ID und Index matchen?
      // Da ich keine IDs für Einträge habe (nur Index), ist das schwer.
      // Ich baue `updateWorkoutEntry` das per Index arbeitet.
      
      const entry: PlannedWorkoutEntry = {
        workoutId,
        completed,
        durationMinutes,
      };

      // Hier nehmen wir an, wir fügen hinzu (wie Original 'saveDetailsForPast' im 'Add'-Kontext)
      // Ich splitte das lieber auf.
      
      const existing = plannedWorkouts[dateKey];
      const nextEntries = existing === undefined ? [] : normalizePlannedValueToEntries(existing as any);
      await savePlannedWorkout(dateKey, [...nextEntries, entry].slice(0, 3));
      await loadData();
      await rescheduleTrainingReminders();
    },
    [plannedWorkouts, loadData]
  );
  
  // Funktion zum expliziten Updaten eines existierenden Eintrags (für Edit Modal -> Details)
  // Das fehlte wohl im Original oder war buggy? 
  // Im Original: `openEditForEntry` -> setzt `editEntryIndex`.
  // Aber `saveDetailsForPast` nutzt `editEntryIndex` NICHT. Es ignoriert ihn.
  // Das ist definitiv ein Bug im Original-Code: "Details bearbeiten" fügt das Training nochmal hinzu.
  // Ich werde das hier korrigieren: `updateEntryAtIndex`.
  const updateEntryAtIndex = useCallback(async (date: Date, index: number, updates: Partial<PlannedWorkoutEntry>) => {
      const key = toLocalDateKey(date);
      // Bestehende Einträge laden (oder Default materialisieren)
      let entries = getEntriesForDate(date);
      
      if (index >= 0 && index < entries.length) {
          const old = entries[index];
          entries[index] = { ...old, ...updates };
          await savePlannedWorkout(key, entries);
          await loadData();
          await rescheduleTrainingReminders();
      }
  }, [getEntriesForDate, loadData]);

  const moveWorkout = useCallback(
    async (fromDate: Date, toDate: Date, workoutId: string) => {
        // ... (Logik aus moveWorkoutToDate)
        // Checks müssen im UI passieren oder hier Error werfen.
        // Ich übernehme die Core-Logik.
        
        const fromKey = toLocalDateKey(fromDate);
        const toKey = toLocalDateKey(toDate);
        
        // Remove from Source
        const fromEntries = getEntriesForDate(fromDate);
        // Finde den Eintrag (wir nehmen den ersten passenden, falls doppelt)
        const idx = fromEntries.findIndex(e => e.workoutId === workoutId);
        if (idx === -1) return; // Nichts zu tun
        
        const remaining = fromEntries.filter((_, i) => i !== idx);
        await savePlannedWorkout(fromKey, remaining.length === 0 ? '' : remaining);

        // Add to Target
        // Achtung: getEntriesForDate gibt Default zurück, wenn noch nichts gespeichert.
        // Wir müssen sicherstellen, dass wir das manualisieren.
        const toEntries = getEntriesForDate(toDate);
        if (toEntries.length >= 3) {
            throw new Error('TARGET_FULL');
        }
        await savePlannedWorkout(toKey, [...toEntries, { workoutId }].slice(0, 3));
        
        await loadData();
        await rescheduleTrainingReminders();
    },
    [getEntriesForDate, loadData]
  );

  return {
    workouts,
    plannedWorkouts,
    plannerSettings,
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
  };
}




