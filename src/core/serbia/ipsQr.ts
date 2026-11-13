import { MAX_PARA, formatAmountPlain, type Para } from '../money';
import { isValidAccount, normalizeAccount } from './account';
import { isValidQrPaymentCode } from './paymentCodes';
import { cleanReference, isValidModel97 } from './reference';
import { cyrillicToLatin } from './translit';

export interface IpsQrPayment {
  /** 18 digits. */
  account: string;
  /** Up to 3 lines separated by "\n". */
  payeeName: string;
  amount: Para;
  payer?: string;
  paymentCode: string;
  purpose?: string;
  /** Two-digit model, "" or "00" for none. */
  model?: string;
  reference?: string;
}

export interface ParsedIpsQr extends IpsQrPayment {
  /** RL, the free-form payee reference that replaces RO. */
  payeeReference?: string;
}

export type IpsQrIssue =
  | { tag: string | null; code: 'format'; message: string }
  | {
      tag: string;
      code:
        | 'missing'
        | 'duplicate'
        | 'unknown'
        | 'invalid'
        | 'length'
        | 'lines'
        | 'chars'
        | 'checksum';
    }
  | { tag: null; code: 'exclusive' | 'too-large' };

export const QR_MAX_BYTES_M = 331;
export const QR_MAX_BYTES_L = 425;

const PR_TAGS = [
  'K',
  'V',
  'C',
  'R',
  'N',
  'I',
  'P',
  'SF',
  'S',
  'RO',
  'RL',
] as const;
const MANDATORY = ['K', 'V', 'C', 'R', 'N', 'I', 'SF'] as const;

const SPECIALS = '!"#$%&\'()*+,\\-./:;<=>?@\\[\\]^_`{}~“”„‘’';
const TEXT_CHARS = new RegExp(`^[A-Za-z0-9ČĆŽŠĐčćžšđ ${SPECIALS}]*$`, 'u');
const AMOUNT = /^RSD(\d{1,12}),(\d{0,2})$/;

function charLength(s: string): number {
  return Array.from(s).length;
}

function checkText(
  tag: string,
  value: string,
  maxChars: number,
  maxLines: number,
  out: IpsQrIssue[],
): void {
  const lines = value.split(/\r\n|\r|\n/);
  if (lines.length > maxLines) out.push({ tag, code: 'lines' });
  if (charLength(value) > maxChars) out.push({ tag, code: 'length' });
  if (!lines.every((l) => TEXT_CHARS.test(l))) out.push({ tag, code: 'chars' });
}

function checkRo(value: string, out: IpsQrIssue[]): void {
  if (!/^\d{2}[A-Za-z0-9-]{1,23}$/.test(value)) {
    out.push({
      tag: 'RO',
      code: charLength(value) > 25 ? 'length' : 'invalid',
    });
  } else if (value.startsWith('97') && !isValidModel97(value.slice(2))) {
    out.push({ tag: 'RO', code: 'checksum' });
  }
}

function splitFields(text: string): {
  fields: [string, string][];
  issues: IpsQrIssue[];
} {
  const issues: IpsQrIssue[] = [];
  const fields: [string, string][] = [];
  for (const part of text.split('|')) {
    const colon = part.indexOf(':');
    if (colon === -1) {
      issues.push({
        tag: null,
        code: 'format',
        message: `field without ":": ${part}`,
      });
      continue;
    }
    fields.push([part.slice(0, colon), part.slice(colon + 1)]);
  }
  return { fields, issues };
}

/**
 * Strict check of an IPS QR string for K:PR, following Prilog 1 and the
 * observed behaviour of the NBS validator.
 */
