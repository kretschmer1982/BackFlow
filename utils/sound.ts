import { Audio } from 'expo-av';

let loadedBeep: Audio.Sound | null = null;
let lastPlay = 0;

export async function playBeep() {
  try {
    // Kein mehrfaches Play innerhalb 300ms
    if(Date.now() - lastPlay < 300) return;
    lastPlay = Date.now();
    if (!loadedBeep) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
        { shouldPlay: false, volume: 0.4 }
      );
      loadedBeep = sound;
    }
    if (loadedBeep) {
      await loadedBeep.replayAsync();
    }
  } catch (e) {
    loadedBeep = null; // Reset/reload bei Fehler
  }
}
