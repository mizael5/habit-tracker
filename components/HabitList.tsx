import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Habit } from '../types';
import { HabitItem } from './HabitItem';

type Props = {
  habits: Habit[];
  onToggle: (id: string) => void;
};

export function HabitList({ habits, onToggle }: Props) {
  if (habits.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No habits yet. Add one below!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={habits}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <HabitItem habit={item} onToggle={onToggle} />
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});
