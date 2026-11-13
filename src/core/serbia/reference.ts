import { parseIsoDate, pad, type IsoDate } from '../date';
import { mod97, mod97Control } from './mod97';

export const MAX_REFERENCE_LENGTH = 23;

export type ReferenceError =
  'empty' | 'chars' | 'length' | 'structure' | 'checksum';

/** Strips what people type around a reference: spaces, and dashes for model 97. */
export function cleanReference(model: string, input: string): string {
  const s = input.replace(/\s+/g, '');
  return model === '97' ? s.replace(/-/g, '').toUpperCase() : s;
}

function lettersToDigits(s: string): string {
  return s.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
}

/** Prepends the model 97 control number to a reference body. */
export function computeModel97(body: string): string | null {
  const s = cleanReference('97', body);
  if (!/^[0-9A-Z]{1,21}$/.test(s)) return null;
  return mod97Control(lettersToDigits(s)) + s;
}

export function isValidModel97(ref: string): boolean {
  if (!/^\d{2}[0-9A-Z]{1,21}$/.test(ref)) return false;
  return mod97(lettersToDigits(ref.slice(2)) + ref.slice(0, 2)) === 1;
}

/** MOD 11 with weights 2, 3, 4, ... from the right, no cycle; 10 and 11 give 0. */
export function mod11Control(digits: string): string {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += Number(digits[digits.length - 1 - i]) * (i + 2);
  }
  const k = 11 - (sum % 11);
  return k >= 10 ? '0' : String(k);
}

/** Builds "(P1)K-(P2)K-P3" from the data parts. */
export function computeModel11(parts: readonly string[]): string | null {
  if (
    parts.length < 1 ||
    parts.length > 3 ||
    !parts.every((p) => /^\d+$/.test(p))
  )
    return null;
  return parts.map((p, i) => (i < 2 ? p + mod11Control(p) : p)).join('-');
}

export function isValidModel11(ref: string): boolean {
  if (!/^\d+(-\d+){0,2}$/.test(ref)) return false;
  const parts = ref.split('-');
  if (parts.join('').length > 20) return false;
  return parts.every(
    (p, i) =>
      i >= 2 || (p.length >= 2 && mod11Control(p.slice(0, -1)) === p.slice(-1)),
  );
}

/** Checks an already cleaned reference against its model. */
export function validateReference(
  model: string,
  ref: string,
): ReferenceError | null {
  if (ref === '') return 'empty';
  if (ref.length > MAX_REFERENCE_LENGTH) return 'length';
  switch (model) {
    case '97':
      if (!/^[0-9A-Z]+$/.test(ref)) return 'chars';
      if (!/^\d{2}./.test(ref)) return 'structure';
      return isValidModel97(ref) ? null : 'checksum';
    case '11':
      if (!/^[0-9-]+$/.test(ref)) return 'chars';
      if (!/^\d+(-\d+){0,2}$/.test(ref) || ref.replace(/-/g, '').length > 20)
        return 'structure';
      return isValidModel11(ref) ? null : 'checksum';
    default:
      return /^[A-Za-z0-9-]+$/.test(ref) ? null : 'chars';
  }
}

export interface TemplateContext {
  /** Values for {OPSTINA}, {JMBG}, {PIB} and custom placeholders. */
  vars: Readonly<Record<string, string | undefined>>;
  /** Start of the billing period; year, month and quarter come from here. */
  periodStart: IsoDate;
}

export type TemplateError =
  | { kind: 'syntax' }
  | { kind: 'missing'; name: string }
  | { kind: 'too-long'; name: string; width: number };

export type TemplateResult =
  { ok: true; value: string } | { ok: false; error: TemplateError };

const PLACEHOLDER = /\{([A-Z][A-Z0-9_]*)(?::(\d{1,2}))?\}/g;

/**
 * Expands "{OPSTINA}{JMBG}{YY}" or "{NAPLATNI:11}{YY}{MM}". ":n" pads the
 * value with leading zeros to n characters.
 */
export function renderTemplate(
  template: string,
  ctx: TemplateContext,
): TemplateResult {
  if (/[{}]/.test(template.replace(PLACEHOLDER, '')))
    return { ok: false, error: { kind: 'syntax' } };
  const period = parseIsoDate(ctx.periodStart);
  if (!period) throw new RangeError(`Invalid date: ${ctx.periodStart}`);
  const builtins: Record<string, string> = {
    YYYY: pad(period.year, 4),
    YY: pad(period.year % 100),
    MM: pad(period.month),
    Q: String(Math.ceil(period.month / 3)),
  };

  const errors: TemplateError[] = [];
  const value = template.replace(
    PLACEHOLDER,
    (_, name: string, widthStr: string | undefined) => {
      const raw = builtins[name] ?? ctx.vars[name]?.replace(/\s+/g, '');
      if (raw === undefined || raw === '') {
        errors.push({ kind: 'missing', name });
        return '';
      }
      if (widthStr === undefined) return raw;
      const width = Number(widthStr);
      if (raw.length > width) {
        errors.push({ kind: 'too-long', name, width });
        return '';
      }
      return raw.padStart(width, '0');
    },
  );
  const [error] = errors;
  return error ? { ok: false, error } : { ok: true, value };
}

export type BuildReferenceResult =
  | { ok: true; value: string }
  | {
      ok: false;
      error: TemplateError | { kind: 'invalid'; reason: ReferenceError };
    };

/**
 * Renders the template and, for model 97, prepends the control number: the
 * template describes the body only.
 */
export function buildReference(
  model: string,
  template: string,
  ctx: TemplateContext,
): BuildReferenceResult {
  const rendered = renderTemplate(template, ctx);
  if (!rendered.ok) return rendered;
  let ref = cleanReference(model, rendered.value);
  if (model === '97') {
    const withControl = computeModel97(ref);
    if (withControl === null) {
      const reason =
        ref === '' ? 'empty' : /^[0-9A-Z]+$/.test(ref) ? 'length' : 'chars';
      return { ok: false, error: { kind: 'invalid', reason } };
    }
    ref = withControl;
  }
  const reason = validateReference(model, ref);
  return reason
    ? { ok: false, error: { kind: 'invalid', reason } }
    : { ok: true, value: ref };
}
