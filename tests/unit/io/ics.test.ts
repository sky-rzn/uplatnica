import { describe, expect, it } from 'vitest';
import { dueDatesIcs, foldLine } from '../../../src/io/ics';
import { dataset } from './fixtures';

const NOW = new Date('2026-11-13T10:00:00Z');

describe('dueDatesIcs', () => {
  it('has an event for each unpaid period ahead', () => {
    const ics = dueDatesIcs(dataset(), '2026-11-13', NOW, 40);
    expect(ics.split('\r\n')).toMatchInlineSnapshot(`
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Uplatnica//Rokovi//SR",
        "CALSCALE:GREGORIAN",
        "X-WR-CALNAME:Uplatnica",
        "BEGIN:VEVENT",
        "UID:b1/2026-10@uplatnica",
        "DTSTAMP:20261113T100000Z",
        "DTSTART;VALUE=DATE:20261015",
        "DTEND;VALUE=DATE:20261016",
        "SUMMARY:Infostan: 234\\,56 RSD",
        "DESCRIPTION:Period: oktobar 2026\\nIznos: 234\\,56 RSD\\nPrimalac: Primalac\\nR",
        " ačun: 845-404849-87\\nŠifra plaćanja: 289\\nPoziv na broj: 97 70202610",
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Infostan: 234\\,56 RSD",
        "TRIGGER:-PT15H",
        "END:VALARM",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "UID:b1/2026-11@uplatnica",
        "DTSTAMP:20261113T100000Z",
        "DTSTART;VALUE=DATE:20261115",
        "DTEND;VALUE=DATE:20261116",
        "SUMMARY:Infostan: 1.000\\,00 RSD",
        "DESCRIPTION:Period: novembar 2026\\nIznos: 1.000\\,00 RSD\\nPrimalac: Primalac",
        " \\nRačun: 845-404849-87\\nŠifra plaćanja: 289\\nPoziv na broj: 97 67202611",
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Infostan: 1.000\\,00 RSD",
        "TRIGGER:-PT15H",
        "END:VALARM",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "UID:b1/2026-12@uplatnica",
        "DTSTAMP:20261113T100000Z",
        "DTSTART;VALUE=DATE:20261215",
        "DTEND;VALUE=DATE:20261216",
        "SUMMARY:Infostan: 1.000\\,00 RSD",
        "DESCRIPTION:Period: decembar 2026\\nIznos: 1.000\\,00 RSD\\nPrimalac: Primalac",
        " \\nRačun: 845-404849-87\\nŠifra plaćanja: 289\\nPoziv na broj: 97 64202612",
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Infostan: 1.000\\,00 RSD",
        "TRIGGER:-PT15H",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
      ]
    `);
  });
});

describe('foldLine', () => {
  it('folds at 75 octets without splitting a character', () => {
    const line = `SUMMARY:${'č'.repeat(40)}`;
    const folded = foldLine(line);
    const parts = folded.split('\r\n ');
    expect(parts.join('')).toBe(line);
    for (const p of parts)
      expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
    expect(parts).toHaveLength(2);
  });
});
