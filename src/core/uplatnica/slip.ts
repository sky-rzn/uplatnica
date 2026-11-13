import { periodReference } from '../forms/occurrence';
import type { Bill, Profile } from '../model';
import { formatAmount, type Para } from '../money';
import type { ResolvedOccurrence } from '../schedule';
import { formatAccount, normalizeAccount } from '../serbia/account';
import { buildIpsQr, checkQrText, type BuildResult } from '../serbia/ipsQr';
import { effectiveAmount, remainingAmount } from '../status';

/** Prilog 2: payer, purpose and payee take 3 lines of 35 characters. */
export const SLIP_LINE_CHARS = 35;
export const SLIP_LINES = 3;

export interface SlipData {
  payer: string[];
  purpose: string[];
  payee: string[];
  paymentCode: string;
  currency: string;
  /** "=1.287,60", or "" while the amount is unknown. */
  amount: string;
  account: string;
  model: string;
  reference: string;
}

export interface SlipInput {
  bill: Bill;
  profile: Profile | undefined;
  amount: Para | undefined;
  reference: string | undefined;
}

export type SlipWarning = 'no-amount' | 'overflow';

export interface Slip {
  data: SlipData;
  /** null while the amount is unknown: a code without one is useless. */
  qr: BuildResult | null;
  warnings: SlipWarning[];
}

/**
 * Wraps text at word boundaries into lines of at most `width` characters,
 * keeping the line breaks already there. Words longer than a line are cut.
 */
export function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\r\n|\r|\n/)) {
    let line = '';
    for (let word of para.trim().split(/\s+/)) {
      if (word === '') continue;
      while (word.length > width) {
        if (line !== '') lines.push(line);
        lines.push(word.slice(0, width));
        word = word.slice(width);
        line = '';
      }
      if (line === '') line = word;
      else if (line.length + 1 + word.length <= width) line += ` ${word}`;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line !== '') lines.push(line);
  }
  return lines;
}

/**
 * What the slip for a period carries: what is left to pay, or the whole
 * amount again once the period is paid, and the period's reference.
 */
export function slipInput(
  bill: Bill,
  occ: ResolvedOccurrence,
  profile: Profile | undefined,
): SlipInput {
  const rest = remainingAmount(bill, occ);
  return {
    bill,
    profile,
    amount: rest !== undefined && rest > 0 ? rest : effectiveAmount(bill, occ),
    reference:
      occ.stored?.reference ?? periodReference(bill, profile, occ.start),
  };
}

function block(text: string, overflow: { value: boolean }): string[] {
  const lines = wrapText(text, SLIP_LINE_CHARS);
  if (lines.length > SLIP_LINES) overflow.value = true;
  return lines.slice(0, SLIP_LINES);
}

export function buildSlip(input: SlipInput): Slip {
  const { bill, profile, amount } = input;
  const reference = input.reference ?? '';
  const payerText = profile
    ? [profile.name, profile.address].filter((s) => s.trim() !== '').join('\n')
    : '';
  const payeeText = [bill.payee.name, bill.payee.address ?? '']
    .filter((s) => s.trim() !== '')
    .join('\n');
  const account = normalizeAccount(bill.payee.account);
  const overflow = { value: false };

  const data: SlipData = {
    payer: block(payerText, overflow),
    purpose: block(bill.purpose, overflow),
    payee: block(payeeText, overflow),
    paymentCode: bill.paymentCode,
    currency: bill.currency,
    amount: amount === undefined ? '' : `=${formatAmount(amount)}`,
    account: account.ok ? formatAccount(account.value) : bill.payee.account,
    model: reference === '' ? '' : (bill.model ?? ''),
    reference,
  };

  const warnings: SlipWarning[] = [];
  if (amount === undefined) warnings.push('no-amount');
  if (overflow.value) warnings.push('overflow');

  const qrPayer =
    checkQrText('P', payerText).length === 0
      ? payerText
      : (profile?.name ?? '');
  const qr =
    amount === undefined
      ? null
      : buildIpsQr({
          account: bill.payee.account,
          payeeName: bill.payee.name,
          amount,
          paymentCode: bill.paymentCode,
          purpose: bill.purpose,
          ...(qrPayer !== '' ? { payer: qrPayer } : {}),
          ...(reference !== '' ? { model: bill.model ?? '', reference } : {}),
        });
  return { data, qr, warnings };
}
