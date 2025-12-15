import { MonthlyTrainingBarChart } from '@/components/profile/MonthlyTrainingBarChart';
import { Workout } from '@/types/interfaces';
import { getPlannedWorkouts, getSettings, getWorkouts, normalizePlannedValueToEntries } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACCENT = '#4c1d95'; // dunkleres Lila
const CHART_H = 148; // etwas niedriger, damit Balken optisch nicht "zu hoch" wirken
const CHART_TOP_PAD = 8; // Luft nach oben unter der Überschrift

function toLocalDateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toUtcDateKey(d: Date) {
  // Wichtig: ISO-String von "mittags" nehmen, damit UTC-Tag nicht auf Vortag kippt (Zeitzonen)
  const noon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  return noon.toISOString().slice(0, 10);
}

function getIsoWeekYearAndNumber(date: Date): { year: number; week: number } {
  // ISO week: Monday as first day, week 1 contains Jan 4th
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // 1..7 (Mon..Sun), Sunday -> 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // nearest Thursday
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const diffDays = Math.floor((d.getTime() - yearStart.getTime()) / 86400000);
  const week = Math.floor(diffDays / 7) + 1;
  return { year, week };
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function getDaysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function formatMonthTitle(d: Date) {
  const raw = d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
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
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(new Date()));

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

  const yearStats = useMemo(() => {
    const byId = new Map(workouts.map((w) => [w.id, w]));
    const now = new Date();
    const todayKey = toLocalDateKey(now);

    const yearStart = new Date(now.getFullYear(), 0, 1);

    let completedCountYear = 0;
    let totalMinutesYear = 0;

    for (
      let d = new Date(yearStart.getFullYear(), yearStart.getMonth(), yearStart.getDate());
      toLocalDateKey(d) <= todayKey;
      d.setDate(d.getDate() + 1)
    ) {
      const localKey = toLocalDateKey(d);
      const utcKey = toUtcDateKey(d);
      const val = planned[localKey] ?? planned[utcKey];
      if (val === undefined) continue;

      const entries = normalizePlannedValueToEntries(val as any);
      // Nur "completed" und pro WorkoutId nur einmal (gegen Doppel-Daten)
      const completedIds = new Set<string>();
      for (const entry of entries) {
        if (!entry.completed) continue;
        if (typeof entry.workoutId === 'string') completedIds.add(entry.workoutId);
        if (typeof entry.durationMinutes === 'number' && entry.durationMinutes > 0) {
          totalMinutesYear += entry.durationMinutes;
          continue;
        }
        const w = byId.get(entry.workoutId);
        if (w) {
          const m = estimateWorkoutMinutes(w);
          if (m) totalMinutesYear += m;
        }
      }
      completedCountYear += completedIds.size;
    }

    return { completedCountYear, totalMinutesYear };
  }, [planned, workouts]);

  const monthModel = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const daysInMonth = getDaysInMonth(monthStart);
    const todayKey = toLocalDateKey(new Date());
    const monthIsCurrent = toLocalDateKey(monthStart) === toLocalDateKey(startOfMonth(new Date()));

    // Balkendiagramm: Aggregation pro ISO-Kalenderwoche (KW)
    const byWeek = new Map<string, { year: number; week: number; count: number }>();
    const monthWeeksInOrder: { year: number; week: number }[] = [];
    const seenWeekKey = new Set<string>();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      const localKey = toLocalDateKey(d);
      // Nur durchgeführte Trainings bis inkl. heute auswerten
      if (localKey > todayKey) continue;
      const utcKey = toUtcDateKey(d);
      const val = planned[localKey] ?? planned[utcKey];
      const { year, week } = getIsoWeekYearAndNumber(d);
      const key = `${year}-W${week}`;

      // Wochen-Achse: alle KWs des Monats anzeigen (auch 0)
      if (!seenWeekKey.has(key)) {
        seenWeekKey.add(key);
        monthWeeksInOrder.push({ year, week });
      }

      if (val === undefined) continue;

      const entries = normalizePlannedValueToEntries(val as any);
      // Nur "completed" zählt
      const completedIds = new Set<string>();
      for (const e of entries) {
        if (!e?.completed) continue;
        if (typeof e.workoutId === 'string') completedIds.add(e.workoutId);
      }
      const completed = completedIds.size;
      if (completed <= 0) continue;

      const cur = byWeek.get(key) ?? { year, week, count: 0 };
      cur.count += completed;
      byWeek.set(key, cur);
    }

    const weeks = monthWeeksInOrder.map(({ year, week }) => {
      const key = `${year}-W${week}`;
      return byWeek.get(key) ?? { year, week, count: 0 };
    });
    const monthTotal = weeks.reduce((sum, w) => sum + w.count, 0);
    const maxCount = weeks.reduce((m, w) => Math.max(m, w.count), 0);

    return { monthStart, weeks, monthTotal, maxCount, todayKey, monthIsCurrent };
  }, [planned, selectedMonth]);

  const handlePrevMonth = useCallback(() => {
    setSelectedMonth((prev) => addMonths(prev, -1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleToday = useCallback(() => {
    setSelectedMonth(startOfMonth(new Date()));
  }, []);

  const yAxisMax = useMemo(() => {
    // Y-Achse soll die echte Häufigkeit zeigen (kein Headroom über dem Maximum)
    return Math.max(1, monthModel.maxCount || 0);
  }, [monthModel.maxCount]);

  const yTicks = useMemo(() => {
    // Beschriftung startet ab 1 (keine 0) und geht bis zum echten Maximum.
    // Bei kleinen Max-Werten zeigen wir alle Stufen (z.B. 1..3).
    const max = Math.max(1, yAxisMax);
    if (max <= 6) {
      return Array.from({ length: max }, (_, i) => max - i);
    }
    // Bei größeren Max-Werten: wenige sinnvolle Ticks, aber nie über max.
    const t1 = max;
    const t2 = Math.max(1, Math.ceil((2 * max) / 3));
    const t3 = Math.max(1, Math.ceil(max / 3));
    const vals = [t1, t2, t3, 1];
    return Array.from(new Set(vals)).sort((a, b) => b - a);
  }, [yAxisMax]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor }]}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.subtitle}>Deine Statistiken</Text>
        </View>

        <View style={styles.yearRow}>
          <View style={styles.kpiCircleWrap}>
            <View style={styles.kpiCircle}>
              <Text style={styles.kpiValue}>{yearStats.completedCountYear}</Text>
            </View>
            <Text style={styles.kpiLabel}>Trainings (Jahr)</Text>
          </View>

          <View style={styles.kpiCircleWrap}>
            <View style={styles.kpiCircle}>
              <Text style={styles.kpiValue}>{yearStats.totalMinutesYear}</Text>
            </View>
            <Text style={styles.kpiLabel}>Minuten (Jahr)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trainingshäufigkeit</Text>

          {/* Monatswahl wie im Planner */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton} activeOpacity={0.85}>
              <Text style={styles.navButtonText}>{'<'}</Text>
            </TouchableOpacity>

            <View style={styles.navCenter}>
              <Text style={styles.monthTitle}>{formatMonthTitle(monthModel.monthStart)}</Text>
              <TouchableOpacity
                onPress={handleToday}
                style={[styles.todayButton, monthModel.monthIsCurrent && styles.todayButtonActive]}
                activeOpacity={0.85}>
                <Text style={styles.todayButtonIcon} accessibilityLabel="Heute">
                  ⟲
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton} activeOpacity={0.85}>
              <Text style={styles.navButtonText}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartMeta}>
                {monthModel.monthTotal} Trainings (durchgeführt) in diesem Monat
              </Text>
            </View>

            <MonthlyTrainingBarChart
              weeks={monthModel.weeks}
              yAxisMax={yAxisMax}
              yTicks={yTicks}
              accentColor={ACCENT}
              height={CHART_H}
              topPadding={CHART_TOP_PAD}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  subtitle: { color: '#aaaaaa', marginTop: 4, fontSize: 13, fontWeight: '700' },

  yearRow: {
    paddingHorizontal: 18,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiCircleWrap: { flex: 1, alignItems: 'center' },
  kpiCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#151515',
    borderWidth: 2,
    borderColor: '#4c1d95',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  kpiLabel: { color: '#aaaaaa', marginTop: 6, fontSize: 11, fontWeight: '800', textAlign: 'center' },

  section: { paddingHorizontal: 18, paddingTop: 18 },
  sectionTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900', marginBottom: 10 },

  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navButton: {
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    width: 44,
    alignItems: 'center',
  },
  navButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monthTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  todayButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonActive: { borderColor: '#4c1d95' },
  todayButtonIcon: { color: '#ffffff', fontSize: 16, fontWeight: '900' },

  chartCard: {
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 14,
    padding: 12,
  },
  chartHeader: {
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2b2b2b',
  },
  chartMeta: { color: '#aaaaaa', fontSize: 12, fontWeight: '700' },
});


