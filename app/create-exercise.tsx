import { Exercise } from '@/constants/exercises';
import { APP_THEME_COLORS } from '@/constants/theme';
import { getCustomExercises, getSettings, saveCustomExercise } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
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

export default function CreateExerciseScreen() {
  const router = useRouter();
  const [backgroundColor, setBackgroundColor] = useState<string>(APP_THEME_COLORS.dark.background);
  const [exercise, setExercise] = useState<Partial<Exercise>>({
    name: '',
    type: 'duration',
    amount: 40,
    instructions: '',
  });

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setBackgroundColor(settings.appBackgroundColor);
    };
    loadSettings();
  }, []);

  const isDarkBackground = useMemo(() => isDarkColor(backgroundColor), [backgroundColor]);
  const theme = isDarkBackground ? APP_THEME_COLORS.dark : APP_THEME_COLORS.light;
  const accentColor = theme.accent;
  const cardBg = theme.cardBackground;
  
  const textColor = isDarkBackground ? '#ffffff' : '#111827';
  const labelColor = isDarkBackground ? '#ffffff' : '#111827';
  const inputBg = isDarkBackground ? '#2a2a2a' : '#f9fafb';
  const inputBorder = isDarkBackground ? '#333333' : '#d1d5db';
  const inputColor = isDarkBackground ? '#ffffff' : '#111827';
  const placeholderColor = isDarkBackground ? '#666666' : '#9ca3af';

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
      id: '',
      name: exercise.name.trim(),
      type: exercise.type || 'duration',
      amount: exercise.amount || 40,
      instructions: exercise.instructions.trim(),
      source: 'custom',
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
      <StatusBar style={isDarkBackground ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: inputBorder }]}>
        <Text style={[styles.title, { color: textColor }]}>Neue Übung</Text>
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={[styles.label, { color: labelColor }]}>Übungsname *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor }]}
              value={exercise.name}
              onChangeText={(text) => setExercise({ ...exercise, name: text })}
              placeholder="z.B. Liegestütze"
              placeholderTextColor={placeholderColor}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: labelColor }]}>Anweisungen *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor }]}
              value={exercise.instructions}
              onChangeText={(text) => setExercise({ ...exercise, instructions: text })}
              placeholder="Beschreibe die Übung..."
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: labelColor }]}>Typ</Text>
            <View style={styles.typeSelector}>
              <Pressable
                style={[
                  styles.typeButton,
                  { backgroundColor: inputBg, borderColor: inputBorder },
                  exercise.type === 'duration' && { borderColor: accentColor },
                ]}
                onPress={() => setExercise({ ...exercise, type: 'duration' })}>
                <Text
                  style={[
                    styles.typeButtonText,
                    exercise.type === 'duration' && { color: accentColor },
                  ]}>
                  Dauer
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.typeButton,
                  { backgroundColor: inputBg, borderColor: inputBorder },
                  exercise.type === 'reps' && { borderColor: accentColor },
                ]}
                onPress={() => setExercise({ ...exercise, type: 'reps' })}>
                <Text
                  style={[
                    styles.typeButtonText,
                    exercise.type === 'reps' && { color: accentColor },
                  ]}>
                  Wiederholungen
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: labelColor }]}>
              {exercise.type === 'duration' ? 'Sekunden' : 'Anzahl'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor }]}
              value={exercise.amount?.toString()}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (!isNaN(num) && num > 0) {
                  setExercise({ ...exercise, amount: num });
                } else if (text === '') {
                  setExercise({ ...exercise, amount: undefined });
                }
              }}
              placeholder={exercise.type === 'duration' ? '40' : '10'}
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: backgroundColor, borderTopColor: inputBorder }]}>
          <Pressable 
            style={[styles.saveButton, { backgroundColor: cardBg, borderWidth: 1, borderColor: inputBorder }]} 
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: accentColor }]}>Übung Speichern</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
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
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    borderWidth: 1,
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
    borderWidth: 2,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaaaaa',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
