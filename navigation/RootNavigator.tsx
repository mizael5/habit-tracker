import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TabNavigator } from './TabNavigator';
import { OnboardingStack } from './OnboardingStack';

export function RootNavigator() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarded').then((v) => setOnboarded(v === 'true'));

    // Poll for onboarding completion (set by FirstHabitScreen)
    const interval = setInterval(async () => {
      const v = await AsyncStorage.getItem('onboarded');
      if (v === 'true') {
        setOnboarded(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (onboarded === null) return null; // splash/loading

  return (
    <NavigationContainer>
      {onboarded ? <TabNavigator /> : <OnboardingStack />}
    </NavigationContainer>
  );
}
