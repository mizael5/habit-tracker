# Habit Tracker — Plan 2: Challenges & Progress

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Plan 1 must be complete and all tests passing.

**Goal:** Add per-habit challenge goals (user-set consecutive-day targets), the challenge completion celebration overlay, the Habit Detail screen with a streak calendar and history log, and implement the Progress screen with a consistency chart.

**Architecture:** `useHabits` gains `setChallengeGoal` and `clearChallenge`. `toggleHabit` and `incrementVolume` now return a `{ completed, challengeComplete }` pair so callers can trigger the right reward. A `RewardOverlay` component handles the full-screen challenge celebration. `HabitDetailScreen` is added to TodayStack. `ProgressScreen` is implemented with `victory-native` charts.

**Tech Stack:** Expo SDK 54, victory-native (charts), react-native-reanimated (already present)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `hooks/useHabits.ts` | Modify | setChallengeGoal, clearChallenge; updated return type for toggleHabit/incrementVolume |
| `hooks/__tests__/useHabits.test.ts` | Modify | Tests for challenge logic |
| `components/RewardOverlay.tsx` | Create | Full-screen challenge completion celebration |
| `components/StreakCalendar.tsx` | Create | Per-habit monthly calendar with completion dots |
| `screens/HabitDetailScreen.tsx` | Create | Calendar + challenge setter + history log |
| `screens/TodayScreen.tsx` | Modify | Handle challengeComplete flag; show RewardOverlay |
| `screens/ProgressScreen.tsx` | Modify | Implement with charts and history log |
| `navigation/TodayStack.tsx` | Modify | Add HabitDetail route |
| `navigation/types.ts` | Modify | Add HabitDetail to TodayStackParamList |

---

## Task 1: Install victory-native

**Files:** `package.json`

- [ ] **Step 1: Install**

```bash
npx expo install victory-native
```

- [ ] **Step 2: Verify**

```bash
npx expo start --clear
```

Expected: Metro starts without error.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install victory-native for progress charts"
```

---

## Task 2: Write tests for challenge logic

**Files:** `hooks/__tests__/useHabits.test.ts`

- [ ] **Step 1: Append challenge tests**

```ts
// In hooks/__tests__/useHabits.test.ts
// Add these imports at the top:
// import { calculateStreak } from '../useHabits';  (already imported)
// import { isChallengeComplete } from '../useHabits';

import { isChallengeComplete } from '../useHabits';

