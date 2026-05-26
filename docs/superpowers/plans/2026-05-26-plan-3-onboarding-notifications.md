# Habit Tracker — Plan 3: Onboarding, Notifications, Settings & How It Works

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Plans 1 and 2 must be complete and all tests passing.

**Goal:** Add the two-screen onboarding flow (Welcome + First Habit), implement local push notifications with smart content, build the Settings screen with configurable notification times and toggles, and add the How It Works screen.

**Architecture:** `RootNavigator` gains an onboarding check (AsyncStorage flag `"onboarded"`). A `useNotifications` hook owns all scheduling logic. Settings screen replaces its placeholder and reads/writes notification prefs from AsyncStorage. How It Works is a static scroll view linked from both Settings and the Welcome screen.

**Tech Stack:** Expo SDK 54, expo-notifications, expo-haptics (already installed), AsyncStorage (already in use)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `hooks/useNotifications.ts` | Create | Request permission, schedule morning/evening notifications |
| `hooks/__tests__/useNotifications.test.ts` | Create | Tests for schedule logic |
| `screens/WelcomeScreen.tsx` | Create | Onboarding step 1: name + notification permission |
| `screens/FirstHabitScreen.tsx` | Create | Onboarding step 2: first habit creation |
| `screens/SettingsScreen.tsx` | Modify | Notification times, sound/haptics toggles, link to How It Works |
| `screens/HowItWorksScreen.tsx` | Create | Static explainer screen |
| `navigation/RootNavigator.tsx` | Modify | Onboarding check; OnboardingStack |
| `navigation/OnboardingStack.tsx` | Create | Welcome → FirstHabit |
| `navigation/SettingsStack.tsx` | Create | Settings → HowItWorks |
| `navigation/TabNavigator.tsx` | Modify | Settings tab uses SettingsStack |
| `navigation/types.ts` | Modify | OnboardingStackParamList, SettingsStackParamList |

---

## Task 1: Install expo-notifications

**Files:** `package.json`

- [ ] **Step 1: Install**

```bash
npx expo install expo-notifications
```

- [ ] **Step 2: Verify**

```bash
npx expo start --clear
```

Expected: Metro starts without error.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install expo-notifications"
```

---

## Task 2: Write tests for notification scheduling logic

**Files:** `hooks/__tests__/useNotifications.test.ts`

- [ ] **Step 1: Write the tests**

```ts
// hooks/__tests__/useNotifications.test.ts
import {
  buildMorningContent,
  buildEveningContent,
  buildScheduleTrigger,
} from '../useNotifications';

describe('buildMorningContent', () => {
  it('includes streak count when streak > 0', () => {
    const content = buildMorningContent(5);
    expect(content.body).toContain('5-day streak');
  });

  it('uses generic message when streak is 0', () => {
    const content = buildMorningContent(0);
    expect(content.body).toContain('build your habits');
  });
});

describe('buildEveningContent', () => {
  it('mentions the first incomplete habit name', () => {
    const content = buildEveningContent('Morning run', undefined);
    expect(content.body).toContain('Morning run');
  });

  it('uses generic message when all habits are complete', () => {
    const content = buildEveningContent(null, undefined);
    expect(content.body).toContain('habits');
  });

  it('adds challenge nudge when one day from goal', () => {
    const content = buildEveningContent('Read', 14);
    expect(content.body).toContain('14-day challenge');
  });
});

