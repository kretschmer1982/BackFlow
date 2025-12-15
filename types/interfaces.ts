import { Exercise } from '@/constants/exercises';

// Workout-Übung: Kann die Standard-Übung überschreiben
export interface WorkoutExercise extends Exercise {
  image?: string | number;
  // Eindeutige Instanz-ID, um mehrere Vorkommen derselben Übung unterscheiden zu können
  instanceId?: string;
  // Alle Felder von Exercise sind vorhanden, können aber überschrieben werden
}

// Workout Interface
export interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  // Optional: manuell erfasste Gesamtzeit (Minuten) – für Statistik/Planung
  totalMinutes?: number;
  createdAt?: number; // Timestamp für Sortierung
}

