import { Exercise } from '@/constants/exercises';
import { Workout } from '@/types/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKOUTS_KEY = '@backflow_workouts';
const CUSTOM_EXERCISES_KEY = '@backflow_custom_exercises';
const SETTINGS_KEY = '@backflow_settings';

// Typ für Einstellungen
export interface BackflowSettings {
  // Globale Hintergrundfarbe für die gesamte App
  appBackgroundColor: string;
  // Trainings-Erinnerungen
  enableReminders: boolean;
  // Ausgewählte Wochentage für Erinnerungen (z.B. 'mon', 'tue', ...)
  reminderDays: string[];
  // Piepton während des Workouts (Countdown / Phasenwechsel)
  enableBeep: boolean;
}

// Standard-Einstellungen
const DEFAULT_SETTINGS: BackflowSettings = {
  // Standard: komplett dunkel/schwarz
  appBackgroundColor: '#000000',
  enableReminders: false,
  reminderDays: [],
   enableBeep: true,
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

      // ReminderDays immer als Array sicherstellen
      if (!Array.isArray(migrated.reminderDays)) {
        migrated.reminderDays = [];
      }

      const settings: BackflowSettings = {
        appBackgroundColor: migrated.appBackgroundColor || DEFAULT_SETTINGS.appBackgroundColor,
        enableReminders:
          typeof migrated.enableReminders === 'boolean'
            ? migrated.enableReminders
            : DEFAULT_SETTINGS.enableReminders,
        reminderDays: migrated.reminderDays,
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

