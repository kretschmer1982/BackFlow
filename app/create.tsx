// @ts-nocheck
import { Exercise, EXERCISES, getImageSource } from '@/constants/exercises';
import { Workout, WorkoutExercise } from '@/types/interfaces';
import {
    getCustomExercises,
    getSettings,
    getWorkoutById,
    saveWorkout,
} from '@/utils/storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DraggableFlatList, {
    RenderItemParams,
} from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

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

function isDarkColor(hex: string) {
  const { r, g, b } = parseHexColor(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const titleInputRef = useRef<TextInput | null>(null);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutTotalMinutes, setWorkoutTotalMinutes] = useState('');
  const [isTitleEditable, setIsTitleEditable] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string>('#2a2a2a');
  const [selectedExercises, setSelectedExercises] =
    useState<WorkoutExercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>(EXERCISES);
  // State für Eingabewerte der Übungsmengen (erlaubt leere Strings)
  const [exerciseAmountInputs, setExerciseAmountInputs] =
    useState<Map<string, string>>(new Map());
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);
  
  const isDarkBackground = useMemo(
    () => isDarkColor(backgroundColor),
    [backgroundColor]
  );
  
  // Dynamische Farben
  const textColor = isDarkBackground ? '#ffffff' : '#111827';
  const subTextColor = isDarkBackground ? '#aaaaaa' : '#4b5563';
  const cardBg = isDarkBackground ? '#2a2a2a' : '#ffffff';
  const cardBorder = isDarkBackground ? '#333333' : '#d1d5db';
  const inputBg = isDarkBackground ? '#151515' : '#f9fafb';
  const inputBorder = isDarkBackground ? '#333333' : '#d1d5db';
  const placeholderColor = isDarkBackground ? '#666666' : '#9ca3af';

  const createExerciseInstance = (exercise: Exercise): WorkoutExercise => ({
    ...exercise,
    instanceId: `${exercise.name}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
  });

  // Lade Workout zum Bearbeiten
  useEffect(() => {
    const loadWorkout = async () => {
      if (workoutId) {
        const workout = await getWorkoutById(workoutId);
        if (workout) {
          setWorkoutName(workout.name);
          setWorkoutTotalMinutes(
            typeof (workout as any).totalMinutes === 'number' && (workout as any).totalMinutes > 0
              ? String((workout as any).totalMinutes)
              : ''
          );
          const exercisesWithIds = workout.exercises.map((ex, index) => ({
            ...ex,
            instanceId:
              ex.instanceId ||
              `${ex.name}-${index}-${Date.now().toString(36)}`,
          }));
          setSelectedExercises(exercisesWithIds);

          const inputsMap = new Map<string, string>();
          exercisesWithIds.forEach((ex) => {
            if (ex.instanceId) {
              inputsMap.set(ex.instanceId, ex.amount?.toString() || '');
            }
          });
          setExerciseAmountInputs(inputsMap);
        }
      }
    };
    loadWorkout();
  }, [workoutId]);

  // Lade benutzerdefinierte Übungen beim Mount und wenn Screen fokussiert wird
  useFocusEffect(
    useCallback(() => {
      const loadCustomExercises = async () => {
        const customExercises = await getCustomExercises();
        setAllExercises([...EXERCISES, ...customExercises]);
      };
      loadCustomExercises();
    }, [])
  );

  // Lade globale Hintergrundfarbe
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setBackgroundColor(settings.appBackgroundColor);
    };
    loadSettings();
  }, []);

  const handleAddExerciseFromLibrary = (exercise: Exercise) => {
    const instance = createExerciseInstance(exercise);
    setSelectedExercises((prev) => [...prev, instance]);
    if (instance.instanceId) {
      const newInputs = new Map(exerciseAmountInputs);
      newInputs.set(instance.instanceId, exercise.amount.toString());
      setExerciseAmountInputs(newInputs);
    }
  };

  const updateExerciseAmount = (instanceId: string, amount: number) => {
    setSelectedExercises((prev) =>
      prev.map((ex) =>
        ex.instanceId === instanceId ? { ...ex, amount } : ex
      )
    );
  };

  const updateExerciseAmountInput = (instanceId: string, text: string) => {
    // Entferne alle nicht-numerischen Zeichen
    const cleanedText = text.replace(/[^0-9]/g, '');

    // Aktualisiere immer den Input-State mit dem bereinigten Text (oder leerem String)
    const newInputs = new Map(exerciseAmountInputs);
    newInputs.set(instanceId, cleanedText);
    setExerciseAmountInputs(newInputs);

    // Aktualisiere den tatsächlichen Wert nur wenn eine gültige Zahl eingegeben wird
    if (cleanedText === '') {
      // Leere Eingabe erlauben - der State bleibt leer
      return;
    }

    const num = parseInt(cleanedText, 10);
    if (!isNaN(num) && num > 0) {
      updateExerciseAmount(instanceId, num);
    }
  };

  const removeExerciseInstance = (instanceId: string) => {
    setSelectedExercises((prev) =>
      prev.filter((ex) => ex.instanceId !== instanceId)
    );
    const newInputs = new Map(exerciseAmountInputs);
    newInputs.delete(instanceId);
    setExerciseAmountInputs(newInputs);
  };

  const handleSave = async () => {
    if (!workoutName.trim()) {
      alert('Bitte gib einen Namen für das Workout ein');
      return;
    }

    if (selectedExercises.length === 0) {
      alert('Bitte wähle mindestens eine Übung aus');
      return;
    }

    // Validiere und bereinige Übungen - setze Standard-Werte wenn amount fehlt oder 0 ist
    const exercises = selectedExercises.map((ex) => {
      // Wenn amount 0 oder undefined ist, verwende den Standard-Wert aus der ursprünglichen Übung
      const originalExercise = allExercises.find((e) => e.name === ex.name);
      const amount =
        ex.amount && ex.amount > 0
          ? ex.amount
          : originalExercise?.amount || 40;

      return {
        ...ex,
        amount,
      };
    });

    const workout: Workout = {
      id: workoutId || Date.now().toString(),
      name: workoutName.trim(),
      exercises,
      totalMinutes: (() => {
        const m = parseInt(workoutTotalMinutes || '0', 10);
        return Number.isFinite(m) && m > 0 ? m : undefined;
      })(),
      createdAt: workoutId ? undefined : Date.now(),
    };

    const success = await saveWorkout(workout);
    if (success) {
      router.back();
    } else {
      alert('Fehler beim Speichern des Workouts');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDarkBackground ? 'light' : 'dark'} />
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TextInput
            ref={titleInputRef}
            style={[
              styles.titleInput,
              { color: textColor },
              isTitleEditable &&
                (isDarkBackground
                  ? styles.titleInputEditingDark
                  : styles.titleInputEditingLight),
            ]}
            value={workoutName}
            onChangeText={setWorkoutName}
            editable={isTitleEditable}
            onBlur={() => setIsTitleEditable(false)}
            placeholder={workoutId ? 'Workoutname' : 'Neues Workout'}
            placeholderTextColor={placeholderColor}
            testID="create-workout-title-input"
          />
          <Pressable
            style={styles.titleEditButton}
            onPress={() => {
              if (!isTitleEditable) {
                setIsTitleEditable(true);
                // Kurzen Delay, damit editable-State sicher aktiv ist,
                // bevor der Fokus gesetzt wird (sorgt auch fürs Tastatur-Öffnen).
                setTimeout(() => {
                  titleInputRef.current?.focus();
                }, 0);
              } else {
                // Bearbeitung bestätigen
                setIsTitleEditable(false);
                titleInputRef.current?.blur();
              }
            }}>
            <Text
              style={
                isTitleEditable
                  ? styles.titleConfirmIcon
                  : styles.titleEditIcon
              }>
              {isTitleEditable ? '✓' : '✎'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.totalMinutesRow}>
          <Text style={[styles.totalMinutesLabel, { color: subTextColor }]}>Gesamtzeit (Min.)</Text>
          <TextInput
            value={workoutTotalMinutes}
            onChangeText={(t) => setWorkoutTotalMinutes(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            placeholder="z.B. 25"
            placeholderTextColor={placeholderColor}
            style={[styles.totalMinutesInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
          />
        </View>
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={styles.columnsContainer}>
          <ScrollView
            style={styles.leftColumn}
            contentContainerStyle={styles.leftColumnContent}>
            <View style={styles.section}>
              <View style={styles.availableExercisesContainer}>
                <Text style={[styles.availableExercisesTitle, { color: textColor }]}>
                  Weitere Übungen
                </Text>
                <Text style={[styles.availableExercisesHint, { color: subTextColor }]}>
                  Tippe auf eine Übung, um sie dem Workout hinzuzufügen. Über
                  das Info-Symbol siehst du Details und Bild.
                </Text>

                {allExercises.map((exercise) => (
                  <View key={exercise.name} style={[styles.exerciseCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={styles.exerciseHeader}>
                      <Pressable
                        style={styles.exerciseHeaderMain}
                        onPress={() => handleAddExerciseFromLibrary(exercise)}>
                        <Text
                          style={[styles.exerciseName, { color: textColor }]}
                          numberOfLines={2}
                          ellipsizeMode="tail">
                          {exercise.name}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.infoButton}
                        onPress={() => setInfoExercise(exercise)}>
                        <Text style={[styles.infoIcon, { borderColor: textColor, color: textColor }]}>i</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.newExerciseEntryContainer}>
                <Pressable
                  style={styles.addExerciseButton}
                  onPress={() => router.push('/create-exercise')}>
                  <Text style={styles.addExerciseButtonText}>
                    Neue Übung anlegen
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <View style={styles.rightColumn}>
            <Text style={[styles.rightColumnTitle, { color: textColor }]}>Dein Workout</Text>
            <DraggableFlatList
              data={selectedExercises}
              keyExtractor={(item) =>
                item.instanceId ? item.instanceId : item.name
              }
              onDragEnd={({ data }) => {
                setSelectedExercises(data);
              }}
              renderItem={({
                item,
                drag,
                isActive,
              }: RenderItemParams<WorkoutExercise>) => {
                const key = item.instanceId ?? item.name;
                const amountValue = exerciseAmountInputs.has(key)
                  ? exerciseAmountInputs.get(key) ?? ''
                  : item.amount?.toString() || '';

                let longPressTimeout: ReturnType<typeof setTimeout> | null =
                  null;

                return (
                  <View
                    style={[
                      styles.exerciseCard,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                      isActive && styles.exerciseCardActive,
                    ]}>
                    <TouchableOpacity
                      style={styles.selectedExerciseHeader}
                      onPressIn={() => {
                        longPressTimeout = setTimeout(drag, 200);
                      }}
                      onPressOut={() => {
                        if (longPressTimeout) {
                          clearTimeout(longPressTimeout);
                          longPressTimeout = null;
                        }
                      }}
                      activeOpacity={0.7}
                      testID={`create-selected-exercise-${key}`}>
                      <View style={styles.selectedContentRow}>
                        <View style={styles.selectedTextColumn}>
                          <Text style={[styles.selectedExerciseName, { color: textColor }]}>
                            {item.name}
                          </Text>
                          <View style={styles.amountRow}>
                            <Text style={[styles.amountUnitText, { color: textColor }]}>
                              {item.type === 'duration' ? 'Sek' : 'Anz.'}
                            </Text>
                            <TextInput
                              style={[styles.amountInlineInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                              value={amountValue}
                              onChangeText={(text) =>
                                updateExerciseAmountInput(key, text)
                              }
                              keyboardType="numeric"
                              placeholder={
                                item.amount ? item.amount.toString() : undefined
                              }
                              placeholderTextColor={placeholderColor}
                              testID={`create-exercise-amount-input-${key}`}
                            />
                          </View>
                        </View>
                        <Pressable
                          style={styles.removeExerciseButton}
                          onPress={() => key && removeExerciseInstance(key)}>
                          <Text style={styles.removeExerciseButtonText}>
                            ×
                          </Text>
                        </Pressable>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListFooterComponent={
                <View style={styles.footer}>
                  <Pressable
                    style={[styles.exerciseCard, styles.saveCard]}
                    onPress={handleSave}
                    testID="create-save-workout-button">
                    <Text style={styles.saveButtonText}>
                      {workoutId
                        ? 'Workout aktualisieren'
                        : 'Workout Speichern'}
                    </Text>
                  </Pressable>
                </View>
              }
              contentContainerStyle={styles.selectedListContent}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {infoExercise && (
        <Modal
          transparent
          animationType="fade"
          visible={!!infoExercise}
          onRequestClose={() => setInfoExercise(null)}>
          <View style={styles.infoModalOverlay}>
            <View style={[styles.infoModalCard, { backgroundColor: isDarkBackground ? '#111827' : '#ffffff', borderColor: '#4ade80' }]}>
              <Text style={[styles.infoModalTitle, { color: isDarkBackground ? '#ffffff' : '#111827' }]}>{infoExercise!.name}</Text>
              <Image
                source={getImageSource(
                  infoExercise!.name,
                  infoExercise!.image
                )}
                style={styles.infoModalImage}
                resizeMode="cover"
              />
              <Text style={styles.infoModalMeta}>
                {infoExercise!.type === 'duration'
                  ? `${infoExercise!.amount ?? 0} Sekunden`
                  : `${infoExercise!.amount ?? 0} Wiederholungen`}
              </Text>
              {infoExercise!.instructions ? (
                <Text style={[styles.infoModalText, { color: isDarkBackground ? '#e5e7eb' : '#374151' }]}>
                  {infoExercise!.instructions}
                </Text>
              ) : null}

              <Pressable
                style={styles.infoModalCloseButton}
                onPress={() => setInfoExercise(null)}>
                <Text style={styles.infoModalCloseText}>Schließen</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  totalMinutesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  totalMinutesLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalMinutesInput: {
    width: 90,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  titleInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
  },
  titleInputEditingDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  titleInputEditingLight: {
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  titleEditButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleEditIcon: {
    fontSize: 26,
    color: '#4ade80',
  },
  titleConfirmIcon: {
    fontSize: 26,
    color: '#4ade80',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    flex: 1,
  },
  leftColumnContent: {
    paddingHorizontal: 8,
    paddingBottom: 32,
  },
  rightColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  rightColumnTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
  selectedListContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333333',
  },
  exerciseCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 56,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 16,
    position: 'relative',
    height: 56,
  },
  checkboxContainer: {
    marginRight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4ade80',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#4ade80',
  },
  checkmark: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
  },
  exerciseType: {
    fontSize: 14,
    color: '#aaaaaa',
  },
  amountInputContainer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  amountLabel: {
    fontSize: 14,
    color: '#aaaaaa',
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333333',
  },
  amountInlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  amountInlineLabel: {
    fontSize: 12,
    color: '#aaaaaa',
    marginRight: 2,
  },
  amountInlineInput: {
    minWidth: 56,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 0,
    paddingVertical: 16,
    borderTopWidth: 0,
  },
  saveCard: {
    backgroundColor: '#4ade80',
    borderColor: '#4ade80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  exerciseImage: {
    width: 44,
    height: 32,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#2a2a2a',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addExerciseButton: {
    backgroundColor: '#4ade80',
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  addExerciseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  newExerciseCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  newExerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#4ade80',
    backgroundColor: '#2a2a2a',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaaaaa',
  },
  typeButtonTextActive: {
    color: '#4ade80',
  },
  newExerciseActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelNewExerciseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
  },
  cancelNewExerciseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveNewExerciseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4ade80',
    alignItems: 'center',
  },
  saveNewExerciseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  exerciseCardActive: {
    borderColor: '#4ade80',
  },
  removeExerciseButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeExerciseButtonText: {
    fontSize: 20,
    color: '#ff4b4b',
    fontWeight: 'bold',
  },
  availableExercisesContainer: {
    marginTop: 16,
  },
  availableExercisesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  availableExercisesHint: {
    fontSize: 14,
    marginBottom: 12,
  },
  exerciseHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 32,
  },
  selectedExerciseHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectedContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTextColumn: {
    flex: 1,
  },
  selectedExerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  amountUnitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  newExerciseEntryContainer: {
    marginTop: 16,
  },
  infoButton: {
    position: 'absolute',
    top: 4,
    right: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.9,
  },
  exerciseDescriptionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1f2933',
  },
  exerciseDescriptionText: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 20,
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  infoModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoModalImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#1f2933',
  },
  infoModalMeta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ade80',
    marginBottom: 8,
  },
  infoModalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoModalCloseButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#4ade80',
  },
  infoModalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
