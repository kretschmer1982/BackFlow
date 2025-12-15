import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';

const BEEP_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
const CHECK_URL = 'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg';

export function useBeepPlayer() {
  const player = useAudioPlayer(BEEP_URL);
  const checkPlayer = useAudioPlayer(CHECK_URL);
  const lastBeepRef = useRef(0);
  const lastCheckRef = useRef(0);

  // Globaler Audio-Modus (Ducking / Silent Mode)
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    }).catch(() => {
      // ignore
    });
  }, []);

  const playBeep = useCallback(async () => {
    // Kein mehrfaches Play innerhalb kurzer Zeit (gegen Doppel-Trigger)
    const now = Date.now();
    if (now - lastBeepRef.current < 80) return;
    lastBeepRef.current = now;

    try {
      player.seekTo(0);
      player.play();
    } catch {
      // ignore
    }
  }, [player]);

  const playDoubleBeep = useCallback(async () => {
    // 2 kurze Beeps als Start-Signal
    await playBeep();
    await new Promise((r) => setTimeout(r, 180));
    await playBeep();
  }, [playBeep]);

  const playCheck = useCallback(async () => {
    // Anderer Ton als "Übung fertig"
    const now = Date.now();
    if (now - lastCheckRef.current < 120) return;
    lastCheckRef.current = now;

    try {
      checkPlayer.seekTo(0);
      checkPlayer.play();
    } catch {
      // ignore
    }
  }, [checkPlayer]);

  return { playBeep, playDoubleBeep, playCheck };
}
