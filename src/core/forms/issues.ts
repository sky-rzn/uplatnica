import type { ReferenceError } from '../serbia/reference';

export type Issue =
  | { code: 'required' }
  | { code: 'too-long'; max: number }
  | { code: 'chars' }
  | { code: 'integer'; min: number; max: number }
  | { code: 'not-found' }
  | { code: 'color' }
  | { code: 'account-format' }
  | { code: 'account-checksum' }
  | { code: 'jmbg-format' }
  | { code: 'jmbg-checksum' }
  | { code: 'pib-format' }
  | { code: 'pib-checksum' }
  | { code: 'payer-too-long' }
  | { code: 'payment-code' }
  | { code: 'payment-code-not-qr' }
  | { code: 'amount' }
  | { code: 'month' }
  | { code: 'date' }
  | { code: 'end-before-start' }
  | { code: 'no-dates' }
  | { code: 'reference'; reason: ReferenceError }
  | { code: 'template-syntax' }
  | { code: 'template-too-long'; width: number }
  | { code: 'profile-missing'; field: 'JMBG' | 'PIB' }
  | { code: 'model97-has-control' };

/** Field name to issue; dynamic fields look like "dates.2" or "referenceVars.NAPLATNI". */
export type Issues = Record<string, Issue>;

export interface FormResult<T> {
  value: T | null;
  errors: Issues;
  warnings: Issues;
}

export function parseInteger(
  s: string,
  min: number,
  max: number,
): number | Issue {
  const t = s.trim();
  if (!/^-?\d+$/.test(t)) return { code: 'integer', min, max };
  const n = Number(t);
  return n < min || n > max ? { code: 'integer', min, max } : n;
}
