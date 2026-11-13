export type IsoDate = string;
export type YearMonth = string;

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const YEAR_MONTH = /^(\d{4})-(\d{2})$/;

export interface Ymd {
  year: number;
  month: number;
  day: number;
}

export function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function parseIsoDate(s: string): Ymd | null {
  const m = ISO_DATE.exec(s);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month))
    return null;
  return { year, month, day };
}

export function isIsoDate(s: string): boolean {
  return parseIsoDate(s) !== null;
}

function mustParse(s: IsoDate): Ymd {
  const d = parseIsoDate(s);
  if (!d) throw new RangeError(`Invalid date: ${s}`);
  return d;
}

export function isoDate(year: number, month: number, day: number): IsoDate {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function toDayNumber(s: IsoDate): number {
  const { year, month, day } = mustParse(s);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

export function fromDayNumber(n: number): IsoDate {
  const d = new Date(n * DAY_MS);
  return isoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function addDays(s: IsoDate, days: number): IsoDate {
  return fromDayNumber(toDayNumber(s) + days);
}

export function diffDays(a: IsoDate, b: IsoDate): number {
  return toDayNumber(a) - toDayNumber(b);
}

/** 0 = Sunday ... 6 = Saturday */
export function dayOfWeek(s: IsoDate): number {
  return (((toDayNumber(s) + 4) % 7) + 7) % 7;
}

export function parseYearMonth(
  s: YearMonth,
): { year: number; month: number } | null {
  const m = YEAR_MONTH.exec(s);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function monthIndex(year: number, month: number): number {
  return year * 12 + month - 1;
}

export function fromMonthIndex(index: number): { year: number; month: number } {
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function firstOfMonthIndex(index: number): IsoDate {
  const { year, month } = fromMonthIndex(index);
  return isoDate(year, month, 1);
}

export function todayIso(now: Date = new Date()): IsoDate {
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
