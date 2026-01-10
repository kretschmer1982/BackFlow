import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { seedDemoWorkouts } from '@/utils/seed';
import { useRouter } from 'expo-router';

export default function SeedScreen() {
  const [status, setStatus] = useState('Seeding...');
  const router = useRouter();

  useEffect(() => {
    async function run() {
      try {
        await seedDemoWorkouts();
        setStatus('Seeding complete!');
        // Optional: Nach einer kurzen Verzögerung zurückkehren
        setTimeout(() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/');
          }
        }, 500);
      } catch (err) {
        setStatus('Seeding failed: ' + (err as Error).message);
      }
    }
    run();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

