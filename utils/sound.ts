import { Audio } from 'expo-av';

let loadedBeep: Audio.Sound | null = null;
let lastPlay = 0;

async function ensureBeepLoaded() {
  if (loadedBeep) return;
  const { sound } = await Audio.Sound.createAsync(
    { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
    { shouldPlay: false, volume: 0.4 }
  );
  loadedBeep = sound;
}

export async function preloadBeep() {
  try {
    await ensureBeepLoaded();
  } catch (e) {
    // Fehler beim Vorladen ignorieren – beim ersten echten Play wird erneut versucht
    loadedBeep = null;
  }
}

export async function playBeep() {
  try {
    // Kein mehrfaches Play innerhalb 300ms
    if (Date.now() - lastPlay < 300) return;
    lastPlay = Date.now();

    await ensureBeepLoaded();

    if (loadedBeep) {
      await loadedBeep.replayAsync();
    }
  } catch (e) {
    loadedBeep = null; // Reset/reload bei Fehler
  }
}
