import { describe, expect, it } from 'vitest';
import {
  agendaItems,
  agendaTotals,
  type AgendaItem,
} from '../../../src/core/agenda';
import type { Section } from '../../../src/core/model';
import { bill } from './fixtures';

const section: Section = {
  id: 's1',
  name: 'Stan',
  color: '#888888',
  order: 0,
  archived: false,
};

const monthly = bill(
  {
    kind: 'periodic',
    everyMonths: 1,
    due: { day: 15, monthOffset: 1 },
    start: '2026-08',
  },
  { amountMode: 'variable' },
);
delete monthly.amount;

function keys(items: readonly AgendaItem[]) {
  return items.map((i) => [i.occ.periodKey, i.status, i.remaining]);
}

describe('agendaItems', () => {
  it('lists unpaid periods from the first one up to the horizon', () => {
    const items = agendaItems(
      [section],
      [monthly],
      [
        { billId: 'b1', periodKey: '2026-08', paidAt: '2026-09-10' },
        { billId: 'b1', periodKey: '2026-10', amount: 50000 },
      ],
      '2026-11-13',
      70,
    );
    expect(keys(items)).toEqual([
      ['2026-09', 'overdue', undefined],
      ['2026-10', 'due', 50000],
      ['2026-11', 'awaiting-amount', undefined],
      ['2026-12', 'upcoming', undefined],
    ]);
  });

  it('counts only what is left after a short payment', () => {
    const items = agendaItems(
      [section],
      [monthly],
      [
        {
          billId: 'b1',
          periodKey: '2026-10',
          amount: 50000,
          paidAt: '2026-11-01',
          paidAmount: 20000,
        },
      ],
      '2026-11-13',
      0,
    );
    expect(keys(items)).toContainEqual(['2026-10', 'partial', 30000]);
  });

  it('keeps unpaid records the schedule no longer produces', () => {
    const items = agendaItems(
      [section],
      [monthly],
      [{ billId: 'b1', periodKey: '2026-05', amount: 10000 }],
      '2026-11-13',
      0,
    );
    expect(items[0]?.occ).toMatchObject({
      periodKey: '2026-05',
      outOfSchedule: true,
    });
    expect(items[0]?.status).toBe('overdue');
  });

  it('includes a current period due beyond the horizon', () => {
    const yearly = bill({
      kind: 'periodic',
      everyMonths: 12,
      due: { day: 30, monthOffset: 11 },
      start: '2026-01',
    });
    expect(keys(agendaItems([section], [yearly], [], '2026-02-01', 0))).toEqual(
      [['2026', 'due', 100000]],
    );
  });

  it('skips archived bills and bills in archived sections', () => {
    const archived = { ...monthly, id: 'b2', archived: true };
    const hidden = { ...monthly, id: 'b3', sectionId: 's2' };
    const items = agendaItems(
      [section, { ...section, id: 's2', archived: true }],
      [archived, hidden],
      [],
      '2026-11-13',
    );
    expect(items).toEqual([]);
  });

  it('sorts by due date and then by title', () => {
    const a = { ...monthly, id: 'a', title: 'Voda' };
    const b = { ...monthly, id: 'b', title: 'Struja' };
    const items = agendaItems([section], [a, b], [], '2026-08-01', 30);
    expect(items.map((i) => [i.occ.dueDate, i.bill.title])).toEqual([
      ['2026-09-15', 'Struja'],
      ['2026-09-15', 'Voda'],
    ]);
  });
});

describe('agendaTotals', () => {
  it('sums known amounts and counts unknown ones per group', () => {
    const items = agendaItems(
      [section],
      [monthly],
      [
        { billId: 'b1', periodKey: '2026-08', amount: 10000 },
        { billId: 'b1', periodKey: '2026-10', amount: 50000 },
      ],
      '2026-11-13',
      70,
    );
    expect(agendaTotals(items)).toEqual({
      overdue: { count: 2, sum: 10000, unknown: 1 },
      now: { count: 2, sum: 50000, unknown: 1 },
      soon: { count: 1, sum: 0, unknown: 1 },
    });
  });
});
