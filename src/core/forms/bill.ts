import { isIsoDate, monthIndex, parseYearMonth, type IsoDate } from '../date';
import type {
  Bill,
  DueRule,
  EveryMonths,
  Profile,
  ReferenceModel,
  Schedule,
  Section,
} from '../model';
import { parseAmount, type Para } from '../money';
import { dueDateFor, upcomingPeriods, type Period } from '../schedule';
import type { BillPreset } from '../serbia/presets';
import { formatAccountShort, normalizeAccount } from '../serbia/account';
import { QR_TEXT_LIMITS, checkQrText } from '../serbia/ipsQr';
import {
  isValidPaymentCode,
  isValidQrPaymentCode,
} from '../serbia/paymentCodes';
import {
  buildReference,
  cleanReference,
  isValidModel97,
} from '../serbia/reference';
import {
  parseInteger,
  type FormResult,
  type Issue,
  type Issues,
} from './issues';

export const EVERY_MONTHS: readonly EveryMonths[] = [1, 2, 3, 4, 6, 12];

export type DueKind = 'day' | 'last' | 'daysFromStart';
export type PayFromKind = 'none' | DueKind;

export interface BillDraft {
  title: string;
  sectionId: string;
  profileId: string;
  payeeName: string;
  payeeAddress: string;
  account: string;
  paymentCode: string;
  purpose: string;
  model: ReferenceModel;
  reference: string;
  referenceVars: Record<string, string>;
  amountMode: 'fixed' | 'variable';
  amount: string;
  scheduleKind: 'periodic' | 'dates';
  everyMonths: EveryMonths;
  dueKind: DueKind;
  dueDay: string;
  monthOffset: string;
  daysFromStart: string;
  payFromKind: PayFromKind;
  payFromDay: string;
  payFromMonthOffset: string;
  payFromDaysFromStart: string;
  start: string;
  end: string;
  shiftToWorkday: boolean;
  dates: string[];
  notes: string;
  archived: boolean;
}

export interface BillContext {
  id: string;
  sections: readonly Section[];
  profiles: readonly Profile[];
  today: IsoDate;
}

export interface BillPreview {
  /** Upcoming periods, nearest first. */
  next: Period[];
  reference?: { periodKey: string; value: string };
}

export interface BillFormResult extends FormResult<Bill> {
  preview: BillPreview;
}

const BUILTIN_PLACEHOLDERS = new Set(['YYYY', 'YY', 'MM', 'Q']);
const PROFILE_PLACEHOLDERS = new Set(['JMBG', 'PIB']);
const PLACEHOLDER = /\{([A-Z][A-Z0-9_]*)(?::\d{1,2})?\}/g;
const PREVIEW_COUNT = 3;

/** Placeholders the bill itself has to supply values for. */
export function customPlaceholders(template: string): string[] {
  const names = Array.from(template.matchAll(PLACEHOLDER), (m) => m[1] ?? '');
  return [...new Set(names)].filter(
    (n) => !BUILTIN_PLACEHOLDERS.has(n) && !PROFILE_PLACEHOLDERS.has(n),
  );
}

export function emptyBillDraft(
  sectionId: string,
  profileId: string,
  today: IsoDate,
): BillDraft {
  return {
    title: '',
    sectionId,
    profileId,
    payeeName: '',
    payeeAddress: '',
    account: '',
    paymentCode: '289',
    purpose: '',
    model: '',
    reference: '',
    referenceVars: {},
    amountMode: 'fixed',
    amount: '',
    scheduleKind: 'periodic',
    everyMonths: 1,
    dueKind: 'day',
    dueDay: '15',
    monthOffset: '0',
    daysFromStart: '0',
    payFromKind: 'none',
    payFromDay: '1',
    payFromMonthOffset: '0',
    payFromDaysFromStart: '0',
    start: today.slice(0, 7),
    end: '',
    shiftToWorkday: false,
    dates: [],
    notes: '',
    archived: false,
  };
}

