import { addDays, type IsoDate } from './date';
import type { Bill } from './model';
import type { Para } from './money';
import type { ResolvedOccurrence } from './schedule';

export type Status =
  'paid' | 'partial' | 'overdue' | 'awaiting-amount' | 'due' | 'upcoming';

export const DEFAULT_HORIZON_DAYS = 14;

export function effectiveAmount(
  bill: Bill,
  occ: ResolvedOccurrence,
): Para | undefined {
  return (
    occ.stored?.amount ??
    (bill.amountMode === 'fixed' ? bill.amount : undefined)
  );
}

/** The amount less a short payment; undefined while the amount is unknown. */
export function remainingAmount(
  bill: Bill,
  occ: ResolvedOccurrence,
): Para | undefined {
  const amount = effectiveAmount(bill, occ);
  if (amount === undefined) return undefined;
  const paid =
    occ.stored?.paidAt !== undefined ? (occ.stored.paidAmount ?? 0) : 0;
  return amount - paid;
}

export function computeStatus(
  bill: Bill,
  occ: ResolvedOccurrence,
  today: IsoDate,
  horizonDays: number = DEFAULT_HORIZON_DAYS,
): Status {
  const amount = effectiveAmount(bill, occ);
  const stored = occ.stored;
  if (stored?.paidAt !== undefined) {
    const short =
      stored.paidAmount !== undefined &&
      amount !== undefined &&
      stored.paidAmount < amount;
    if (!short) return 'paid';
  }
  if (today > addDays(occ.dueDate, bill.graceDays ?? 0)) return 'overdue';
  if (stored?.paidAt !== undefined) return 'partial';

  const current = occ.start <= today && today < occ.end;
  if (!current && occ.dueDate > addDays(today, horizonDays)) return 'upcoming';
  return amount === undefined ? 'awaiting-amount' : 'due';
}
