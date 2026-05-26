# Habit Tracker — Plan 1: Foundation & Core Loop

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up tab navigation, migrate the data model to support binary and volume habits, update the Today screen with per-habit reward moments (haptics + sound + confetti), and build the Add/Edit Habit screen.

**Architecture:** Replace the single-screen App.tsx with a NavigationContainer mounting a tab navigator (Today, Progress placeholder, Settings placeholder). The Today tab uses a native stack. State stays in `useHabits` (expanded). A `useReward` hook encapsulates haptics + sound. Confetti cannon is owned by TodayScreen and fires on habit completion.

**Tech Stack:** Expo SDK 54, React Navigation 6 (native-stack + bottom-tabs), expo-haptics, expo-av, react-native-confetti-cannon, react-native-reanimated (already in Expo 54)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `types/index.ts` | Modify | Extended Habit type + HabitType |
| `hooks/useHabits.ts` | Modify | addHabit (new sig), editHabit, deleteHabit, incrementVolume, migrateHabits |
| `hooks/__tests__/useHabits.test.ts` | Modify | Tests for new actions + migration |
| `hooks/useReward.ts` | Create | Haptics + sound trigger |
| `hooks/__tests__/useReward.test.ts` | Create | Tests for useReward |
| `navigation/types.ts` | Create | TypeScript param list types |
| `navigation/RootNavigator.tsx` | Create | Root stack (tabs only; onboarding added in Plan 3) |
| `navigation/TabNavigator.tsx` | Create | Bottom tabs: Today, Progress, Settings |
| `navigation/TodayStack.tsx` | Create | Stack: TodayScreen, AddHabitScreen |
| `screens/TodayScreen.tsx` | Create | Daily habit list with toggle/counter |
| `screens/AddHabitScreen.tsx` | Create | Create + edit habit |
| `screens/ProgressScreen.tsx` | Create | Placeholder (implemented in Plan 2) |
| `screens/SettingsScreen.tsx` | Create | Placeholder (implemented in Plan 3) |
| `components/HabitItem.tsx` | Modify | Binary toggle / volume counter, emoji, streak badge |
| `components/HabitList.tsx` | Modify | Pass onIncrement prop through |
| `assets/sounds/chime.mp3` | Add | Bundled chime audio (download manually) |
| `App.tsx` | Modify | Simplified to mount NavigationContainer only |

---

## Task 1: Install dependencies + add chime sound

**Files:** `package.json`, `assets/sounds/chime.mp3`

- [ ] **Step 1: Install packages**

```bash
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context expo-haptics expo-av
npm install react-native-confetti-cannon
```

- [ ] **Step 2: Verify Expo starts without errors**

```bash
npx expo start --clear
```

Expected: Metro bundler starts, no import errors in terminal.

- [ ] **Step 3: Download a chime sound**

Download any short chime or success sound MP3 (≤100 KB) from a free sound library (search "chime success sound free MP3"). Save it as:

```
assets/sounds/chime.mp3
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json assets/sounds/chime.mp3
git commit -m "chore: install navigation, haptics, av, confetti deps + add chime sound"
```

---

## Task 2: Update Habit type

**Files:** `types/index.ts`

- [ ] **Step 1: Replace the Habit type**

```ts
// types/index.ts
export type HabitType = 'binary' | 'volume';

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  type: HabitType;
  targetCount: number;               // 1 for binary, N for volume
  completedDates: string[];          // ISO dates where habit was fully completed
  volumeLog: Record<string, number>; // date → tap count (volume only)
  streak: number;
  challengeGoal?: number;            // days target (Plan 2)
  challengeStartDate?: string;       // ISO date challenge was set (Plan 2)
};
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: extend Habit type for binary/volume habits and challenges"
```

---

## Task 3: Write tests for new useHabits logic

**Files:** `hooks/__tests__/useHabits.test.ts`

- [ ] **Step 1: Add tests for `migrateHabits`, `addHabit`, `editHabit`, `deleteHabit`, `incrementVolume`**

Append these tests to the existing file (keep existing `calculateStreak` tests):

