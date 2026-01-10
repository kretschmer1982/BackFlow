// Demo-Workouts für Seeding und Tests
import { Workout } from '@/types/interfaces';

// Demo-Workout: Starke Mitte (für Planner-Dienstag)
export const DEMO_STARKE_MITTE: Workout = {
  id: 'demo-starke-mitte',
  name: 'Starke Mitte',
  exercises: [
    { id: '1', name: 'Plank', type: 'duration', amount: 60, instructions: 'Unterarmstütz halten' },
    { id: '2', name: 'Seitstütz', type: 'duration', amount: 30, instructions: 'Seitstütz auf Unterarm' },
  ],
  createdAt: 0,
};

// Demo-Workout: Rücken-Fit (für Planner-Samstag)
export const DEMO_RUECKEN_FIT: Workout = {
  id: 'demo-ruecken-fit',
  name: 'Rücken-Fit',
  exercises: [
    { id: '1', name: 'Katze-Kuh', type: 'duration', amount: 30, instructions: 'Vierfüßlerstand, Wirbelsäule runden und strecken' },
    { id: '2', name: 'Schwimmer', type: 'duration', amount: 45, instructions: 'Bauchlage, Arme und Beine diagonal heben' },
  ],
  createdAt: 0,
};

// Demo-Workout: Planner Test Workout (für allgemeine Tests)
export const DEMO_PLANNER_TEST: Workout = {
  id: 'demo-planner-test-workout',
  name: 'Planner Test Workout',
  exercises: [
    { id: '1', name: 'Unterarmstütz', type: 'duration', amount: 40, instructions: '' },
    { id: '2', name: 'Supermann', type: 'duration', amount: 40, instructions: '' },
    { id: '3', name: 'Diagonaler Vierfüßlerstand', type: 'duration', amount: 40, instructions: '' },
    { id: '4', name: 'Brücke', type: 'duration', amount: 40, instructions: '' },
  ],
  createdAt: 0,
};

// Alle Demo-Workouts als Array
export const DEMO_WORKOUTS: Workout[] = [
  DEMO_STARKE_MITTE,
  DEMO_RUECKEN_FIT,
  DEMO_PLANNER_TEST,
];
