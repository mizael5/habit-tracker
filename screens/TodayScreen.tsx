// screens/TodayScreen.tsx
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ConfettiCannon from 'react-native-confetti-cannon';
import { HabitList } from '../components/HabitList';
import { RewardOverlay } from '../components/RewardOverlay';
import { useHabits } from '../hooks/useHabits';
import { useReward } from '../hooks/useReward';
import { TodayScreenProps } from '../navigation/types';
import { Habit } from '../types';

const { width } = Dimensions.get('window');

export function TodayScreen({ navigation }: TodayScreenProps) {
  const { habits, toggleHabit, incrementVolume } = useHabits();
  const { triggerReward, triggerLightTap } = useReward();
  const confettiRef = useRef<ConfettiCannon>(null);
  const [challengeHabit, setChallengeHabit] = useState<Habit | null>(null);

  const handleToggle = (id: string) => {
    const { completed, challengeComplete } = toggleHabit(id);
    if (completed) {
      triggerReward();
      if (challengeComplete) {
        const habit = habits.find((h) => h.id === id);
        if (habit) setChallengeHabit(habit);
      } else {
        confettiRef.current?.start();
      }
    }
  };

  const handleIncrement = (id: string) => {
    const { completed, challengeComplete } = incrementVolume(id);
    if (completed) {
      triggerReward();
      if (challengeComplete) {
        const habit = habits.find((h) => h.id === id);
        if (habit) setChallengeHabit(habit);
      } else {
        confettiRef.current?.start();
      }
    } else {
      triggerLightTap();
    }
  };

  const handlePress = (id: string) => {
    navigation.navigate('HabitDetail', { habitId: id });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.listWrap}>
        <HabitList
          habits={habits}
          onToggle={handleToggle}
          onIncrement={handleIncrement}
          onPress={handlePress}
        />
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddHabit', {})}
        >
          <Text style={styles.addButtonText}>+ Add Habit</Text>
        </TouchableOpacity>
      </View>
      <ConfettiCannon
        ref={confettiRef}
        count={80}
        origin={{ x: width / 2, y: -10 }}
        autoStart={false}
        fadeOut
      />
      <RewardOverlay
        visible={challengeHabit !== null}
        habitName={challengeHabit?.name ?? ''}
        days={challengeHabit?.challengeGoal ?? 0}
        onDismiss={() => setChallengeHabit(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  listWrap: { flex: 1 },
  footer: {
    padding: 16, paddingBottom: 20,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  addButton: {
    backgroundColor: '#6366f1', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
