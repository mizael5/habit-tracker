import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TodayScreen } from '../screens/TodayScreen';
import { AddHabitScreen } from '../screens/AddHabitScreen';
import { HabitDetailScreen } from '../screens/HabitDetailScreen';
import { TodayStackParamList } from './types';

const Stack = createNativeStackNavigator<TodayStackParamList>();

export function TodayStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TodayScreen"
        component={TodayScreen}
        options={{ title: 'Habit Tracker', headerLargeTitle: true }}
      />
      <Stack.Screen
        name="AddHabit"
        component={AddHabitScreen}
        options={({ route }) => ({
          title: route.params?.habitId ? 'Edit Habit' : 'New Habit',
        })}
      />
      <Stack.Screen
        name="HabitDetail"
        component={HabitDetailScreen}
        options={{ title: 'Habit Detail' }}
      />
    </Stack.Navigator>
  );
}
