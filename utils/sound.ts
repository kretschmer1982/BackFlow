import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';

const BEEP_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
const LONG_BEEP_URL = 'https://actions.google.com/sounds/v1/alarms/beep_long.ogg';
const CHECK_URL = 'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg';
const FANFARE_SOURCE = require('@/assets/audio/ping.mp3');

export function useBeepPlayer() {
  const player = useAudioPlayer(BEEP_URL);
  const longPlayer = useAudioPlayer(LONG_BEEP_URL);
  const checkPlayer = useAudioPlayer(CHECK_URL);
  const fanfarePlayer = useAudioPlayer(FANFARE_SOURCE);
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

  const lastLongBeepRef = useRef(0);
  const playLongSignal = useCallback(async () => {
    const now = Date.now();
    if (now - lastLongBeepRef.current < 120) return;
    lastLongBeepRef.current = now;

    try {
      longPlayer.seekTo(0);
      longPlayer.play();
    } catch {
      // ignore
    }
  }, [longPlayer]);

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

  const playFanfare = useCallback(async () => {
    try {
      fanfarePlayer.seekTo(0);
      fanfarePlayer.play();
    } catch {
      // ignore
    }
  }, [fanfarePlayer]);

  return { playBeep, playLongSignal, playCheck, playFanfare };
}
