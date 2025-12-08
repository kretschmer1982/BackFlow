import { Exercise } from '@/constants/exercises';

// Workout-Übung: Kann die Standard-Übung überschreiben
export interface WorkoutExercise extends Exercise {
  image?: string | number;
  // Alle Felder von Exercise sind vorhanden, können aber überschrieben werden
}

// Workout Interface
export interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt?: number; // Timestamp für Sortierung
}

