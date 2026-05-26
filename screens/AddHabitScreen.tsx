import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AddHabitScreenProps } from '../navigation/types';

export function AddHabitScreen({ route }: AddHabitScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {route.params?.habitId ? 'Edit Habit' : 'Add Habit'} — coming in Task 8
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  text: { fontSize: 16, color: '#6b7280' },
});