describe('isChallengeComplete', () => {
  it('returns true when streak meets challenge goal', () => {
    expect(isChallengeComplete(7, 7)).toBe(true);
  });

  it('returns true when streak exceeds challenge goal', () => {
    expect(isChallengeComplete(10, 7)).toBe(true);
  });

  it('returns false when streak is below goal', () => {
    expect(isChallengeComplete(5, 7)).toBe(false);
  });

  it('returns false when no challenge goal set', () => {
    expect(isChallengeComplete(5, undefined)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: FAIL — "isChallengeComplete is not exported".

- [ ] **Step 3: Commit**

```bash
git add hooks/__tests__/useHabits.test.ts
git commit -m "test: add isChallengeComplete tests (red)"
```

---

## Task 3: Extend useHabits with challenge actions

**Files:** `hooks/useHabits.ts`

- [ ] **Step 1: Add `isChallengeComplete` pure function and extend return types**

Add these changes to `hooks/useHabits.ts`:

```ts
// Add this pure function (export it — used in tests and UI)
export function isChallengeComplete(streak: number, challengeGoal: number | undefined): boolean {
  if (challengeGoal === undefined) return false;
  return streak >= challengeGoal;
}
```

- [ ] **Step 2: Update `toggleHabit` return type**

Replace the `toggleHabit` function with this version that returns `{ completed, challengeComplete }`:

```ts
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
```

- [ ] **Step 3: Update `incrementVolume` return type**

Replace `incrementVolume` with:

```ts
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
```

- [ ] **Step 4: Add `setChallengeGoal` and `clearChallenge`**

```ts
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
```

- [ ] **Step 5: Add `setChallengeGoal` and `clearChallenge` to the return object**

```ts
return { habits, addHabit, editHabit, deleteHabit, toggleHabit, incrementVolume, setChallengeGoal, clearChallenge };
```

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add hooks/useHabits.ts hooks/__tests__/useHabits.test.ts
git commit -m "feat: add challenge logic — setChallengeGoal, clearChallenge, isChallengeComplete (TDD)"
```

---

## Task 4: Build RewardOverlay component

**Files:** `components/RewardOverlay.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/RewardOverlay.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Modal,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  habitName: string;
  days: number;
  onDismiss: () => void;
};

export function RewardOverlay({ visible, habitName, days, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
      setTimeout(() => confettiRef.current?.start(), 200);
    } else {
      scale.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>Challenge Complete!</Text>
          <Text style={styles.subtitle}>{habitName}</Text>
          <Text style={styles.days}>{days} days in a row</Text>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
      <ConfettiCannon
        ref={confettiRef}
        count={150}
        origin={{ x: width / 2, y: -10 }}
        autoStart={false}
        fadeOut
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: 32, alignItems: 'center', width: width * 0.82,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20,
  },
  trophy: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#6366f1', marginBottom: 4 },
  days: { fontSize: 15, color: '#6b7280', marginBottom: 24 },
  button: {
    backgroundColor: '#6366f1', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/RewardOverlay.tsx
git commit -m "feat: add RewardOverlay component for challenge completion celebration"
```

---

## Task 5: Update TodayScreen to handle challengeComplete

**Files:** `screens/TodayScreen.tsx`, `navigation/types.ts`, `navigation/TodayStack.tsx`

- [ ] **Step 1: Add HabitDetail to navigation types**

```ts
// navigation/types.ts — add HabitDetail to TodayStackParamList
export type TodayStackParamList = {
  TodayScreen: undefined;
  AddHabit: { habitId?: string };
  HabitDetail: { habitId: string };  // add this line
};

// Add this export:
export type HabitDetailScreenProps = NativeStackScreenProps<TodayStackParamList, 'HabitDetail'>;
```

- [ ] **Step 2: Add HabitDetail to TodayStack**

In `navigation/TodayStack.tsx`, import `HabitDetailScreen` and add the screen:

```tsx
import { HabitDetailScreen } from '../screens/HabitDetailScreen';

// Inside Stack.Navigator, after AddHabit screen:
<Stack.Screen
  name="HabitDetail"
  component={HabitDetailScreen}
  options={{ title: 'Habit Detail' }}
/>
```

- [ ] **Step 3: Update TodayScreen to use the new return types and show RewardOverlay**

```tsx
// screens/TodayScreen.tsx — replace with full version
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
      <HabitList
        habits={habits}
        onToggle={handleToggle}
        onIncrement={handleIncrement}
        onPress={handlePress}
      />
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
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: 36,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  addButton: {
    backgroundColor: '#6366f1', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add screens/TodayScreen.tsx navigation/types.ts navigation/TodayStack.tsx
git commit -m "feat: wire challenge completion into TodayScreen with RewardOverlay"
```

---

## Task 6: Build StreakCalendar component

**Files:** `components/StreakCalendar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/StreakCalendar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  completedDates: string[]; // ISO date strings
  month?: Date;             // defaults to current month
};

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function StreakCalendar({ completedDates, month = new Date() }: Props) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = getDaysInMonth(year, monthIndex);
  const completedSet = new Set(completedDates);

  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  const blanks = Array(firstDayOfWeek).fill(null);
  const allCells = [...blanks, ...days];

  const monthLabel = month.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
      <View style={styles.dayLabels}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {allCells.map((day, i) => {
          if (!day) return <View key={`blank-${i}`} style={styles.cell} />;
          const iso = day.toISOString().split('T')[0];
          const done = completedSet.has(iso);
          const isToday = iso === new Date().toISOString().split('T')[0];
          return (
            <View
              key={iso}
              style={[styles.cell, done && styles.cellDone, isToday && !done && styles.cellToday]}
            >
              <Text style={[styles.dayNum, done && styles.dayNumDone]}>
                {day.getDate()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = 36;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12, textAlign: 'center' },
  dayLabels: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  dayLabel: { width: CELL_SIZE, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center', borderRadius: CELL_SIZE / 2 },
  cellDone: { backgroundColor: '#6366f1' },
  cellToday: { borderWidth: 2, borderColor: '#6366f1' },
  dayNum: { fontSize: 13, color: '#374151' },
  dayNumDone: { color: '#fff', fontWeight: '700' },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/StreakCalendar.tsx
git commit -m "feat: add StreakCalendar component with monthly completion view"
```

---

## Task 7: Build HabitDetailScreen

**Files:** `screens/HabitDetailScreen.tsx`

- [ ] **Step 1: Create the screen**

```tsx
// screens/HabitDetailScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert,
} from 'react-native';
import { StreakCalendar } from '../components/StreakCalendar';
import { useHabits } from '../hooks/useHabits';
import { HabitDetailScreenProps } from '../navigation/types';

const PRESET_GOALS = [7, 14, 21, 30, 66];

export function HabitDetailScreen({ route, navigation }: HabitDetailScreenProps) {
  const { habitId } = route.params;
  const { habits, setChallengeGoal, clearChallenge } = useHabits();
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
    Alert.alert('Clear Challenge', 'Remove the current challenge goal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearChallenge(habitId) },
    ]);
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
          <Text style={styles.editLink}>Edit</Text>
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
```

- [ ] **Step 2: Run tests and verify in Expo Go**

```bash
npm test
npx expo start
```

Tap any habit on Today screen → Habit Detail opens with calendar, challenge setter, and history log.

- [ ] **Step 3: Commit**

```bash
git add screens/HabitDetailScreen.tsx
git commit -m "feat: build HabitDetailScreen — calendar, challenge goal setter, history log"
```

---

## Task 8: Implement ProgressScreen

**Files:** `screens/ProgressScreen.tsx`

- [ ] **Step 1: Replace the placeholder ProgressScreen**

```tsx
// screens/ProgressScreen.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';
import { useHabits } from '../hooks/useHabits';

const { width } = Dimensions.get('window');

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function ProgressScreen() {
  const { habits } = useHabits();
  const last30 = getLast30Days();

  // Per-day completion rate (0–1) across all habits
  const chartData = last30.map((date, i) => {
    if (habits.length === 0) return { x: i + 1, y: 0 };
    const completed = habits.filter((h) => h.completedDates.includes(date)).length;
    return { x: i + 1, y: parseFloat((completed / habits.length).toFixed(2)) };
  });

  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  const avgStreak = habits.length
    ? (habits.reduce((sum, h) => sum + h.streak, 0) / habits.length).toFixed(1)
    : '0';

  const recentLog: { date: string; name: string; emoji: string }[] = [];
  last30.slice().reverse().forEach((date) => {
    habits.forEach((h) => {
      if (h.completedDates.includes(date)) {
        recentLog.push({ date, name: h.name, emoji: h.emoji });
      }
    });
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Your Progress</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalCompletions}</Text>
          <Text style={styles.statLabel}>Total completions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{avgStreak}</Text>
          <Text style={styles.statLabel}>Avg streak (days)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{habits.length}</Text>
          <Text style={styles.statLabel}>Active habits</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Daily completion rate — last 30 days</Text>
        <VictoryChart
          width={width - 48}
          height={180}
          theme={VictoryTheme.grayscale}
          padding={{ top: 10, bottom: 30, left: 40, right: 10 }}
          domainPadding={{ x: 4 }}
        >
          <VictoryAxis
            tickValues={[1, 10, 20, 30]}
            tickFormat={(t) => {
              const d = new Date();
              d.setDate(d.getDate() - (30 - t));
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
            style={{ tickLabels: { fontSize: 9, fill: '#9ca3af' } }}
          />
          <VictoryAxis dependentAxis tickFormat={(t) => `${Math.round(t * 100)}%`} style={{ tickLabels: { fontSize: 9, fill: '#9ca3af' } }} />
          <VictoryBar
            data={chartData}
            style={{ data: { fill: '#6366f1', borderRadius: 3 } }}
            barRatio={0.6}
          />
        </VictoryChart>
      </View>

      <View style={styles.logCard}>
        <Text style={styles.chartTitle}>History log</Text>
        {recentLog.length === 0 ? (
          <Text style={styles.emptyLog}>Complete habits to see your history here.</Text>
        ) : (
          recentLog.slice(0, 30).map((entry, i) => (
            <View key={i} style={styles.logRow}>
              <Text style={styles.logEmoji}>{entry.emoji}</Text>
              <Text style={styles.logName}>{entry.name}</Text>
              <Text style={styles.logDate}>
                {new Date(entry.date + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statNum: { fontSize: 24, fontWeight: '800', color: '#6366f1' },
  statLabel: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 2 },
  chartCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  chartTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  logCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  emptyLog: { color: '#9ca3af', fontSize: 14 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  logEmoji: { fontSize: 20, marginRight: 10 },
  logName: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  logDate: { fontSize: 12, color: '#9ca3af' },
});
```

- [ ] **Step 2: Run tests and verify in Expo Go**

```bash
npm test
npx expo start
```

Tap Progress tab → chart, stats, and history log are visible.

- [ ] **Step 3: Commit**

```bash
git add screens/ProgressScreen.tsx
git commit -m "feat: implement ProgressScreen with bar chart, stats, and history log"
```

---

## Task 9: End-to-end verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 2: Verify on device with Expo Go**

| Scenario | Expected |
|---|---|
| Tap a habit row | Opens Habit Detail with calendar and streak |
| Set a 7-day challenge | Challenge progress bar appears: "Day N of 7" |
| Complete habit until streak = 7 | RewardOverlay fires with confetti + "7 days in a row" |
| Dismiss overlay | Returns to Today screen, challenge can be reset |
| Tap Progress tab | Chart, stats, and history log show real data |
| Clear a challenge | Challenge goal removed, preset buttons reappear |

- [ ] **Step 3: Commit**

```bash
git add -p
git commit -m "chore: plan 2 complete — challenges and progress verified"
```

---

**Plan 2 complete.** Continue with `docs/superpowers/plans/2026-05-26-plan-3-onboarding-notifications.md`.
