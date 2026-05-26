import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { Habit, HabitType } from '../types';

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

export function migrateHabits(raw: unknown[]): Habit[] {
  return (raw as any[]).map((h) => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji ?? '⭐',
    type: h.type ?? 'binary',
    targetCount: h.targetCount ?? 1,
    completedDates: h.completedDates ?? [],
    volumeLog: h.volumeLog ?? {},
    streak: h.streak ?? 0,
    challengeGoal: h.challengeGoal,
    challengeStartDate: h.challengeStartDate,
  }));
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) setHabits(migrateHabits(JSON.parse(json)));
    });
  }, []);

  const save = (updated: Habit[]) => {
    setHabits(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addHabit = (params: {
    name: string;
    emoji: string;
    type: HabitType;
    targetCount: number;
  }) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: params.name.trim(),
      emoji: params.emoji,
      type: params.type,
      targetCount: params.targetCount,
      completedDates: [],
      volumeLog: {},
      streak: 0,
    };
    save([...habits, newHabit]);
  };

  const editHabit = (
    id: string,
    params: Pick<Habit, 'name' | 'emoji' | 'type' | 'targetCount'>
  ) => {
    const updated = habits.map((h) => {
      if (h.id !== id) return h;
      // reset volumeLog when switching habit type
      const volumeLog = params.type !== h.type ? {} : h.volumeLog;
      return { ...h, ...params, volumeLog };
    });
    save(updated);
  };

  const deleteHabit = (id: string) => {
    save(habits.filter((h) => h.id !== id));
  };

  const toggleHabit = (id: string): boolean => {
    const todayStr = new Date().toISOString().split('T')[0];
    let justCompleted = false;
    const updated = habits.map((h) => {
      if (h.id !== id || h.type !== 'binary') return h;
      const alreadyDone = h.completedDates.includes(todayStr);
      const completedDates = alreadyDone
        ? h.completedDates.filter((d) => d !== todayStr)
        : [...h.completedDates, todayStr];
      if (!alreadyDone) justCompleted = true;
      return { ...h, completedDates, streak: calculateStreak(completedDates) };
    });
    save(updated);
    return justCompleted;
  };

  const incrementVolume = (id: string): boolean => {
    const todayStr = new Date().toISOString().split('T')[0];
    let justCompleted = false;
    const updated = habits.map((h) => {
      if (h.id !== id || h.type !== 'volume') return h;
      const prevCount = h.volumeLog[todayStr] ?? 0;
      if (prevCount >= h.targetCount) return h; // already at target, no-op
      const newCount = prevCount + 1;
      const volumeLog = { ...h.volumeLog, [todayStr]: newCount };
      let completedDates = h.completedDates;
      if (newCount >= h.targetCount && !h.completedDates.includes(todayStr)) {
        completedDates = [...h.completedDates, todayStr];
        justCompleted = true;
      }
      return { ...h, volumeLog, completedDates, streak: calculateStreak(completedDates) };
    });
    save(updated);
    return justCompleted;
  };

  return { habits, addHabit, editHabit, deleteHabit, toggleHabit, incrementVolume };
}
