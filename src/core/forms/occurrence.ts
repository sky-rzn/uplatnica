import { addDays, isIsoDate, type IsoDate } from '../date';
import type { Bill, Occurrence, Profile } from '../model';
import { parseAmount, type Para } from '../money';
import { findPeriod, type ResolvedOccurrence } from '../schedule';
import { effectiveAmount } from '../status';
import {
  buildReference,
  cleanReference,
  validateReference,
} from '../serbia/reference';
import type { FormResult, Issues } from './issues';

export interface OccurrenceDraft {
  /** Empty means the bill's fixed amount, or not known yet. */
  amount: string;
  dueDate: string;
  /** Empty means the one rendered from the bill's template. */
  reference: string;
  paidAt: string;
  /** Empty means the whole amount. */
  paidAmount: string;
  note: string;
}

export interface OccurrenceContext {
  bill: Bill;
  occ: ResolvedOccurrence;
  profile: Profile | undefined;
  today: IsoDate;
}

/** save keeps the payment as it is; pay records it; unpay drops it. */
export type OccurrenceAction = 'save' | 'pay' | 'unpay';

/** The poziv na broj the bill's template gives for a period, if it renders. */
export function periodReference(
  bill: Bill,
  profile: Profile | undefined,
  periodStart: IsoDate,
): string | undefined {
  if (bill.referenceTemplate === undefined) return undefined;
  const result = buildReference(bill.model ?? '', bill.referenceTemplate, {
    vars: { JMBG: profile?.jmbg, PIB: profile?.pib, ...bill.referenceVars },
    periodStart,
  });
  return result.ok ? result.value : undefined;
}

/** The due date the schedule gives, before any override. */
export function scheduledDueDate(bill: Bill, occ: ResolvedOccurrence): IsoDate {
  return (
    findPeriod(bill.schedule, occ.periodKey)?.dueDate ?? addDays(occ.end, -1)
  );
}

export function occurrenceToDraft(
  ctx: OccurrenceContext,
  formatAmount: (p: Para) => string,
): OccurrenceDraft {
  const { occ, today } = ctx;
  const s = occ.stored;
  return {
    amount: s?.amount !== undefined ? formatAmount(s.amount) : '',
    dueDate: occ.dueDate,
    reference:
      s?.reference ?? periodReference(ctx.bill, ctx.profile, occ.start) ?? '',
    paidAt: s?.paidAt ?? today,
    paidAmount: s?.paidAmount !== undefined ? formatAmount(s.paidAmount) : '',
    note: s?.note ?? '',
  };
}

function readAmount(
  name: string,
  input: string,
  errors: Issues,
): Para | undefined {
  if (input.trim() === '') return undefined;
  const para = parseAmount(input);
  if (para === null || para === 0) {
    errors[name] = { code: 'amount' };
    return undefined;
  }
  return para;
}

export function validateOccurrence(
  d: OccurrenceDraft,
  ctx: OccurrenceContext,
  action: OccurrenceAction,
): FormResult<Occurrence> {
  const { bill, occ } = ctx;
  const errors: Issues = {};
  const model = bill.model ?? '';

  const amount = readAmount('amount', d.amount, errors);

  const dueDate = d.dueDate.trim();
  if (!isIsoDate(dueDate)) errors.dueDate = { code: 'date' };

  const reference = cleanReference(model, d.reference);
  const defaultReference = periodReference(bill, ctx.profile, occ.start);
  if (reference !== '') {
    const reason = validateReference(model, reference);
    if (reason) errors.reference = { code: 'reference', reason };
  } else if (model !== '' && defaultReference === undefined) {
    errors.reference = { code: 'required' };
  }

  const recordPayment =
    action === 'pay' || (action === 'save' && occ.stored?.paidAt !== undefined);
  let paidAt: IsoDate | undefined;
  let paidAmount: Para | undefined;
  if (recordPayment) {
    paidAt = d.paidAt.trim();
    if (!isIsoDate(paidAt)) errors.paidAt = { code: 'date' };
    paidAmount = readAmount('paidAmount', d.paidAmount, errors);
  }

  if (Object.keys(errors).length > 0)
    return { value: null, errors, warnings: {} };

  const result: Occurrence = { billId: bill.id, periodKey: occ.periodKey };
  if (
    amount !== undefined &&
    !(bill.amountMode === 'fixed' && amount === bill.amount)
  )
    result.amount = amount;
  if (dueDate !== scheduledDueDate(bill, occ)) result.dueDate = dueDate;
  if (reference !== '' && reference !== defaultReference)
    result.reference = reference;
  if (paidAt !== undefined) {
    result.paidAt = paidAt;
    const due = effectiveAmount(bill, { ...occ, stored: result });
    const paid = paidAmount ?? due;
    if (paid !== undefined) result.paidAmount = paid;
  }
  const note = d.note.trim();
  if (note !== '') result.note = note;
  return { value: result, errors, warnings: {} };
}
