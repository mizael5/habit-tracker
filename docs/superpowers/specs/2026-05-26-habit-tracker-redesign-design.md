# Habit Tracker — Full Redesign Spec

**Date:** 2026-05-26
**Status:** Approved

---

## 1. App Design Framework

| Layer | Definition |
|---|---|
| Core function | Create and track habits |
| Core loop | Create habit → track it → receive reward (visual + haptic + sound) |
| Accessory features | History log, consistency chart, multiple habit types, user-created challenges |
| Surface area | 7 screens (within 5–7 target) |
| Retention hook | Daily local push notifications (morning + evening); challenge completion moments |

---

## 2. Platforms

iOS and Android. Local notifications via `expo-notifications` (no server required). Haptics via `expo-haptics` (no-ops gracefully on Android devices without haptic motor).

---

## 3. Screen Map

### Onboarding (pre-tabs, shown once)

1. **Welcome** — user enters their name, grants notification permission, sees a link to "How It Works"
2. **First Habit** — creates their first habit (name, type, emoji, optional challenge goal); cannot skip

### Main App — Bottom Tab Navigator

**Tab 1: Today**
- Habit list showing all habits for the current day
- Binary habits: tap-to-toggle checkmark
- Volume habits: `+` button with counter showing `current / target`
- Each row shows streak badge and emoji
- Reward animation fires in-place on completion
- Stack screens reachable from Today:
  - **Add / Edit Habit** — name, type (binary or volume), emoji picker, target count (volume only)
  - **Habit Detail** — per-habit completion calendar, challenge goal setter, full completion history log

**Tab 2: Progress**
- Consistency bar chart (last 30 days, per-habit completion rate)
- All-habits heatmap calendar
- Overall completion rate stat
- Scrollable history log (all habits, all dates)

**Tab 3: Settings**
- Morning notification time (default 8:00 AM, toggleable)
- Evening notification time (default 8:00 PM, toggleable)
- Sound on/off
- Haptics on/off
- Stack screen reachable from Settings:
  - **How It Works** — explains binary vs volume habits, streaks, challenges, and how rewards fire; also linked from the Welcome onboarding screen

---

## 4. Data Model

```ts
type HabitType = 'binary' | 'volume';

type Habit = {
  id: string;
  name: string;
  emoji: string;
  type: HabitType;
  targetCount: number;              // 1 for binary, N for volume
  completedDates: string[];         // ISO dates where habit was fully completed
  volumeLog: Record<string, number>; // date → tap count (volume habits only)
  streak: number;
  challengeGoal?: number;           // e.g. 21 (days in a row)
  challengeStartDate?: string;      // ISO date when challenge was set
};
```

**Completion logic:**
- Binary: completed when toggled on for today
- Volume: completed when `volumeLog[today] >= targetCount`; `completedDates` is updated atomically when threshold is crossed

**Challenge completion:** derived — `streak >= challengeGoal`. No separate field needed.

**Persistence:** AsyncStorage key `"habits"` unchanged. On first load after upgrade, missing fields are filled with defaults (`emoji: "⭐"`, `type: "binary"`, `targetCount: 1`, `volumeLog: {}`, no challenge).

---

## 5. Core Loop — Reward Sequence

### Binary habit completed (toggle tap):
1. `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)`
2. Checkmark animates in (scale + spring bounce via `react-native-reanimated`)
3. Row background transitions to indigo gradient
4. `react-native-confetti-cannon` fires from the row position
5. Chime sound plays (`expo-av`, bundled audio ≤50 KB)
6. Streak badge increments with pop animation

### Volume habit — each tap (not yet complete):
1. `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
2. Counter increments (`current / target`)

### Volume habit — final tap (hits target):
- Same full reward sequence as binary habit

### Challenge completion (streak reaches challengeGoal):
1. Full-screen celebration overlay appears
2. Large confetti burst, louder/longer chime variant
3. "Challenge Complete!" banner with habit name and days achieved
4. Overlay dismisses on user tap

---

## 6. Habit Types

| Type | Interaction | "Done" condition |
|---|---|---|
| Binary | Single tap toggle | Toggled on for today |
| Volume | `+` button, shows `N / target` | `volumeLog[today] >= targetCount` |

Users select the type when creating or editing a habit. Type can be changed on Edit; existing `completedDates` are preserved, `volumeLog` resets to `{}`.

---

## 7. Challenges

- User-created only — set on any habit from its Habit Detail screen
- User picks a goal (number of consecutive days, e.g. 7, 14, 21)
- `challengeStartDate` is set to today when the goal is saved
- Progress displayed on Habit Detail: "Day 5 of 21"
- If streak breaks: `challengeGoal` and `challengeStartDate` are cleared from the habit; the user must set a new challenge manually
- Completion triggers the full-screen celebration overlay (Section 5)
- Only one active challenge per habit at a time

---

## 8. Notifications

**Implementation:** `expo-notifications` local notifications. No backend required.

**Permission:** Requested on the Welcome onboarding screen. App is fully functional if denied; Settings shows a system-settings prompt for users who want to enable later.

**Morning notification** (default 8:00 AM, user-configurable):
> "Time to build your habits 💪 You're on a [X]-day streak!"

**Evening notification** (default 8:00 PM, user-configurable):
> "Don't break your streak! Have you done [habit name] today?"
- Picks the first incomplete habit of the day for specificity
- Falls back to generic message if all habits are complete

**Challenge nudge** (appended to evening notification when streak = challengeGoal − 1):
> "One more day — complete your [N]-day challenge tomorrow!"

**Scheduling:** Notifications are rescheduled whenever the user changes times in Settings or completes onboarding.

---

## 9. New Dependencies

| Package | Purpose |
|---|---|
| `@react-navigation/native` | Navigation core |
| `@react-navigation/bottom-tabs` | Tab bar |
| `@react-navigation/stack` | Stack screens (Habit Detail, Add Habit, How It Works) |
| `react-native-screens` + `react-native-safe-area-context` | Navigation peer deps |
| `expo-haptics` | Haptic feedback |
| `expo-av` | Sound playback |
| `expo-notifications` | Local push notifications |
| `react-native-confetti-cannon` | Confetti particle burst |
| `victory-native` | Charts on Progress screen |
| `react-native-reanimated` | Smooth animations (already in Expo 54) |

---

## 10. What Is Not Changing

- AsyncStorage as the persistence layer
- `calculateStreak` pure function (extended, not replaced)
- Single `hooks/useHabits.ts` as the state owner (expanded with new actions)
- Jest + jest-expo test setup
- Expo SDK 54
