import { addDays, type IsoDate } from './date';
import type { Bill, Occurrence, Section } from './model';
import type { Para } from './money';
import {
  periodKeyBounds,
  resolveOccurrences,
  type ResolvedOccurrence,
} from './schedule';
import {
  computeStatus,
  effectiveAmount,
  remainingAmount,
  type Status,
} from './status';

export const AGENDA_AHEAD_DAYS = 45;

export interface AgendaItem {
  bill: Bill;
  section: Section;
  occ: ResolvedOccurrence;
  status: Exclude<Status, 'paid'>;
  amount: Para | undefined;
  /** What is left to pay: the amount less a short payment. */
  remaining: Para | undefined;
}

function firstDate(bill: Bill, stored: readonly Occurrence[]): IsoDate | null {
  const candidates: IsoDate[] = [];
  if (bill.schedule.kind === 'dates') candidates.push(...bill.schedule.dates);
  else candidates.push(`${bill.schedule.start}-01`);
  for (const o of stored) {
    const bounds = periodKeyBounds(o.periodKey);
    if (bounds) candidates.push(bounds.start);
  }
  return candidates.sort()[0] ?? null;
}

/**
 * Unpaid periods of active bills: all that are overdue or due now, and the
 * upcoming ones due within aheadDays. Sorted by due date.
 */
export function agendaItems(
  sections: readonly Section[],
  bills: readonly Bill[],
  occurrences: readonly Occurrence[],
  today: IsoDate,
  aheadDays: number = AGENDA_AHEAD_DAYS,
): AgendaItem[] {
  const active = new Map(
    sections.filter((s) => !s.archived).map((s) => [s.id, s]),
  );
  const byBill = new Map<string, Occurrence[]>();
  for (const o of occurrences) {
    const list = byBill.get(o.billId);
    if (list) list.push(o);
    else byBill.set(o.billId, [o]);
  }
  const until = addDays(today, aheadDays);
  const items: AgendaItem[] = [];
  for (const bill of bills) {
    const section = active.get(bill.sectionId);
    if (bill.archived || !section) continue;
    const stored = byBill.get(bill.id) ?? [];
    const from = firstDate(bill, stored);
    if (from === null || from > until) continue;
    for (const occ of resolveOccurrences(
      bill,
      stored,
      from,
      addDays(until, 1),
    )) {
      const status = computeStatus(bill, occ, today);
      if (status === 'paid' || (status === 'upcoming' && occ.dueDate > until))
        continue;
      items.push({
        bill,
        section,
        occ,
        status,
        amount: effectiveAmount(bill, occ),
        remaining: remainingAmount(bill, occ),
      });
    }
  }
  return items.sort(
    (a, b) =>
      (a.occ.dueDate < b.occ.dueDate
        ? -1
        : a.occ.dueDate > b.occ.dueDate
          ? 1
          : 0) || a.bill.title.localeCompare(b.bill.title),
  );
}

export interface AgendaTotal {
  count: number;
  /** Sum of the known remaining amounts. */
  sum: Para;
  /** Periods whose amount is not known yet. */
  unknown: number;
}

export type AgendaGroup = 'overdue' | 'now' | 'soon';

export function agendaGroup(status: AgendaItem['status']): AgendaGroup {
  switch (status) {
    case 'overdue':
      return 'overdue';
    case 'upcoming':
      return 'soon';
    default:
      return 'now';
  }
}

export function agendaTotals(
  items: readonly AgendaItem[],
): Record<AgendaGroup, AgendaTotal> {
  const totals: Record<AgendaGroup, AgendaTotal> = {
    overdue: { count: 0, sum: 0, unknown: 0 },
    now: { count: 0, sum: 0, unknown: 0 },
    soon: { count: 0, sum: 0, unknown: 0 },
  };
  for (const item of items) {
    const t = totals[agendaGroup(item.status)];
    t.count++;
    if (item.remaining === undefined) t.unknown++;
    else t.sum += item.remaining;
  }
  return totals;
}
