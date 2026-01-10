// Seeding-Funktion für Demo-Workouts
import { DEMO_RUECKEN_FIT, DEMO_STARKE_MITTE, DEMO_WORKOUTS } from '@/constants/workouts';
import { toLocalDateKey } from '@/utils/date';
import { savePlannedWorkout, saveWorkout, updatePlannerSettings } from '@/utils/storage';

export async function seedDemoWorkouts() {
  const now = Date.now();

  // Demo-Workouts speichern (mit aktuellem Timestamp)
  for (let i = 0; i < DEMO_WORKOUTS.length; i++) {
    const workout = { ...DEMO_WORKOUTS[i], createdAt: now + i };
    await saveWorkout(workout);
  }

  // Default-Schedule: Dienstag = Starke Mitte, Samstag = Rücken-Fit
  await updatePlannerSettings({
    defaultSchedule: {
      2: [DEMO_STARKE_MITTE.id],
      6: [DEMO_RUECKEN_FIT.id],
    },
  });

  // Workouts für 3 Wochen planen
  const weeksToSeed = 3;
  const dayToWorkoutId: Record<number, string> = {
    2: DEMO_STARKE_MITTE.id, // Dienstag
    6: DEMO_RUECKEN_FIT.id,  // Samstag
  };
  const referenceDate = new Date();

  for (let weekIndex = 0; weekIndex < weeksToSeed; weekIndex++) {
    for (const [weekdayStr, workoutId] of Object.entries(dayToWorkoutId)) {
      const weekday = Number(weekdayStr);
      const targetDate = new Date(referenceDate);
      const baseDay = targetDate.getDay();
      const offset = ((weekday - baseDay + 7) % 7) + weekIndex * 7;
      targetDate.setDate(targetDate.getDate() + offset);
      await savePlannedWorkout(toLocalDateKey(targetDate), [workoutId]);
    }
  }

  return DEMO_WORKOUTS.length;
}
