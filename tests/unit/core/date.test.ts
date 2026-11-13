import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayOfWeek,
  daysInMonth,
  diffDays,
  isIsoDate,
  todayIso,
} from '../../../src/core/date';

describe('date', () => {
  it('knows month lengths and leap years', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it('validates ISO dates', () => {
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-1-01')).toBe(false);
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(diffDays('2027-01-01', '2026-01-01')).toBe(365);
  });

  it('computes the day of week', () => {
    expect(dayOfWeek('2026-11-13')).toBe(5);
    expect(dayOfWeek('2026-06-28')).toBe(0);
    expect(dayOfWeek('1969-12-31')).toBe(3);
  });

  it('takes today from the local calendar', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
