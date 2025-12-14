import { Exercise } from '@/constants/exercises';
import { Workout } from '@/types/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKOUTS_KEY = '@backflow_workouts';
const CUSTOM_EXERCISES_KEY = '@backflow_custom_exercises';
const SETTINGS_KEY = '@backflow_settings';
const PLANNED_WORKOUTS_KEY = '@backflow_planned_workouts';
const PLANNER_SETTINGS_KEY = '@backflow_planner_settings';

export type TrainingReminderTimeOfDay = 'morning' | 'noon' | 'evening';

// Typ für Einstellungen
export interface BackflowSettings {
  // Globale Hintergrundfarbe für die gesamte App
  appBackgroundColor: string;
  // Trainings-Erinnerungen (Planner)
  trainingReminderEnabled: boolean;
  // Zeitpunkt der Erinnerung
  trainingReminderTimeOfDay: TrainingReminderTimeOfDay;
  // Piepton während des Workouts (Countdown / Phasenwechsel)
  enableBeep: boolean;
}

// Standard-Einstellungen
const DEFAULT_SETTINGS: BackflowSettings = {
  // Standard: komplett dunkel/schwarz
  appBackgroundColor: '#000000',
  trainingReminderEnabled: false,
  trainingReminderTimeOfDay: 'morning',
  enableBeep: true,
};

// Planner Types
export interface PlannedWorkoutsMap {
  [date: string]: string; // YYYY-MM-DD -> workoutId
}

export interface PlannerSettings {
  // 0=Sun, 1=Mon, ..., 6=Sat
  defaultSchedule: { [day: number]: string | null };
}

const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  defaultSchedule: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
};

// Einstellungen laden
export async function getSettings(): Promise<BackflowSettings> {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);

      // Migration: Basis sind Default-Settings, dann gespeicherte Settings
      let migrated: any = {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };

      // Falls noch ein alter exerciseBackgroundColor-Wert existiert,
      // übernehme ihn als appBackgroundColor.
      if (!migrated.appBackgroundColor && migrated.exerciseBackgroundColor) {
        migrated.appBackgroundColor = migrated.exerciseBackgroundColor;
      }

      // Bereinige alte Properties
      if (migrated.exerciseBackgroundColor) {
        delete migrated.exerciseBackgroundColor;
      }

      // Migration: alte Reminder Settings -> neue Planner Reminder Settings
      if (typeof migrated.enableReminders === 'boolean' && typeof migrated.trainingReminderEnabled !== 'boolean') {
        migrated.trainingReminderEnabled = migrated.enableReminders;
      }
      if (
        migrated.trainingReminderTimeOfDay !== 'morning' &&
        migrated.trainingReminderTimeOfDay !== 'noon' &&
        migrated.trainingReminderTimeOfDay !== 'evening'
      ) {
        migrated.trainingReminderTimeOfDay = DEFAULT_SETTINGS.trainingReminderTimeOfDay;
      }

      // alte Reminder-Properties entfernen
      if (migrated.enableReminders !== undefined) delete migrated.enableReminders;
      if (migrated.reminderDays !== undefined) delete migrated.reminderDays;

      const settings: BackflowSettings = {
        appBackgroundColor: migrated.appBackgroundColor || DEFAULT_SETTINGS.appBackgroundColor,
        trainingReminderEnabled:
          typeof migrated.trainingReminderEnabled === 'boolean'
            ? migrated.trainingReminderEnabled
            : DEFAULT_SETTINGS.trainingReminderEnabled,
        trainingReminderTimeOfDay: migrated.trainingReminderTimeOfDay,
        enableBeep:
          typeof migrated.enableBeep === 'boolean'
            ? migrated.enableBeep
            : DEFAULT_SETTINGS.enableBeep,
      };

      // Speichere migrierte Settings zurück
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

      return settings;
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Fehler beim Laden der Einstellungen:', error);
    return DEFAULT_SETTINGS;
  }
}

// Einstellungen speichern (führt Merge mit bestehenden Werten durch)
export async function updateSettings(
  partialSettings: Partial<BackflowSettings>
): Promise<BackflowSettings | null> {
  try {
    const current = await getSettings();
    const updated: BackflowSettings = {
      ...current,
      ...partialSettings,
    };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Fehler beim Speichern der Einstellungen:', error);
    return null;
  }
}

// Alle Workouts laden
export async function getWorkouts(): Promise<Workout[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(WORKOUTS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Fehler beim Laden der Workouts:', error);
    return [];
  }
}

// Workout speichern
export async function saveWorkout(workout: Workout): Promise<boolean> {
  try {
    const workouts = await getWorkouts();
    
    // Prüfe ob Workout mit dieser ID bereits existiert
    const existingIndex = workouts.findIndex((w) => w.id === workout.id);
    
    if (existingIndex >= 0) {
      // Aktualisiere existierendes Workout
      workouts[existingIndex] = workout;
    } else {
      // Füge neues Workout hinzu
      workouts.push(workout);
    }
    
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
    return true;
  } catch (error) {
    console.error('Fehler beim Speichern des Workouts:', error);
    return false;
  }
}

