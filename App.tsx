import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AddHabitModal } from './components/AddHabitModal';
import { HabitList } from './components/HabitList';
import { useHabits } from './hooks/useHabits';

export default function App() {
  const { habits, addHabit, toggleHabit } = useHabits();
  const [modalVisible, setModalVisible] = useState(false);

  const handleAdd = (name: string) => {
    addHabit(name);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Habit Tracker</Text>
      </View>
      <HabitList habits={habits} onToggle={toggleHabit} />
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add Habit</Text>
        </TouchableOpacity>
      </View>
      <AddHabitModal
        visible={modalVisible}
        onAdd={handleAdd}
        onCancel={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