describe('buildScheduleTrigger', () => {
  it('returns hour and minute from a time string', () => {
    const trigger = buildScheduleTrigger('08:30');
    expect(trigger).toEqual({ hour: 8, minute: 30, repeats: true });
  });

  it('handles single-digit hours', () => {
    const trigger = buildScheduleTrigger('07:05');
    expect(trigger).toEqual({ hour: 7, minute: 5, repeats: true });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: FAIL — "buildMorningContent is not exported".

- [ ] **Step 3: Commit**

```bash
git add hooks/__tests__/useNotifications.test.ts
git commit -m "test: add notification content builder tests (red)"
```

---

## Task 3: Implement useNotifications

**Files:** `hooks/useNotifications.ts`

- [ ] **Step 1: Create the hook**

```ts
// hooks/useNotifications.ts
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = 'notificationPrefs';

export type NotificationPrefs = {
  morningEnabled: boolean;
  morningTime: string;  // "HH:MM"
  eveningEnabled: boolean;
  eveningTime: string;  // "HH:MM"
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};

export const DEFAULT_PREFS: NotificationPrefs = {
  morningEnabled: true,
  morningTime: '08:00',
  eveningEnabled: true,
  eveningTime: '20:00',
  soundEnabled: true,
  hapticsEnabled: true,
};

// Pure functions — exported for testing

export function buildMorningContent(maxStreak: number) {
  const body = maxStreak > 0
    ? `Time to build your habits 💪 You're on a ${maxStreak}-day streak!`
    : "Time to build your habits 💪 Start your streak today!";
  return { title: 'Habit Tracker', body };
}

export function buildEveningContent(
  firstIncompleteHabit: string | null,
  daysFromChallengeGoal: number | undefined
) {
  let body: string;
  if (firstIncompleteHabit) {
    body = `Don't break your streak! Have you done "${firstIncompleteHabit}" today?`;
    if (daysFromChallengeGoal !== undefined) {
      body += ` One more day — complete your ${daysFromChallengeGoal}-day challenge tomorrow!`;
    }
  } else {
    body = "Great work! All your habits are done for today 🎉";
  }
  return { title: 'Habit Tracker', body };
}

export function buildScheduleTrigger(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return { hour: h, minute: m, repeats: true };
}

// Async helpers

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function loadPrefs(): Promise<NotificationPrefs> {
  const json = await AsyncStorage.getItem(PREFS_KEY);
  return json ? { ...DEFAULT_PREFS, ...JSON.parse(json) } : { ...DEFAULT_PREFS };
}

export async function savePrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function scheduleNotifications(
  prefs: NotificationPrefs,
  maxStreak: number,
  firstIncompleteHabit: string | null,
  daysFromChallengeGoal: number | undefined
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (prefs.morningEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: buildMorningContent(maxStreak),
      trigger: buildScheduleTrigger(prefs.morningTime),
    });
  }

  if (prefs.eveningEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: buildEveningContent(firstIncompleteHabit, daysFromChallengeGoal),
      trigger: buildScheduleTrigger(prefs.eveningTime),
    });
  }
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add hooks/useNotifications.ts hooks/__tests__/useNotifications.test.ts
git commit -m "feat: add useNotifications — schedule logic with pure builder functions (TDD)"
```

---

## Task 4: Build HowItWorksScreen

**Files:** `screens/HowItWorksScreen.tsx`

- [ ] **Step 1: Create the screen**

```tsx
// screens/HowItWorksScreen.tsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

type Section = { title: string; icon: string; body: string };

const SECTIONS: Section[] = [
  {
    title: 'Daily Habits',
    icon: '✓',
    body: 'Binary habits are things you do once a day — like meditating or journaling. Tap the circle to mark it done. Undo it if you tap by mistake.',
  },
  {
    title: 'Count-Based Habits',
    icon: '#',
    body: 'Volume habits have a daily target — like drinking 8 glasses of water. Tap + each time you do it. The habit completes when you hit your target.',
  },
  {
    title: 'Streaks',
    icon: '🔥',
    body: 'A streak counts how many consecutive days you\'ve completed a habit. Miss a day and the streak resets. Streaks are the simplest measure of consistency.',
  },
  {
    title: 'Challenges',
    icon: '🏆',
    body: 'Open any habit to set a challenge goal — a number of days in a row you commit to. Hit your goal and you\'ll get a full celebration moment. If you miss a day, the challenge clears and you can set a new one.',
  },
  {
    title: 'Rewards',
    icon: '🎉',
    body: 'Every time you complete a habit, you get a haptic pulse, a chime, and a confetti burst. It\'s a small moment — but those small moments add up.',
  },
  {
    title: 'Notifications',
    icon: '🔔',
    body: 'We send two nudges a day: a morning reminder to kick off your habits, and an evening check-in if anything\'s still undone. You control the times in Settings.',
  },
];

