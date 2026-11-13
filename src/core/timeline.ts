import {
  diffDays,
  firstOfMonthIndex,
  fromMonthIndex,
  monthIndex,
  parseIsoDate,
  type IsoDate,
} from './date';
import type { Bill, Occurrence, Section } from './model';
import type { Para } from './money';
import { resolveOccurrences, type ResolvedOccurrence } from './schedule';
import { computeStatus, effectiveAmount, type Status } from './status';

export type Zoom = '6m' | '1y' | '3y';

const ZOOMS: Record<Zoom, { before: number; months: number; step: number }> = {
  '6m': { before: 1, months: 6, step: 3 },
  '1y': { before: 3, months: 12, step: 3 },
  '3y': { before: 12, months: 36, step: 12 },
};

export interface TimelineRange {
  /** First day of the first month, inclusive. */
  from: IsoDate;
  /** First day after the last month, exclusive. */
  to: IsoDate;
  days: number;
}

/**
 * The visible months: a few before the current month, the rest after it.
 * shift moves the window by whole steps of the zoom.
 */
export function timelineRange(
  zoom: Zoom,
  today: IsoDate,
  shift = 0,
): TimelineRange {
  const ymd = parseIsoDate(today);
  if (!ymd) throw new RangeError(`Invalid date: ${today}`);
  const z = ZOOMS[zoom];
  const first = monthIndex(ymd.year, ymd.month) - z.before + shift * z.step;
  const from = firstOfMonthIndex(first);
  const to = firstOfMonthIndex(first + z.months);
  return { from, to, days: diffDays(to, from) };
}

export interface MonthColumn {
  year: number;
  month: number;
  /** Day offset from range.from, inclusive. */
  start: number;
  end: number;
}

export function monthColumns(range: TimelineRange): MonthColumn[] {
  const ymd = parseIsoDate(range.from);
  if (!ymd) throw new RangeError(`Invalid date: ${range.from}`);
  const result: MonthColumn[] = [];
  for (let idx = monthIndex(ymd.year, ymd.month); ; idx++) {
    const start = firstOfMonthIndex(idx);
    if (start >= range.to) break;
    result.push({
      ...fromMonthIndex(idx),
      start: diffDays(start, range.from),
      end: diffDays(firstOfMonthIndex(idx + 1), range.from),
    });
  }
  return result;
}

export interface YearColumn {
  year: number;
  start: number;
  end: number;
}

export function yearColumns(months: readonly MonthColumn[]): YearColumn[] {
  const result: YearColumn[] = [];
  for (const m of months) {
    const last = result.at(-1);
    if (last?.year === m.year) last.end = m.end;
    else result.push({ year: m.year, start: m.start, end: m.end });
  }
  return result;
}

export interface Block {
  occ: ResolvedOccurrence;
  status: Status;
  amount: Para | undefined;
  /** Day offsets from range.from, clipped to the range; end is exclusive. */
  start: number;
  end: number;
  clippedStart: boolean;
  clippedEnd: boolean;
  /** Overlapping blocks, which only stale records produce, go to lower lanes. */
  lane: number;
}

export interface BillRow {
  bill: Bill;
  blocks: Block[];
  lanes: number;
  /** Sum of known amounts of the periods due within the range. */
  total: Para;
  /** Periods due within the range whose amount is not known yet. */
  unknown: number;
}

function assignLanes(blocks: readonly Block[]): number {
  const ordered = [...blocks].sort(
    (a, b) =>
      Number(a.occ.outOfSchedule) - Number(b.occ.outOfSchedule) ||
      a.start - b.start,
  );
  const placed: Block[] = [];
  let lanes = 1;
  for (const block of ordered) {
    let lane = 0;
    while (
      placed.some(
        (o) => o.lane === lane && o.start < block.end && block.start < o.end,
      )
    )
      lane++;
    block.lane = lane;
    lanes = Math.max(lanes, lane + 1);
    placed.push(block);
  }
  return lanes;
}

export function billRow(
  bill: Bill,
  stored: readonly Occurrence[],
  range: TimelineRange,
  today: IsoDate,
): BillRow {
  const blocks = resolveOccurrences(bill, stored, range.from, range.to).map(
    (occ): Block => {
      const start = diffDays(occ.start, range.from);
      const end = diffDays(occ.end, range.from);
      return {
        occ,
        status: computeStatus(bill, occ, today),
        amount: effectiveAmount(bill, occ),
        start: Math.max(0, start),
        end: Math.min(range.days, end),
        clippedStart: start < 0,
        clippedEnd: end > range.days,
        lane: 0,
      };
    },
  );
  const lanes = assignLanes(blocks);
  let total = 0;
  let unknown = 0;
  for (const b of blocks) {
    if (b.occ.dueDate < range.from || b.occ.dueDate >= range.to) continue;
    if (b.amount === undefined) unknown++;
    else total += b.amount;
  }
  return { bill, blocks, lanes, total, unknown };
}

/** Day offset of today, or null when today is outside the range. */
export function todayOffset(
  range: TimelineRange,
  today: IsoDate,
): number | null {
  return today >= range.from && today < range.to
    ? diffDays(today, range.from)
    : null;
}

export interface TimelineFilter {
  sectionId?: string | undefined;
  profileId?: string | undefined;
  /** Keeps only bills with a period in the range that is not paid. */
  unpaidOnly?: boolean;
}

export interface SectionGroup {
  section: Section;
  rows: BillRow[];
}

/** Active bills by section, in section order and then by title. */
export function timelineGroups(
  sections: readonly Section[],
  bills: readonly Bill[],
  occurrences: readonly Occurrence[],
  range: TimelineRange,
  today: IsoDate,
  filter: TimelineFilter = {},
): SectionGroup[] {
  const byBill = new Map<string, Occurrence[]>();
  for (const o of occurrences) {
    const list = byBill.get(o.billId);
    if (list) list.push(o);
    else byBill.set(o.billId, [o]);
  }
  return [...sections]
    .filter(
      (s) =>
        !s.archived &&
        (filter.sectionId === undefined || s.id === filter.sectionId),
    )
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      section,
      rows: bills
        .filter(
          (b) =>
            !b.archived &&
            b.sectionId === section.id &&
            (filter.profileId === undefined ||
              b.profileId === filter.profileId),
        )
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((b) => billRow(b, byBill.get(b.id) ?? [], range, today))
        .filter(
          (row) =>
            !filter.unpaidOnly || row.blocks.some((b) => b.status !== 'paid'),
        ),
    }))
    .filter((g) => g.rows.length > 0);
}
