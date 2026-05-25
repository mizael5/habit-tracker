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
