import { describe, expect, it } from 'vitest';
import type { Schedule } from '../../../src/core/model';
import {
  dueDateFor,
  expand,
  findPeriod,
  periodKeyBounds,
  periods,
  resolveOccurrences,
} from '../../../src/core/schedule';
import { bill } from './fixtures';

const monthly = (
  extra: Partial<Extract<Schedule, { kind: 'periodic' }>> = {},
): Schedule => ({
  kind: 'periodic',
  everyMonths: 1,
  due: { day: 15, monthOffset: 1 },
  start: '2026-01',
  ...extra,
});

describe('dueDateFor', () => {
  const jan2026 = 2026 * 12;

  it('clamps the day to the month length', () => {
    expect(dueDateFor({ day: 31 }, jan2026 + 1)).toBe('2026-02-28');
    expect(dueDateFor({ day: 29 }, 2024 * 12 + 1)).toBe('2024-02-29');
    expect(dueDateFor({ day: 30 }, 2024 * 12 + 1)).toBe('2024-02-29');
    expect(dueDateFor({ day: 31 }, jan2026 + 3)).toBe('2026-04-30');
  });

  it('supports the last day and a month offset', () => {
    expect(dueDateFor({ day: 'last' }, jan2026 + 1)).toBe('2026-02-28');
    expect(dueDateFor({ day: 'last', monthOffset: 1 }, jan2026)).toBe(
      '2026-02-28',
    );
    expect(dueDateFor({ day: 15, monthOffset: 1 }, jan2026 + 11)).toBe(
      '2027-01-15',
    );
  });

  it('counts days from the period start', () => {
    expect(dueDateFor({ daysFromStart: 44 }, jan2026)).toBe('2026-02-14');
    expect(dueDateFor({ daysFromStart: 44 }, jan2026 + 3)).toBe('2026-05-15');
    expect(dueDateFor({ daysFromStart: 44 }, jan2026 + 6)).toBe('2026-08-14');
    expect(dueDateFor({ daysFromStart: 44 }, jan2026 + 9)).toBe('2026-11-14');
  });

  it('rejects nonsense rules', () => {
    expect(() => dueDateFor({ day: 0 }, jan2026)).toThrow(RangeError);
    expect(() => dueDateFor({ day: 32 }, jan2026)).toThrow(RangeError);
    expect(() => dueDateFor({ daysFromStart: -1 }, jan2026)).toThrow(
      RangeError,
    );
  });
});

