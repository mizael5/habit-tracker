import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Habit } from '../types';

type Props = {
  habit: Habit;
  onToggle: (id: string) => void;
};

export function HabitItem({ habit, onToggle }: Props) {
  const todayStr = new Date().toISOString().split('T')[0];
  const completedToday = habit.completedDates.includes(todayStr);

  return (
    <TouchableOpacity
      style={[styles.row, completedToday && styles.rowCompleted]}
      onPress={() => onToggle(habit.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.circle, completedToday && styles.circleCompleted]}>
        {completedToday && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={[styles.name, completedToday && styles.nameCompleted]}>
        {habit.name}
      </Text>
      <Text style={styles.streak}>🔥 {habit.streak} {habit.streak === 1 ? 'day' : 'days'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowCompleted: {
    backgroundColor: '#f0fdf4',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  circleCompleted: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e',
  },
  check: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  nameCompleted: {
    color: '#6b7280',
  },
  streak: {
    fontSize: 14,
    color: '#6b7280',
  },
});