// Workout löschen
export async function deleteWorkout(id: string): Promise<boolean> {
  try {
    const workouts = await getWorkouts();
    const filteredWorkouts = workouts.filter((w) => w.id !== id);
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(filteredWorkouts));
    return true;
  } catch (error) {
    console.error('Fehler beim Löschen des Workouts:', error);
    return false;
  }
}

// Workout nach ID laden
export async function getWorkoutById(id: string): Promise<Workout | null> {
  try {
    const workouts = await getWorkouts();
    return workouts.find((w) => w.id === id) || null;
  } catch (error) {
    console.error('Fehler beim Laden des Workouts:', error);
    return null;
  }
}

// Benutzerdefinierte Übungen laden
export async function getCustomExercises(): Promise<Exercise[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Fehler beim Laden der benutzerdefinierten Übungen:', error);
    return [];
  }
}

// Benutzerdefinierte Übung speichern
export async function saveCustomExercise(exercise: Exercise): Promise<boolean> {
  try {
    const exercises = await getCustomExercises();
    
    // Prüfe ob Übung mit diesem Namen bereits existiert
    const existingIndex = exercises.findIndex((e) => e.name === exercise.name);
    
    if (existingIndex >= 0) {
      // Aktualisiere existierende Übung
      exercises[existingIndex] = exercise;
    } else {
      // Füge neue Übung hinzu
      exercises.push(exercise);
    }
    
    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(exercises));
    return true;
  } catch (error) {
    console.error('Fehler beim Speichern der Übung:', error);
    return false;
  }
}

// Benutzerdefinierte Übung löschen
export async function deleteCustomExercise(name: string): Promise<boolean> {
  try {
    const exercises = await getCustomExercises();
    const filteredExercises = exercises.filter((e) => e.name !== name);
    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(filteredExercises));
    return true;
  } catch (error) {
    console.error('Fehler beim Löschen der Übung:', error);
    return false;
  }
}

// --- Planner Storage ---

export async function getPlannerSettings(): Promise<PlannerSettings> {
  try {
    const jsonValue = await AsyncStorage.getItem(PLANNER_SETTINGS_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      const mergedDefaultSchedule = {
        ...DEFAULT_PLANNER_SETTINGS.defaultSchedule,
        ...(parsed?.defaultSchedule || {}),
      };
      // Ensure all days exist (0..6)
      for (let d = 0; d <= 6; d++) {
        if (mergedDefaultSchedule[d] === undefined) mergedDefaultSchedule[d] = null;
      }
      return {
        ...DEFAULT_PLANNER_SETTINGS,
        ...parsed,
        defaultSchedule: mergedDefaultSchedule,
      };
    }
    return DEFAULT_PLANNER_SETTINGS;
  } catch (error) {
    console.error('Fehler beim Laden der Planner Einstellungen:', error);
    return DEFAULT_PLANNER_SETTINGS;
  }
}

export async function updatePlannerSettings(
  partialSettings: Partial<PlannerSettings>
): Promise<PlannerSettings | null> {
  try {
    const current = await getPlannerSettings();
    const nextDefaultSchedule = {
      ...current.defaultSchedule,
      ...(partialSettings.defaultSchedule || {}),
    };
    for (let d = 0; d <= 6; d++) {
      if (nextDefaultSchedule[d] === undefined) nextDefaultSchedule[d] = null;
    }
    const updated: PlannerSettings = {
      ...current,
      ...partialSettings,
      defaultSchedule: nextDefaultSchedule,
    };
    await AsyncStorage.setItem(PLANNER_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Fehler beim Speichern der Planner Einstellungen:', error);
    return null;
  }
}

export async function getPlannedWorkouts(): Promise<PlannedWorkoutsMap> {
  try {
    const jsonValue = await AsyncStorage.getItem(PLANNED_WORKOUTS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (error) {
    console.error('Fehler beim Laden der geplanten Workouts:', error);
    return {};
  }
}

export async function savePlannedWorkout(date: string, workoutId: string): Promise<boolean> {
  try {
    const planned = await getPlannedWorkouts();
    planned[date] = workoutId;
    await AsyncStorage.setItem(PLANNED_WORKOUTS_KEY, JSON.stringify(planned));
    return true;
  } catch (error) {
    console.error('Fehler beim Speichern des geplanten Workouts:', error);
    return false;
  }
}

export async function deletePlannedWorkout(date: string): Promise<boolean> {
  try {
    const planned = await getPlannedWorkouts();
    delete planned[date];
    await AsyncStorage.setItem(PLANNED_WORKOUTS_KEY, JSON.stringify(planned));
    return true;
  } catch (error) {
    console.error('Fehler beim Löschen des geplanten Workouts:', error);
    return false;
  }
}
