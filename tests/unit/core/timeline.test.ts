import { describe, expect, it } from 'vitest';
import type { Section } from '../../../src/core/model';
import {
  billRow,
  monthColumns,
  timelineGroups,
  timelineRange,
  todayOffset,
  yearColumns,
} from '../../../src/core/timeline';
import { bill } from './fixtures';

const monthly = bill(
  {
    kind: 'periodic',
    everyMonths: 1,
    due: { day: 15, monthOffset: 1 },
    start: '2026-01',
  },
  { amountMode: 'variable' },
);
delete monthly.amount;

describe('timelineRange', () => {
  it('shows three months back and nine ahead by default', () => {
    expect(timelineRange('1y', '2026-11-13')).toEqual({
      from: '2026-08-01',
      to: '2027-08-01',
      days: 365,
    });
  });

  it('shifts by whole steps of the zoom', () => {
    expect(timelineRange('1y', '2026-11-13', -1).from).toBe('2026-05-01');
    expect(timelineRange('6m', '2026-11-13')).toMatchObject({
      from: '2026-10-01',
      to: '2027-04-01',
    });
    expect(timelineRange('3y', '2026-01-31', 1)).toMatchObject({
      from: '2026-01-01',
      to: '2029-01-01',
    });
  });
});

describe('monthColumns and yearColumns', () => {
  it('cover the range without gaps', () => {
    const range = timelineRange('6m', '2026-12-01');
    const months = monthColumns(range);
    expect(months.map((m) => [m.year, m.month])).toEqual([
      [2026, 11],
      [2026, 12],
      [2027, 1],
      [2027, 2],
      [2027, 3],
      [2027, 4],
    ]);
    expect(months[0]).toMatchObject({ start: 0, end: 30 });
    expect(months.at(-1)?.end).toBe(range.days);
    expect(yearColumns(months)).toEqual([
      { year: 2026, start: 0, end: 61 },
      { year: 2027, start: 61, end: range.days },
    ]);
  });
});

describe('todayOffset', () => {
  it('is null outside the range', () => {
    const range = timelineRange('6m', '2026-11-13');
    expect(todayOffset(range, '2026-11-13')).toBe(43);
    expect(todayOffset(range, '2027-04-01')).toBeNull();
  });
});

describe('billRow', () => {
  const range = timelineRange('6m', '2026-11-13');

  it('places one block per period with status and amount', () => {
    const row = billRow(
      monthly,
      [
        {
          billId: 'b1',
          periodKey: '2026-10',
          amount: 50000,
          paidAt: '2026-11-10',
        },
        { billId: 'b1', periodKey: '2026-11', amount: 70000 },
      ],
      range,
      '2026-11-13',
    );
    expect(
      row.blocks.map((b) => [b.occ.periodKey, b.status, b.amount, b.start]),
    ).toEqual([
      ['2026-10', 'paid', 50000, 0],
      ['2026-11', 'due', 70000, 31],
      ['2026-12', 'upcoming', undefined, 61],
      ['2027-01', 'upcoming', undefined, 92],
      ['2027-02', 'upcoming', undefined, 123],
      ['2027-03', 'upcoming', undefined, 151],
    ]);
    expect(row.lanes).toBe(1);
  });

  it('sums the periods due within the range', () => {
    const row = billRow(
      monthly,
      [
        { billId: 'b1', periodKey: '2026-09', amount: 10000 },
        { billId: 'b1', periodKey: '2026-10', amount: 50000 },
      ],
      range,
      '2026-11-13',
    );
    // September is due in October, March in April: only October counts.
    expect(row.total).toBe(50000);
    expect(row.unknown).toBe(4);
  });

  it('clips blocks at the edges of the range', () => {
    const quarterly = bill({
      kind: 'periodic',
      everyMonths: 3,
      due: { daysFromStart: 44 },
      start: '2026-01',
    });
    const row = billRow(
      quarterly,
      [],
      timelineRange('6m', '2026-12-13'),
      '2026-12-13',
    );
    expect(
      row.blocks.map((b) => [b.occ.periodKey, b.start, b.end, b.clippedStart]),
    ).toEqual([
      ['2026-Q4', 0, 61, true],
      ['2027-Q1', 61, 151, false],
      ['2027-Q2', 151, 181, false],
    ]);
    expect(row.blocks[2]?.clippedEnd).toBe(true);
  });

  it('moves stale records that overlap the schedule to another lane', () => {
    const quarterly = bill({
      kind: 'periodic',
      everyMonths: 3,
      due: { daysFromStart: 44 },
      start: '2026-01',
    });
    const row = billRow(
      quarterly,
      [
        { billId: 'b1', periodKey: '2026-10', paidAt: '2026-10-20' },
        { billId: 'b1', periodKey: '2026-11', paidAt: '2026-11-20' },
      ],
      range,
      '2026-11-13',
    );
    expect(
      row.blocks.map((b) => [b.occ.periodKey, b.occ.outOfSchedule, b.lane]),
    ).toEqual([
      ['2026-Q4', false, 0],
      ['2026-10', true, 1],
      ['2026-11', true, 1],
      ['2027-Q1', false, 0],
    ]);
    expect(row.lanes).toBe(2);
  });
});

describe('timelineGroups', () => {
  const sections: Section[] = [
    { id: 's2', name: 'Porezi', color: '#000000', order: 1, archived: false },
    { id: 's1', name: 'Stan', color: '#000000', order: 0, archived: false },
    { id: 's3', name: 'Staro', color: '#000000', order: 2, archived: true },
  ];
  const bills = [
    { ...monthly, id: 'b1', title: 'Struja' },
    { ...monthly, id: 'b2', title: 'Infostan' },
    { ...monthly, id: 'b3', title: 'Paušal', sectionId: 's2', profileId: 'p2' },
    { ...monthly, id: 'b4', title: 'Arhiva', archived: true },
    { ...monthly, id: 'b5', title: 'Garaža', sectionId: 's3' },
  ];
  const range = timelineRange('6m', '2026-11-13');

  it('groups active bills by section order and title', () => {
    const groups = timelineGroups(sections, bills, [], range, '2026-11-13');
    expect(
      groups.map((g) => [g.section.id, g.rows.map((r) => r.bill.id)]),
    ).toEqual([
      ['s1', ['b2', 'b1']],
      ['s2', ['b3']],
    ]);
  });

  it('filters by section, payer and unpaid periods', () => {
    const ids = (filter: Parameters<typeof timelineGroups>[5]) =>
      timelineGroups(sections, bills, [], range, '2026-11-13', filter).flatMap(
        (g) => g.rows.map((r) => r.bill.id),
      );
    expect(ids({ sectionId: 's2' })).toEqual(['b3']);
    expect(ids({ profileId: 'p1' })).toEqual(['b2', 'b1']);

    const allPaid = [
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
      '2027-03',
    ].map((periodKey) => ({ billId: 'b1', periodKey, paidAt: '2026-11-01' }));
    expect(
      timelineGroups(sections, bills, allPaid, range, '2026-11-13', {
        unpaidOnly: true,
      }).flatMap((g) => g.rows.map((r) => r.bill.id)),
    ).toEqual(['b2', 'b3']);
  });
});
