import type { DueRule, EveryMonths, Schedule } from '../core/model';

export const EVERY_LABELS: Record<EveryMonths, string> = {
  1: 'mesečno',
  2: 'na 2 meseca',
  3: 'tromesečno',
  4: 'na 4 meseca',
  6: 'polugodišnje',
  12: 'godišnje',
};

function dueText(due: DueRule): string {
  if ('daysFromStart' in due)
    return `${String(due.daysFromStart + 1)}. dan perioda`;
  const day = due.day === 'last' ? 'poslednji dan' : `${String(due.day)}.`;
  const offset = due.monthOffset ?? 0;
  if (offset === 0) return `${day} u mesecu`;
  if (offset === 1) return `${day} narednog meseca`;
  return `${day} posle ${String(offset)} meseca`;
}

export function scheduleText(s: Schedule): string {
  if (s.kind === 'dates') {
    const n = s.dates.length;
    return n === 1 ? 'jednom' : `${String(n)} datuma`;
  }
  return `${EVERY_LABELS[s.everyMonths]}, rok ${dueText(s.due)}`;
}
