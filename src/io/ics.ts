import { agendaItems } from '../core/agenda';
import { addDays, type IsoDate } from '../core/date';
import { periodReference } from '../core/forms/occurrence';
import { formatAmount } from '../core/money';
import { formatAccountShort } from '../core/serbia/account';
import type { Dataset } from '../db/schema';
import { periodLabel } from '../ui/period-text';

export const ICS_AHEAD_DAYS = 366;

const encoder = new TextEncoder();

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Splits a content line into 75-octet pieces without breaking a character. */
export function foldLine(line: string): string {
  const parts: string[] = [];
  let part = '';
  let size = 0;
  for (const ch of line) {
    const n = encoder.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (size + n > limit) {
      parts.push(part);
      part = '';
      size = 0;
    }
    part += ch;
    size += n;
  }
  parts.push(part);
  return parts.join('\r\n ');
}

function icsDate(d: IsoDate): string {
  return d.replace(/-/g, '');
}

function icsStamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
}

/**
 * The unpaid periods of active bills as all-day events on their due dates:
 * every overdue one and those due within aheadDays. The UID stays the same
 * for a period, so importing the file again updates the events.
 */
export function dueDatesIcs(
  data: Dataset,
  today: IsoDate,
  now: Date,
  aheadDays: number = ICS_AHEAD_DAYS,
): string {
  const profiles = new Map(data.profiles.map((p) => [p.id, p]));
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Uplatnica//Rokovi//SR',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Uplatnica',
  ];
  for (const item of agendaItems(
    data.sections,
    data.bills,
    data.occurrences,
    today,
    aheadDays,
  )) {
    const { bill, occ } = item;
    const amount = item.remaining ?? item.amount;
    const reference =
      occ.stored?.reference ??
      periodReference(bill, profiles.get(bill.profileId), occ.start);
    const details = [
      `Period: ${periodLabel(occ)}`,
      `Iznos: ${amount === undefined ? 'još nije unet' : `${formatAmount(amount)} RSD`}`,
      `Primalac: ${bill.payee.name}`,
      `Račun: ${formatAccountShort(bill.payee.account)}`,
      `Šifra plaćanja: ${bill.paymentCode}`,
      ...(reference === undefined
        ? []
        : [`Poziv na broj: ${bill.model ? `${bill.model} ` : ''}${reference}`]),
    ];
    const summary =
      amount === undefined
        ? bill.title
        : `${bill.title}: ${formatAmount(amount)} RSD`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${encodeURIComponent(bill.id)}/${encodeURIComponent(occ.periodKey)}@uplatnica`,
      `DTSTAMP:${icsStamp(now)}`,
      `DTSTART;VALUE=DATE:${icsDate(occ.dueDate)}`,
      `DTEND;VALUE=DATE:${icsDate(addDays(occ.dueDate, 1))}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(details.join('\n'))}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(summary)}`,
      'TRIGGER:-PT15H',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
