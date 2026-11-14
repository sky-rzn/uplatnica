import type { Bill, Occurrence, Profile, Section } from '../core/model';
import type { Dataset, Stored, TableName, Tombstone } from '../db/schema';

export function occurrenceKey(o: {
  billId: string;
  periodKey: string;
}): string {
  return JSON.stringify([o.billId, o.periodKey]);
}

export interface RecordRef {
  table: TableName;
  key: string;
}

export interface MergeStats {
  added: number;
  updated: number;
  /** Incoming records not taken because the stored copy is as new or newer. */
  kept: number;
  /** Stored records deleted because another device deleted them later. */
  deleted: number;
}

export interface MergePlan {
  /** Records and tombstones to write. */
  put: Dataset;
  /** Stored records to delete without leaving a tombstone. */
  drop: RecordRef[];
  stats: MergeStats;
}

interface Slot<T> {
  cur?: Stored<T>;
  inc?: Stored<T>;
  curTomb?: Tombstone;
  incTomb?: Tombstone;
}

const time = Date.parse;

function newest<T>(
  a: T | undefined,
  b: T | undefined,
  at: (x: T) => string,
): T | undefined {
  if (!a || !b) return a ?? b;
  return time(at(b)) > time(at(a)) ? b : a;
}

function record<T>(s: Slot<T>): Stored<T> | undefined {
  return newest(s.cur, s.inc, (r) => r.updatedAt);
}

function tombstone<T>(s: Slot<T>): Tombstone | undefined {
  return newest(s.curTomb, s.incTomb, (t) => t.deletedAt);
}

/** A deletion wins over a change made at the same moment. */
function alive<T>(s: Slot<T>): boolean {
  const r = record(s);
  const t = tombstone(s);
  return !!r && (!t || time(r.updatedAt) > time(t.deletedAt));
}

class Table<T> {
  readonly slots = new Map<string, Slot<T> & { alive: boolean }>();

  constructor(
    readonly name: TableName,
    readonly key: (r: T) => string,
    current: Dataset,
    incoming: Dataset,
    rows: (d: Dataset) => readonly Stored<T>[],
  ) {
    const slot = (k: string) => {
      let s = this.slots.get(k);
      if (!s) this.slots.set(k, (s = { alive: false }));
      return s;
    };
    for (const r of rows(current)) slot(key(r)).cur = r;
    for (const r of rows(incoming)) slot(key(r)).inc = r;
    for (const t of current.tombstones)
      if (t.table === name) slot(t.key).curTomb = t;
    for (const t of incoming.tombstones)
      if (t.table === name) slot(t.key).incTomb = t;
    for (const s of this.slots.values()) s.alive = alive(s);
  }

  isAlive(k: string): boolean {
    return this.slots.get(k)?.alive ?? false;
  }

  /** Keeps a record a live one refers to, though it was deleted later. */
  revive(k: string): boolean {
    const s = this.slots.get(k);
    if (s && !s.alive && record(s)) s.alive = true;
    return s?.alive ?? false;
  }

  plan(put: Stored<T>[], plan: MergePlan): void {
    const { stats } = plan;
    for (const [key, s] of this.slots) {
      if (s.alive) {
        const r = record(s);
        if (r && r !== s.cur) {
          put.push(r);
          if (s.cur) stats.updated++;
          else stats.added++;
        } else if (s.inc) stats.kept++;
        continue;
      }
      if (s.inc) stats.kept++;
      if (s.cur) {
        plan.drop.push({ table: this.name, key });
        stats.deleted++;
      }
      const t = tombstone(s);
      if (t && t !== s.curTomb) plan.put.tombstones.push(t);
    }
  }
}

/**
 * What to write so that the stored data holds the newest version of every
 * record and deletion from both sides. Both devices reach the same data
 * after merging each other's: a bill keeps the section and payer it refers
 * to alive, and payments of a deleted bill go with it.
 */
export function mergeDatasets(current: Dataset, incoming: Dataset): MergePlan {
  const profiles = new Table<Profile>(
    'profiles',
    (p) => p.id,
    current,
    incoming,
    (d) => d.profiles,
  );
  const sections = new Table<Section>(
    'sections',
    (s) => s.id,
    current,
    incoming,
    (d) => d.sections,
  );
  const bills = new Table<Bill>(
    'bills',
    (b) => b.id,
    current,
    incoming,
    (d) => d.bills,
  );
  const occurrences = new Table<Occurrence>(
    'occurrences',
    occurrenceKey,
    current,
    incoming,
    (d) => d.occurrences,
  );

  for (const s of bills.slots.values()) {
    const b = s.alive && record(s);
    if (b && !(sections.revive(b.sectionId) && profiles.revive(b.profileId)))
      s.alive = false;
  }
  for (const s of occurrences.slots.values()) {
    const o = s.alive && record(s);
    if (o && !bills.isAlive(o.billId)) s.alive = false;
  }

  const plan: MergePlan = {
    put: {
      profiles: [],
      sections: [],
      bills: [],
      occurrences: [],
      tombstones: [],
    },
    drop: [],
    stats: { added: 0, updated: 0, kept: 0, deleted: 0 },
  };
  profiles.plan(plan.put.profiles, plan);
  sections.plan(plan.put.sections, plan);
  bills.plan(plan.put.bills, plan);
  occurrences.plan(plan.put.occurrences, plan);
  return plan;
}
