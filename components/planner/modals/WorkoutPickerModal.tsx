import { APP_THEME_COLORS, isLightColor } from '@/constants/theme';
import { Workout } from '@/types/interfaces';
import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  workouts: Workout[];
  onSelect: (workout: Workout) => void;
  backgroundColor: string;
}

export function WorkoutPickerModal({
  visible,
  onClose,
  workouts,
  onSelect,
  backgroundColor,
}: Props) {
  const isLight = isLightColor(backgroundColor);
  const theme = isLight ? APP_THEME_COLORS.light : APP_THEME_COLORS.dark;
  const overlayColor = isLight ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.75)';
  const cardBg = theme.cardBackground;
  const borderColor = theme.borderColor;
  const textColor = theme.text;
  const subtextColor = theme.subtext;
  const accentColor = theme.accent;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={[styles.pickerOverlay, { backgroundColor: overlayColor }]} onPress={onClose}>
        <View style={[styles.pickerContainer, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.pickerTitle, { color: textColor }]}>Workout wählen</Text>
          {workouts.length === 0 ? (
            <Text style={[styles.emptyText, { color: subtextColor }]}>Keine Workouts vorhanden.</Text>
          ) : (
            <FlatList
              data={workouts}
              keyExtractor={(w) => w.id}
              renderItem={({ item: w }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, { borderBottomColor: borderColor }]}
                  onPress={() => onSelect(w)}>
                  <Text style={[styles.pickerItemText, { color: textColor }]}>{w.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity
            style={[styles.pickerCancel, { borderColor, backgroundColor: cardBg }]}
            onPress={onClose}>
            <Text style={[styles.pickerCancelText, { color: accentColor }]}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 40,
  },
  pickerContainer: {
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
    borderWidth: 1,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 18,
  },
  pickerCancel: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
});




