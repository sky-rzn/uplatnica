import type { DueRule, EveryMonths, Schedule } from '../core/model';
import { t } from '../i18n';

export function everyLabel(m: EveryMonths): string {
  return t.schedule.every[m];
}

function dueText(due: DueRule): string {
  const s = t.schedule;
  if ('daysFromStart' in due) return s.daysFromStart(due.daysFromStart + 1);
  const day = due.day === 'last' ? s.lastDay : s.day(due.day);
  const offset = due.monthOffset ?? 0;
  if (offset === 0) return s.sameMonth(day);
  if (offset === 1) return s.nextMonth(day);
  return s.laterMonth(day, offset);
}

export function scheduleText(s: Schedule): string {
  if (s.kind === 'dates')
    return s.dates.length === 1
      ? t.schedule.once
      : t.schedule.dates(s.dates.length);
  return t.schedule.periodic(everyLabel(s.everyMonths), dueText(s.due));
}
