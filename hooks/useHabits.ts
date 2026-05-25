import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { Habit } from '../types';

const STORAGE_KEY = 'habits';

export function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const today = new Date();
  const todayStr = fmt(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = fmt(yesterday);

  const dateSet = new Set(completedDates);

  let current: Date;
  if (dateSet.has(todayStr)) {
    current = new Date(today);
  } else if (dateSet.has(yesterdayStr)) {
    current = new Date(yesterday);
  } else {
    return 0;
  }

  let streak = 0;
  while (dateSet.has(fmt(current))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) setHabits(JSON.parse(json));
    });
  }, []);

  const save = (updated: Habit[]) => {
    setHabits(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addHabit = (name: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: name.trim(),
      completedDates: [],
      streak: 0,
    };
    save([...habits, newHabit]);
  };

  const toggleHabit = (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = habits.map((h) => {
      if (h.id !== id) return h;
      const alreadyDone = h.completedDates.includes(todayStr);
      const completedDates = alreadyDone
        ? h.completedDates.filter((d) => d !== todayStr)
        : [...h.completedDates, todayStr];
      return { ...h, completedDates, streak: calculateStreak(completedDates) };
    });
    save(updated);
  };

  return { habits, addHabit, toggleHabit };
}
