# Habit Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-screen habit tracker demo app with Expo + React Native that runs on iPhone via Expo Go.

**Architecture:** Single-screen app using `App.tsx` as the entry point. Data logic is isolated in a `useHabits` hook, UI is split into focused components (`HabitItem`, `HabitList`, `AddHabitModal`). Local persistence via `AsyncStorage`.

**Tech Stack:** Expo (managed, blank-typescript template), React Native, TypeScript, `@react-native-async-storage/async-storage`, Jest + `@testing-library/react-native`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `App.tsx` | Create | Home screen — layout, header, wires components |
| `types/index.ts` | Create | `Habit` type definition |
| `hooks/useHabits.ts` | Create | All data logic: load, save, add, toggle, streak |
| `components/HabitItem.tsx` | Create | Single habit row: name, streak, toggle |
| `components/HabitList.tsx` | Create | Scrollable list of `HabitItem`s |
| `components/AddHabitModal.tsx` | Create | Modal with text input for adding a habit |
| `hooks/__tests__/useHabits.test.ts` | Create | Unit tests for `calculateStreak` |

---

### Task 1: Scaffold the Expo project

**Files:**
- Modify: `App.tsx` (generated, will be replaced in Task 8)
- Creates: `package.json`, `tsconfig.json`, `app.json`, `babel.config.js`

- [ ] **Step 1: Create the Expo app in the current directory**

Run this from inside `mobile-apps/`:

```bash
npx create-expo-app@latest . --template blank-typescript
```

When prompted "The directory . is not empty. Continue?", type `y`.

Expected output: `✅ Your project is ready!`

- [ ] **Step 2: Install AsyncStorage**

```bash
npx expo install @react-native-async-storage/async-storage
```

Expected: package installed, no errors.

- [ ] **Step 3: Verify the dev server starts**

```bash
npx expo start
```

Expected: QR code appears in terminal. Press `Ctrl+C` to stop — we're not running on device yet.

- [ ] **Step 4: Create folder structure**

```bash
mkdir components
mkdir hooks
mkdir types
mkdir hooks/__tests__
```

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Expo blank-typescript project"
```

---

### Task 2: Type definitions

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Create the Habit type**

Create `types/index.ts`:

```ts
export type Habit = {
  id: string;
  name: string;
  completedDates: string[]; // ISO date strings e.g. "2026-05-25"
  streak: number;
};
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add Habit type definition"
```

---

### Task 3: Streak calculation logic (TDD)

**Files:**
- Create: `hooks/useHabits.ts` (streak function only)
- Create: `hooks/__tests__/useHabits.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `hooks/__tests__/useHabits.test.ts`:

```ts
import { calculateStreak } from '../useHabits';

const fmt = (d: Date) => d.toISOString().split('T')[0];
const today = fmt(new Date());
const yesterday = fmt(new Date(Date.now() - 86400000));
const twoDaysAgo = fmt(new Date(Date.now() - 86400000 * 2));

describe('calculateStreak', () => {
  it('returns 0 for empty dates', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 1 when only today is completed', () => {
    expect(calculateStreak([today])).toBe(1);
  });

  it('returns 2 when today and yesterday are completed', () => {
    expect(calculateStreak([today, yesterday])).toBe(2);
  });

  it('returns streak from yesterday when today not completed', () => {
    expect(calculateStreak([yesterday, twoDaysAgo])).toBe(2);
  });

  it('returns 1 when only yesterday is completed', () => {
    expect(calculateStreak([yesterday])).toBe(1);
  });

  it('returns 0 when only an old date exists (gap)', () => {
    expect(calculateStreak([twoDaysAgo])).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest hooks/__tests__/useHabits.test.ts
```

Expected: FAIL — `Cannot find module '../useHabits'`

- [ ] **Step 3: Create `hooks/useHabits.ts` with the exported `calculateStreak` function**

