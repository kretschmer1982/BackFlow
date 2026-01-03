import { WARM_UP_LIBRARY, Exercise } from '@/constants/exercises';
import { getSettings } from '@/utils/storage';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseWarmupParams {
  onComplete: () => void;
  segments?: Exercise[];
}

export interface UseWarmupResult {
  currentSegment: Exercise | null;
  currentSegmentIndex: number;
  totalSegments: number;
  secondsRemaining: number;
  isPaused: boolean;
  handlePauseToggle: () => void;
  handleSkip: () => void;
  stopSpeech: () => void;
}

export function useWarmup({ segments, onComplete }: UseWarmupParams): UseWarmupResult {
  const defaultWarmup = WARM_UP_LIBRARY[0]?.segments ?? [];
  const warmupSegments = segments ?? defaultWarmup;
  const totalSegments = warmupSegments.length;
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(() => warmupSegments[0]?.amount ?? 0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const isCompletedRef = useRef(false);
  const lastAnnouncedSegmentRef = useRef<number | null>(null);
  const speechCancelledRef = useRef(false);

  useEffect(() => {
    if (warmupSegments.length === 0) {
      onComplete();
    }
  }, [onComplete, warmupSegments.length]);

  const [enableBeep, setEnableBeep] = useState(true);
  const enableBeepRef = useRef(true);
  const currentSpeechCompletionRef = useRef<(() => void) | null>(null);

  const finishCurrentSpeech = useCallback(() => {
    const resolver = currentSpeechCompletionRef.current;
    if (!resolver) return;
    currentSpeechCompletionRef.current = null;
    resolver();
  }, []);

  const speakText = useCallback(
    (text: string, rateOverride?: number) => {
      if (!text?.trim() || !enableBeepRef.current) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        currentSpeechCompletionRef.current = () => {
          currentSpeechCompletionRef.current = null;
          resolve();
        };

        try {
          Speech.speak(text, {
            language: 'de-DE',
            rate: rateOverride ?? 0.9,
            onDone: finishCurrentSpeech,
            onStopped: finishCurrentSpeech,
            onError: finishCurrentSpeech,
          });
        } catch {
          finishCurrentSpeech();
        }
      });
    },
    [finishCurrentSpeech]
  );

  const cancelSpeech = useCallback(() => {
    try {
      Speech.stop();
    } catch {
      // ignore
    }
    speechCancelledRef.current = true;
    finishCurrentSpeech();
  }, [finishCurrentSpeech]);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setEnableBeep(typeof settings.enableBeep === 'boolean' ? settings.enableBeep : true);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    enableBeepRef.current = enableBeep;
  }, [enableBeep]);

  useEffect(() => {
    setCurrentSegmentIndex(0);
    setSecondsRemaining(warmupSegments[0]?.amount ?? 0);
    lastAnnouncedSegmentRef.current = null;
    isCompletedRef.current = false;
    setIsCompleted(false);
    speechCancelledRef.current = false;
  }, [warmupSegments]);

  const goToSegment = useCallback(
    (index: number) => {
      const segment = warmupSegments[index];
      if (!segment) return;
      setCurrentSegmentIndex(index);
      setSecondsRemaining(segment.amount);
      lastAnnouncedSegmentRef.current = null;
      isCompletedRef.current = false;
      setIsCompleted(false);
      speechCancelledRef.current = false;
    },
    [warmupSegments]
  );

  const advanceSegment = useCallback(() => {
    if (isCompletedRef.current) return;
    const nextIndex = currentSegmentIndex + 1;
    if (nextIndex >= warmupSegments.length) {
      isCompletedRef.current = true;
      setIsCompleted(true);
      setSecondsRemaining(0);
      cancelSpeech();
      onComplete();
      return;
    }
    goToSegment(nextIndex);
  }, [cancelSpeech, currentSegmentIndex, goToSegment, onComplete, warmupSegments.length]);

  const handleSkip = useCallback(() => {
    cancelSpeech();
    advanceSegment();
  }, [advanceSegment, cancelSpeech]);

  const handlePauseToggle = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isPaused || isCompleted || secondsRemaining <= 0) {
      return;
    }
    const tick = setInterval(() => {
      setSecondsRemaining((prev) => {
        const safePrev = Number.isFinite(prev) ? prev : 1;
        if (safePrev <= 1) {
          clearInterval(tick);
          advanceSegment();
          return 0;
        }
        return safePrev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [advanceSegment, isCompleted, isPaused, secondsRemaining]);

  const sleep = useCallback((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)), []);

  const speakSegmentInstructions = useCallback(
    async (instructions: string) => {
      const sentences = instructions
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);
      for (let i = 0; i < sentences.length; i++) {
        if (speechCancelledRef.current) {
          break;
        }
        await speakText(sentences[i], 0.9);
        if (i < sentences.length - 1) {
          await sleep(2000);
        }
      }
    },
    [sleep, speakText]
  );

  useEffect(() => {
    if (warmupSegments.length === 0 || isCompleted) {
      return;
    }
    if (lastAnnouncedSegmentRef.current === currentSegmentIndex) {
      return;
    }
    const instructions = warmupSegments[currentSegmentIndex]?.instructions?.trim();
    if (!instructions) {
      lastAnnouncedSegmentRef.current = currentSegmentIndex;
      return;
    }
    lastAnnouncedSegmentRef.current = currentSegmentIndex;
    void speakSegmentInstructions(instructions);
  }, [currentSegmentIndex, isCompleted, speakSegmentInstructions, warmupSegments]);

  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [cancelSpeech]);

  const currentSegment = warmupSegments[currentSegmentIndex] ?? null;

  return {
    currentSegment,
    currentSegmentIndex,
    totalSegments,
    secondsRemaining,
    isPaused,
    handlePauseToggle,
    handleSkip,
    stopSpeech: cancelSpeech,
  };
}

