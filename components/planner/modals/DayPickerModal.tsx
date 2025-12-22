import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Helper für Datumsformatierung
const formatDateRange = (date: Date) => {
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
};

function toLocalDateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  days: Date[]; // Die nächsten 7 Tage
  onSelect: (date: Date) => void;
  currentDate: Date | null; // Der Tag, von dem wir verschieben (um "aktueller Tag" anzuzeigen)
  todayKey: string;
  isDayFull: (date: Date) => boolean;
}

export function DayPickerModal({
  visible,
  onClose,
  days,
  onSelect,
  currentDate,
  todayKey,
  isDayFull,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Tag wählen</Text>
          <Text style={styles.pickerSubtitle}>
            Wähle einen Tag mit freiem Slot (max. 3 Trainings pro Tag).
          </Text>
          <FlatList
            data={days}
            keyExtractor={(d) => d.toISOString()}
            renderItem={({ item: d }) => {
              const occupied = isDayFull(d);
              const isSame = currentDate
                ? toLocalDateKey(currentDate) === toLocalDateKey(d)
                : false;
              const isPast = toLocalDateKey(d) < todayKey;
              const disabled = occupied && !isSame;

              return (
                <TouchableOpacity
                  style={[
                    styles.dayPickItem,
                    (disabled || isPast) && styles.dayPickItemDisabled,
                  ]}
                  onPress={() => {
                    if (isPast) {
                      // Alert Logik im Parent oder hier? Besser hier kurz abfangen.
                      // Da wir aber Alert nicht importiert haben, lassen wir onClick einfach ins Leere laufen
                      // oder rufen select auf und Parent prüft nochmal.
                      // Wir rendern es als disabled, also sollte onPress idealerweise nichts tun.
                      return;
                    }
                    if (disabled) {
                      return;
                    }
                    onSelect(d);
                  }}
                  activeOpacity={0.8}
                  disabled={disabled || isPast}>
                  <Text style={styles.dayPickText}>
                    {formatDateRange(d)}
                    {isPast ? '  (vergangen)' : disabled ? '  (belegt)' : ''}
                    {isSame ? '  (aktueller Tag)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
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
  pickerSubtitle: {
    color: '#aaaaaa',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  dayPickItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  dayPickItemDisabled: {
    opacity: 0.45,
  },
  dayPickText: {
    color: '#ffffff',
    fontSize: 16,
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






