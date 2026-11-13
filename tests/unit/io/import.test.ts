import { describe, expect, it } from 'vitest';
import { backupJson, fullBackup, sectionBackup } from '../../../src/io/export';
import { parseBackup } from '../../../src/io/import';
import { mergeDatasets } from '../../../src/io/merge';
import { T0, dataset } from './fixtures';

const NOW = new Date('2026-11-13T10:00:00Z');

function withData(patch: (b: Record<string, unknown>) => void): string {
  const b = JSON.parse(backupJson(fullBackup(dataset(), NOW))) as Record<
    string,
    unknown
  >;
  patch(b);
  return JSON.stringify(b);
}

describe('parseBackup', () => {
  it('reads back what fullBackup() wrote', () => {
    const backup = fullBackup(dataset(), NOW);
    expect(parseBackup(backupJson(backup))).toEqual({ ok: true, backup });
  });

  it('reads back a section export', () => {
    const backup = sectionBackup(dataset(), 's1', NOW);
    expect(backup.profiles[0]).not.toHaveProperty('jmbg');
    expect(backup.occurrences).toEqual([]);
    expect(parseBackup(backupJson(backup))).toEqual({ ok: true, backup });
  });

  it('rejects what is not a backup', () => {
    expect(parseBackup('{')).toEqual({
      ok: false,
      issues: [{ code: 'not-json' }],
    });
    expect(parseBackup('{"app":"uplatnica","schemaVersion":9}')).toEqual({
      ok: false,
      issues: [{ code: 'newer', version: 9 }],
    });
  });

  it('names the path of each invalid field', () => {
    const text = withData((b) => {
      const [bill] = b.bills as Record<string, unknown>[];
      if (!bill) throw new Error('no bill');
      (bill.payee as Record<string, unknown>).account = '845000000040484988';
      bill.colour = 'red';
      (b.occurrences as Record<string, unknown>[]).push({
        billId: 'b1',
        periodKey: '2026-13',
        updatedAt: T0,
      });
    });
    expect(parseBackup(text)).toEqual({
      ok: false,
      issues: [
        { code: 'invalid', path: 'bills[0].payee.account' },
        { code: 'unknown-keys', path: 'bills[0]', keys: ['colour'] },
        { code: 'invalid', path: 'occurrences[2].periodKey' },
      ],
    });
  });

  it('rejects duplicates and dangling references', () => {
    const text = withData((b) => {
      const sections = b.sections as unknown[];
      sections.push(sections[0]);
      (b.profiles as unknown[]).length = 0;
      const [occ] = b.occurrences as Record<string, unknown>[];
      if (occ) occ.billId = 'gone';
    });
    expect(parseBackup(text)).toEqual({
      ok: false,
      issues: [
        { code: 'duplicate', path: 'sections[1]' },
        { code: 'missing-ref', path: 'bills[0].profileId' },
        { code: 'missing-ref', path: 'occurrences[0].billId' },
      ],
    });
  });
});

describe('mergeDatasets', () => {
  it('takes new records and newer copies, keeps the rest', () => {
    const current = dataset();
    const incoming = dataset();
    const [bill] = incoming.bills;
    const [section] = incoming.sections;
    if (!bill || !section) throw new Error('fixture');
    bill.title = 'Infostan novi';
    bill.updatedAt = '2026-11-02T10:00:00Z';
    section.name = 'Stari naziv';
    section.updatedAt = '2026-10-01T10:00:00.000Z';
    incoming.occurrences.push({
      billId: 'b1',
      periodKey: '2026-11',
      amount: 5000,
      updatedAt: T0,
    });

    const { put, stats } = mergeDatasets(current, incoming);
    expect(stats).toEqual({ added: 1, updated: 1, kept: 4 });
    expect(put.bills.map((b) => b.title)).toEqual(['Infostan novi']);
    expect(put.sections).toEqual([]);
    expect(put.occurrences.map((o) => o.periodKey)).toEqual(['2026-11']);
  });
});
