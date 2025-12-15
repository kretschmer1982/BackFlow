import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  date: Date | null;
  completed: boolean;
  onToggleCompleted: () => void;
  durationMinutes: string;
  onChangeDuration: (text: string) => void;
  onSave: () => void;
  backgroundColor: string;
}

export function PastWorkoutDetailsModal({
  visible,
  onClose,
  date,
  completed,
  onToggleCompleted,
  durationMinutes,
  onChangeDuration,
  onSave,
  backgroundColor,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        style={[styles.pickerOverlay, { backgroundColor: 'rgba(0,0,0,0.75)' }]}
        onPress={onClose}>
        <Pressable style={[styles.editModalCard, { backgroundColor }]} onPress={() => {}}>
          <Text style={styles.editTitle}>Training (Vergangenheit)</Text>
          <Text style={styles.editSubtitle}>{date ? formatDateRange(date) : ''}</Text>

          <TouchableOpacity
            style={styles.editAction}
            onPress={onToggleCompleted}
            activeOpacity={0.85}>
            <Text style={styles.editActionText}>
              Training durchgeführt: {completed ? 'Ja' : 'Nein'}
            </Text>
          </TouchableOpacity>

          <View style={[styles.editAction, { paddingVertical: 10 }]}>
            <Text style={[styles.editActionText, { textAlign: 'left', marginBottom: 6 }]}>
              Gesamtzeit (Minuten)
            </Text>
            <TextInput
              value={durationMinutes}
              onChangeText={onChangeDuration}
              keyboardType="numeric"
              placeholder="z.B. 25"
              placeholderTextColor="#666666"
              style={styles.detailsInput}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.pickerCancel, { flex: 1, marginTop: 0 }]}
              onPress={onClose}
              activeOpacity={0.85}>
              <Text style={styles.pickerCancelText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveDetailsBtn, { flex: 1 }]}
              onPress={onSave}
              activeOpacity={0.85}>
              <Text style={styles.saveDetailsBtnText}>Speichern</Text>
            </TouchableOpacity>
          </View>
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
  detailsInput: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerCancel: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
  },
  pickerCancelText: {
    color: '#fff',
    fontSize: 16,
  },
  saveDetailsBtn: {
    marginTop: 0,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  saveDetailsBtnText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
});



