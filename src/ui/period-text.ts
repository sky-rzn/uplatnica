import { addDays, parseIsoDate, type IsoDate } from '../core/date';
import type { Status } from '../core/status';
import { formatDate } from './format';

export const MONTHS = [
  'januar',
  'februar',
  'mart',
  'april',
  'maj',
  'jun',
  'jul',
  'avgust',
  'septembar',
  'oktobar',
  'novembar',
  'decembar',
] as const;

export const MONTHS_SHORT = [
  'jan',
  'feb',
  'mar',
  'apr',
  'maj',
  'jun',
  'jul',
  'avg',
  'sep',
  'okt',
  'nov',
  'dec',
] as const;

function monthYear(date: IsoDate): string {
  const ymd = parseIsoDate(date);
  if (!ymd) return date;
  return `${MONTHS[ymd.month - 1] ?? ''} ${String(ymd.year)}`;
}

/** "novembar 2026", "4. kvartal 2026", "2026. godina" or "15.12.2026." */
export function periodLabel(p: {
  periodKey: string;
  start: IsoDate;
  end: IsoDate;
}): string {
  const key = p.periodKey;
  let m: RegExpExecArray | null;
  if (parseIsoDate(key)) return formatDate(key);
  if ((m = /^(\d{4})-Q([1-4])$/.exec(key)))
    return `${m[2] ?? ''}. kvartal ${m[1] ?? ''}`;
  if (/^\d{4}$/.test(key)) return `${key}. godina`;
  const first = monthYear(p.start);
  const last = monthYear(addDays(p.end, -1));
  return first === last ? first : `${first} - ${last}`;
}

export const STATUS_LABELS: Record<Status, string> = {
  paid: 'plaćeno',
  partial: 'delimično plaćeno',
  overdue: 'kasni',
  'awaiting-amount': 'čeka iznos',
  due: 'za plaćanje',
  upcoming: 'predstoji',
};

export const STATUS_ICONS: Record<Status, string> = {
  paid: '✓',
  partial: '½',
  overdue: '!',
  'awaiting-amount': '?',
  due: '',
  upcoming: '',
};
