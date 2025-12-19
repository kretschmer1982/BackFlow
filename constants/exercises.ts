// Übungstypen
import { AUTO_EXERCISE_IMAGE_MAP } from '@/constants/generatedExerciseImages';

export type ExerciseType = 'duration' | 'reps';
export type ExerciseEquipment = 'Kurzhantel' | 'Gymnastikball';
export type ExerciseSource = 'standard' | 'custom';

// Interface für Übungen, inklusive Quellenangabe für spätere Cloud-Synchronisation
export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  amount: number; // Sekunden bei 'duration', Anzahl bei 'reps'
  instructions: string;
  image?: string | number; // optional, hängt vor allem von benutzerdefinierten Übungen ab
  equipment?: ExerciseEquipment;
  source?: ExerciseSource;
}

const DEFAULT_AVATAR_IMAGE: number = require('../assets/images/avatar_default.png');

const STANDARD_EXERCISES: Exercise[] = [
  {
    id: '1',
    name: 'Unterarmstütz',
    type: 'duration',
    amount: 40,
    instructions: 'Unterarmstütz halten, Körper gerade ausrichten',
    source: 'standard',
  },
  {
    id: '2',
    name: 'Supermann',
    type: 'duration',
    amount: 40,
    instructions: 'Bauchlage, Arme und Beine gleichzeitig anheben',
    source: 'standard',
  },
  {
    id: '3',
    name: 'Diagonaler Vierfüßlerstand',
    type: 'duration',
    amount: 40,
    instructions: 'Vierfüßlerstand, diagonal Arm und Bein strecken',
    source: 'standard',
  },
  {
    id: '4',
    name: 'Brücke',
    type: 'duration',
    amount: 40,
    instructions: 'Rückenlage, Hüfte nach oben drücken, Gesäß anspannen',
    source: 'standard',
  },
  {
    id: '5',
    name: 'Katze-Kuh',
    type: 'duration',
    amount: 40,
    instructions: 'Vierfüßlerstand, Wirbelsäule abwechselnd runden (Katze) und strecken (Kuh)',
    source: 'standard',
  },
  {
    id: '6',
    name: 'Crunches',
    type: 'reps',
    amount: 25,
    instructions: 'Rückenlage, Oberkörper kontrolliert Richtung Knie ziehen',
    source: 'standard',
  },
  {
    id: '7',
    name: 'Beinheben',
    type: 'reps',
    amount: 20,
    instructions: 'Rückenlage, Beine gestreckt anheben und kontrolliert absenken',
    source: 'standard',
  },
  {
    id: '8',
    name: 'Russische Drehung',
    type: 'reps',
    amount: 30,
    instructions: 'Sitzposition, Oberkörper drehen, Hände vor der Brust halten',
    source: 'standard',
  },
  {
    id: '9',
    name: 'Seitstütz links',
    type: 'duration',
    amount: 30,
    instructions: 'Seitstütz auf dem linken Unterarm, Körper in einer Linie halten',
    source: 'standard',
  },
  {
    id: '10',
    name: 'Seitstütz rechts',
    type: 'duration',
    amount: 30,
    instructions: 'Seitstütz auf dem rechten Unterarm, Körper in einer Linie halten',
    source: 'standard',
  },
  {
    id: '11',
    name: 'Umgekehrte Planke',
    type: 'duration',
    amount: 30,
    instructions: 'Rückenlage, auf Hände/Unterarme stützen und Hüfte anheben, Körper bildet eine Linie',
    source: 'standard',
  },
  {
    id: '12',
    name: 'Kindhaltung',
    type: 'duration',
    amount: 40,
    instructions: 'Aus dem Fersensitz Oberkörper nach vorne sinken lassen, Arme lang nach vorn strecken',
    source: 'standard',
  },
  {
    id: '13',
    name: 'Rumpfrotation im Sitz',
    type: 'duration',
    amount: 40,
    instructions: 'Aufrecht sitzen, Hände vor der Brust, Oberkörper langsam von Seite zu Seite rotieren',
    source: 'standard',
  },
  {
    id: '14',
    name: 'Hüftbeuge',
    type: 'reps',
    amount: 15,
    instructions: 'Hüftbeuge in aufrechter Position: Gesäß nach hinten schieben, Rücken bleibt gerade',
    source: 'standard',
  },
  {
    id: '15',
    name: 'Kurzhantel-Russische Drehung',
    type: 'reps',
    amount: 20,
    instructions: 'Sitzend, Oberkörper leicht zurückgelehnt, Kurzhantel mit beiden Händen seitlich drehen',
    equipment: 'Kurzhantel',
    source: 'standard',
  },
  {
    id: '16',
    name: 'Kurzhantel-Hollow Hold',
    type: 'duration',
    amount: 30,
    instructions: 'Rückenlage, Beine und Oberkörper heben, Kurzhantel über Kopf halten',
    equipment: 'Kurzhantel',
    source: 'standard',
  },
  {
    id: '17',
    name: 'Kurzhantel-Rumänisches Kreuzheben',
    type: 'reps',
    amount: 15,
    instructions: 'Stehend, Rumpf nach vorn kippen, Kurzhanteln nah am Körper führen',
    equipment: 'Kurzhantel',
    source: 'standard',
  },
  {
    id: '18',
    name: 'Kurzhantel-Side Plank Row',
    type: 'reps',
    amount: 12,
    instructions: 'Seitstütz, Kurzhantel seitlich nach oben ziehen, Rumpf stabil halten',
    equipment: 'Kurzhantel',
    source: 'standard',
  },
  {
    id: '19',
    name: 'Kurzhantel-Goblet Squat',
    type: 'reps',
    amount: 15,
    instructions: 'Stehend, Kurzhantel vor der Brust halten, tief in die Hocke gehen',
    equipment: 'Kurzhantel',
    source: 'standard',
  },
  {
    id: '20',
    name: 'Gymnastikball-Atmung',
    type: 'duration',
    amount: 40,
    instructions: 'Im Sitzen auf dem Ball, lange Ausatmung und Oberkörper entspannt nach vorne sinken',
    equipment: 'Gymnastikball',
    source: 'standard',
  },
  {
    id: '21',
    name: 'Gymnastikball-Beckenmobilisation',
    type: 'duration',
    amount: 30,
    instructions: 'Im Sitzen kreisende Beckenbewegungen ausführen, Ball unterstützt Sitzhaltung',
    equipment: 'Gymnastikball',
    source: 'standard',
  },
  {
    id: '22',
    name: 'Gymnastikball-Brustkreisen',
    type: 'reps',
    amount: 16,
    instructions: 'Stehend, Ball vor dem Körper halten, Arme in gleichmäßigen Kreisen öffnen',
    equipment: 'Gymnastikball',
    source: 'standard',
  },
  {
    id: '23',
    name: 'Gymnastikball-Rückenroll',
    type: 'reps',
    amount: 12,
    instructions: 'Mit dem Rücken auf dem Ball, langsam vor- und zurückrollen, Mobilisation Wirbelsäule',
    equipment: 'Gymnastikball',
    source: 'standard',
  },
  {
    id: '24',
    name: 'Gymnastikball-Hüftöffner',
    type: 'duration',
    amount: 30,
    instructions: 'Seitlich auf dem Ball, oberes Bein über den Ball legen, Hüfte leicht öffnen',
    equipment: 'Gymnastikball',
    source: 'standard',
  },
];

export const EXERCISES: Exercise[] = [...STANDARD_EXERCISES];

function normalizeImageValue(value?: string | number): string | number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return undefined;
}

export function getExerciseImage(exercise?: Exercise | null, fallbackImage?: string | number): string | number {
  const assetId = exercise?.id;
  if (assetId && AUTO_EXERCISE_IMAGE_MAP[assetId]) {
    return AUTO_EXERCISE_IMAGE_MAP[assetId];
  }

  const exerciseImage = normalizeImageValue(exercise?.image);
  if (exerciseImage) {
    return exerciseImage;
  }

  const fallback = normalizeImageValue(fallbackImage);
  if (fallback) {
    return fallback;
  }

  return DEFAULT_AVATAR_IMAGE;
}

export function getImageSource(exercise: Exercise, fallbackImage?: string | number) {
  const image = getExerciseImage(exercise, fallbackImage);
  return typeof image === 'number' ? image : { uri: image };
}

export const EXERCISE_DURATION = 40; // Sekunden (Standard für duration-Übungen)
export const REST_DURATION = 20; // Sekunden
export const GET_READY_DURATION = 20; // Sekunden (Default, kann in Settings überschrieben werden)
export const TOTAL_ROUNDS = 5;