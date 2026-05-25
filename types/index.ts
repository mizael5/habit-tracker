export type Habit = {
  id: string;
  name: string;
  completedDates: string[]; // ISO date strings e.g. "2026-05-25"
  streak: number;
};
