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