```ts
import { migrateHabits } from '../useHabits';
import { Habit } from '../../types';

describe('migrateHabits', () => {
  it('fills missing fields with defaults on old habit objects', () => {
    const old = [{ id: '1', name: 'Run', completedDates: [], streak: 0 }];
    const result = migrateHabits(old as any);
    expect(result[0]).toEqual({
      id: '1',
      name: 'Run',
      emoji: '⭐',
      type: 'binary',
      targetCount: 1,
      completedDates: [],
      volumeLog: {},
      streak: 0,
      challengeGoal: undefined,
      challengeStartDate: undefined,
    });
  });

  it('preserves existing fields if already present', () => {
    const existing: Habit = {
      id: '2', name: 'Meditate', emoji: '🧘', type: 'volume',
      targetCount: 3, completedDates: ['2026-05-01'], volumeLog: {},
      streak: 1,
    };
    const result = migrateHabits([existing] as any);
    expect(result[0].emoji).toBe('🧘');
    expect(result[0].type).toBe('volume');
    expect(result[0].targetCount).toBe(3);
  });
});

// NOTE: addHabit, editHabit, deleteHabit, incrementVolume involve React state
// and AsyncStorage. They are integration-tested via the hook — test them manually
// in the running app after Task 4. Pure logic (migrateHabits, calculateStreak)
// is unit-tested here.
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All existing `calculateStreak` tests pass. New `migrateHabits` tests FAIL with "migrateHabits is not a function" — this is correct, implementation comes next.

- [ ] **Step 3: Commit**

```bash
git add hooks/__tests__/useHabits.test.ts
git commit -m "test: add migrateHabits tests (red)"
```

---

## Task 4: Extend useHabits

**Files:** `hooks/useHabits.ts`

- [ ] **Step 1: Replace the full file with the extended hook**

```ts
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
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All tests pass including new `migrateHabits` tests.

- [ ] **Step 3: Commit**

```bash
git add hooks/useHabits.ts hooks/__tests__/useHabits.test.ts
git commit -m "feat: extend useHabits — binary/volume, migrateHabits, editHabit, deleteHabit"
```

---

## Task 5: Set up navigation skeleton

**Files:** `navigation/types.ts`, `navigation/RootNavigator.tsx`, `navigation/TabNavigator.tsx`, `navigation/TodayStack.tsx`, `screens/TodayScreen.tsx`, `screens/ProgressScreen.tsx`, `screens/SettingsScreen.tsx`, `App.tsx`

- [ ] **Step 1: Create navigation types**

```ts
// navigation/types.ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type TabParamList = {
  Today: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type TodayStackParamList = {
  TodayScreen: undefined;
  AddHabit: { habitId?: string };
};

export type TodayScreenProps = NativeStackScreenProps<TodayStackParamList, 'TodayScreen'>;
export type AddHabitScreenProps = NativeStackScreenProps<TodayStackParamList, 'AddHabit'>;
```

- [ ] **Step 2: Create placeholder screens**

```tsx
// screens/ProgressScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Progress — coming in Plan 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  text: { fontSize: 16, color: '#6b7280' },
});
```

```tsx
// screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings — coming in Plan 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  text: { fontSize: 16, color: '#6b7280' },
});
```

- [ ] **Step 3: Create placeholder TodayScreen (will be fleshed out in Task 7)**

```tsx
// screens/TodayScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TodayScreenProps } from '../navigation/types';

export function TodayScreen({ navigation }: TodayScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Today — wiring in Task 7</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  text: { fontSize: 16, color: '#6b7280' },
});
```

- [ ] **Step 4: Create TabNavigator**

```tsx
// navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { TodayStack } from './TodayStack';
import { ProgressScreen } from '../screens/ProgressScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayStack}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text> }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 5: Create TodayStack**

```tsx
// navigation/TodayStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TodayScreen } from '../screens/TodayScreen';
import { AddHabitScreen } from '../screens/AddHabitScreen';
import { TodayStackParamList } from './types';

const Stack = createNativeStackNavigator<TodayStackParamList>();

export function TodayStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TodayScreen"
        component={TodayScreen}
        options={{ title: 'Habit Tracker', headerLargeTitle: true }}
      />
      <Stack.Screen
        name="AddHabit"
        component={AddHabitScreen}
        options={({ route }) => ({
          title: route.params?.habitId ? 'Edit Habit' : 'New Habit',
          presentation: 'modal',
        })}
      />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 6: Create RootNavigator**

