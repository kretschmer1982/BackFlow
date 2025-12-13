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
import React, { useCallback, useEffect, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Pressable,
    SafeAreaView,
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

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const [workoutName, setWorkoutName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [selectedExercises, setSelectedExercises] =
    useState<WorkoutExercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>(EXERCISES);
  // State für Eingabewerte der Übungsmengen (erlaubt leere Strings)
  const [exerciseAmountInputs, setExerciseAmountInputs] =
    useState<Map<string, string>>(new Map());
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);

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
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TextInput
            style={styles.titleInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder={workoutId ? 'Workoutname' : 'Neues Workout'}
            placeholderTextColor="#666666"
            testID="create-workout-title-input"
          />
          <Text style={styles.titleEditIcon}>✎</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={styles.columnsContainer}>
          <ScrollView
            style={styles.leftColumn}
            contentContainerStyle={styles.leftColumnContent}>
            <View style={styles.section}>
              <View style={styles.availableExercisesContainer}>
                <Text style={styles.availableExercisesTitle}>
                  Weitere Übungen
                </Text>
                <Text style={styles.availableExercisesHint}>
                  Tippe auf eine Übung, um sie dem Workout hinzuzufügen. Über
                  das Info-Symbol siehst du Details und Bild.
                </Text>

                {allExercises.map((exercise) => (
                  <View key={exercise.name} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <Pressable
                        style={styles.exerciseHeaderMain}
                        onPress={() => handleAddExerciseFromLibrary(exercise)}>
                        <Text
                          style={styles.exerciseName}
                          numberOfLines={2}
                          ellipsizeMode="tail">
                          {exercise.name}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.infoButton}
                        onPress={() => setInfoExercise(exercise)}>
                        <Text style={styles.infoIcon}>i</Text>
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
            <Text style={styles.rightColumnTitle}>Dein Workout</Text>
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
                          <Text style={styles.selectedExerciseName}>
                            {item.name}
                          </Text>
                          <View style={styles.amountRow}>
                            <Text style={styles.amountUnitText}>
                              {item.type === 'duration' ? 'Sek' : 'Anz.'}
                            </Text>
                            <TextInput
                              style={styles.amountInlineInput}
                              value={amountValue}
                              onChangeText={(text) =>
                                updateExerciseAmountInput(key, text)
                              }
                              keyboardType="numeric"
                              placeholder={
                                item.amount ? item.amount.toString() : undefined
                              }
                              placeholderTextColor="#666666"
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
                    style={styles.saveButton}
                    onPress={handleSave}
                    testID="create-save-workout-button">
                    <Text style={styles.saveButtonText}>
                      {workoutId ? 'Workout aktualisieren' : 'Workout Speichern'}
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
            <View style={styles.infoModalCard}>
              <Text style={styles.infoModalTitle}>{infoExercise!.name}</Text>
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
                <Text style={styles.infoModalText}>
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
    backgroundColor: '#1a1a1a',
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
  titleInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  titleEditIcon: {
    fontSize: 20,
    color: '#4ade80',
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
    color: '#ffffff',
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
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
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
    color: '#ffffff',
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
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    borderTopWidth: 0,
  },
  saveButton: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: 1,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addExerciseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
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
    backgroundColor: '#3a3a3a',
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
    color: '#ffffff',
    marginBottom: 4,
  },
  availableExercisesHint: {
    fontSize: 14,
    color: '#aaaaaa',
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
    color: '#ffffff',
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
    color: '#ffffff',
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
    borderColor: '#ffffff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
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
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
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
    color: '#a7f3d0',
    marginBottom: 8,
  },
  infoModalText: {
    fontSize: 14,
    color: '#e5e7eb',
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
