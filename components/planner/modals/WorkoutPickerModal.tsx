import { Workout } from '@/types/interfaces';
import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  workouts: Workout[];
  onSelect: (workout: Workout) => void;
}

export function WorkoutPickerModal({ visible, onClose, workouts, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Workout wählen</Text>
          {workouts.length === 0 ? (
            <Text style={styles.emptyText}>Keine Workouts vorhanden.</Text>
          ) : (
            <FlatList
              data={workouts}
              keyExtractor={(w) => w.id}
              renderItem={({ item: w }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => onSelect(w)}>
                  <Text style={styles.pickerItemText}>{w.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
            <Text style={styles.pickerCancelText}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 40,
  },
  pickerContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  pickerItemText: {
    color: '#ffffff',
    fontSize: 18,
  },
  pickerCancel: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
  },
  pickerCancelText: {
    color: '#fff',
    fontSize: 16,
  },
});



