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

export function isChallengeComplete(streak: number, challengeGoal: number | undefined): boolean {
  if (challengeGoal === undefined) return false;
  return streak >= challengeGoal;
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

  const toggleHabit = (id: string): { completed: boolean; challengeComplete: boolean } => {
    const todayStr = new Date().toISOString().split('T')[0];
    let completed = false;
    let challengeComplete = false;
    const updated = habits.map((h) => {
      if (h.id !== id || h.type !== 'binary') return h;
      const alreadyDone = h.completedDates.includes(todayStr);
      const completedDates = alreadyDone
        ? h.completedDates.filter((d) => d !== todayStr)
        : [...h.completedDates, todayStr];
      const newStreak = calculateStreak(completedDates);
      // auto-clear challenge when un-toggling drops streak to 0 (spec §7)
      const challengeCleared = alreadyDone && newStreak === 0;
      if (!alreadyDone) {
        completed = true;
        if (isChallengeComplete(newStreak, h.challengeGoal)) {
          challengeComplete = true;
        }
      }
      return {
        ...h,
        completedDates,
        streak: newStreak,
        challengeGoal: challengeCleared ? undefined : h.challengeGoal,
        challengeStartDate: challengeCleared ? undefined : h.challengeStartDate,
      };
    });
    save(updated);
    return { completed, challengeComplete };
  };

  const incrementVolume = (id: string): { completed: boolean; challengeComplete: boolean } => {
    const todayStr = new Date().toISOString().split('T')[0];
    let completed = false;
    let challengeComplete = false;
    const updated = habits.map((h) => {
      if (h.id !== id || h.type !== 'volume') return h;
      const prevCount = h.volumeLog[todayStr] ?? 0;
      if (prevCount >= h.targetCount) return h;
      const newCount = prevCount + 1;
      const volumeLog = { ...h.volumeLog, [todayStr]: newCount };
      let completedDates = h.completedDates;
      if (newCount >= h.targetCount && !h.completedDates.includes(todayStr)) {
        completedDates = [...h.completedDates, todayStr];
        completed = true;
        const newStreak = calculateStreak(completedDates);
        if (isChallengeComplete(newStreak, h.challengeGoal)) {
          challengeComplete = true;
        }
        return { ...h, volumeLog, completedDates, streak: newStreak };
      }
      return { ...h, volumeLog, completedDates, streak: calculateStreak(completedDates) };
    });
    save(updated);
    return { completed, challengeComplete };
  };

  const setChallengeGoal = (id: string, days: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = habits.map((h) =>
      h.id !== id ? h : { ...h, challengeGoal: days, challengeStartDate: todayStr }
    );
    save(updated);
  };

  const clearChallenge = (id: string) => {
    const updated = habits.map((h) =>
      h.id !== id ? h : { ...h, challengeGoal: undefined, challengeStartDate: undefined }
    );
    save(updated);
  };

  // Dev-only: fills in the last (challengeGoal - 1) days so the next toggle fires challenge completion
  const devSetupChallengeCompletion = (id: string) => {
    const updated = habits.map((h) => {
      if (h.id !== id || !h.challengeGoal) return h;
      const daysNeeded = h.challengeGoal - 1;
      const dates: string[] = [];
      for (let i = daysNeeded; i >= 1; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }
      // Merge with existing completedDates, remove today so the next tap triggers completion
      const todayStr = new Date().toISOString().split('T')[0];
      const merged = Array.from(new Set([
        ...h.completedDates.filter((d) => d !== todayStr),
        ...dates,
      ]));
      return { ...h, completedDates: merged, streak: calculateStreak(merged) };
    });
    save(updated);
  };

  // Dev-only: clears today's completion so the celebration can be re-triggered
  const devClearToday = (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = habits.map((h) => {
      if (h.id !== id) return h;
      const completedDates = h.completedDates.filter((d) => d !== todayStr);
      const volumeLog = { ...h.volumeLog };
      delete volumeLog[todayStr];
      return { ...h, completedDates, volumeLog, streak: calculateStreak(completedDates) };
    });
    save(updated);
  };

  const reload = () => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) setHabits(migrateHabits(JSON.parse(json)));
      else setHabits([]);
    });
  };

  return { habits, addHabit, editHabit, deleteHabit, toggleHabit, incrementVolume, setChallengeGoal, clearChallenge, devSetupChallengeCompletion, devClearToday, reload };
}
