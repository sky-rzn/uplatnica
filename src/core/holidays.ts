import {
  addDays,
  dayOfWeek,
  isoDate,
  parseIsoDate,
  type IsoDate,
} from './date';

export function orthodoxEaster(year: number): IsoDate {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const julianToGregorian = Math.floor(year / 100) - Math.floor(year / 400) - 2;
  return addDays(isoDate(year, month, day), julianToGregorian);
}

function isWeekend(date: IsoDate): boolean {
  const dow = dayOfWeek(date);
  return dow === 0 || dow === 6;
}

const cache = new Map<number, ReadonlySet<IsoDate>>();

/**
 * Non-working public holidays under the Zakon o državnim i drugim praznicima
 * u Republici Srbiji, including the Monday-or-later carry-over when a state
 * holiday falls on a Sunday. Religious holidays of minority faiths only
 * apply to their members and are not included.
 */
export function serbianHolidays(year: number): ReadonlySet<IsoDate> {
  const cached = cache.get(year);
  if (cached) return cached;

  const stateHolidays = [
    isoDate(year, 1, 1),
    isoDate(year, 1, 2),
    isoDate(year, 2, 15),
    isoDate(year, 2, 16),
    isoDate(year, 5, 1),
    isoDate(year, 5, 2),
    isoDate(year, 11, 11),
  ];
  const easter = orthodoxEaster(year);
  const days = new Set<IsoDate>([
    ...stateHolidays,
    isoDate(year, 1, 7),
    addDays(easter, -2),
    addDays(easter, -1),
    easter,
    addDays(easter, 1),
  ]);

  for (const date of stateHolidays) {
    if (dayOfWeek(date) !== 0) continue;
    let next = addDays(date, 1);
    while (days.has(next) || isWeekend(next)) next = addDays(next, 1);
    days.add(next);
  }

  cache.set(year, days);
  return days;
}

export function isHoliday(date: IsoDate): boolean {
  const ymd = parseIsoDate(date);
  if (!ymd) throw new RangeError(`Invalid date: ${date}`);
  return serbianHolidays(ymd.year).has(date);
}

export function isWorkday(date: IsoDate): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

export function nextWorkday(date: IsoDate): IsoDate {
  let d = date;
  while (!isWorkday(d)) d = addDays(d, 1);
  return d;
}