```tsx
// navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';

export function RootNavigator() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
```

- [ ] **Step 7: Simplify App.tsx**

```tsx
// App.tsx
import React from 'react';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return <RootNavigator />;
}
```

- [ ] **Step 8: Create a temporary AddHabitScreen stub (will be replaced in Task 8)**

```tsx
// screens/AddHabitScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AddHabitScreenProps } from '../navigation/types';

export function AddHabitScreen({ route }: AddHabitScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {route.params?.habitId ? 'Edit Habit' : 'Add Habit'} — coming in Task 8
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  text: { fontSize: 16, color: '#6b7280' },
});
```

- [ ] **Step 9: Verify the app loads with tab navigation**

```bash
npx expo start --clear
```

Open in Expo Go. Expected: Three tabs (📋 Today, 📊 Progress, ⚙️ Settings) are visible and tappable. Today shows placeholder text.

- [ ] **Step 10: Commit**

```bash
git add navigation/ screens/ App.tsx
git commit -m "feat: set up tab + stack navigation skeleton"
```

---

## Task 6: Update HabitItem for binary/volume/emoji

**Files:** `components/HabitItem.tsx`, `components/HabitList.tsx`

- [ ] **Step 1: Replace HabitItem**

```tsx
// components/HabitItem.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Habit } from '../types';

type Props = {
  habit: Habit;
  onToggle: (id: string) => void;
  onIncrement: (id: string) => void;
  onPress: (id: string) => void;
};

export function HabitItem({ habit, onToggle, onIncrement, onPress }: Props) {
  const todayStr = new Date().toISOString().split('T')[0];
  const isDone = habit.completedDates.includes(todayStr);
  const todayCount = habit.volumeLog[todayStr] ?? 0;

  const checkScale = useRef(new Animated.Value(isDone ? 1 : 0)).current;
  const rowBg = useRef(new Animated.Value(isDone ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(checkScale, { toValue: isDone ? 1 : 0, useNativeDriver: false, tension: 150, friction: 8 }),
      Animated.timing(rowBg, { toValue: isDone ? 1 : 0, useNativeDriver: false, duration: 300 }),
    ]).start();
  }, [isDone]);

  const rowBackground = rowBg.interpolate({ inputRange: [0, 1], outputRange: ['#ffffff', '#eef2ff'] });

  return (
    <Animated.View style={[styles.row, { backgroundColor: rowBackground }]}>
    <TouchableOpacity style={styles.rowInner} onPress={() => onPress(habit.id)} activeOpacity={0.7}>
      <Text style={styles.emoji}>{habit.emoji}</Text>
      <View style={styles.info}>
        <Text style={[styles.name, isDone && styles.nameDone]}>{habit.name}</Text>
        {habit.streak > 0 && (
          <Text style={styles.streak}>🔥 {habit.streak}-day streak</Text>
        )}
      </View>
      {habit.type === 'binary' ? (
        <TouchableOpacity
          onPress={() => onToggle(habit.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Animated.View style={[styles.checkbox, isDone && styles.checkboxDone, { transform: [{ scale: checkScale }] }]}>
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <View style={styles.counter}>
          <Text style={[styles.counterText, isDone && styles.counterDone]}>
            {todayCount}/{habit.targetCount}
          </Text>
          <TouchableOpacity
            style={[styles.incrementBtn, isDone && styles.incrementBtnDone]}
            onPress={() => onIncrement(habit.id)}
            disabled={isDone}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.incrementBtnText}>{isDone ? '✓' : '+'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emoji: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  nameDone: { color: '#9ca3af', textDecorationLine: 'line-through' },
  streak: { fontSize: 12, color: '#f59e0b', marginTop: 2 },
  checkbox: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxDone: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  checkmark: { color: '#fff', fontSize: 16, fontWeight: '700' },
  counter: { alignItems: 'center', gap: 4 },
  counterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  counterDone: { color: '#6366f1' },
  incrementBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },
  incrementBtnDone: { backgroundColor: '#6366f1' },
  incrementBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
});
```

