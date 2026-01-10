// Hilfsfunktionen für Übungsbilder
import { AUTO_EXERCISE_IMAGE_MAP } from '@/constants/generatedExerciseImages';
import { Exercise } from '@/constants/exercises';

const DEFAULT_AVATAR_IMAGE: number = require('../assets/images/avatar_default.png');

function normalizeImageValue(value?: string | number): string | number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return undefined;
}

export function getExerciseImage(exercise?: Exercise | null, fallbackImage?: string | number): string | number {
  const assetId = exercise?.id;
  if (assetId && AUTO_EXERCISE_IMAGE_MAP[assetId]) {
    return AUTO_EXERCISE_IMAGE_MAP[assetId];
  }

  const exerciseImage = normalizeImageValue(exercise?.image);
  if (exerciseImage) {
    return exerciseImage;
  }

  const fallback = normalizeImageValue(fallbackImage);
  if (fallback) {
    return fallback;
  }

  return DEFAULT_AVATAR_IMAGE;
}

export function getImageSource(exercise: Exercise, fallbackImage?: string | number) {
  const image = getExerciseImage(exercise, fallbackImage);
  return typeof image === 'number' ? image : { uri: image };
}

