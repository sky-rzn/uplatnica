import { describe, expect, it } from 'vitest';
import type { Occurrence } from '../../../src/core/model';
import { resolveOccurrences } from '../../../src/core/schedule';
import { computeStatus } from '../../../src/core/status';
import { bill } from './fixtures';

const paušal = bill(
  {
    kind: 'periodic',
    everyMonths: 1,
    due: { day: 15, monthOffset: 1 },
    start: '2026-01',
  },
  { graceDays: 2 },
);

function statusOf(
  today: string,
  stored: Partial<Occurrence> = {},
  b = paušal,
): string {
  const [occ] = resolveOccurrences(
    b,
    [{ billId: 'b1', periodKey: '2026-10', ...stored }],
    '2026-10-01',
    '2026-11-01',
  );
  if (!occ) throw new Error('no occurrence');
  return computeStatus(b, occ, today);
}

describe('computeStatus', () => {
  it('is due in the current period', () => {
    expect(statusOf('2026-10-01')).toBe('due');
  });

  it('is due within the horizon after the period', () => {
    expect(statusOf('2026-11-01')).toBe('due');
    expect(statusOf('2026-11-17')).toBe('due');
  });

  it('is overdue after the grace days', () => {
    expect(statusOf('2026-11-18')).toBe('overdue');
  });

  it('is upcoming far ahead', () => {
    expect(statusOf('2026-09-01')).toBe('upcoming');
  });

  it('is paid regardless of the date', () => {
    expect(statusOf('2027-01-01', { paidAt: '2026-11-10' })).toBe('paid');
    expect(
      statusOf('2027-01-01', { paidAt: '2026-11-10', paidAmount: 100000 }),
    ).toBe('paid');
  });

  it('is partial when less than the amount was paid', () => {
    expect(
      statusOf('2026-11-10', { paidAt: '2026-11-10', paidAmount: 50000 }),
    ).toBe('partial');
    expect(
      statusOf('2026-11-10', {
        paidAt: '2026-11-10',
        paidAmount: 50000,
        amount: 40000,
      }),
    ).toBe('paid');
    expect(
      statusOf('2026-12-01', { paidAt: '2026-11-10', paidAmount: 50000 }),
    ).toBe('overdue');
  });

  it('awaits the amount of a variable bill', () => {
    const variable = { ...paušal, amountMode: 'variable' as const };
    expect(statusOf('2026-10-20', {}, variable)).toBe('awaiting-amount');
    expect(statusOf('2026-10-20', { amount: 324900 }, variable)).toBe('due');
    expect(statusOf('2026-09-01', {}, variable)).toBe('upcoming');
    expect(statusOf('2026-12-01', {}, variable)).toBe('overdue');
  });

  it('follows an overridden due date', () => {
    expect(statusOf('2026-11-25', { dueDate: '2026-11-30' })).toBe('due');
  });
});
