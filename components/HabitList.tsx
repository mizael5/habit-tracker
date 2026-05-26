import React from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import { Habit } from '../types';
import { HabitItem } from './HabitItem';

type Props = {
  habits: Habit[];
  onToggle: (id: string) => void;
  onIncrement: (id: string) => void;
  onPress: (id: string) => void;
};

export function HabitList({ habits, onToggle, onIncrement, onPress }: Props) {
  if (habits.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No habits yet — add your first one!</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={habits}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <HabitItem
          habit={item}
          onToggle={onToggle}
          onIncrement={onIncrement}
          onPress={onPress}
        />
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 8, paddingBottom: 100 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
