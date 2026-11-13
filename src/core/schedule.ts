import {
  addDays,
  daysInMonth,
  firstOfMonthIndex,
  fromMonthIndex,
  isIsoDate,
  isoDate,
  monthIndex,
  pad,
  parseIsoDate,
  parseYearMonth,
  type IsoDate,
} from './date';
import { nextWorkday } from './holidays';
import type { Bill, DueRule, EveryMonths, Occurrence, Schedule } from './model';

export interface Period {
  periodKey: string;
  /** Inclusive. */
  start: IsoDate;
  /** Exclusive. */
  end: IsoDate;
  /** Due date before the shift to a working day. */
  nominalDue: IsoDate;
  dueDate: IsoDate;
}

export interface VirtualOccurrence extends Period {
  billId: string;
}

export interface ResolvedOccurrence extends VirtualOccurrence {
  stored?: Occurrence;
  /** The stored record no longer matches any period of the schedule. */
  outOfSchedule: boolean;
}

export function periodKey(
  everyMonths: EveryMonths,
  startIndex: number,
): string {
  const { year, month } = fromMonthIndex(startIndex);
  if (everyMonths === 3 && month % 3 === 1)
    return `${pad(year, 4)}-Q${String((month + 2) / 3)}`;
  if (everyMonths === 12 && month === 1) return pad(year, 4);
  return `${pad(year, 4)}-${pad(month)}`;
}

/** Calendar bounds a period key names on its own, without a schedule. */
export function periodKeyBounds(
  key: string,
): { start: IsoDate; end: IsoDate } | null {
  let m: RegExpExecArray | null;
  if (isIsoDate(key)) return { start: key, end: addDays(key, 1) };
  if ((m = /^(\d{4})-Q([1-4])$/.exec(key))) {
    const idx = monthIndex(Number(m[1]), Number(m[2]) * 3 - 2);
    return { start: firstOfMonthIndex(idx), end: firstOfMonthIndex(idx + 3) };
  }
  if ((m = /^(\d{4})$/.exec(key))) {
    const idx = monthIndex(Number(m[1]), 1);
    return { start: firstOfMonthIndex(idx), end: firstOfMonthIndex(idx + 12) };
  }
  const ym = parseYearMonth(key);
  if (ym) {
    const idx = monthIndex(ym.year, ym.month);
    return { start: firstOfMonthIndex(idx), end: firstOfMonthIndex(idx + 1) };
  }
  return null;
}

export function dueDateFor(rule: DueRule, startIndex: number): IsoDate {
  if ('daysFromStart' in rule) {
    if (!Number.isInteger(rule.daysFromStart) || rule.daysFromStart < 0) {
      throw new RangeError(
        `Invalid daysFromStart: ${String(rule.daysFromStart)}`,
      );
    }
    return addDays(firstOfMonthIndex(startIndex), rule.daysFromStart);
  }
  const offset = rule.monthOffset ?? 0;
  if (!Number.isInteger(offset))
    throw new RangeError(`Invalid monthOffset: ${String(offset)}`);
  const { year, month } = fromMonthIndex(startIndex + offset);
  const last = daysInMonth(year, month);
  if (rule.day === 'last') return isoDate(year, month, last);
  if (!Number.isInteger(rule.day) || rule.day < 1 || rule.day > 31) {
    throw new RangeError(`Invalid due day: ${String(rule.day)}`);
  }
  return isoDate(year, month, Math.min(rule.day, last));
}

type Periodic = Extract<Schedule, { kind: 'periodic' }>;

function periodicBounds(
  schedule: Periodic,
): { first: number; last: number } | null {
  const start = parseYearMonth(schedule.start);
  if (!start) throw new RangeError(`Invalid schedule start: ${schedule.start}`);
  const first = monthIndex(start.year, start.month);
  if (schedule.end === undefined) return { first, last: Infinity };
  const end = parseYearMonth(schedule.end);
  if (!end) throw new RangeError(`Invalid schedule end: ${schedule.end}`);
  const last = monthIndex(end.year, end.month);
  return last < first ? null : { first, last };
}

function periodicPeriod(schedule: Periodic, startIndex: number): Period {
  const nominalDue = dueDateFor(schedule.due, startIndex);
  return {
    periodKey: periodKey(schedule.everyMonths, startIndex),
    start: firstOfMonthIndex(startIndex),
    end: firstOfMonthIndex(startIndex + schedule.everyMonths),
    nominalDue,
    dueDate: schedule.shiftToWorkday ? nextWorkday(nominalDue) : nominalDue,
  };
}

