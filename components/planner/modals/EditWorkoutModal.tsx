import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity } from 'react-native';

const formatDateRange = (date: Date) => {
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
};

interface Props {
  visible: boolean;
  onClose: () => void;
  workoutName: string;
  date: Date | null;
  isPast: boolean;
  onChangeDay: () => void;
  onChangeWorkout: () => void;
  onEditDetails: () => void;
  onDelete: () => void;
  backgroundColor: string;
}

export function EditWorkoutModal({
  visible,
  onClose,
  workoutName,
  date,
  isPast,
  onChangeDay,
  onChangeWorkout,
  onEditDetails,
  onDelete,
  backgroundColor,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        style={[styles.pickerOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
        onPress={onClose}>
        <Pressable style={[styles.editModalCard, { backgroundColor }]} onPress={() => {}}>
          <Text style={styles.editTitle}>Training bearbeiten</Text>
          <Text style={styles.editSubtitle}>
            {workoutName} {date ? `• ${formatDateRange(date)}` : ''}
          </Text>

          <TouchableOpacity
            style={styles.editAction}
            onPress={onChangeDay}
            activeOpacity={0.85}>
            <Text style={styles.editActionText}>Tag ändern</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editAction}
            onPress={onChangeWorkout}
            activeOpacity={0.85}>
            <Text style={styles.editActionText}>Workout ändern</Text>
          </TouchableOpacity>

          {isPast && (
            <TouchableOpacity
              style={styles.editAction}
              onPress={onEditDetails}
              activeOpacity={0.85}>
              <Text style={styles.editActionText}>Details bearbeiten</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.editAction} onPress={onDelete} activeOpacity={0.85}>
            <Text style={styles.editDeleteText}>Training löschen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editAction, { marginTop: 6 }]}
            onPress={onClose}
            activeOpacity={0.85}>
            <Text style={styles.editCancelText}>Abbrechen</Text>
          </TouchableOpacity>
        </Pressable>
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
  editModalCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#333333',
  },
  editTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  editSubtitle: {
    color: '#aaaaaa',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  editAction: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 10,
  },
  editActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  editDeleteText: {
    color: '#f59e0b',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  editCancelText: {
    color: '#aaaaaa',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});



