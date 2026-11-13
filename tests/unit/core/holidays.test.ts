import { describe, expect, it } from 'vitest';
import {
  isWorkday,
  nextWorkday,
  orthodoxEaster,
  serbianHolidays,
} from '../../../src/core/holidays';

describe('orthodoxEaster', () => {
  it.each([
    [2021, '2021-05-02'],
    [2023, '2023-04-16'],
    [2024, '2024-05-05'],
    [2025, '2025-04-20'],
    [2026, '2026-04-12'],
    [2027, '2027-05-02'],
  ])('%i', (year, date) => {
    expect(orthodoxEaster(year)).toBe(date);
  });
});

describe('serbianHolidays', () => {
  it('lists the fixed holidays and Easter from Friday to Monday', () => {
    expect([...serbianHolidays(2025)].sort()).toEqual([
      '2025-01-01',
      '2025-01-02',
      '2025-01-07',
      '2025-02-15',
      '2025-02-16',
      '2025-02-17',
      '2025-04-18',
      '2025-04-19',
      '2025-04-20',
      '2025-04-21',
      '2025-05-01',
      '2025-05-02',
      '2025-11-11',
    ]);
  });

  it('carries a Sunday state holiday past the second holiday day', () => {
    expect(serbianHolidays(2026).has('2026-02-17')).toBe(true);
  });

  it('carries a Sunday holiday past Easter Monday', () => {
    expect(serbianHolidays(2021).has('2021-05-04')).toBe(true);
  });

  it('carries Dan primirja on a Sunday to Monday', () => {
    expect(serbianHolidays(2029).has('2029-11-12')).toBe(true);
  });

  it('does not carry Christmas', () => {
    expect(serbianHolidays(2024).has('2024-01-08')).toBe(false);
  });
});

describe('nextWorkday', () => {
  it('moves the paušal deadline for January 2026 to 18.02.2026', () => {
    expect(nextWorkday('2026-02-15')).toBe('2026-02-18');
  });

  it('moves the IV quarter porez na imovinu deadline to 16.11.2026', () => {
    expect(nextWorkday('2026-11-14')).toBe('2026-11-16');
  });

  it('moves the EPS deadline 28.06.2026 to Monday', () => {
    expect(nextWorkday('2026-06-28')).toBe('2026-06-29');
  });

  it('keeps a working day', () => {
    expect(isWorkday('2026-11-13')).toBe(true);
    expect(nextWorkday('2026-11-13')).toBe('2026-11-13');
  });
});