Create `hooks/useHabits.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest hooks/__tests__/useHabits.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add hooks/useHabits.ts hooks/__tests__/useHabits.test.ts
git commit -m "feat: add useHabits hook with calculateStreak (TDD)"
```

---

### Task 4: HabitItem component

**Files:**
- Create: `components/HabitItem.tsx`

- [ ] **Step 1: Create the component**

Create `components/HabitItem.tsx`:

```tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Habit } from '../types';

type Props = {
  habit: Habit;
  onToggle: (id: string) => void;
};

export function HabitItem({ habit, onToggle }: Props) {
  const todayStr = new Date().toISOString().split('T')[0];
  const completedToday = habit.completedDates.includes(todayStr);

  return (
    <TouchableOpacity
      style={[styles.row, completedToday && styles.rowCompleted]}
      onPress={() => onToggle(habit.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.circle, completedToday && styles.circleCompleted]}>
        {completedToday && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={[styles.name, completedToday && styles.nameCompleted]}>
        {habit.name}
      </Text>
      <Text style={styles.streak}>🔥 {habit.streak} {habit.streak === 1 ? 'day' : 'days'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowCompleted: {
    backgroundColor: '#f0fdf4',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  circleCompleted: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e',
  },
  check: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  nameCompleted: {
    color: '#6b7280',
  },
  streak: {
    fontSize: 14,
    color: '#6b7280',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/HabitItem.tsx
git commit -m "feat: add HabitItem component"
```

---

### Task 5: HabitList component

**Files:**
- Create: `components/HabitList.tsx`

- [ ] **Step 1: Create the component**

Create `components/HabitList.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/HabitList.tsx
git commit -m "feat: add HabitList component"
```

---

### Task 6: AddHabitModal component

**Files:**
- Create: `components/AddHabitModal.tsx`

- [ ] **Step 1: Create the component**

Create `components/AddHabitModal.tsx`:

```tsx
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onAdd: (name: string) => void;
  onCancel: () => void;
};

export function AddHabitModal({ visible, onAdd, onCancel }: Props) {
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };

  const handleCancel = () => {
    setText('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Add New Habit</Text>
            <TextInput
              style={styles.input}
              placeholder="Habit name..."
              placeholderTextColor="#9ca3af"
              value={text}
              onChangeText={setText}
              autoFocus
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, !text.trim() && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={!text.trim()}
              >
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  addBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  addBtnDisabled: {
    backgroundColor: '#c7d2fe',
  },
  addText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/AddHabitModal.tsx
git commit -m "feat: add AddHabitModal component"
```

---

### Task 7: Home screen (App.tsx)

**Files:**
- Modify: `App.tsx` (replace generated content entirely)

- [ ] **Step 1: Replace App.tsx with the home screen**

Replace the full contents of `App.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests to confirm nothing is broken**

```bash
npx jest
```

Expected: All 6 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add App.tsx
git commit -m "feat: add home screen — wires HabitList, AddHabitModal, useHabits"
```

---

### Task 8: Run on iPhone via Expo Go

- [ ] **Step 1: Install Expo Go on your iPhone**

Open the App Store on your iPhone and install **Expo Go**.

- [ ] **Step 2: Ensure phone and computer are on the same WiFi network**

- [ ] **Step 3: Start the dev server**

```bash
npx expo start
```

- [ ] **Step 4: Scan the QR code**

Open the iPhone camera, point it at the QR code in the terminal. Tap the banner that appears. Expo Go will open and load the app.

Expected: The Habit Tracker home screen appears with an empty list and a "+ Add Habit" button.

- [ ] **Step 5: Smoke test the app**

1. Tap "+ Add Habit", type "Drink water", tap Add → habit appears with 🔥 0 days
2. Tap the habit row → circle turns green, 🔥 1 day
3. Tap again → unchecked, 🔥 0 days
4. Add a second habit → both appear in the list
5. Force-quit and reopen Expo Go → habits persist

---

## Done

All tasks complete. The app runs on your iPhone with habit creation, daily toggling, streak tracking, and local persistence.
