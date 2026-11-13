import { mod97, mod97Control } from './mod97';

export type AccountError = 'format' | 'checksum';

export type AccountResult =
  { ok: true; value: string } | { ok: false; error: AccountError };

/**
 * Normalizes "160-602-16", "160-0000000000602-16" or an 18-digit string to
 * 18 digits. Leading zeros may be omitted only in the middle part.
 */
export function normalizeAccount(input: string): AccountResult {
  const s = input.replace(/\s+/g, '');
  let digits: string;
  if (/^\d{18}$/.test(s)) {
    digits = s;
  } else {
    const m = /^(\d{3})-(\d{1,13})-(\d{2})$/.exec(s);
    if (!m) return { ok: false, error: 'format' };
    digits = `${m[1] ?? ''}${(m[2] ?? '').padStart(13, '0')}${m[3] ?? ''}`;
  }
  return isValidAccount(digits)
    ? { ok: true, value: digits }
    : { ok: false, error: 'checksum' };
}

export function accountControl(first16: string): string {
  if (!/^\d{16}$/.test(first16))
    throw new RangeError(`Expected 16 digits: ${first16}`);
  return mod97Control(first16);
}

export function isValidAccount(digits: string): boolean {
  return /^\d{18}$/.test(digits) && mod97(digits) === 1;
}

/** "160-0000000000602-16" */
export function formatAccount(digits: string): string {
  return `${digits.slice(0, 3)}-${digits.slice(3, 16)}-${digits.slice(16)}`;
}

/** "160-602-16" */
export function formatAccountShort(digits: string): string {
  return `${digits.slice(0, 3)}-${digits.slice(3, 16).replace(/^0+(?=\d)/, '')}-${digits.slice(16)}`;
}
