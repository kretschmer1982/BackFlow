import { EXERCISES, Exercise } from '@/constants/exercises';
import { getCustomExercises } from '@/utils/storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ExerciseList() {
  const [allExercises, setAllExercises] = useState<Exercise[]>(EXERCISES);

  useEffect(() => {
    const loadCustomExercises = async () => {
      const customExercises = await getCustomExercises();
      setAllExercises([...EXERCISES, ...customExercises]);
    };
    loadCustomExercises();
  }, []);

  return (
    <View style={styles.exerciseList}>
      <Text style={styles.exerciseListTitle}>Übungen:</Text>
      {allExercises.map((exercise, index) => (
        <View
          key={exercise.name}
          style={styles.exerciseItem}>
          <Text style={styles.exerciseNumber}>{index + 1}.</Text>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseType}>
            {exercise.type === 'duration' ? `${exercise.amount}s` : `${exercise.amount} x`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseList: {
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  exerciseListTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  exerciseNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ade80', // Hellgrün
    marginRight: 12,
    minWidth: 30,
  },
  exerciseName: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
    flex: 1,
  },
  exerciseType: {
    fontSize: 16,
    color: '#aaaaaa',
    fontWeight: '400',
  },
});