export function billToDraft(
  bill: Bill,
  formatAmount: (p: Para) => string,
): BillDraft {
  const d = emptyBillDraft(bill.sectionId, bill.profileId, '0000-01-01');
  d.title = bill.title;
  d.payeeName = bill.payee.name;
  d.payeeAddress = bill.payee.address ?? '';
  d.account = formatAccountShort(bill.payee.account);
  d.paymentCode = bill.paymentCode;
  d.purpose = bill.purpose;
  d.model = bill.model ?? '';
  d.reference = bill.referenceTemplate ?? '';
  d.referenceVars = { ...bill.referenceVars };
  d.amountMode = bill.amountMode;
  d.amount = bill.amount === undefined ? '' : formatAmount(bill.amount);
  d.notes = bill.notes ?? '';
  d.archived = bill.archived;

  const s = bill.schedule;
  if (s.kind === 'dates') {
    d.scheduleKind = 'dates';
    d.dates = [...s.dates];
    d.start = '';
    return d;
  }
  d.everyMonths = s.everyMonths;
  d.start = s.start;
  d.end = s.end ?? '';
  d.shiftToWorkday = s.shiftToWorkday ?? false;
  Object.assign(d, dueRuleFields(s.due));
  if (s.payFrom) {
    const f = dueRuleFields(s.payFrom);
    d.payFromKind = f.dueKind;
    if (f.dueDay !== undefined) d.payFromDay = f.dueDay;
    if (f.monthOffset !== undefined) d.payFromMonthOffset = f.monthOffset;
    if (f.daysFromStart !== undefined) d.payFromDaysFromStart = f.daysFromStart;
  }
  return d;
}

function dueRuleFields(
  rule: DueRule,
): Pick<BillDraft, 'dueKind'> &
  Partial<Pick<BillDraft, 'dueDay' | 'monthOffset' | 'daysFromStart'>> {
  if ('daysFromStart' in rule)
    return {
      dueKind: 'daysFromStart',
      daysFromStart: String(rule.daysFromStart),
    };
  const offset = String(rule.monthOffset ?? 0);
  return rule.day === 'last'
    ? { dueKind: 'last', monthOffset: offset }
    : { dueKind: 'day', dueDay: String(rule.day), monthOffset: offset };
}

function readInteger(
  field: string,
  raw: string,
  min: number,
  max: number,
  errors: Issues,
): number | undefined {
  const n = parseInteger(raw, min, max);
  if (typeof n === 'number') return n;
  errors[field] = n;
  return undefined;
}

function readDueRule(
  kind: DueKind,
  fields: Record<'dueDay' | 'monthOffset' | 'daysFromStart', [string, string]>,
  errors: Issues,
): DueRule | undefined {
  if (kind === 'daysFromStart') {
    const days = readInteger(...fields.daysFromStart, 0, 366, errors);
    return days === undefined ? undefined : { daysFromStart: days };
  }
  const offset = readInteger(...fields.monthOffset, 0, 12, errors);
  const day =
    kind === 'last' ? 'last' : readInteger(...fields.dueDay, 1, 31, errors);
  if (offset === undefined || day === undefined) return undefined;
  return offset === 0 ? { day } : { day, monthOffset: offset };
}

