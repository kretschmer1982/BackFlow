import { Exercise } from '@/constants/exercises';
import { getCustomExercises, getSettings, saveCustomExercise } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateExerciseScreen() {
  const router = useRouter();
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [exercise, setExercise] = useState<Partial<Exercise>>({
    name: '',
    type: 'duration',
    amount: 40,
    instructions: '',
    image: 'https://placehold.co/600x400/png?text=New+Exercise',
  });

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setBackgroundColor(settings.appBackgroundColor);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!exercise.name?.trim()) {
      alert('Bitte gib einen Namen für die Übung ein');
      return;
    }

    if (!exercise.instructions?.trim()) {
      alert('Bitte gib Anweisungen für die Übung ein');
      return;
    }

    const fullExercise: Exercise = {
      name: exercise.name.trim(),
      type: exercise.type || 'duration',
      amount: exercise.amount || 40,
      instructions: exercise.instructions.trim(),
      image: exercise.image || 'https://placehold.co/600x400/png?text=New+Exercise',
    };

    // Prüfe ob Übung mit diesem Namen bereits existiert
    const customExercises = await getCustomExercises();
    const exists = customExercises.some((e) => e.name === fullExercise.name);
    
    if (exists) {
      alert('Eine Übung mit diesem Namen existiert bereits');
      return;
    }

    const success = await saveCustomExercise(fullExercise);
    if (success) {
      alert('Übung erfolgreich erstellt!');
      router.back();
    } else {
      alert('Fehler beim Speichern der Übung');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Neue Übung</Text>
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.label}>Übungsname *</Text>
            <TextInput
              style={styles.input}
              value={exercise.name}
              onChangeText={(text) => setExercise({ ...exercise, name: text })}
              placeholder="z.B. Liegestütze"
              placeholderTextColor="#666666"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Anweisungen *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={exercise.instructions}
              onChangeText={(text) => setExercise({ ...exercise, instructions: text })}
              placeholder="Beschreibe die Übung..."
              placeholderTextColor="#666666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Typ</Text>
            <View style={styles.typeSelector}>
              <Pressable
                style={[
                  styles.typeButton,
                  exercise.type === 'duration' && styles.typeButtonActive,
                ]}
                onPress={() => setExercise({ ...exercise, type: 'duration' })}>
                <Text
                  style={[
                    styles.typeButtonText,
                    exercise.type === 'duration' && styles.typeButtonTextActive,
                  ]}>
                  Dauer
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.typeButton,
                  exercise.type === 'reps' && styles.typeButtonActive,
                ]}
                onPress={() => setExercise({ ...exercise, type: 'reps' })}>
                <Text
                  style={[
                    styles.typeButtonText,
                    exercise.type === 'reps' && styles.typeButtonTextActive,
                  ]}>
                  Wiederholungen
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              {exercise.type === 'duration' ? 'Sekunden' : 'Anzahl'}
            </Text>
            <TextInput
              style={styles.input}
              value={exercise.amount?.toString()}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (!isNaN(num) && num > 0) {
                  setExercise({ ...exercise, amount: num });
                } else if (text === '') {
                  // Eingabe gelöscht: amount nicht auf 0 setzen, sondern leer lassen
                  setExercise({ ...exercise, amount: undefined });
                }
              }}
              placeholder={exercise.type === 'duration' ? '40' : '10'}
              placeholderTextColor="#666666"
              keyboardType="numeric"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Übung Speichern</Text>
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
    marginBottom: 24,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#4ade80',
    backgroundColor: '#1a3a2a',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaaaaa',
  },
  typeButtonTextActive: {
    color: '#4ade80',
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
});