function datePeriods(dates: readonly IsoDate[]): Period[] {
  const sorted = [...new Set(dates)].sort();
  return sorted.map((date, i) => {
    if (!isIsoDate(date)) throw new RangeError(`Invalid date: ${date}`);
    const prev = sorted[i - 1];
    const start =
      prev !== undefined ? addDays(prev, 1) : `${date.slice(0, 7)}-01`;
    return {
      periodKey: date,
      start,
      end: addDays(date, 1),
      nominalDue: date,
      dueDate: date,
    };
  });
}

function overlaps(
  p: { start: IsoDate; end: IsoDate },
  from: IsoDate,
  to: IsoDate,
): boolean {
  return p.start < to && p.end > from;
}

/** Periods of the schedule whose span intersects [from, to). */
export function periods(
  schedule: Schedule,
  from: IsoDate,
  to: IsoDate,
): Period[] {
  if (schedule.kind === 'dates') {
    return datePeriods(schedule.dates).filter((p) => overlaps(p, from, to));
  }
  const bounds = periodicBounds(schedule);
  if (!bounds) return [];
  const fromYmd = parseIsoDate(from);
  if (!fromYmd) throw new RangeError(`Invalid date: ${from}`);
  const every = schedule.everyMonths;
  const skip = Math.max(
    0,
    Math.floor(
      (monthIndex(fromYmd.year, fromYmd.month) - bounds.first) / every,
    ),
  );
  const result: Period[] = [];
  for (
    let idx = bounds.first + skip * every;
    idx <= bounds.last;
    idx += every
  ) {
    const p = periodicPeriod(schedule, idx);
    if (p.start >= to) break;
    if (overlaps(p, from, to)) result.push(p);
  }
  return result;
}

export function expand(
  bill: Bill,
  from: IsoDate,
  to: IsoDate,
): VirtualOccurrence[] {
  return periods(bill.schedule, from, to).map((p) => ({
    ...p,
    billId: bill.id,
  }));
}

/** The schedule period a key names, or null when the key is not part of it. */
export function findPeriod(schedule: Schedule, key: string): Period | null {
  if (schedule.kind === 'dates') {
    return datePeriods(schedule.dates).find((p) => p.periodKey === key) ?? null;
  }
  const bounds = periodicBounds(schedule);
  const keyBounds = periodKeyBounds(key);
  if (!bounds || !keyBounds) return null;
  const ymd = parseIsoDate(keyBounds.start);
  if (!ymd) return null;
  const idx = monthIndex(ymd.year, ymd.month);
  if (
    idx < bounds.first ||
    idx > bounds.last ||
    (idx - bounds.first) % schedule.everyMonths !== 0
  ) {
    return null;
  }
  const p = periodicPeriod(schedule, idx);
  return p.periodKey === key ? p : null;
}

/**
 * Joins the computed periods in [from, to) with the stored overrides.
 * Stored records whose period the schedule no longer produces are kept and
 * flagged, so a paid period never disappears after a schedule edit.
 */
export function resolveOccurrences(
  bill: Bill,
  stored: readonly Occurrence[],
  from: IsoDate,
  to: IsoDate,
): ResolvedOccurrence[] {
  const byKey = new Map<string, Occurrence>();
  for (const o of stored) if (o.billId === bill.id) byKey.set(o.periodKey, o);

  const result: ResolvedOccurrence[] = expand(bill, from, to).map((v) => {
    const o = byKey.get(v.periodKey);
    if (!o) return { ...v, outOfSchedule: false };
    return {
      ...v,
      dueDate: o.dueDate ?? v.dueDate,
      stored: o,
      outOfSchedule: false,
    };
  });

  for (const o of byKey.values()) {
    if (findPeriod(bill.schedule, o.periodKey)) continue;
    const bounds = periodKeyBounds(o.periodKey);
    if (!bounds || !overlaps(bounds, from, to)) continue;
    const due = o.dueDate ?? addDays(bounds.end, -1);
    result.push({
      billId: bill.id,
      periodKey: o.periodKey,
      ...bounds,
      nominalDue: due,
      dueDate: due,
      stored: o,
      outOfSchedule: true,
    });
  }

  return result.sort((a, b) =>
    a.start < b.start ? -1 : a.start > b.start ? 1 : 0,
  );
}
