// Übungstypen
export type ExerciseType = 'duration' | 'reps';

// Interface für Übungen
export interface Exercise {
  name: string;
  type: ExerciseType;
  amount: number; // Sekunden bei 'duration', Anzahl bei 'reps'
  instructions: string;
  image: string | number; // String für URLs, Number für require()
}

// Übungen für das BackFlow Workout
export const EXERCISES: Exercise[] = [
  {
    name: 'Plank',
    type: 'duration',
    amount: 40,
    instructions: 'Unterarmstütz halten, Körper gerade ausrichten',
    image: 'https://placehold.co/600x400/png?text=Plank',
  },
  {
    name: 'Superman',
    type: 'duration',
    amount: 40,
    instructions: 'Bauchlage, Arme und Beine gleichzeitig anheben',
    image: 'https://placehold.co/600x400/png?text=Superman',
  },
  {
    name: 'Bird-Dog',
    type: 'duration',
    amount: 40,
    instructions: 'Vierfüßlerstand, diagonal Arm und Bein strecken',
    image: 'https://placehold.co/600x400/png?text=Bird-Dog',
  },
  {
    name: 'Glute Bridge',
    type: 'duration',
    amount: 40,
    instructions: 'Rückenlage, Hüfte nach oben drücken, Gesäß anspannen',
    image: 'https://placehold.co/600x400/png?text=Glute%20Bridge',
  },
  {
    name: 'Cat-Cow',
    type: 'duration',
    amount: 40,
    instructions: 'Vierfüßlerstand, Wirbelsäule abwechselnd krümmen und strecken',
    image: 'https://placehold.co/600x400/png?text=Cat-Cow',
  },
  {
    name: 'Sit-Ups',
    type: 'reps',
    amount: 30,
    instructions: 'Rückenlage, Oberkörper aufrichten',
    image: 'https://placehold.co/600x400/png?text=Sit-Ups',
  },
  // Platzhalter für weitere Übungen - kann später ergänzt werden
  // {
  //   name: 'Dead Bug',
  //   type: 'duration',
  //   amount: 40,
  //   instructions: '...',
  // },
];

// Mapping von Übungsnamen zu Bildern (für lokale Bilder)
export const EXERCISE_IMAGE_MAP: Record<string, number> = {
  'Plank': require('../assets/images/plank.png'),
  'Superman': require('../assets/images/superman.png'),
  'Bird-Dog': require('../assets/images/birddog.png'),
};

// Funktion zum Abrufen des Bildes für eine Übung
export function getExerciseImage(exerciseName: string, fallbackImage: string | number): string | number {
  // Wenn es ein lokales Bild gibt, verwende es
  if (EXERCISE_IMAGE_MAP[exerciseName]) {
    return EXERCISE_IMAGE_MAP[exerciseName];
  }
  // Sonst verwende das Fallback-Bild (URL oder require)
  return fallbackImage;
}

// Hilfsfunktion zum Erstellen der Image-Source für React Native Image-Komponenten
export function getImageSource(exerciseName: string, fallbackImage: string | number | undefined) {
  const image = getExerciseImage(exerciseName, fallbackImage || '');
  return typeof image === 'number' ? image : { uri: image };
}

// Workout-Konfiguration
export const EXERCISE_DURATION = 40; // Sekunden (Standard für duration-Übungen)
export const REST_DURATION = 20; // Sekunden
export const GET_READY_DURATION = 5; // Sekunden
export const TOTAL_ROUNDS = 5;