- [ ] **Step 2: Update HabitList to pass onIncrement and onPress**

```tsx
// components/HabitList.tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add components/HabitItem.tsx components/HabitList.tsx
git commit -m "feat: update HabitItem for binary/volume types, emoji, and streak badge"
```

---

## Task 7: Build TodayScreen

**Files:** `screens/TodayScreen.tsx`

- [ ] **Step 1: Replace the placeholder TodayScreen**

```tsx
// screens/TodayScreen.tsx
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ConfettiCannon from 'react-native-confetti-cannon';
import { HabitList } from '../components/HabitList';
import { useHabits } from '../hooks/useHabits';
import { useReward } from '../hooks/useReward';
import { TodayScreenProps } from '../navigation/types';

const { width } = Dimensions.get('window');

export function TodayScreen({ navigation }: TodayScreenProps) {
  const { habits, toggleHabit, incrementVolume } = useHabits();
  const { triggerReward, triggerLightTap } = useReward();
  const confettiRef = useRef<ConfettiCannon>(null);

  const handleToggle = (id: string) => {
    const completed = toggleHabit(id);
    if (completed) {
      triggerReward();
      confettiRef.current?.start();
    }
  };

  const handleIncrement = (id: string) => {
    const completed = incrementVolume(id);
    if (completed) {
      triggerReward();
      confettiRef.current?.start();
    } else {
      triggerLightTap();
    }
  };

  const handlePress = (id: string) => {
    navigation.navigate('AddHabit', { habitId: id });
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

**Note:** `useReward` doesn't exist yet — the app will crash. Implement it in Task 9 before testing this screen in Expo Go.

- [ ] **Step 2: Commit**

```bash
git add screens/TodayScreen.tsx
git commit -m "feat: build TodayScreen wired to useHabits and useReward"
```

---

## Task 8: Build AddHabitScreen

**Files:** `screens/AddHabitScreen.tsx`

- [ ] **Step 1: Replace the stub with the full Add/Edit Habit screen**

```tsx
// screens/AddHabitScreen.tsx
import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert
} from 'react-native';
import { useHabits } from '../hooks/useHabits';
import { HabitType } from '../types';
import { AddHabitScreenProps } from '../navigation/types';

const EMOJI_OPTIONS = ['⭐','🔥','💪','🧘','📚','🎯','💧','🏃','😴','🥗','🎸','✍️','🧹','💊','🌱','🎨'];

export function AddHabitScreen({ route, navigation }: AddHabitScreenProps) {
  const { habitId } = route.params ?? {};
  const { habits, addHabit, editHabit, deleteHabit } = useHabits();
  const existing = habits.find((h) => h.id === habitId);

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '⭐');
  const [type, setType] = useState<HabitType>(existing?.type ?? 'binary');
  const [targetCount, setTargetCount] = useState(String(existing?.targetCount ?? 3));

  useLayoutEffect(() => {
    if (existing) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={handleDelete}>
            <Text style={{ color: '#ef4444', fontSize: 15 }}>Delete</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [existing]);

  const handleDelete = () => {
    Alert.alert('Delete Habit', 'This will remove all history. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { deleteHabit(habitId!); navigation.goBack(); },
      },
    ]);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return;
    }
    const params = {
      name,
      emoji,
      type,
      targetCount: type === 'volume' ? (parseInt(targetCount, 10) || 3) : 1,
    };
    if (existing) {
      editHabit(habitId!, params);
    } else {
      addHabit(params);
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Habit Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Morning run"
        autoFocus
        returnKeyType="done"
        maxLength={40}
      />

      <Text style={styles.label}>Emoji</Text>
      <View style={styles.emojiGrid}>
        {EMOJI_OPTIONS.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.emojiOption, emoji === e && styles.emojiSelected]}
            onPress={() => setEmoji(e)}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'binary' && styles.typeBtnActive]}
          onPress={() => setType('binary')}
        >
          <Text style={[styles.typeBtnText, type === 'binary' && styles.typeBtnTextActive]}>
            ✓  Daily (once)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'volume' && styles.typeBtnActive]}
          onPress={() => setType('volume')}
        >
          <Text style={[styles.typeBtnText, type === 'volume' && styles.typeBtnTextActive]}>
            #  Count-based
          </Text>
        </TouchableOpacity>
      </View>

      {type === 'volume' && (
        <>
          <Text style={styles.label}>Daily target</Text>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={targetCount}
            onChangeText={setTargetCount}
            keyboardType="number-pad"
            placeholder="3"
            maxLength={2}
          />
        </>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{existing ? 'Save Changes' : 'Add Habit'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  inputSmall: { width: 80 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiOption: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  emojiSelected: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  emojiText: { fontSize: 24 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  typeBtnActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  typeBtnTextActive: { color: '#6366f1' },
  saveButton: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/AddHabitScreen.tsx
git commit -m "feat: build AddHabitScreen — create and edit habits with type/emoji/target"
```

---

## Task 9: Build useReward hook (TDD)

**Files:** `hooks/__tests__/useReward.test.ts`, `hooks/useReward.ts`

- [ ] **Step 1: Write the failing test**

```ts
// hooks/__tests__/useReward.test.ts
import * as Haptics from 'expo-haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Heavy: 'Heavy', Light: 'Light' },
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: { playAsync: jest.fn(), replayAsync: jest.fn() },
      }),
    },
  },
}));

