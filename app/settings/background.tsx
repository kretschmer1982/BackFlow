import { getSettings, updateSettings } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Reduzierte Farbpalette für die App-Hintergründe
// Dunkle Hintergründe
// - Schwarz
// - Sehr dunkles Grau
// - Mittelgrau
// - Dunkelbraun
// - Dunkles Lila
// - Dunkelrot
// Helle Hintergründe
// - Weiß
// - Helles Grau
// - Heller Sandton
// - Sehr helles Lila
// - Helles Rosa
const COLOR_PALETTE: string[] = [
  '#000000', // schwarz
  '#111827', // sehr dunkles grau (Tailwind gray-900)
  '#4b5563', // grau (Tailwind gray-600)
  '#3f2a1b', // dunkelbraun
  '#4c1d95', // dunkel lila
  '#7f1d1d', // dunkelrot
  '#ffffff', // weiß
  '#e5e7eb', // helles grau
  '#f5e7d3', // hell sandfarben
  '#f3e8ff', // sehr helles lila
  '#fee2e2', // helles rosa
];

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

export default function BackgroundSettingsScreen() {
  const router = useRouter();
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');

  useEffect(() => {
    const load = async () => {
      const settings = await getSettings();
      setBackgroundColor(settings.appBackgroundColor);
    };
    load();
  }, []);

  const handleSelectColor = async (color: string) => {
    setBackgroundColor(color);
    await updateSettings({ appBackgroundColor: color });
  };

  const isLightBackground = isLightColor(backgroundColor);
  const statusBarStyle = isLightBackground ? 'dark' : 'light';

  const renderColorItem = ({ item }: { item: string }) => {
    const isSelected = item.toLowerCase() === backgroundColor.toLowerCase();

    return (
      <TouchableOpacity
        style={[
          styles.colorItem,
          { backgroundColor: item },
          isSelected && styles.colorItemSelected,
        ]}
        onPress={() => handleSelectColor(item)}
        activeOpacity={0.85}>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={statusBarStyle} />
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            isLightBackground && styles.titleOnLight,
          ]}>
          Hintergrund
        </Text>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionSubtitle,
            isLightBackground && styles.sectionSubtitleOnLight,
          ]}>
          Lege die Hintergrundfarbe für die gesamte App fest.
        </Text>

        <View style={styles.previewRow}>
          <View style={[styles.previewBox, { backgroundColor }]} />
        </View>

        <FlatList
          data={COLOR_PALETTE}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={styles.colorRow}
          renderItem={renderColorItem}
          contentContainerStyle={styles.colorListContent}
        />
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
  backButtonTextOnLight: {
    color: '#15803d',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  titleOnLight: {
    color: '#111827',
  },
  section: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#aaaaaa',
    marginBottom: 16,
  },
  sectionSubtitleOnLight: {
    color: '#4b5563',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  previewBox: {
    width: 64,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  colorListContent: {
    paddingBottom: 24,
  },
  colorRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  colorItem: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorItemSelected: {
    borderColor: '#4ade80',
  },
});


