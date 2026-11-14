import { describe, expect, it } from 'vitest';
import type { Tombstone } from '../../../src/db/schema';
import { mergeDatasets, occurrenceKey } from '../../../src/io/merge';
import { T0, dataset } from './fixtures';

const LATER = '2026-11-05T10:00:00.000Z';

function tomb(
  table: Tombstone['table'],
  key: string,
  deletedAt = LATER,
): Tombstone {
  return { table, key, deletedAt };
}

function withoutBill() {
  const d = dataset();
  d.bills = [];
  d.occurrences = [];
  return d;
}

describe('mergeDatasets with deletions', () => {
  it('deletes a record deleted elsewhere after it was changed here', () => {
    const incoming = dataset();
    const [, occ] = incoming.occurrences;
    if (!occ) throw new Error('fixture');
    incoming.occurrences = incoming.occurrences.slice(0, 1);
    incoming.tombstones = [tomb('occurrences', occurrenceKey(occ))];

    const { put, drop, stats } = mergeDatasets(dataset(), incoming);
    expect(drop).toEqual([{ table: 'occurrences', key: occurrenceKey(occ) }]);
    expect(put.tombstones).toEqual(incoming.tombstones);
    expect(stats).toEqual({ added: 0, updated: 0, kept: 4, deleted: 1 });
  });

  it('keeps a record changed here after it was deleted elsewhere', () => {
    const current = dataset();
    const [occ] = current.occurrences;
    if (!occ) throw new Error('fixture');
    occ.updatedAt = '2026-11-06T10:00:00.000Z';
    const incoming = dataset();
    incoming.occurrences = [];
    incoming.tombstones = [tomb('occurrences', occurrenceKey(occ))];

    const { put, drop } = mergeDatasets(current, incoming);
    expect(drop).toEqual([]);
    expect(put.tombstones).toEqual([]);
  });

  it('does not bring back a record deleted here', () => {
    const current = dataset();
    const [, occ] = current.occurrences;
    if (!occ) throw new Error('fixture');
    current.occurrences = current.occurrences.slice(0, 1);
    current.tombstones = [tomb('occurrences', occurrenceKey(occ))];

    const { put, stats } = mergeDatasets(current, dataset());
    expect(put.occurrences).toEqual([]);
    expect(stats.kept).toBe(5);
  });

  it('lets a deletion win over a change made at the same moment', () => {
    const incoming = dataset();
    incoming.occurrences = [];
    incoming.tombstones = dataset().occurrences.map((o) =>
      tomb('occurrences', occurrenceKey(o), T0),
    );
    expect(mergeDatasets(dataset(), incoming).stats.deleted).toBe(2);
  });

  it('deletes the payments of a bill deleted elsewhere', () => {
    const current = dataset();
    current.occurrences.push({
      billId: 'b1',
      periodKey: '2026-11',
      amount: 5000,
      updatedAt: '2026-11-06T10:00:00.000Z',
    });
    const incoming = withoutBill();
    incoming.tombstones = [tomb('bills', 'b1')];

    const { put, drop, stats } = mergeDatasets(current, incoming);
    expect(drop.map((r) => r.table)).toEqual([
      'bills',
      'occurrences',
      'occurrences',
      'occurrences',
    ]);
    expect(put.tombstones).toEqual([tomb('bills', 'b1')]);
    expect(stats.deleted).toBe(4);
  });

  it('does not take payments of a bill deleted here', () => {
    const current = withoutBill();
    current.tombstones = [tomb('bills', 'b1')];
    const incoming = dataset();
    const [occ] = incoming.occurrences;
    if (!occ) throw new Error('fixture');
    occ.updatedAt = '2026-11-06T10:00:00.000Z';

    const { put } = mergeDatasets(current, incoming);
    expect(put.bills).toEqual([]);
    expect(put.occurrences).toEqual([]);
  });

  it('brings back a section deleted here that a new bill elsewhere uses', () => {
    const current = withoutBill();
    current.sections = [];
    current.tombstones = [tomb('sections', 's1')];
    const incoming = dataset();
    const [b] = incoming.bills;
    if (!b) throw new Error('fixture');
    b.updatedAt = '2026-11-06T10:00:00.000Z';

    const { put } = mergeDatasets(current, incoming);
    expect(put.sections.map((s) => s.id)).toEqual(['s1']);
    expect(put.bills.map((x) => x.id)).toEqual(['b1']);
  });

  it('keeps a section deleted elsewhere that a bill here uses', () => {
    const incoming = withoutBill();
    incoming.sections = [];
    incoming.tombstones = [tomb('sections', 's1')];

    const { put, drop } = mergeDatasets(dataset(), incoming);
    expect(drop).toEqual([]);
    expect(put.tombstones).toEqual([]);
  });
});
