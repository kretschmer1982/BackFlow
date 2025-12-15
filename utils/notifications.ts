import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
    TrainingReminderTimeOfDay,
    getPlannedWorkouts,
    getPlannerSettings,
    getSettings,
    getWorkouts,
    updateSettings,
} from '@/utils/storage';

const CHANNEL_ID = 'training-reminders';

// In Expo Go Android darf expo-notifications nicht "aus Versehen" geladen werden,
// sonst erscheint die Push-Warnung bereits beim App-Start.
// Deshalb: KEIN (auch kein type-only) Import von 'expo-notifications' in diesem File.
let cachedNotifications: any | null = null;
let initialized = false;
const isExpoGo =
  // SDK-abhängig: früher appOwnership, inzwischen executionEnvironment
  (Constants as any).appOwnership === 'expo' ||
  (Constants as any).executionEnvironment === 'storeClient';
const isExpoGoAndroid = isExpoGo && Platform.OS === 'android';

async function getNotifications() {
  if (cachedNotifications) return cachedNotifications;

  // Expo Go (Android): expo-notifications löst beim Import eine Push-Warnung aus.
  // Für lokale Trainings-Erinnerungen nutzen wir hier deshalb ein No-Op Stub.
  // (In Expo Go sind Notifications ohnehin nur eingeschränkt testbar.)
  if (isExpoGoAndroid) {
    cachedNotifications = {
      AndroidImportance: { DEFAULT: 3 },
      setAutoServerRegistrationEnabledAsync: async () => {},
      setNotificationHandler: () => {},
      setNotificationChannelAsync: async () => {},
      // In Expo Go sollen wir die Reminder-Einstellung speichern können,
      // auch wenn echte OS-Prompts/Reminders nur eingeschränkt testbar sind.
      getPermissionsAsync: async () => ({ granted: true }),
      requestPermissionsAsync: async () => ({ granted: true }),
      cancelAllScheduledNotificationsAsync: async () => {},
      scheduleNotificationAsync: async () => {},
    };
    return cachedNotifications;
  }

  cachedNotifications = await import('expo-notifications');
  return cachedNotifications;
}

async function initNotificationsOnce() {
  if (initialized) return;
  initialized = true;

  const Notifications = await getNotifications();

  // In Expo Go (Android) sind Remote Push Notifications seit SDK 53 entfernt.
  // expo-notifications versucht sonst u.U. automatisch Push-Token-Registrierung.
  // Wir brauchen hier nur lokale Notifications, daher Auto-Registration aus.
  try {
    if (typeof Notifications.setAutoServerRegistrationEnabledAsync === 'function') {
      await Notifications.setAutoServerRegistrationEnabledAsync(false);
    }
  } catch {
    // Ignorieren – best effort
  }

  // Damit (lokale) Notifications auch im Vordergrund angezeigt werden
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // shouldShowAlert ist deprecated → neue Flags nutzen
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function cancelAllScheduledLocalNotifications(): Promise<void> {
  await initNotificationsOnce();
  const Notifications = await getNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
}

function toLocalDateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function toUtcDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getHourForTimeOfDay(time: TrainingReminderTimeOfDay): number {
  switch (time) {
    case 'morning':
      return 7;
    case 'noon':
      return 12;
    case 'evening':
      return 17;
  }
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await initNotificationsOnce();
  const Notifications = await getNotifications();
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Training-Erinnerungen',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4ade80',
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (isExpoGoAndroid) return true;
  await ensureAndroidChannel();
  await initNotificationsOnce();
  const Notifications = await getNotifications();

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  const req = await Notifications.requestPermissionsAsync();
  return !!req.granted;
}

/**
 * Plant lokale Benachrichtigungen für die nächsten 30 Tage.
 * Es wird NUR für Tage geplant, an denen ein Training im Planner existiert
 * (manuell geplant oder via Wochenplan), und nur für zukünftige Uhrzeiten.
 */
export async function rescheduleTrainingReminders(): Promise<void> {
  const settings = await getSettings();

  // Wenn deaktiviert: in Expo Go nichts anfassen (sonst Warnungen),
  // in nativen Builds geplante Notifications entfernen.
  if (!settings.trainingReminderEnabled) {
    if (isExpoGoAndroid) return;

    // Native builds: aufräumen
    await ensureAndroidChannel();
    try {
      await cancelAllScheduledLocalNotifications();
    } catch {
      // ignore
    }
    await updateSettings({ trainingReminderHasScheduled: false });
    return;
  }

  await ensureAndroidChannel();
  await initNotificationsOnce();
  const Notifications = await getNotifications();

  // Wir canceln bewusst alle geplanten lokalen Notifications dieser App,
  // damit keine Duplikate entstehen.
  await Notifications.cancelAllScheduledNotificationsAsync();

  const hasPerm = await ensureNotificationPermissions();
  if (!hasPerm) return;

  const planned = await getPlannedWorkouts();
  const plannerSettings = await getPlannerSettings();
  const workouts = await getWorkouts();

  const hour = getHourForTimeOfDay(settings.trainingReminderTimeOfDay);
  const now = new Date();
  let scheduledCount = 0;

  for (let i = 0; i < 30; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() + i);

    const localKey = toLocalDateKey(day);
    const utcKey = toUtcDateKey(day);
    const manual = planned[localKey] ?? planned[utcKey];

    let workoutId: string | null = null;
    if (manual !== undefined) {
      if (manual === '') {
        workoutId = null;
      } else if (Array.isArray(manual)) {
        const first = manual.find((v: any) => v && typeof v === 'object' && typeof v.workoutId === 'string')
          ?? manual.find((v: any) => typeof v === 'string');
        if (!first) workoutId = null;
        else if (typeof first === 'string') workoutId = first;
        else workoutId = first.workoutId;
      } else if (typeof manual === 'object' && manual && typeof manual.workoutId === 'string') {
        workoutId = manual.workoutId;
      } else {
        workoutId = manual as any;
      }
    } else {
      const dow = day.getDay();
      workoutId = plannerSettings.defaultSchedule[dow] ?? null;
    }

    if (!workoutId) continue;

    const triggerDate = new Date(day);
    triggerDate.setHours(hour, 0, 0, 0);
    if (triggerDate.getTime() <= now.getTime()) continue;

    const workoutName = workouts.find((w) => w.id === workoutId)?.name;
    const body = workoutName
      ? `Heute ist ${workoutName} geplant.`
      : 'Heute ist ein Training geplant.';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Training-Erinnerung',
        body,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      // Date-Trigger: neuer API-Shape (Date als param ist deprecated)
      trigger: { type: 'date', date: triggerDate },
    });
    scheduledCount++;
  }

  await updateSettings({ trainingReminderHasScheduled: scheduledCount > 0 });
}


