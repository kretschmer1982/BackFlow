import { Workout } from '@/types/interfaces';
import { deleteWorkout, getWorkouts } from '@/utils/storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showFabMenu, setShowFabMenu] = useState(false);

  const loadWorkouts = useCallback(async () => {
    const loadedWorkouts = await getWorkouts();
    // Sortiere nach Erstellungsdatum (neueste zuerst)
    loadedWorkouts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    setWorkouts(loadedWorkouts);
  }, []);

  // Lade Workouts beim ersten Mount und wenn Screen fokussiert wird
  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  const handleWorkoutPress = (workout: Workout) => {
    router.push({
      pathname: '/run',
      params: { workoutId: workout.id },
    });
  };

  const handleDeleteWorkout = async (id: string, event: any) => {
    event.stopPropagation();
    
    Alert.alert(
      'Workout löschen',
      'Möchtest du dieses Workout wirklich löschen?',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkout(id);
            loadWorkouts();
          },
        },
      ]
    );
  };

  const handleEditWorkout = (workout: Workout, event: any) => {
    event.stopPropagation();
    router.push({
      pathname: '/create',
      params: { workoutId: workout.id },
    });
  };

  const handleFabPress = () => {
    setShowFabMenu(!showFabMenu);
  };

  const handleCreateWorkout = () => {
    setShowFabMenu(false);
    router.push('/create');
  };

  const handleCreateExercise = () => {
    setShowFabMenu(false);
    router.push('/create-exercise');
  };

  const renderWorkoutItem = ({ item }: { item: Workout }) => (
    <TouchableOpacity
      style={styles.workoutItem}
      onPress={() => handleWorkoutPress(item)}
      activeOpacity={0.7}>
      <View style={styles.workoutContent}>
        <Text style={styles.workoutName}>{item.name}</Text>
        <Text style={styles.workoutInfo}>
          {item.exercises.length} {item.exercises.length === 1 ? 'Übung' : 'Übungen'}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <Pressable
          style={styles.editButton}
          onPress={(e) => handleEditWorkout(item, e)}>
          <Text style={styles.editButtonText}>✎</Text>
        </Pressable>
        <Pressable
          style={styles.deleteButton}
          onPress={(e) => handleDeleteWorkout(item.id, e)}>
          <Text style={styles.deleteButtonText}>×</Text>
        </Pressable>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>BackFlow</Text>
        <Text style={styles.subtitle}>Deine Workouts</Text>
      </View>

      {workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Noch keine Workouts</Text>
          <Text style={styles.emptyStateSubtext}>
            Erstelle dein erstes Workout mit dem + Button
          </Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.fabContainer}>
        {showFabMenu && (
          <View style={styles.fabMenu}>
            <TouchableOpacity
              style={[styles.fabMenuItem, styles.fabMenuItemFirst]}
              onPress={handleCreateWorkout}
              activeOpacity={0.8}>
              <Text style={styles.fabMenuItemText}>Neues Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={handleCreateExercise}
              activeOpacity={0.8}>
              <Text style={styles.fabMenuItemText}>Neue Übung</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.fab, showFabMenu && styles.fabActive]}
          onPress={handleFabPress}
          activeOpacity={0.8}>
          <Text style={styles.fabText}>{showFabMenu ? '×' : '+'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a', // Zurück zu dunklem Hintergrund
  },
  header: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaaaaa',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  workoutItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#333333',
  },
  workoutContent: {
    flex: 1,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  workoutInfo: {
    fontSize: 16,
    color: '#aaaaaa',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 18,
    color: '#4ade80',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#ff4444',
    fontWeight: 'bold',
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 24,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    alignItems: 'flex-end',
  },
  fabMenu: {
    marginBottom: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabMenuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  fabMenuItemFirst: {
    borderTopWidth: 0,
  },
  fabMenuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4ade80',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabActive: {
    backgroundColor: '#ff4444',
    shadowColor: '#ff4444',
  },
  fabText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    lineHeight: 40,
  },
});

