import { StyleSheet } from 'react-native';

export const sharedRunTextStyles = StyleSheet.create({
  roundLine: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  countdown: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  headerLabel: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  exerciseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    marginVertical: 12,
  },
  instructions: {
    fontSize: 24,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
    lineHeight: 26,
  },
});

export const sharedRunLayoutStyles = StyleSheet.create({
  roundRow: {
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
  },
});



