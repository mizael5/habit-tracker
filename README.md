# Habit Tracker

A mobile habit-tracking app built with **Expo SDK 54** and **React Native**. Track daily habits, build streaks, set challenge goals, and get notified when it's time to check in.

## Features

- **Today tab** — mark habits done (binary) or log reps/counts (volume-based)
- **Streak tracking** — automatic streak calculation with confetti on completion
- **Challenge goals** — set 7 / 14 / 21 / 30 / 66-day challenges with a progress bar
- **Progress tab** — 30-day completion bar chart and history log
- **Notifications** — configurable morning reminder and evening check-in
- **Onboarding** — first-launch welcome flow with name input and notification opt-in
- **Settings** — toggle sound, haptics, notification times, and Dev Tools for testing

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 54 / React Native |
| Navigation | React Navigation 6 (native stack + bottom tabs) |
| Persistence | AsyncStorage |
| Notifications | expo-notifications |
| Haptics | expo-haptics |
| Animation | react-native-confetti-cannon |
| Testing | Jest + jest-expo |

## Getting Started

```bash
npm install
npx expo start          # scan QR with Expo Go on your phone
npx expo start --clear  # clear Metro cache after dependency changes
```

Your phone and computer must be on the same Wi-Fi network. Install **Expo Go** from the App Store or Google Play.

## Running Tests

```bash
npm test
npx jest hooks/__tests__/useHabits.test.ts   # single file
```

## Project Structure

```
├── App.tsx                  # root — onboarding gate + RootNavigator
├── navigation/
│   ├── RootNavigator.tsx    # onboarding vs main app switch
│   ├── TabNavigator.tsx     # bottom tab bar
│   ├── TodayStack.tsx       # Today → HabitDetail → AddHabit
│   └── types.ts             # all navigator param lists + screen props
├── screens/
│   ├── TodayScreen.tsx      # habit list + add button
│   ├── HabitDetailScreen.tsx# streak calendar, challenge settings
│   ├── AddHabitScreen.tsx   # add / edit / delete a habit
│   ├── ProgressScreen.tsx   # bar chart + history log
│   ├── SettingsScreen.tsx   # notifications, feedback, dev tools
│   ├── WelcomeScreen.tsx    # onboarding step 1
│   ├── FirstHabitScreen.tsx # onboarding step 2
│   └── HowItWorksScreen.tsx # static explainer
├── components/
│   ├── HabitList.tsx        # FlatList wrapper
│   ├── HabitItem.tsx        # animated habit row
│   ├── StreakCalendar.tsx   # monthly completion grid
│   └── RewardOverlay.tsx    # challenge-complete celebration modal
├── hooks/
│   ├── useHabits.ts         # all habit state + AsyncStorage logic
│   ├── useNotifications.ts  # schedule / load / save notification prefs
│   └── useReward.ts         # haptics + sound on completion
└── types/index.ts           # Habit and HabitType types
```

## Notes

- Targets **Expo SDK 54** — do not upgrade to 56+ without verifying the Expo Go version on device
- victory-native v41 uses Skia and is not web-compatible; the Progress chart uses plain Views instead
- `Alert.alert` callbacks are unreliable on Expo Web — destructive actions call handlers directly
