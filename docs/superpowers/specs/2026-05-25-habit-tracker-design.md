# Habit Tracker — Design Spec
**Date:** 2026-05-25

## Overview

A simple demo habit tracker mobile app built with Expo and React Native, designed to run on an iPhone via the Expo Go app over local WiFi. Users can add habits, mark them complete each day, and track their current streak.

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Expo (managed workflow) + React Native | Zero native toolchain setup |
| Language | TypeScript | Type safety |
| Persistence | `@react-native-async-storage/async-storage` | Simple key-value store, included in Expo |
| State | React `useState` + `useEffect` | Sufficient for demo scope |
| Navigation | None (single screen) | No navigation needed |
| UI | Plain React Native `StyleSheet` | No external UI library needed |
| Device testing | Expo Go via QR code | No Apple Developer account required |

---

## Project Structure

```
mobile-apps/
├── app/
│   └── index.tsx          # Home screen
├── components/
│   ├── HabitList.tsx      # Renders the list of habits
│   ├── HabitItem.tsx      # Single habit row (name, streak, toggle)
│   └── AddHabitModal.tsx  # Modal for adding a new habit
├── hooks/
│   └── useHabits.ts       # All data logic and AsyncStorage persistence
├── types/
│   └── index.ts           # Habit type definition
└── app.json               # Expo config
```

---

## Data Model

```ts
type Habit = {
  id: string;           // UUID
  name: string;         // Display name entered by user
  completedDates: string[]; // ISO date strings e.g. "2026-05-25"
  streak: number;       // Consecutive days completed up to today
};
```

Habits are stored in `AsyncStorage` under the key `"habits"` as a JSON-serialized array.

---

## Features

### Home Screen
- Displays all habits in a scrollable list
- Header: "Habit Tracker"
- Each row shows: completion toggle, habit name, streak count (🔥 N days)
- A "+ Add Habit" button fixed at the bottom opens the add modal

### Habit Row States
- **Uncompleted today:** Circle icon (○), normal text color
- **Completed today:** Checkmark (✓), green accent, muted text

### Add Habit
- Tapping "+ Add Habit" opens a centered modal
- Modal contains: title "Add New Habit", a text input, Cancel and Add buttons
- On Add: new habit is created with an empty `completedDates` array and `streak: 0`
- On Cancel: modal closes with no changes

### Toggle Completion
- Tapping a habit row toggles its completion for today
- If marking complete: today's ISO date is added to `completedDates`, streak is recalculated
- If unmarking: today's ISO date is removed from `completedDates`, streak is recalculated

### Streak Logic
- Streak = the number of consecutive days (ending today or yesterday) that appear in `completedDates`
- If today is not yet completed, streak counts backward from yesterday
- Resets to 0 if there is any gap in consecutive days

### Persistence
- On every state change, habits array is serialized and saved to `AsyncStorage`
- On app start, habits are loaded from `AsyncStorage` (defaults to empty array if no data found)

---

## Out of Scope

- Editing or deleting habits
- Push notifications / reminders
- Categories or priorities
- History/calendar view
- Backend or cloud sync

---

## Running on Device

1. Install **Expo Go** from the App Store on the iPhone
2. Run `npx expo start` in the project directory
3. Scan the QR code shown in the terminal with the iPhone camera
4. The app loads over local WiFi — phone and computer must be on the same network
