import { Tabs } from 'expo-router';
import React, { useState } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSettings } from '@/utils/storage';
import { useFocusEffect } from '@react-navigation/native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');

  useFocusEffect(
    React.useCallback(() => {
      const loadSettings = async () => {
        const settings = await getSettings();
        setBackgroundColor(settings.appBackgroundColor);
      };
      loadSettings();
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: backgroundColor,
          borderTopColor: '#333333',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="figure.run" color={color} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
