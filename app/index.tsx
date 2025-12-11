import { Workout } from '@/types/interfaces';
import { deleteWorkout, getWorkouts, getSettings, hasSeenIntro } from '@/utils/storage';
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

function parseHexColor(hex: string) {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);
  return { r, g, b };
}

function blendHexColors(baseHex: string, blendHex: string, factor: number) {
  const base = parseHexColor(baseHex);
  const blend = parseHexColor(blendHex);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(base.r * (1 - factor) + blend.r * factor);
  const g = clamp(base.g * (1 - factor) + blend.g * factor);
  const b = clamp(base.b * (1 - factor) + blend.b * factor);
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getWorkoutCardColors(backgroundColor: string) {
  const { r, g, b } = parseHexColor(backgroundColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isDark = luminance < 0.5;

  if (isDark) {
    // Dunkler Hintergrund: Karten leicht aufhellen
    const cardBackground = blendHexColors(backgroundColor, '#ffffff', 0.08);
    const cardBorder = blendHexColors(backgroundColor, '#ffffff', 0.16);
    return { cardBackground, cardBorder };
  } else {
    // Heller Hintergrund: Karten leicht abdunkeln
    const cardBackground = blendHexColors(backgroundColor, '#000000', 0.08);
    const cardBorder = blendHexColors(backgroundColor, '#000000', 0.16);
    return { cardBackground, cardBorder };
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [hasCheckedIntro, setHasCheckedIntro] = useState(false);

  const loadWorkouts = useCallback(async () => {
    const loadedWorkouts = await getWorkouts();
    // Sortiere nach Erstellungsdatum (neueste zuerst)
    loadedWorkouts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    setWorkouts(loadedWorkouts);
  }, []);

  const loadSettings = useCallback(async () => {
    const settings = await getSettings();
    setBackgroundColor(settings.appBackgroundColor);
  }, []);

  // Beim Fokussieren prüfen, ob das Intro bereits gesehen wurde.
  // Wenn nicht, direkt auf den Info-Screen umleiten.
  useFocusEffect(
    useCallback(() => {
      const checkIntroAndLoad = async () => {
        const seenIntro = await hasSeenIntro();
        if (!seenIntro) {
          router.replace('/info');
          return;
        }

        setHasCheckedIntro(true);
        await loadWorkouts();
        await loadSettings();
      };

      checkIntroAndLoad();
    }, [router, loadWorkouts, loadSettings])
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

  const renderWorkoutItem = ({ item }: { item: Workout }) => {
    const { cardBackground, cardBorder } = getWorkoutCardColors(backgroundColor);

    return (
      <TouchableOpacity
        style={[
          styles.workoutItem,
          { backgroundColor: cardBackground, borderColor: cardBorder },
        ]}
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
  };

  if (!hasCheckedIntro) {
    return null;
  }

  const { r, g, b } = parseHexColor(backgroundColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isDarkBackground = luminance < 0.5;
  const primaryTextColor = isDarkBackground ? '#ffffff' : '#111827';
  const secondaryTextColor = isDarkBackground ? '#aaaaaa' : '#4b5563';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDarkBackground ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: primaryTextColor }]}>BackFlow</Text>
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          Deine Workouts
        </Text>
      </View>

      {workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: primaryTextColor }]}>
            Noch keine Workouts
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: secondaryTextColor }]}>
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

      <View style={styles.settingsButtonContainer}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
          activeOpacity={0.8}>
          <Text style={styles.settingsButtonText}>⚙</Text>
        </TouchableOpacity>
      </View>

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
  settingsButtonContainer: {
    position: 'absolute',
    left: 24,
    bottom: 24,
  },
  settingsButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#555555',
  },
  settingsButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
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