function readSchedule(d: BillDraft, errors: Issues): Schedule | undefined {
  if (d.scheduleKind === 'dates') {
    const dates: IsoDate[] = [];
    const bad = d.dates.filter((raw, i) => {
      const date = raw.trim();
      if (date === '') return false;
      if (isIsoDate(date)) {
        dates.push(date);
        return false;
      }
      errors[`dates.${String(i)}`] = { code: 'date' };
      return true;
    });
    if (bad.length > 0) return undefined;
    if (dates.length === 0) {
      errors.dates = { code: 'no-dates' };
      return undefined;
    }
    return { kind: 'dates', dates: [...new Set(dates)].sort() };
  }

  const due = readDueRule(
    d.dueKind,
    {
      dueDay: ['dueDay', d.dueDay],
      monthOffset: ['monthOffset', d.monthOffset],
      daysFromStart: ['daysFromStart', d.daysFromStart],
    },
    errors,
  );
  const payFrom =
    d.payFromKind === 'none'
      ? undefined
      : readDueRule(
          d.payFromKind,
          {
            dueDay: ['payFromDay', d.payFromDay],
            monthOffset: ['payFromMonthOffset', d.payFromMonthOffset],
            daysFromStart: ['payFromDaysFromStart', d.payFromDaysFromStart],
          },
          errors,
        );
  const start = d.start.trim();
  const end = d.end.trim();
  if (start === '') errors.start = { code: 'required' };
  else if (!parseYearMonth(start)) errors.start = { code: 'month' };
  if (end !== '' && !parseYearMonth(end)) errors.end = { code: 'month' };
  else if (end !== '' && parseYearMonth(start) && end < start)
    errors.end = { code: 'end-before-start' };
  if (!due || errors.start || errors.end) return undefined;
  if (d.payFromKind !== 'none' && !payFrom) return undefined;
  if (payFrom) {
    const ym = parseYearMonth(start);
    const idx = ym ? monthIndex(ym.year, ym.month) : 0;
    if (dueDateFor(payFrom, idx) > dueDateFor(due, idx)) {
      errors.payFromKind = { code: 'pay-from-after-due' };
      return undefined;
    }
  }

  const schedule: Schedule = {
    kind: 'periodic',
    everyMonths: d.everyMonths,
    due,
    start,
  };
  if (payFrom) schedule.payFrom = payFrom;
  if (end !== '') schedule.end = end;
  if (d.shiftToWorkday) schedule.shiftToWorkday = true;
  return schedule;
}

function templateIssue(
  error: Exclude<ReturnType<typeof buildReference>, { ok: true }>['error'],
): [string, Issue] {
  switch (error.kind) {
    case 'syntax':
      return ['reference', { code: 'template-syntax' }];
    case 'missing':
      return PROFILE_PLACEHOLDERS.has(error.name)
        ? [
            'reference',
            { code: 'profile-missing', field: error.name as 'JMBG' | 'PIB' },
          ]
        : [`referenceVars.${error.name}`, { code: 'required' }];
    case 'too-long':
      return [
        `referenceVars.${error.name}`,
        { code: 'template-too-long', width: error.width },
      ];
    case 'invalid':
      return ['reference', { code: 'reference', reason: error.reason }];
  }
}

function qrTextIssue(
  field: string,
  tag: 'N' | 'S',
  value: string,
  errors: Issues,
): void {
  const [issue] = checkQrText(tag, value);
  if (!issue) return;
  errors[field] =
    issue.code === 'chars'
      ? { code: 'chars' }
      : { code: 'too-long', max: QR_TEXT_LIMITS[tag].chars };
}