describe('useReward — haptics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('triggerReward fires Heavy haptic', async () => {
    const { triggerReward } = require('../useReward').useRewardFunctions();
    await triggerReward();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Heavy');
  });

  it('triggerLightTap fires Light haptic', () => {
    const { triggerLightTap } = require('../useReward').useRewardFunctions();
    triggerLightTap();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Light');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest hooks/__tests__/useReward.test.ts -v
```

Expected: FAIL — "useReward is not a module" or similar.

- [ ] **Step 3: Implement useReward**

```ts
// hooks/useReward.ts
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useCallback, useRef } from 'react';

// Exported for testing without React (no hooks)
export function useRewardFunctions() {
  let soundRef: Audio.Sound | null = null;

  const triggerReward = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      if (!soundRef) {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/chime.mp3')
        );
        soundRef = sound;
      }
      await soundRef.replayAsync();
    } catch {
      // sound is non-critical
    }
  };

  const triggerLightTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return { triggerReward, triggerLightTap };
}

// React hook version (memoized, sound instance persists across renders)
export function useReward() {
  const soundRef = useRef<Audio.Sound | null>(null);

  const triggerReward = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/chime.mp3')
        );
        soundRef.current = sound;
      }
      await soundRef.current.replayAsync();
    } catch {
      // sound is non-critical
    }
  }, []);

  const triggerLightTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return { triggerReward, triggerLightTap };
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add hooks/useReward.ts hooks/__tests__/useReward.test.ts
git commit -m "feat: add useReward hook — haptics + sound on habit completion (TDD)"
```

---

## Task 10: End-to-end verification + cleanup

**Files:** None — manual verification

- [ ] **Step 1: Start the app**

```bash
npx expo start --clear
```

- [ ] **Step 2: Verify on device with Expo Go**

Run through this checklist:

| Scenario | Expected |
|---|---|
| App opens | Three tabs visible (📋 📊 ⚙️) |
| Tap + Add Habit | AddHabit modal slides up |
| Create a binary habit (e.g. "Read 📚") | Habit appears in Today list |
| Tap the checkbox | Confetti fires, haptic fires, row shows strikethrough |
| Create a volume habit (e.g. "Water 💧 × 4") | Shows `0/4` counter with `+` button |
| Tap `+` three times | Counter shows `3/4`, light haptic each tap |
| Tap `+` fourth time | Counter shows `4/4`, confetti fires, heavy haptic fires |
| Tap a habit row | Opens Edit screen pre-filled |
| Delete a habit | Habit removed from list |
| Tap Progress tab | Shows placeholder text |
| Tap Settings tab | Shows placeholder text |

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Final commit if any cleanup was needed**

```bash
git add -p  # stage only intentional changes
git commit -m "chore: plan 1 complete — foundation and core loop verified"
```

---

**Plan 1 complete.** Continue with `docs/superpowers/plans/2026-05-26-plan-2-challenges-progress.md`.
