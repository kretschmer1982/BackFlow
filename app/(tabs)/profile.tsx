import { Workout } from '@/types/interfaces';
import { getPlannedWorkouts, getSettings, getWorkouts, normalizePlannedValueToEntries } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function toLocalDateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function estimateWorkoutMinutes(workout: Workout): number | null {
  if (typeof workout.totalMinutes === 'number' && workout.totalMinutes > 0) return workout.totalMinutes;
  // fallback: nur duration-Übungen grob aufsummieren
  const totalSeconds = workout.exercises.reduce((sum, ex) => {
    if (ex.type === 'duration' && typeof ex.amount === 'number') return sum + ex.amount;
    return sum;
  }, 0);
  if (totalSeconds <= 0) return null;
  return Math.max(1, Math.round(totalSeconds / 60));
}

export default function ProfileScreen() {
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [planned, setPlanned] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    const settings = await getSettings();
    setBackgroundColor(settings.appBackgroundColor);
    const w = await getWorkouts();
    setWorkouts(w);
    const p = await getPlannedWorkouts();
    setPlanned(p as any);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const stats = useMemo(() => {
    const byId = new Map(workouts.map((w) => [w.id, w]));
    let completedCount = 0;
    let totalMinutes = 0;

    for (const [dateKey, val] of Object.entries(planned)) {
      // Nur Vergangenheit inkl. heute für Stats
      if (dateKey > toLocalDateKey(new Date())) continue;

      const entries = normalizePlannedValueToEntries(val as any);
      for (const entry of entries) {
        if (!entry.completed) continue;
        completedCount += 1;
        if (typeof entry.durationMinutes === 'number' && entry.durationMinutes > 0) {
          totalMinutes += entry.durationMinutes;
          continue;
        }
        const w = byId.get(entry.workoutId);
        if (w) {
          const m = estimateWorkoutMinutes(w);
          if (m) totalMinutes += m;
        }
      }
    }

    return { completedCount, totalMinutes };
  }, [planned, workouts]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.subtitle}>Deine Statistiken</Text>
      </View>

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Trainings (durchgeführt)</Text>
          <Text style={styles.cardValue}>{stats.completedCount}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Gesamtminuten</Text>
          <Text style={styles.cardValue}>{stats.totalMinutes}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  subtitle: { color: '#aaaaaa', marginTop: 4, fontSize: 13, fontWeight: '700' },
  cards: { paddingHorizontal: 18, paddingTop: 10, gap: 12 },
  card: {
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    padding: 14,
  },
  cardLabel: { color: '#aaaaaa', fontSize: 13, fontWeight: '700' },
  cardValue: { color: '#ffffff', marginTop: 6, fontSize: 28, fontWeight: '900' },
});