export function validateBill(d: BillDraft, ctx: BillContext): BillFormResult {
  const errors: Issues = {};
  const warnings: Issues = {};
  const preview: BillPreview = { next: [] };

  const title = d.title.trim();
  if (title === '') errors.title = { code: 'required' };

  if (d.sectionId === '') errors.sectionId = { code: 'required' };
  else if (!ctx.sections.some((s) => s.id === d.sectionId))
    errors.sectionId = { code: 'not-found' };
  const profile = ctx.profiles.find((p) => p.id === d.profileId);
  if (d.profileId === '') errors.profileId = { code: 'required' };
  else if (!profile) errors.profileId = { code: 'not-found' };

  const payeeName = d.payeeName.trim();
  const payeeAddress = d.payeeAddress.trim();
  if (payeeName === '') errors.payeeName = { code: 'required' };

  let account = '';
  if (d.account.trim() === '') {
    errors.account = { code: 'required' };
  } else {
    const r = normalizeAccount(d.account);
    if (r.ok) account = r.value;
    else
      errors.account = {
        code: r.error === 'checksum' ? 'account-checksum' : 'account-format',
      };
  }

  const paymentCode = d.paymentCode.trim();
  if (paymentCode === '') errors.paymentCode = { code: 'required' };
  else if (!isValidPaymentCode(paymentCode))
    errors.paymentCode = { code: 'payment-code' };
  else if (!isValidQrPaymentCode(paymentCode))
    warnings.paymentCode = { code: 'payment-code-not-qr' };

  const purpose = d.purpose.trim();
  if (purpose === '') errors.purpose = { code: 'required' };

  let amount: Para | undefined;
  if (d.amountMode === 'fixed') {
    const parsed = d.amount.trim() === '' ? null : parseAmount(d.amount);
    if (parsed === null || parsed === 0)
      errors.amount =
        d.amount.trim() === '' ? { code: 'required' } : { code: 'amount' };
    else amount = parsed;
  }

  const schedule = readSchedule(d, errors);
  if (schedule)
    preview.next = upcomingPeriods(schedule, ctx.today, PREVIEW_COUNT);

  const template = d.reference.trim();
  const vars = customPlaceholders(template);
  const referenceVars: Record<string, string> = {};
  for (const name of vars) {
    const v = (d.referenceVars[name] ?? '').trim();
    if (v !== '') referenceVars[name] = v;
  }
  if (template === '') {
    if (d.model !== '') errors.reference = { code: 'required' };
  } else {
    const period = preview.next[0];
    const result = buildReference(d.model, template, {
      vars: { JMBG: profile?.jmbg, PIB: profile?.pib, ...referenceVars },
      periodStart: period?.start ?? ctx.today,
    });
    if (result.ok) {
      if (period)
        preview.reference = {
          periodKey: period.periodKey,
          value: result.value,
        };
    } else {
      const [field, issue] = templateIssue(result.error);
      errors[field] = issue;
    }
    if (
      d.model === '97' &&
      !template.includes('{') &&
      isValidModel97(cleanReference('97', template))
    )
      warnings.reference = { code: 'model97-has-control' };
  }

  if (!errors.payeeName) qrTextIssue('payeeName', 'N', payeeName, errors);
  if (!errors.purpose) qrTextIssue('purpose', 'S', purpose, errors);

  if (Object.keys(errors).length > 0 || !schedule)
    return { value: null, errors, warnings, preview };

  const payee: Bill['payee'] = { name: payeeName, account };
  if (payeeAddress !== '') payee.address = payeeAddress;
  const bill: Bill = {
    id: ctx.id,
    sectionId: d.sectionId,
    profileId: d.profileId,
    title,
    payee,
    paymentCode,
    purpose,
    amountMode: d.amountMode,
    currency: 'RSD',
    schedule,
    archived: d.archived,
  };
  if (d.model !== '') bill.model = d.model;
  if (template !== '') bill.referenceTemplate = template;
  if (Object.keys(referenceVars).length > 0) bill.referenceVars = referenceVars;
  if (amount !== undefined) bill.amount = amount;
  const notes = d.notes.trim();
  if (notes !== '') bill.notes = notes;
  return { value: bill, errors, warnings, preview };
}

/** The first month of the calendar-aligned period of everyMonths that holds month. */
function alignMonth(month: string, everyMonths: EveryMonths): string {
  const ym = parseYearMonth(month);
  if (!ym) return month;
  const m = ym.month - ((ym.month - 1) % everyMonths);
  return `${String(ym.year).padStart(4, '0')}-${String(m).padStart(2, '0')}`;
}

/** Fills a draft from a preset, keeping its section, payer and first period. */
export function applyPreset(d: BillDraft, preset: BillPreset): BillDraft {
  const base = emptyBillDraft(d.sectionId, d.profileId, '0000-01-01');
  const due = preset.due;
  return {
    ...base,
    title: preset.title,
    payeeName: preset.payeeName,
    account: preset.account,
    paymentCode: preset.paymentCode,
    purpose: preset.purpose,
    model: preset.model,
    reference: preset.reference ?? '',
    amountMode: preset.amountMode,
    everyMonths: preset.everyMonths,
    start: alignMonth(d.start, preset.everyMonths),
    shiftToWorkday: preset.shiftToWorkday,
    ...('daysFromStart' in due
      ? { dueKind: 'daysFromStart', daysFromStart: String(due.daysFromStart) }
      : {
          dueKind: due.day === 'last' ? 'last' : 'day',
          dueDay: due.day === 'last' ? base.dueDay : String(due.day),
          monthOffset: String(due.monthOffset ?? 0),
        }),
  };
}
