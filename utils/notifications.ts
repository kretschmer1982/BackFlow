import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { getPlannerSettings, getSettings, getWorkouts, TrainingReminderTimeOfDay } from './storage';

// Konfiguration des Verhaltens bei Empfang im Vordergrund
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotificationObserver() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      // Bei Interaktion zum Workout-Tab navigieren
      // Wir nutzen replace, um sicherzustellen, dass wir auf dem richtigen Tab landen
      router.dismissAll();
      router.replace('/(tabs)');
    });

    return () => subscription.remove();
  }, [router]);
}

export async function ensureNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

function getTimeForTimeOfDay(tod: TrainingReminderTimeOfDay): { hour: number; minute: number } {
  switch (tod) {
    case 'morning': return { hour: 7, minute: 0 };
    case 'noon': return { hour: 12, minute: 0 };
    case 'evening': return { hour: 18, minute: 0 };
    default: return { hour: 7, minute: 0 };
  }
}

export async function rescheduleTrainingReminders() {
  // Zuerst alles löschen
  await Notifications.cancelAllScheduledNotificationsAsync();

  const settings = await getSettings();
  if (!settings.trainingReminderEnabled) return;

  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) return;

  const workouts = await getWorkouts();
  const planner = await getPlannerSettings();
  const { hour, minute } = getTimeForTimeOfDay(settings.trainingReminderTimeOfDay);

  // Plane für die nächsten 7 Tage
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Setze Zeit
    date.setHours(hour, minute, 0, 0);

    // Wenn Zeitpunkt in der Vergangenheit, überspringen
    if (date.getTime() <= Date.now()) continue;

    const dayOfWeek = date.getDay(); // 0 = Sunday
    const scheduledWorkoutIds = planner.defaultSchedule[dayOfWeek] || [];
    
    if (scheduledWorkoutIds.length > 0) {
      // Finde Namen
      const dayWorkouts = scheduledWorkoutIds.map(id => workouts.find(w => w.id === id)).filter(Boolean);
      
      if (dayWorkouts.length > 0) {
          const workoutNames = dayWorkouts.map(w => w?.name).join(', ');
          
          await Notifications.scheduleNotificationAsync({
             content: {
                 title: 'Training Zeit!',
                 body: `Heute steht an: ${workoutNames}. Tippe hier zum Starten!`,
                 data: { screen: '(tabs)' },
                 sound: true,
             },
             trigger: date, // Date object = Timestamp trigger
         });
      }
    }
  }
}

