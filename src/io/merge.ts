import type { Dataset, Stored } from '../db/schema';

export function occurrenceKey(o: {
  billId: string;
  periodKey: string;
}): string {
  return JSON.stringify([o.billId, o.periodKey]);
}

export interface MergeStats {
  added: number;
  updated: number;
  /** Records kept as they are because the stored copy is as new or newer. */
  kept: number;
}

function mergeTable<T>(
  current: readonly Stored<T>[],
  incoming: readonly Stored<T>[],
  key: (r: T) => string,
  stats: MergeStats,
): Stored<T>[] {
  const byKey = new Map(current.map((r) => [key(r), r]));
  return incoming.filter((r) => {
    const cur = byKey.get(key(r));
    if (!cur) stats.added++;
    else if (Date.parse(r.updatedAt) > Date.parse(cur.updatedAt))
      stats.updated++;
    else {
      stats.kept++;
      return false;
    }
    return true;
  });
}

/**
 * The incoming records to write: new ones and those changed later than the
 * stored copy. Records only the current data holds stay untouched.
 */
export function mergeDatasets(
  current: Dataset,
  incoming: Dataset,
): { put: Dataset; stats: MergeStats } {
  const stats: MergeStats = { added: 0, updated: 0, kept: 0 };
  const put: Dataset = {
    profiles: mergeTable(
      current.profiles,
      incoming.profiles,
      (p) => p.id,
      stats,
    ),
    sections: mergeTable(
      current.sections,
      incoming.sections,
      (s) => s.id,
      stats,
    ),
    bills: mergeTable(current.bills, incoming.bills, (b) => b.id, stats),
    occurrences: mergeTable(
      current.occurrences,
      incoming.occurrences,
      occurrenceKey,
      stats,
    ),
  };
  return { put, stats };
}