export function HowItWorksScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>How It Works</Text>
      <Text style={styles.intro}>
        Everything you need to know about building better habits with this app.
      </Text>
      {SECTIONS.map((s) => (
        <View key={s.title} style={styles.card}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{s.icon}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardText}>{s.body}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 48 },
  heading: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  intro: { fontSize: 15, color: '#6b7280', marginBottom: 24, lineHeight: 22 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, gap: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon: { fontSize: 20 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardText: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/HowItWorksScreen.tsx
git commit -m "feat: add HowItWorksScreen with explainer content"
```

---

## Task 5: Build SettingsStack and SettingsScreen

**Files:** `navigation/types.ts`, `navigation/SettingsStack.tsx`, `screens/SettingsScreen.tsx`

- [ ] **Step 1: Add SettingsStack types**

In `navigation/types.ts`, add:

```ts
export type SettingsStackParamList = {
  SettingsScreen: undefined;
  HowItWorks: undefined;
};

export type SettingsScreenProps = NativeStackScreenProps<SettingsStackParamList, 'SettingsScreen'>;
```

- [ ] **Step 2: Create SettingsStack**

```tsx
// navigation/SettingsStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HowItWorksScreen } from '../screens/HowItWorksScreen';
import { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="HowItWorks" component={HowItWorksScreen} options={{ title: 'How It Works' }} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 3: Update TabNavigator to use SettingsStack**

In `navigation/TabNavigator.tsx`, replace `SettingsScreen` import and usage:

```tsx
// Replace:
// import { SettingsScreen } from '../screens/SettingsScreen';
// with:
import { SettingsStack } from './SettingsStack';

// Replace the Settings Tab.Screen component prop:
// component={SettingsScreen}
// with:
// component={SettingsStack}
```

- [ ] **Step 4: Implement SettingsScreen**

```tsx
// screens/SettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity,
  ScrollView, StyleSheet, Platform, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  loadPrefs, savePrefs, scheduleNotifications,
  requestPermission, NotificationPrefs, DEFAULT_PREFS,
} from '../hooks/useNotifications';
import { useHabits } from '../hooks/useHabits';
import { SettingsScreenProps } from '../navigation/types';

function timeStrToDate(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { habits } = useHabits();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [showPicker, setShowPicker] = useState<'morning' | 'evening' | null>(null);

  useEffect(() => {
    loadPrefs().then(setPrefs);
  }, []);

  const updatePrefs = async (patch: Partial<NotificationPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await savePrefs(next);
    const maxStreak = Math.max(0, ...habits.map((h) => h.streak));
    const todayStr = new Date().toISOString().split('T')[0];
    const firstIncomplete = habits.find((h) => !h.completedDates.includes(todayStr));
    const nearChallenge = habits.find(
      (h) => h.challengeGoal && h.streak === h.challengeGoal - 1
    );
    await scheduleNotifications(
      next,
      maxStreak,
      firstIncomplete?.name ?? null,
      nearChallenge?.challengeGoal
    );
  };

  const handleTimeChange = (_: any, date?: Date) => {
    if (!date || !showPicker) return;
    const timeStr = dateToTimeStr(date);
    if (showPicker === 'morning') updatePrefs({ morningTime: timeStr });
    else updatePrefs({ eveningTime: timeStr });
    if (Platform.OS === 'android') setShowPicker(null);
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert('Notifications blocked', 'Enable notifications in your device Settings app.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>Notifications</Text>
      <TouchableOpacity style={styles.permBtn} onPress={handleRequestPermission}>
        <Text style={styles.permBtnText}>Re-request notification permission</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.rowTitle}>Morning reminder</Text>
          <Text style={styles.rowSub}>{prefs.morningTime}</Text>
        </View>
        <Switch
          value={prefs.morningEnabled}
          onValueChange={(v) => updatePrefs({ morningEnabled: v })}
          trackColor={{ true: '#6366f1' }}
        />
      </View>
      {prefs.morningEnabled && (
        <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker('morning')}>
          <Text style={styles.timeBtnText}>Change morning time ({prefs.morningTime})</Text>
        </TouchableOpacity>
      )}

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.rowTitle}>Evening check-in</Text>
          <Text style={styles.rowSub}>{prefs.eveningTime}</Text>
        </View>
        <Switch
          value={prefs.eveningEnabled}
          onValueChange={(v) => updatePrefs({ eveningEnabled: v })}
          trackColor={{ true: '#6366f1' }}
        />
      </View>
      {prefs.eveningEnabled && (
        <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker('evening')}>
          <Text style={styles.timeBtnText}>Change evening time ({prefs.eveningTime})</Text>
        </TouchableOpacity>
      )}

      {showPicker && (
        <DateTimePicker
          value={timeStrToDate(showPicker === 'morning' ? prefs.morningTime : prefs.eveningTime)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      <Text style={[styles.section, { marginTop: 24 }]}>Feedback</Text>
      <View style={styles.row}>
        <Text style={styles.rowTitle}>Sound</Text>
        <Switch
          value={prefs.soundEnabled}
          onValueChange={(v) => updatePrefs({ soundEnabled: v })}
          trackColor={{ true: '#6366f1' }}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.rowTitle}>Haptics</Text>
        <Switch
          value={prefs.hapticsEnabled}
          onValueChange={(v) => updatePrefs({ hapticsEnabled: v })}
          trackColor={{ true: '#6366f1' }}
        />
      </View>

      <Text style={[styles.section, { marginTop: 24 }]}>Help</Text>
      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => navigation.navigate('HowItWorks')}
      >
        <Text style={styles.linkText}>How It Works</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 48 },
  section: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  permBtn: { backgroundColor: '#eef2ff', borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'center' },
  permBtnText: { color: '#6366f1', fontWeight: '600', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  rowLabel: { flex: 1 },
  rowTitle: { fontSize: 16, color: '#111827', fontWeight: '500', flex: 1 },
  rowSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  timeBtn: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 10, marginBottom: 8, alignItems: 'center' },
  timeBtnText: { color: '#6366f1', fontSize: 14 },
  linkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  linkText: { flex: 1, fontSize: 16, color: '#111827' },
  chevron: { fontSize: 20, color: '#9ca3af' },
});
```

**Note:** `@react-native-community/datetimepicker` is included with Expo SDK 54 — no separate install needed.

- [ ] **Step 5: Run tests and verify in Expo Go**

```bash
npm test
npx expo start
```

Settings tab → time toggles, switches, and "How It Works" link all work.

- [ ] **Step 6: Commit**

```bash
git add navigation/types.ts navigation/SettingsStack.tsx navigation/TabNavigator.tsx screens/SettingsScreen.tsx
git commit -m "feat: implement SettingsScreen with notification prefs, sound/haptics toggles, How It Works link"
```

---

## Task 6: Build onboarding screens

**Files:** `screens/WelcomeScreen.tsx`, `screens/FirstHabitScreen.tsx`

- [ ] **Step 1: Create WelcomeScreen**

```tsx
// screens/WelcomeScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/types';
import { requestPermission } from '../hooks/useNotifications';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const [name, setName] = useState('');

  const handleContinue = async () => {
    if (!name.trim()) return;
    await requestPermission();
    navigation.navigate('FirstHabit', { userName: name.trim() });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>🔥</Text>
        <Text style={styles.title}>Welcome to{'\n'}Habit Tracker</Text>
        <Text style={styles.subtitle}>Build lasting habits, one day at a time.</Text>

        <TextInput
          style={styles.input}
          placeholder="What's your name?"
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleContinue}
          maxLength={30}
        />

        <TouchableOpacity
          style={[styles.btn, !name.trim() && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!name.trim()}
        >
          <Text style={styles.btnText}>Get started →</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('FirstHabit', { userName: '' })}>
          <Text style={styles.skipLink}>
            Skip → <Text style={styles.skipLinkBold}>How It Works</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 34, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 17, color: '#6b7280', textAlign: 'center', marginBottom: 40 },
  input: { width: '100%', backgroundColor: '#f9fafb', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16, fontSize: 18, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  btn: { width: '100%', backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  btnDisabled: { backgroundColor: '#c7d2fe' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  skipLink: { color: '#9ca3af', fontSize: 14 },
  skipLinkBold: { color: '#6366f1', fontWeight: '600' },
});
```

- [ ] **Step 2: Create FirstHabitScreen**

```tsx
// screens/FirstHabitScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/types';
import { useHabits } from '../hooks/useHabits';
import { HabitType } from '../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'FirstHabit'>;

const EMOJI_OPTIONS = ['⭐','🔥','💪','🧘','📚','🎯','💧','🏃','😴','🥗','🎸','✍️','🧹','💊','🌱','🎨'];

export function FirstHabitScreen({ navigation, route }: Props) {
  const { userName } = route.params;
  const { addHabit } = useHabits();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [type, setType] = useState<HabitType>('binary');
  const [targetCount, setTargetCount] = useState('3');

  const handleFinish = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your first habit a name.');
      return;
    }
    addHabit({
      name,
      emoji,
      type,
      targetCount: type === 'volume' ? (parseInt(targetCount, 10) || 3) : 1,
    });
    await AsyncStorage.setItem('onboarded', 'true');
    // RootNavigator listens for this key and switches to tabs
  };

  const greeting = userName ? `Hi ${userName}! 👋` : 'Create your first habit';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{greeting}</Text>
      <Text style={styles.subtitle}>Set up your first habit to get started.</Text>

      <Text style={styles.label}>Habit Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Morning run"
        autoFocus
        maxLength={40}
        returnKeyType="done"
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
          <Text style={[styles.typeBtnText, type === 'binary' && styles.typeBtnTextActive]}>✓  Daily (once)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'volume' && styles.typeBtnActive]}
          onPress={() => setType('volume')}
        >
          <Text style={[styles.typeBtnText, type === 'volume' && styles.typeBtnTextActive]}>#  Count-based</Text>
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

      <TouchableOpacity style={styles.btn} onPress={handleFinish}>
        <Text style={styles.btnText}>Start tracking →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  inputSmall: { width: 80 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiOption: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  emojiSelected: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  emojiText: { fontSize: 24 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f9fafb', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  typeBtnActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  typeBtnTextActive: { color: '#6366f1' },
  btn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 32 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
```

- [ ] **Step 3: Commit**

```bash
git add screens/WelcomeScreen.tsx screens/FirstHabitScreen.tsx
git commit -m "feat: add Welcome and FirstHabit onboarding screens"
```

---

## Task 7: Wire up onboarding in RootNavigator

**Files:** `navigation/types.ts`, `navigation/OnboardingStack.tsx`, `navigation/RootNavigator.tsx`

- [ ] **Step 1: Add OnboardingStack types**

In `navigation/types.ts`, add:

```ts
export type OnboardingStackParamList = {
  Welcome: undefined;
  FirstHabit: { userName: string };
};
```

- [ ] **Step 2: Create OnboardingStack**

```tsx
// navigation/OnboardingStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { FirstHabitScreen } from '../screens/FirstHabitScreen';
import { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="FirstHabit" component={FirstHabitScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 3: Update RootNavigator to check onboarding state**

```tsx
// navigation/RootNavigator.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TabNavigator } from './TabNavigator';
import { OnboardingStack } from './OnboardingStack';

export function RootNavigator() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarded').then((v) => setOnboarded(v === 'true'));

    // Poll for onboarding completion (set by FirstHabitScreen)
    const interval = setInterval(async () => {
      const v = await AsyncStorage.getItem('onboarded');
      if (v === 'true') {
        setOnboarded(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (onboarded === null) return null; // splash/loading

  return (
    <NavigationContainer>
      {onboarded ? <TabNavigator /> : <OnboardingStack />}
    </NavigationContainer>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add navigation/types.ts navigation/OnboardingStack.tsx navigation/RootNavigator.tsx
git commit -m "feat: wire onboarding flow into RootNavigator with AsyncStorage flag"
```

---

## Task 8: End-to-end verification

- [ ] **Step 1: Clear app data and test full onboarding flow**

In Expo Go: shake device → "Clear AsyncStorage" (or uninstall/reinstall Expo Go app data). Reopen.

| Scenario | Expected |
|---|---|
| Fresh launch | Welcome screen shown (not tabs) |
| Enter name + tap "Get started" | Notification permission prompt fires, then First Habit screen |
| Create first habit + tap "Start tracking →" | Tabs appear, habit visible in Today |
| Second launch | Tabs shown directly (onboarding skipped) |
| Tap Settings tab | Notification toggles and time controls visible |
| Toggle morning notification off | Notifications rescheduled |
| Tap "How It Works" | Explainer screen opens with all 6 sections |
| Return to Today, complete a habit | Reward fires (haptic + sound + confetti) |

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 3: Final commit**

```bash
git add -p
git commit -m "chore: plan 3 complete — onboarding, notifications, settings, how it works verified"
```

---

**All three plans complete.** The app now has:
- ✅ Tab navigation (Today, Progress, Settings)
- ✅ Binary and volume habit types with tap counter
- ✅ Reward loop: haptic + chime + confetti on completion
- ✅ User-created challenges with full-screen celebration
- ✅ Habit Detail screen with streak calendar and history
- ✅ Progress screen with bar chart and history log
- ✅ Two-screen onboarding flow
- ✅ Daily local push notifications (morning + evening, configurable)
- ✅ Settings screen with notification time pickers and sound/haptics toggles
- ✅ How It Works screen linked from Settings and onboarding
