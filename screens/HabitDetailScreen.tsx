// screens/HabitDetailScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StreakCalendar } from '../components/StreakCalendar';
import { useHabits } from '../hooks/useHabits';
import { HabitDetailScreenProps } from '../navigation/types';

const PRESET_GOALS = [7, 14, 21, 30, 66];

export function HabitDetailScreen({ route, navigation }: HabitDetailScreenProps) {
  const { habitId } = route.params;
  const { habits, setChallengeGoal, clearChallenge, reload } = useHabits();
  useFocusEffect(useCallback(() => { reload(); }, []));
  const habit = habits.find((h) => h.id === habitId);
  const [customDays, setCustomDays] = useState('');

  if (!habit) {
    return (
      <View style={styles.missing}>
        <Text>Habit not found.</Text>
      </View>
    );
  }

  const hasChallenge = habit.challengeGoal !== undefined;
  const progress = hasChallenge
    ? `Day ${habit.streak} of ${habit.challengeGoal}`
    : null;

  const handleSetGoal = (days: number) => {
    if (days < 1 || days > 365) {
      Alert.alert('Invalid goal', 'Enter a number between 1 and 365.');
      return;
    }
    setChallengeGoal(habitId, days);
    setCustomDays('');
  };

  const handleClear = () => {
    clearChallenge(habitId);
  };

  const recentDates = [...habit.completedDates].sort().slice(-10).reverse();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{habit.emoji}</Text>
        <View>
          <Text style={styles.name}>{habit.name}</Text>
          <Text style={styles.streak}>🔥 {habit.streak}-day streak</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('AddHabit', { habitId })}>
          <Text style={styles.editLink}>Edit / Delete</Text>
        </TouchableOpacity>
      </View>

      <StreakCalendar completedDates={habit.completedDates} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Challenge</Text>
        {hasChallenge ? (
          <View style={styles.activeChallenge}>
            <Text style={styles.challengeProgress}>{progress}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((habit.streak / habit.challengeGoal!) * 100, 100)}%` },
                ]}
              />
            </View>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearLink}>Clear challenge</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.challengeHint}>Set a consecutive-day goal for this habit</Text>
            <View style={styles.presetRow}>
              {PRESET_GOALS.map((d) => (
                <TouchableOpacity key={d} style={styles.presetBtn} onPress={() => handleSetGoal(d)}>
                  <Text style={styles.presetBtnText}>{d}d</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Custom days"
                keyboardType="number-pad"
                value={customDays}
                onChangeText={setCustomDays}
                maxLength={3}
              />
              <TouchableOpacity
                style={styles.customBtn}
                onPress={() => handleSetGoal(parseInt(customDays, 10))}
              >
                <Text style={styles.customBtnText}>Set</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent completions</Text>
        {recentDates.length === 0 ? (
          <Text style={styles.emptyLog}>No completions yet.</Text>
        ) : (
          recentDates.map((d) => (
            <View key={d} style={styles.logRow}>
              <Text style={styles.logDot}>●</Text>
              <Text style={styles.logDate}>{new Date(d + 'T12:00:00').toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { paddingBottom: 40 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  emoji: { fontSize: 36 },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  streak: { fontSize: 13, color: '#f59e0b', marginTop: 2 },
  editLink: { color: '#6366f1', fontSize: 15, fontWeight: '600', marginLeft: 'auto' },
  section: { backgroundColor: '#fff', borderRadius: 16, margin: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  activeChallenge: { gap: 10 },
  challengeProgress: { fontSize: 18, fontWeight: '700', color: '#6366f1' },
  progressBar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: '#6366f1', borderRadius: 4 },
  clearLink: { color: '#ef4444', fontSize: 13 },
  challengeHint: { fontSize: 13, color: '#9ca3af', marginBottom: 12 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#eef2ff' },
  presetBtnText: { color: '#6366f1', fontWeight: '700', fontSize: 13 },
  customRow: { flexDirection: 'row', gap: 10 },
  customInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
  customBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  customBtnText: { color: '#fff', fontWeight: '700' },
  emptyLog: { color: '#9ca3af', fontSize: 14 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  logDot: { color: '#6366f1', fontSize: 10 },
  logDate: { fontSize: 14, color: '#374151' },
});