export function validateIpsQr(text: string): IpsQrIssue[] {
  if (text.startsWith('|') || text.endsWith('|')) {
    return [{ tag: null, code: 'format', message: 'starts or ends with "|"' }];
  }
  if (/^\s|\s$/.test(text)) {
    return [
      { tag: null, code: 'format', message: 'leading or trailing whitespace' },
    ];
  }
  const { fields, issues } = splitFields(text);
  const values = new Map<string, string>();
  for (const [tag, value] of fields) {
    if (!(PR_TAGS as readonly string[]).includes(tag))
      issues.push({ tag, code: 'unknown' });
    else if (values.has(tag)) issues.push({ tag, code: 'duplicate' });
    else if (value === '')
      issues.push({ tag, code: 'format', message: 'empty value' });
    else values.set(tag, value);
  }
  for (const tag of MANDATORY)
    if (!values.has(tag)) issues.push({ tag, code: 'missing' });

  for (const [tag, v] of values) {
    switch (tag) {
      case 'K':
        if (v !== 'PR') issues.push({ tag, code: 'invalid' });
        break;
      case 'V':
        if (v !== '01') issues.push({ tag, code: 'invalid' });
        break;
      case 'C':
        if (v !== '1') issues.push({ tag, code: 'invalid' });
        break;
      case 'R':
        if (!/^\d{18}$/.test(v)) issues.push({ tag, code: 'invalid' });
        else if (!isValidAccount(v)) issues.push({ tag, code: 'checksum' });
        break;
      case 'N':
      case 'P':
        checkText(tag, v, 70, 3, issues);
        break;
      case 'S':
        checkText(tag, v, 35, 1, issues);
        break;
      case 'I':
        if (!AMOUNT.test(v)) issues.push({ tag, code: 'invalid' });
        break;
      case 'SF':
        if (!isValidQrPaymentCode(v)) issues.push({ tag, code: 'invalid' });
        break;
      case 'RO':
        checkRo(v, issues);
        break;
      case 'RL':
        if (!/^[A-Za-z0-9]{1,140}$/.test(v))
          issues.push({ tag, code: 'invalid' });
        break;
    }
  }
  if (values.has('RO') && values.has('RL'))
    issues.push({ tag: null, code: 'exclusive' });
  return issues;
}

/** Transliterates Cyrillic, folds whitespace, drops empty lines, joins lines with CRLF. */
export function sanitizeQrText(value: string, multiline: boolean): string {
  const latin = cyrillicToLatin(value.normalize('NFC'))
    .replace(/[\u00a0\u2007\u202f\t]/g, ' ')
    .replace(/[\u2013\u2014]/g, '-');
  const lines = multiline
    ? latin.split(/\r\n|\r|\n/)
    : [latin.replace(/[\r\n]+/g, ' ')];
  return lines
    .map((l) => l.replace(/ {2,}/g, ' ').trim())
    .filter((l) => l !== '')
    .join('\r\n');
}

export type BuildResult =
  | { ok: true; text: string; bytes: number; ecc: 'M' | 'L' }
  | { ok: false; issues: IpsQrIssue[] };

