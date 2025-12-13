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
// Hinweis: Diese Liste enthält sowohl das ursprüngliche Kern-Set
// als auch zusätzliche Übungen, damit du direkt ca. 15+ sinnvolle
// Standard-Übungen zur Auswahl hast.
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
    instructions:
      'Vierfüßlerstand, Wirbelsäule abwechselnd krümmen (Cat) und strecken (Cow)',
    image: 'https://placehold.co/600x400/png?text=Cat-Cow',
  },
  {
    name: 'Sit-Ups',
    type: 'reps',
    amount: 30,
    instructions: 'Rückenlage, Füße aufstellen, Oberkörper kontrolliert aufrollen',
    image: 'https://placehold.co/600x400/png?text=Sit-Ups',
  },
  {
    name: 'Side Plank links',
    type: 'duration',
    amount: 30,
    instructions:
      'Seitstütz auf dem linken Unterarm, Körper in einer Linie halten',
    image: 'https://placehold.co/600x400/png?text=Side+Plank+L',
  },
  {
    name: 'Side Plank rechts',
    type: 'duration',
    amount: 30,
    instructions:
      'Seitstütz auf dem rechten Unterarm, Körper in einer Linie halten',
    image: 'https://placehold.co/600x400/png?text=Side+Plank+R',
  },
  {
    name: 'Reverse Plank',
    type: 'duration',
    amount: 30,
    instructions:
      'Rückenlage, auf Hände/Unterarme stützen und Hüfte anheben, Körper bildet eine Linie',
    image: 'https://placehold.co/600x400/png?text=Reverse+Plank',
  },
  {
    name: 'Dead Bug',
    type: 'duration',
    amount: 40,
    instructions:
      'Rückenlage, Arme nach oben, Beine 90°, diagonal Arm und Bein langsam senken',
    image: 'https://placehold.co/600x400/png?text=Dead+Bug',
  },
  {
    name: 'Knie zur Brust',
    type: 'duration',
    amount: 40,
    instructions:
      'Rückenlage, abwechselnd ein Knie zur Brust ziehen, Lendenwirbelsäule am Boden halten',
    image: 'https://placehold.co/600x400/png?text=Knie+zur+Brust',
  },
  {
    name: 'Childs Pose',
    type: 'duration',
    amount: 40,
    instructions:
      'Aus dem Fersensitz Oberkörper nach vorne sinken lassen, Arme lang nach vorn strecken',
    image: 'https://placehold.co/600x400/png?text=Childs+Pose',
  },
  {
    name: 'Rumpfrotation im Sitz',
    type: 'duration',
    amount: 40,
    instructions:
      'Aufrecht sitzen, Hände vor der Brust, Oberkörper langsam von Seite zu Seite rotieren',
    image: 'https://placehold.co/600x400/png?text=Rotation',
  },
  {
    name: 'Hip Hinge',
    type: 'reps',
    amount: 15,
    instructions:
      'Hüftbeuge in aufrechter Position: Gesäß nach hinten schieben, Rücken bleibt gerade',
    image: 'https://placehold.co/600x400/png?text=Hip+Hinge',
  },
  {
    name: 'Wall Sit',
    type: 'duration',
    amount: 30,
    instructions:
      'Mit dem Rücken an die Wand gelehnt in Sitzposition (90° Knie) halten, Rumpf aktiv',
    image: 'https://placehold.co/600x400/png?text=Wall+Sit',
  },
];

// Mapping von Übungsnamen zu Bildern (für lokale Bilder)
export const EXERCISE_IMAGE_MAP: Record<string, number> = {
  'Plank': require('../assets/images/plank.png'),
  'Superman': require('../assets/images/superman.png'),
  'Bird-Dog': require('../assets/images/birddog.png'),
};

// Fallback-Bild, wenn keine spezifische Zuordnung oder URL vorhanden ist
const DEFAULT_EXERCISE_IMAGE = require('../assets/images/default.png');

// Funktion zum Abrufen des Bildes für eine Übung
export function getExerciseImage(
  exerciseName: string,
  fallbackImage?: string | number
): string | number {
  // 1) Wenn es ein lokales Bild für den Übungsnamen gibt, verwende es
  if (EXERCISE_IMAGE_MAP[exerciseName]) {
    return EXERCISE_IMAGE_MAP[exerciseName];
  }

  // 2) Wenn ein lokales Fallback (require) übergeben wurde, verwende es
  if (typeof fallbackImage === 'number') {
    return fallbackImage;
  }

  // 3) Für Strings (z.B. alte Platzhalter-URLs) und fehlende Werte:
  //    immer das Default-Bild verwenden
  return DEFAULT_EXERCISE_IMAGE;
}

// Hilfsfunktion zum Erstellen der Image-Source für React Native Image-Komponenten
export function getImageSource(
  exerciseName: string,
  fallbackImage?: string | number
) {
  const image = getExerciseImage(exerciseName, fallbackImage);
  return typeof image === 'number' ? image : { uri: image };
}

// Workout-Konfiguration
export const EXERCISE_DURATION = 40; // Sekunden (Standard für duration-Übungen)
export const REST_DURATION = 20; // Sekunden
export const GET_READY_DURATION = 5; // Sekunden
export const TOTAL_ROUNDS = 5;
