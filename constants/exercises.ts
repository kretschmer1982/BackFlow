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
  summary?: string;
}

export interface Warmup {
  id: string;
  name: string;
  segments: Exercise[];
  summary?: string;
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

export const WARM_UP_SEGMENTS: Exercise[] = [
  {
    id: 'warmup-1',
    name: 'Warm-up: Ankommen & Schultern',
    type: 'duration',
    amount: 60,
    instructions:
      'Hey, schön dass du da bist! Komm auf deine Matte, stell dich hüftbreit und locker hin. Die Knie sind leicht gebeugt. Wir schalten den Alltag aus und den Körper an. Atme tief durch die Nase ein, nimm die Arme über die Seite hoch, mach dich riesengroß und durch den Mund ausatmen, Arme fallen lassen. Noch zweimal: Einatmen, Länge suchen, Ausatmen, loslassen.',
    source: 'standard',
    summary: 'Ankommen, Atmen & Schultern lockern mit langsamen Kreisen.',
  },
  {
    id: 'warmup-2',
    name: 'Warm-up: Flanken öffnen',
    type: 'duration',
    amount: 60,
    instructions:
      'Bleib stabil stehen, bau Spannung im Bauch auf, zieh den Bauchnabel leicht nach innen. Nimm die Arme hoch, greif abwechselnd mit rechts und links zur Decke, stell dir vor, du willst oben einen Apfel pflücken. Zieh dich aus der Taille raus, mach dich lang, die Füße bleiben am Boden kleben. Rechts, links, rechts, links.',
    source: 'standard',
    summary: 'Seitliche Dehnung, Flanken öffnen und Spannung nach oben ziehen.',
  },
  {
    id: 'warmup-3',
    name: 'Warm-up: Rotation & Pendel',
    type: 'duration',
    amount: 60,
    instructions:
      'Komm zurück zur Mitte, lockere kurz die Beine. Lass die Arme locker hängen, beginne den Oberkörper locker von rechts nach links zu drehen, die Arme fliegen mit wie bei einer pendelnden Trommel. Der Blick geht mit über die Schulter nach hinten. Halte das Becken stabil, die Drehung kommt aus der Brustwirbelsäule. Atme fließend weiter, klopf dir mit den Händen leicht auf den unteren Rücken und die Nieren.',
    source: 'standard',
    summary: 'Locker pendelnde Rotation aus der Brustwirbelsäule.',
  },
  {
    id: 'warmup-4',
    name: 'Warm-up: Katze & Kuh im Stand',
    type: 'duration',
    amount: 60,
    instructions:
      'Pendel dich langsam in der Mitte aus. Stütz deine Hände auf die Oberschenkel, knapp oberhalb der Knie, Rücken gerade, Po etwas nach hinten. Atme aus, zieh das Kinn zur Brust, mach den Rücken rund und schieb die Wirbelsäule zur Decke. Atme ein, heb den Brustkorb, geh in ein leichtes Hohlkreuz, Blick hebt sich. Wieder rund, jeden Wirbel einzeln durchbewegen, mach das noch dreimal in deinem Atemrhythmus.',
    source: 'standard',
    summary: 'Stehende Katze-Kuh: Wirbelsäule rund und gestreckt durchatmen.',
  },
  {
    id: 'warmup-5',
    name: 'Warm-up: Beine & Rücken aktivieren',
    type: 'duration',
    amount: 60,
    instructions:
      'Richte dich langsam auf. Stell dich etwas breiter als hüftbreit, geh tief in die Kniebeuge und nimm die Arme nach vorne. Beim Hochkommen zieh die Ellbogen kraftvoll nach hinten, als würdest du rudern, und kneif die Schulterblätter zusammen. Tief – hoch. Halte die Knie außen, spann den Po an.',
    source: 'standard',
    summary: 'Squat & Row: Beine tief, Schultern aktiv und warm.',
  },
  {
    id: 'warmup-6',
    name: 'Warm-up: Lockeres Abklopfen',
    type: 'duration',
    amount: 60,
    instructions:
      'Schüttle die Arme locker aus, lass sie vibrieren. Klopfe mit den Handflächen an die Oberschenkel, dann an die Schultern, spüre wie Wärme kommt. Atme ruhig weiter und nimm den ersten Herzschlag wahr.',
    source: 'standard',
    summary: 'Locker ausklingen lassen mit Vibration und Atem.',
  },
];

export const EXERCISES: Exercise[] = [...STANDARD_EXERCISES];

export const WARM_UP_LIBRARY: Warmup[] = [
  {
    id: 'default',
    name: 'Warm-up: Ankommen & Schultern',
    segments: WARM_UP_SEGMENTS,
    summary: 'Sanftes Ankommen, Atmung und Mobilisierung der Schultern.',
  },
];

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