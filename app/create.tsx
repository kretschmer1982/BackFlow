import { Exercise, EXERCISES, getImageSource } from '@/constants/exercises';
import { Workout, WorkoutExercise } from '@/types/interfaces';
import { getCustomExercises, getWorkoutById, saveCustomExercise, saveWorkout, getSettings } from '@/utils/storage';
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

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const [workoutName, setWorkoutName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [selectedExercises, setSelectedExercises] = useState<
    Map<string, WorkoutExercise>
  >(new Map());
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

  // Lade Workout zum Bearbeiten
  useEffect(() => {
    const loadWorkout = async () => {
      if (workoutId) {
        const workout = await getWorkoutById(workoutId);
        if (workout) {
          setWorkoutName(workout.name);
          const exercisesMap = new Map<string, WorkoutExercise>();
          const inputsMap = new Map<string, string>();
          workout.exercises.forEach((ex) => {
            exercisesMap.set(ex.name, ex);
            inputsMap.set(ex.name, ex.amount?.toString() || '');
          });
          setSelectedExercises(exercisesMap);
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

  const toggleExercise = (exercise: Exercise) => {
    const newSelected = new Map(selectedExercises);
    const newInputs = new Map(exerciseAmountInputs);
    if (newSelected.has(exercise.name)) {
      newSelected.delete(exercise.name);
      newInputs.delete(exercise.name);
    } else {
      // Füge Übung mit Standard-Werten hinzu
      newSelected.set(exercise.name, { ...exercise });
      newInputs.set(exercise.name, exercise.amount.toString());
    }
    setSelectedExercises(newSelected);
    setExerciseAmountInputs(newInputs);
  };

  const updateExerciseAmount = (exerciseName: string, amount: number) => {
    const newSelected = new Map(selectedExercises);
    const exercise = newSelected.get(exerciseName);
    if (exercise) {
      newSelected.set(exerciseName, { ...exercise, amount });
    }
    setSelectedExercises(newSelected);
  };

  const updateExerciseAmountInput = (exerciseName: string, text: string) => {
    // Entferne alle nicht-numerischen Zeichen
    const cleanedText = text.replace(/[^0-9]/g, '');
    
    // Aktualisiere immer den Input-State mit dem bereinigten Text (oder leerem String)
    const newInputs = new Map(exerciseAmountInputs);
    newInputs.set(exerciseName, cleanedText);
    setExerciseAmountInputs(newInputs);
    
    // Aktualisiere den tatsächlichen Wert nur wenn eine gültige Zahl eingegeben wird
    if (cleanedText === '') {
      // Leere Eingabe erlauben - der State bleibt leer
      // Der tatsächliche Wert bleibt unverändert, wird aber beim Speichern validiert
      return;
    }
    
    const num = parseInt(cleanedText, 10);
    if (!isNaN(num) && num > 0) {
      updateExerciseAmount(exerciseName, num);
    }
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
      const newSelected = new Map(selectedExercises);
      newSelected.set(exercise.name, { ...exercise });
      setSelectedExercises(newSelected);
      
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

    if (selectedExercises.size === 0) {
      alert('Bitte wähle mindestens eine Übung aus');
      return;
    }

    // Validiere und bereinige Übungen - setze Standard-Werte wenn amount fehlt oder 0 ist
    const exercises = Array.from(selectedExercises.values()).map((ex) => {
      // Wenn amount 0 oder undefined ist, verwende den Standard-Wert aus der ursprünglichen Übung
      const originalExercise = allExercises.find((e) => e.name === ex.name);
      const amount = ex.amount && ex.amount > 0 ? ex.amount : (originalExercise?.amount || 40);
      
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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Zurück</Text>
        </Pressable>
        <Text style={styles.title}>{workoutId ? 'Workout bearbeiten' : 'Neues Workout'}</Text>
      </View>

      <KeyboardAvoidingView behavior="padding" style={{flex:1}}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.label}>Workout-Name</Text>
            <TextInput
              style={styles.input}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="z.B. Morgen-Routine"
              placeholderTextColor="#666666"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Übungen auswählen</Text>
              <Pressable
                style={styles.addExerciseButton}
                onPress={() => setShowNewExerciseForm(!showNewExerciseForm)}>
                <Text style={styles.addExerciseButtonText}>
                  {showNewExerciseForm ? '−' : '+'} Neue Übung
                </Text>
              </Pressable>
            </View>

            {showNewExerciseForm && (
              <View style={styles.newExerciseCard}>
                <Text style={styles.newExerciseTitle}>Neue Übung erstellen</Text>
                <TextInput
                  style={styles.input}
                  value={newExercise.name}
                  onChangeText={(text) => setNewExercise({ ...newExercise, name: text })}
                  placeholder="Übungsname"
                  placeholderTextColor="#666666"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newExercise.instructions}
                  onChangeText={(text) => setNewExercise({ ...newExercise, instructions: text })}
                  placeholder="Anweisungen"
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.typeSelector}>
                  <Pressable
                    style={[
                      styles.typeButton,
                      newExercise.type === 'duration' && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewExercise({ ...newExercise, type: 'duration' })}>
                    <Text
                      style={[
                        styles.typeButtonText,
                        newExercise.type === 'duration' && styles.typeButtonTextActive,
                      ]}>
                      Dauer
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.typeButton,
                      newExercise.type === 'reps' && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewExercise({ ...newExercise, type: 'reps' })}>
                    <Text
                      style={[
                        styles.typeButtonText,
                        newExercise.type === 'reps' && styles.typeButtonTextActive,
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
                      setNewExercise({ ...newExercise, amount: num });
                    }
                  }}
                  placeholder={newExercise.type === 'duration' ? 'Sekunden' : 'Anzahl'}
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
                        image: 'https://placehold.co/600x400/png?text=New+Exercise',
                      });
                    }}>
                    <Text style={styles.cancelNewExerciseButtonText}>Abbrechen</Text>
                  </Pressable>
                  <Pressable style={styles.saveNewExerciseButton} onPress={handleSaveNewExercise}>
                    <Text style={styles.saveNewExerciseButtonText}>Speichern</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {allExercises.map((exercise) => {
              const isSelected = selectedExercises.has(exercise.name);
              const selectedExercise = selectedExercises.get(exercise.name);

              return (
                <View key={exercise.name} style={styles.exerciseCard}>
                  <TouchableOpacity
                    style={styles.exerciseHeader}
                    onPress={() => toggleExercise(exercise)}
                    activeOpacity={0.7}>
                    {/* Bild-Thumbnail */}
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
                        ]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseType}>
                        {exercise.type === 'duration' ? 'Dauer' : 'Wiederholungen'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {isSelected && (
                    <View style={styles.amountInputContainer}>
                      <Text style={styles.amountLabel}>
                        {exercise.type === 'duration' ? 'Sekunden' : 'Anzahl'}
                      </Text>
                      <TextInput
                        style={styles.amountInput}
                        value={exerciseAmountInputs.has(exercise.name) 
                          ? (exerciseAmountInputs.get(exercise.name) ?? '')
                          : (selectedExercise?.amount?.toString() || exercise.amount.toString())}
                        onChangeText={(text) => updateExerciseAmountInput(exercise.name, text)}
                        keyboardType="numeric"
                        placeholder={exercise.amount.toString()}
                        placeholderTextColor="#666666"
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

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
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4ade80',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
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
});

