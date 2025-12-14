import Constants from 'expo-constants';
import type * as NotificationsType from 'expo-notifications';
import { Platform } from 'react-native';

import {
    TrainingReminderTimeOfDay,
    getPlannedWorkouts,
    getPlannerSettings,
    getSettings,
    getWorkouts,
} from '@/utils/storage';

const CHANNEL_ID = 'training-reminders';

let cachedNotifications: typeof NotificationsType | null = null;
let initialized = false;

async function getNotifications() {
  if (cachedNotifications) return cachedNotifications;
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
    // @ts-expect-error - je nach Version vorhanden
    if (typeof Notifications.setAutoServerRegistrationEnabledAsync === 'function') {
      // @ts-expect-error - je nach Version vorhanden
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
  await ensureAndroidChannel();
  await initNotificationsOnce();
  const Notifications = await getNotifications();

  // Wir canceln bewusst alle geplanten lokalen Notifications dieser App,
  // damit keine Duplikate entstehen.
  await Notifications.cancelAllScheduledNotificationsAsync();

  const settings = await getSettings();
  if (!settings.trainingReminderEnabled) return;

  const hasPerm = await ensureNotificationPermissions();
  if (!hasPerm) return;

  const planned = await getPlannedWorkouts();
  const plannerSettings = await getPlannerSettings();
  const workouts = await getWorkouts();

  const hour = getHourForTimeOfDay(settings.trainingReminderTimeOfDay);
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() + i);

    const localKey = toLocalDateKey(day);
    const utcKey = toUtcDateKey(day);
    const manual = planned[localKey] ?? planned[utcKey];

    let workoutId: string | null = null;
    if (manual !== undefined) {
      workoutId = manual === '' ? null : manual;
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
  }
}

export async function scheduleTestReminderInSeconds(seconds: number = 10) {
  // Hinweis: In Expo Go (Android) sind Remote Push Notifications nicht testbar.
  // Lokale Notifications sollten funktionieren – falls Expo Go trotzdem eine Warnung wirft,
  // ist ein Development Build der saubere Weg.
  if (Constants.appOwnership === 'expo' && Platform.OS === 'android') {
    // best effort: wir versuchen trotzdem lokal zu schedulen
  }

  await ensureAndroidChannel();
  const hasPerm = await ensureNotificationPermissions();
  if (!hasPerm) return;

  await initNotificationsOnce();
  const Notifications = await getNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test: Training-Erinnerung',
      body: 'Wenn du das siehst, funktionieren lokale Benachrichtigungen.',
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: { seconds },
  });
}

