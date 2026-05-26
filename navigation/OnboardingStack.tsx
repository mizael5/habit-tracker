import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { FirstHabitScreen } from '../screens/FirstHabitScreen';
import { HowItWorksScreen } from '../screens/HowItWorksScreen';
import { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="FirstHabit" component={FirstHabitScreen} />
      <Stack.Screen
        name="HowItWorks"
        component={HowItWorksScreen}
        options={{ headerShown: true, title: 'How It Works' }}
      />
    </Stack.Navigator>
  );
}
