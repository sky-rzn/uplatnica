import { addDays, diffDays, parseIsoDate, type IsoDate } from '../core/date';
import type { Status } from '../core/status';
import { t } from '../i18n';
import { formatDate } from './format';

function monthYear(date: IsoDate): string {
  const ymd = parseIsoDate(date);
  if (!ymd) return date;
  return t.monthYear(t.months[ymd.month - 1] ?? '', ymd.year);
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
    return t.quarter(m[2] ?? '', m[1] ?? '');
  if (/^\d{4}$/.test(key)) return t.year(key);
  const first = monthYear(p.start);
  const last = monthYear(addDays(p.end, -1));
  return first === last ? first : `${first} - ${last}`;
}

export function statusLabel(status: Status): string {
  return t.status[status];
}

export const STATUS_ICONS: Record<Status, string> = {
  paid: '✓',
  partial: '½',
  overdue: '!',
  'awaiting-amount': '?',
  due: '',
  upcoming: '',
};

/** "danas", "sutra", "za 3 dana", "pre 5 dana" */
export function dueInText(due: IsoDate, today: IsoDate): string {
  const days = diffDays(due, today);
  if (days === 0) return t.dueIn.today;
  if (days === 1) return t.dueIn.tomorrow;
  if (days === -1) return t.dueIn.yesterday;
  return days > 0 ? t.dueIn.later(days) : t.dueIn.earlier(-days);
}
