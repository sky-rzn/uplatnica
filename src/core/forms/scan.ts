import type { Bill, ReferenceModel } from '../model';
import type { Para } from '../money';
import { formatAccountShort } from '../serbia/account';
import type { ParsedIpsQr } from '../serbia/ipsQr';
import { isValidModel97 } from '../serbia/reference';
import { cyrillicToLatin } from '../serbia/translit';
import type { BillDraft } from './bill';
import type { OccurrenceDraft } from './occurrence';

/** What the scanned code says that the form did not take over. */
export type ScanNote =
  | { code: 'account'; scanned: string; current: string }
  | { code: 'model'; scanned: string; current: string }
  | { code: 'unsupported-model'; model: string }
  | { code: 'payment-code'; scanned: string; current: string }
  | { code: 'no-amount' }
  | { code: 'payee-reference'; value: string };

export interface ScanResult<T> {
  draft: T;
  notes: ScanNote[];
}

const MODELS: readonly string[] = ['97', '11', ''];

function isModel(m: string): m is ReferenceModel {
  return MODELS.includes(m);
}

export function applyScanToOccurrence(
  draft: OccurrenceDraft,
  bill: Bill,
  qr: ParsedIpsQr,
  formatAmount: (p: Para) => string,
): ScanResult<OccurrenceDraft> {
  const next = { ...draft };
  const notes: ScanNote[] = [];
  if (qr.amount > 0) next.amount = formatAmount(qr.amount);
  else notes.push({ code: 'no-amount' });

  const model = bill.model ?? '';
  if (qr.reference !== undefined) {
    const scanned = qr.model ?? '';
    if (scanned === model) next.reference = qr.reference;
    else notes.push({ code: 'model', scanned, current: model });
  }
  if (qr.payeeReference !== undefined)
    notes.push({ code: 'payee-reference', value: qr.payeeReference });
  if (qr.account !== bill.payee.account)
    notes.push({
      code: 'account',
      scanned: qr.account,
      current: bill.payee.account,
    });
  if (qr.paymentCode !== bill.paymentCode)
    notes.push({
      code: 'payment-code',
      scanned: qr.paymentCode,
      current: bill.paymentCode,
    });
  return { draft: next, notes };
}

/** Fills the payee and payment fields; the schedule is left to the user. */
export function applyScanToBill(
  draft: BillDraft,
  qr: ParsedIpsQr,
  formatAmount: (p: Para) => string,
): ScanResult<BillDraft> {
  const next = { ...draft };
  const notes: ScanNote[] = [];
  const [name = '', ...address] = qr.payeeName.split('\n');
  next.payeeName = name;
  next.payeeAddress = address.join('\n');
  if (next.title.trim() === '') next.title = name;
  next.account = formatAccountShort(qr.account);
  next.paymentCode = qr.paymentCode;
  if (qr.purpose !== undefined) next.purpose = qr.purpose;
  if (qr.amount > 0) next.amount = formatAmount(qr.amount);

  if (qr.reference !== undefined) {
    const model = qr.model ?? '';
    if (isModel(model)) {
      next.model = model;
      next.reference =
        model === '97' && isValidModel97(qr.reference)
          ? qr.reference.slice(2)
          : qr.reference;
      next.referenceVars = {};
    } else {
      notes.push({ code: 'unsupported-model', model });
    }
  }
  if (qr.payeeReference !== undefined)
    notes.push({ code: 'payee-reference', value: qr.payeeReference });
  return { draft: next, notes };
}

function nameKey(name: string): string {
  return cyrillicToLatin(name.split('\n')[0] ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export interface ScanMatch {
  bill: Bill;
  /** "name" means the payee matches but the account does not. */
  by: 'account' | 'name';
}

/** Active bills the code is likely for: same account first, then same payee name. */
export function matchScan(
  bills: readonly Bill[],
  qr: ParsedIpsQr,
): ScanMatch[] {
  const active = bills.filter((b) => !b.archived);
  const byAccount = active.filter((b) => b.payee.account === qr.account);
  const key = nameKey(qr.payeeName);
  const byName = active.filter(
    (b) =>
      b.payee.account !== qr.account &&
      key !== '' &&
      nameKey(b.payee.name) === key,
  );
  return [
    ...byAccount.map((bill) => ({ bill, by: 'account' as const })),
    ...byName.map((bill) => ({ bill, by: 'name' as const })),
  ];
}