describe('periods', () => {
  it('builds monthly periods with the due date in the next month', () => {
    const ps = periods(monthly(), '2026-01-01', '2026-03-01');
    expect(ps).toEqual([
      {
        periodKey: '2026-01',
        start: '2026-01-01',
        end: '2026-02-01',
        nominalDue: '2026-02-15',
        dueDate: '2026-02-15',
      },
      {
        periodKey: '2026-02',
        start: '2026-02-01',
        end: '2026-03-01',
        nominalDue: '2026-03-15',
        dueDate: '2026-03-15',
      },
    ]);
  });

  it('shifts the paušal deadline to a working day', () => {
    const [jan] = periods(
      monthly({ shiftToWorkday: true }),
      '2026-01-01',
      '2026-02-01',
    );
    expect(jan?.nominalDue).toBe('2026-02-15');
    expect(jan?.dueDate).toBe('2026-02-18');
  });

  it('uses quarter keys and the 45th day for porez na imovinu', () => {
    const schedule: Schedule = {
      kind: 'periodic',
      everyMonths: 3,
      due: { daysFromStart: 44 },
      start: '2026-01',
      shiftToWorkday: true,
    };
    expect(
      periods(schedule, '2026-01-01', '2027-01-01').map((p) => [
        p.periodKey,
        p.dueDate,
      ]),
    ).toEqual([
      ['2026-Q1', '2026-02-18'],
      ['2026-Q2', '2026-05-15'],
      ['2026-Q3', '2026-08-14'],
      ['2026-Q4', '2026-11-16'],
    ]);
  });

  it('uses month keys for periods not aligned to quarters or years', () => {
    const q = periods(
      monthly({ everyMonths: 3, start: '2026-02' }),
      '2026-01-01',
      '2026-06-01',
    );
    expect(q.map((p) => p.periodKey)).toEqual(['2026-02', '2026-05']);
    const y = periods(
      monthly({ everyMonths: 12, start: '2025-01' }),
      '2026-06-01',
      '2026-07-01',
    );
    expect(y.map((p) => [p.periodKey, p.end])).toEqual([
      ['2026', '2027-01-01'],
    ]);
  });

  it('returns the periods that overlap the range, not only those starting in it', () => {
    const ps = periods(
      monthly({ everyMonths: 6, start: '2025-01' }),
      '2026-03-15',
      '2026-03-16',
    );
    expect(ps.map((p) => [p.start, p.end])).toEqual([
      ['2026-01-01', '2026-07-01'],
    ]);
  });

  it('stops at the end month', () => {
    const ps = periods(monthly({ end: '2026-03' }), '2026-01-01', '2027-01-01');
    expect(ps.map((p) => p.periodKey)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
  });

  it('is empty when the end is before the start', () => {
    expect(
      periods(
        monthly({ start: '2026-05', end: '2026-04' }),
        '2026-01-01',
        '2027-01-01',
      ),
    ).toEqual([]);
  });

  it('is empty before the start', () => {
    expect(
      periods(monthly({ start: '2027-01' }), '2026-01-01', '2027-01-01'),
    ).toEqual([]);
  });

  it('expands bills with dates from the previous date', () => {
    const ps = periods(
      { kind: 'dates', dates: ['2026-09-30', '2026-03-31', '2026-03-31'] },
      '2026-01-01',
      '2027-01-01',
    );
    expect(ps).toEqual([
      {
        periodKey: '2026-03-31',
        start: '2026-03-01',
        end: '2026-04-01',
        nominalDue: '2026-03-31',
        dueDate: '2026-03-31',
      },
      {
        periodKey: '2026-09-30',
        start: '2026-04-01',
        end: '2026-10-01',
        nominalDue: '2026-09-30',
        dueDate: '2026-09-30',
      },
    ]);
  });

  it('filters dates by range', () => {
    const ps = periods(
      { kind: 'dates', dates: ['2026-03-31', '2027-03-31'] },
      '2027-01-01',
      '2028-01-01',
    );
    expect(ps.map((p) => p.periodKey)).toEqual(['2027-03-31']);
  });
});

describe('expand', () => {
  it('tags periods with the bill id', () => {
    const occs = expand(bill(monthly()), '2026-01-01', '2026-02-01');
    expect(occs).toHaveLength(1);
    expect(occs[0]?.billId).toBe('b1');
  });
});

describe('periodKeyBounds', () => {
  it('reads every key format', () => {
    expect(periodKeyBounds('2026-11')).toEqual({
      start: '2026-11-01',
      end: '2026-12-01',
    });
    expect(periodKeyBounds('2026-Q4')).toEqual({
      start: '2026-10-01',
      end: '2027-01-01',
    });
    expect(periodKeyBounds('2026')).toEqual({
      start: '2026-01-01',
      end: '2027-01-01',
    });
    expect(periodKeyBounds('2026-11-14')).toEqual({
      start: '2026-11-14',
      end: '2026-11-15',
    });
    expect(periodKeyBounds('2026-Q5')).toBeNull();
  });
});

describe('findPeriod', () => {
  it('matches only keys the schedule produces', () => {
    const s = monthly({ everyMonths: 2, start: '2026-01', end: '2026-12' });
    expect(findPeriod(s, '2026-03')?.dueDate).toBe('2026-04-15');
    expect(findPeriod(s, '2026-04')).toBeNull();
    expect(findPeriod(s, '2027-01')).toBeNull();
    expect(findPeriod(s, '2025-11')).toBeNull();
    expect(findPeriod(monthly({ everyMonths: 3 }), '2026-01')).toBeNull();
    expect(findPeriod(monthly({ everyMonths: 3 }), '2026-Q1')).not.toBeNull();
  });
});

describe('resolveOccurrences', () => {
  it('applies stored overrides', () => {
    const b = bill(monthly());
    const [jan] = resolveOccurrences(
      b,
      [
        {
          billId: 'b1',
          periodKey: '2026-01',
          dueDate: '2026-02-20',
          paidAt: '2026-02-10',
        },
      ],
      '2026-01-01',
      '2026-02-01',
    );
    expect(jan?.dueDate).toBe('2026-02-20');
    expect(jan?.stored?.paidAt).toBe('2026-02-10');
    expect(jan?.outOfSchedule).toBe(false);
  });

  it('ignores records of other bills', () => {
    const [jan] = resolveOccurrences(
      bill(monthly()),
      [{ billId: 'b2', periodKey: '2026-01' }],
      '2026-01-01',
      '2026-02-01',
    );
    expect(jan?.stored).toBeUndefined();
  });

  it('keeps paid periods after a switch from monthly to quarterly', () => {
    const paid = [
      { billId: 'b1', periodKey: '2026-01', paidAt: '2026-02-10' },
      { billId: 'b1', periodKey: '2026-02', paidAt: '2026-03-10' },
    ];
    const b = bill({
      kind: 'periodic',
      everyMonths: 3,
      due: { day: 'last' },
      start: '2026-01',
    });
    const occs = resolveOccurrences(b, paid, '2026-01-01', '2026-07-01');
    expect(occs.map((o) => [o.periodKey, o.outOfSchedule, o.dueDate])).toEqual([
      ['2026-Q1', false, '2026-01-31'],
      ['2026-01', true, '2026-01-31'],
      ['2026-02', true, '2026-02-28'],
      ['2026-Q2', false, '2026-04-30'],
    ]);
  });

  it('keeps a paid date that was removed from the list', () => {
    const b = bill({ kind: 'dates', dates: ['2026-09-30'] });
    const occs = resolveOccurrences(
      b,
      [{ billId: 'b1', periodKey: '2026-03-31', paidAt: '2026-03-20' }],
      '2026-01-01',
      '2027-01-01',
    );
    expect(occs.map((o) => [o.periodKey, o.outOfSchedule])).toEqual([
      ['2026-03-31', true],
      ['2026-09-30', false],
    ]);
  });

  it('leaves out-of-schedule records outside the range', () => {
    const b = bill(monthly({ start: '2027-01' }));
    expect(
      resolveOccurrences(
        b,
        [{ billId: 'b1', periodKey: '2025-05' }],
        '2026-01-01',
        '2027-01-01',
      ),
    ).toEqual([]);
  });
});