/** Produces the canonical IPS QR string in the tag order NBS uses itself. */
export function buildIpsQr(p: IpsQrPayment): BuildResult {
  const issues: IpsQrIssue[] = [];
  const fields: [string, string][] = [
    ['K', 'PR'],
    ['V', '01'],
    ['C', '1'],
  ];

  const account = normalizeAccount(p.account);
  if (account.ok) fields.push(['R', account.value]);
  else
    issues.push({
      tag: 'R',
      code: account.error === 'checksum' ? 'checksum' : 'invalid',
    });

  const name = sanitizeQrText(p.payeeName, true);
  if (name === '') issues.push({ tag: 'N', code: 'missing' });
  fields.push(['N', name]);

  if (!Number.isSafeInteger(p.amount) || p.amount < 0 || p.amount > MAX_PARA) {
    issues.push({ tag: 'I', code: 'invalid' });
  } else {
    fields.push(['I', `RSD${formatAmountPlain(p.amount)}`]);
  }

  const payer = p.payer === undefined ? '' : sanitizeQrText(p.payer, true);
  if (payer !== '') fields.push(['P', payer]);

  fields.push(['SF', p.paymentCode.trim()]);

  const purpose =
    p.purpose === undefined ? '' : sanitizeQrText(p.purpose, false);
  if (purpose !== '') fields.push(['S', purpose]);

  const reference =
    p.reference === undefined ? '' : cleanReference(p.model ?? '', p.reference);
  if (reference !== '') {
    const model = p.model === undefined || p.model === '' ? '00' : p.model;
    if (!/^\d{2}$/.test(model)) issues.push({ tag: 'RO', code: 'invalid' });
    fields.push(['RO', model + reference]);
  }

  if (issues.length > 0) return { ok: false, issues };
  const text = fields.map(([tag, value]) => `${tag}:${value}`).join('|');
  const strict = validateIpsQr(text);
  if (strict.length > 0) return { ok: false, issues: strict };

  const bytes = new TextEncoder().encode(text).length;
  if (bytes > QR_MAX_BYTES_L)
    return { ok: false, issues: [{ tag: null, code: 'too-large' }] };
  return { ok: true, text, bytes, ecc: bytes <= QR_MAX_BYTES_M ? 'M' : 'L' };
}

export type ParseResult =
  | { ok: true; value: ParsedIpsQr; warnings: IpsQrIssue[] }
  | { ok: false; issues: IpsQrIssue[] };

function parseAmountTag(v: string): Para | null {
  const m = AMOUNT.exec(v);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
}

/**
 * Lenient reader for codes printed on bills: any tag order, any line break,
 * stray whitespace or a trailing "|". The payment code is taken as is.
 * Problems that do not prevent reading come back as warnings.
 */
export function parseIpsQr(input: string): ParseResult {
  const text = input.trim().replace(/^\|+|\|+$/g, '');
  const { fields } = splitFields(text);
  const values = new Map<string, string>();
  for (const [tag, value] of fields) {
    const t = tag.trim().toUpperCase();
    if (!values.has(t)) values.set(t, value.trim());
  }

  const issues: IpsQrIssue[] = [];
  if (values.get('K') !== 'PR')
    issues.push({ tag: 'K', code: values.has('K') ? 'invalid' : 'missing' });
  for (const tag of ['R', 'N', 'I', 'SF'] as const) {
    if (!values.get(tag)) issues.push({ tag, code: 'missing' });
  }
  if (issues.length > 0) return { ok: false, issues };

  const account = (values.get('R') ?? '').replace(/[\s-]/g, '');
  if (!/^\d{18}$/.test(account))
    return { ok: false, issues: [{ tag: 'R', code: 'invalid' }] };
  if (!isValidAccount(account))
    return { ok: false, issues: [{ tag: 'R', code: 'checksum' }] };

  const amount = parseAmountTag(values.get('I') ?? '');
  if (amount === null)
    return { ok: false, issues: [{ tag: 'I', code: 'invalid' }] };

  const lines = (v: string): string =>
    v
      .split(/\r\n|\r|\n/)
      .map((l) => l.trim())
      .join('\n');
  const value: ParsedIpsQr = {
    account,
    payeeName: lines(values.get('N') ?? ''),
    amount,
    paymentCode: values.get('SF') ?? '',
  };
  const payer = values.get('P');
  if (payer) value.payer = lines(payer);
  const purpose = values.get('S');
  if (purpose) value.purpose = purpose;
  const ro = values.get('RO');
  if (ro) {
    const model = ro.slice(0, 2);
    value.model = model === '00' ? '' : model;
    value.reference = ro.slice(2);
  }
  const rl = values.get('RL');
  if (rl) value.payeeReference = rl;

  const warnings = validateIpsQr(text).filter(
    (w) => w.tag !== 'R' && w.tag !== 'I',
  );
  return { ok: true, value, warnings };
}
