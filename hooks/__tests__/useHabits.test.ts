import { calculateStreak, migrateHabits } from '../useHabits';
import { Habit } from '../../types';

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
