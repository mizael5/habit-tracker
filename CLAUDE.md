# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## SDK Version

This project uses **Expo SDK 54** (downgraded from 56 to match Expo Go on device). Do not upgrade to SDK 56+ without confirming the Expo Go app version on the target iPhone supports it.

## Commands

```bash
npx expo start          # Start dev server (scan QR with Expo Go on iPhone)
npx expo start --clear  # Start with Metro cache cleared (use after dependency changes)
npm test                # Run all Jest tests
npx jest hooks/__tests__/useHabits.test.ts  # Run a single test file
```

## Architecture

Single-screen Expo app (no navigation library). State lives entirely in `hooks/useHabits.ts`; components are pure presentational.

- **`App.tsx`** — root component; wires `useHabits` hook to `HabitList` and `AddHabitModal`
- **`hooks/useHabits.ts`** — all data logic: AsyncStorage load/save, `addHabit`, `toggleHabit`. Exports `calculateStreak` as a pure function (enables unit testing without React)
- **`components/`** — three presentational components: `HabitList` (FlatList), `HabitItem` (row with toggle/streak), `AddHabitModal` (input modal)
- **`types/index.ts`** — single `Habit` type: `{ id, name, completedDates: string[], streak: number }`

Persistence: habits are JSON-serialized to AsyncStorage under the key `"habits"` on every state change and rehydrated on mount.

## Testing

Tests cover `calculateStreak` in `hooks/__tests__/useHabits.test.ts`. AsyncStorage is mocked via `moduleNameMapper` in `package.json` (no manual `jest.mock()` needed). Preset is `jest-expo`.

## Running on Device

Phone and computer must be on the same WiFi network. Install **Expo Go** (App Store), run `npx expo start`, scan the QR code with the iPhone camera.
