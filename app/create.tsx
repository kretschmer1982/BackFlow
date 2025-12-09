import { Exercise, EXERCISES, getImageSource } from '@/constants/exercises';
import { Workout, WorkoutExercise } from '@/types/interfaces';
import {
  getCustomExercises,
  getSettings,
  getWorkoutById,
  saveCustomExercise,
  saveWorkout,
} from '@/utils/storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
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
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>(EXERCISES);
  const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
    name: '',
    type: 'duration',
    amount: 40,
    instructions: '',
    image: 'https://placehold.co/600x400/png?text=New+Exercise',
  });
  // State für Eingabewerte der Übungsmengen (erlaubt leere Strings)
  const [exerciseAmountInputs, setExerciseAmountInputs] = useState<Map<string, string>>(new Map());
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [pickerSelections, setPickerSelections] = useState<string[]>([]);

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

  const toggleExerciseSelection = (exerciseName: string) => {
    setPickerSelections((prev) =>
      prev.includes(exerciseName)
        ? prev.filter((name) => name !== exerciseName)
        : [...prev, exerciseName]
    );
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

  const handleSaveNewExercise = async () => {
    if (!newExercise.name?.trim()) {
      alert('Bitte gib einen Namen für die Übung ein');
      return;
    }

    if (!newExercise.instructions?.trim()) {
      alert('Bitte gib Anweisungen für die Übung ein');
      return;
    }

    const exercise: Exercise = {
      name: newExercise.name.trim(),
      type: newExercise.type || 'duration',
      amount: newExercise.amount || 40,
      instructions: newExercise.instructions.trim(),
      image: newExercise.image || 'https://placehold.co/600x400/png?text=New+Exercise',
    };

    const success = await saveCustomExercise(exercise);
    if (success) {
      // Aktualisiere die Übungsliste
      const customExercises = await getCustomExercises();
      setAllExercises([...EXERCISES, ...customExercises]);

      // Füge die neue Übung automatisch zum Workout hinzu
      const instance = createExerciseInstance(exercise);
      setSelectedExercises((prev) => [...prev, instance]);
      if (instance.instanceId) {
        const newInputs = new Map(exerciseAmountInputs);
        newInputs.set(instance.instanceId, exercise.amount.toString());
        setExerciseAmountInputs(newInputs);
      }

      // Reset Form
      setNewExercise({
        name: '',
        type: 'duration',
        amount: 40,
        instructions: '',
        image: 'https://placehold.co/600x400/png?text=New+Exercise',
      });
      setShowNewExerciseForm(false);
    } else {
      alert('Fehler beim Speichern der Übung');
    }
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

  if (showExercisePicker) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.titleInput}>Weitere Übungen</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            {allExercises.map((exercise) => {
              const isSelected = pickerSelections.includes(exercise.name);

              return (
                <View key={exercise.name} style={styles.exerciseCard}>
                  <TouchableOpacity
                    style={styles.exerciseHeader}
                    onPress={() => toggleExerciseSelection(exercise.name)}
                    activeOpacity={0.7}>
                    <Image
                      source={getImageSource(exercise.name, exercise.image)}
                      style={styles.exerciseImage}
                      resizeMode="cover"
                    />
                    <View style={styles.checkboxContainer}>
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxChecked,
                        ]}
                      />
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseType}>
                        {exercise.type === 'duration'
                          ? 'Dauer'
                          : 'Wiederholungen'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={styles.saveButton}
            onPress={() => {
              if (pickerSelections.length === 0) {
                setShowExercisePicker(false);
                return;
              }

              const newSelected = [...selectedExercises];
              const newInputs = new Map(exerciseAmountInputs);

              pickerSelections.forEach((name) => {
                const tmpl = allExercises.find((e) => e.name === name);
                if (tmpl) {
                  const instance = createExerciseInstance(tmpl);
                  newSelected.push(instance);
                  if (instance.instanceId) {
                    newInputs.set(
                      instance.instanceId,
                      tmpl.amount.toString()
                    );
                  }
                }
              });

              setSelectedExercises(newSelected);
              setExerciseAmountInputs(newInputs);
              setPickerSelections([]);
              setShowExercisePicker(false);
            }}>
            <Text style={styles.saveButtonText}>Übungen übernehmen</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
          />
          <Text style={styles.titleEditIcon}>✎</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
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
                  style={styles.exerciseHeader}
                  onPressIn={() => {
                    longPressTimeout = setTimeout(drag, 200);
                  }}
                  onPressOut={() => {
                    if (longPressTimeout) {
                      clearTimeout(longPressTimeout);
                      longPressTimeout = null;
                    }
                  }}
                  activeOpacity={0.7}>
                  <Image
                    source={getImageSource(item.name, item.image)}
                    style={styles.exerciseImage}
                    resizeMode="cover"
                  />
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseType}>
                      {item.type === 'duration'
                        ? 'Dauer'
                        : 'Wiederholungen'}
                    </Text>
                  </View>
                  <View style={styles.amountInlineContainer}>
                    <Text style={styles.amountInlineLabel}>
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
                    />
                  </View>
                  <Pressable
                    style={styles.removeExerciseButton}
                    onPress={() => key && removeExerciseInstance(key)}>
                    <Text style={styles.removeExerciseButtonText}>×</Text>
                  </Pressable>
                </TouchableOpacity>
              </View>
            );
          }}
          ListHeaderComponent={
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.label}>Übungen auswählen</Text>
                  <Pressable
                    style={styles.addExerciseButton}
                    onPress={() =>
                      setShowNewExerciseForm(!showNewExerciseForm)
                    }>
                    <Text style={styles.addExerciseButtonText}>
                      {showNewExerciseForm ? '−' : '+'} Neue Übung
                    </Text>
                  </Pressable>
                </View>

                {showNewExerciseForm && (
                  <View style={styles.newExerciseCard}>
                    <Text style={styles.newExerciseTitle}>
                      Neue Übung erstellen
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={newExercise.name}
                      onChangeText={(text) =>
                        setNewExercise({ ...newExercise, name: text })
                      }
                      placeholder="Übungsname"
                      placeholderTextColor="#666666"
                    />
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={newExercise.instructions}
                      onChangeText={(text) =>
                        setNewExercise({
                          ...newExercise,
                          instructions: text,
                        })
                      }
                      placeholder="Anweisungen"
                      placeholderTextColor="#666666"
                      multiline
                      numberOfLines={3}
                    />
                    <View style={styles.typeSelector}>
                      <Pressable
                        style={[
                          styles.typeButton,
                          newExercise.type === 'duration' &&
                            styles.typeButtonActive,
                        ]}
                        onPress={() =>
                          setNewExercise({
                            ...newExercise,
                            type: 'duration',
                          })
                        }>
                        <Text
                          style={[
                            styles.typeButtonText,
                            newExercise.type === 'duration' &&
                              styles.typeButtonTextActive,
                          ]}>
                          Dauer
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.typeButton,
                          newExercise.type === 'reps' &&
                            styles.typeButtonActive,
                        ]}
                        onPress={() =>
                          setNewExercise({
                            ...newExercise,
                            type: 'reps',
                          })
                        }>
                        <Text
                          style={[
                            styles.typeButtonText,
                            newExercise.type === 'reps' &&
                              styles.typeButtonTextActive,
                          ]}>
                          Wiederholungen
                        </Text>
                      </Pressable>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={newExercise.amount?.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        if (!isNaN(num) && num > 0) {
                          setNewExercise({
                            ...newExercise,
                            amount: num,
                          });
                        }
                      }}
                      placeholder={
                        newExercise.type === 'duration'
                          ? 'Sekunden'
                          : 'Anzahl'
                      }
                      placeholderTextColor="#666666"
                      keyboardType="numeric"
                    />
                    <View style={styles.newExerciseActions}>
                      <Pressable
                        style={styles.cancelNewExerciseButton}
                        onPress={() => {
                          setShowNewExerciseForm(false);
                          setNewExercise({
                            name: '',
                            type: 'duration',
                            amount: 40,
                            instructions: '',
                            image:
                              'https://placehold.co/600x400/png?text=New+Exercise',
                          });
                        }}>
                        <Text style={styles.cancelNewExerciseButtonText}>
                          Abbrechen
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.saveNewExerciseButton}
                        onPress={handleSaveNewExercise}>
                        <Text style={styles.saveNewExerciseButtonText}>
                          Speichern
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                <View style={styles.moreExercisesContainer}>
                  <Pressable
                    style={styles.moreExercisesButton}
                    onPress={() => setShowExercisePicker(true)}>
                    <Text style={styles.moreExercisesButtonText}>
                      Weitere Übungen
                    </Text>
                  </Pressable>
                </View>
              </View>
            </>
          }
          contentContainerStyle={styles.scrollContent}
        />

        <View style={styles.footer}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {workoutId ? 'Workout aktualisieren' : 'Workout Speichern'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
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
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
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
    minWidth: 48,
    paddingVertical: 4,
    paddingHorizontal: 8,
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
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
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
    width: 48,
    height: 36,
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
  moreExercisesContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  moreExercisesButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#333333',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  moreExercisesButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

