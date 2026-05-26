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
