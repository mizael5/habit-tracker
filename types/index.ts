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
