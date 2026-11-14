import type { Dataset } from '../db/schema';
import type { Backup } from './export';
import { occurrenceKey } from './merge';
import { migrate } from './migrate';
import { backupSchema } from './schema';

export type ImportIssue =
  | { code: 'not-json' }
  | { code: 'not-backup' }
  | { code: 'version' }
  | { code: 'newer'; version: number }
  | { code: 'invalid'; path: string }
  | { code: 'unknown-keys'; path: string; keys: string[] }
  | { code: 'duplicate'; path: string }
  | { code: 'missing-ref'; path: string };

export type ParseBackupResult =
  { ok: true; backup: Backup } | { ok: false; issues: ImportIssue[] };

/** "bills[2].payee.account" */
export function formatPath(path: readonly PropertyKey[]): string {
  return path
    .map((p, i) =>
      typeof p === 'number'
        ? `[${String(p)}]`
        : `${i === 0 ? '' : '.'}${String(p)}`,
    )
    .join('');
}

export function parseBackup(text: string): ParseBackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, issues: [{ code: 'not-json' }] };
  }
  const migrated = migrate(raw);
  if (!migrated.ok)
    return {
      ok: false,
      issues: [
        migrated.error === 'newer'
          ? { code: 'newer', version: migrated.version }
          : { code: migrated.error },
      ],
    };
  const parsed = backupSchema.safeParse(migrated.data);
  if (!parsed.success)
    return {
      ok: false,
      issues: parsed.error.issues.map((i): ImportIssue => {
        const path = formatPath(i.path);
        return i.code === 'unrecognized_keys'
          ? { code: 'unknown-keys', path, keys: i.keys }
          : { code: 'invalid', path };
      }),
    };
  const backup = parsed.data as Backup;
  const issues = checkIntegrity(backup);
  return issues.length > 0 ? { ok: false, issues } : { ok: true, backup };
}

/** Duplicate keys and references to records the data does not hold. */
export function checkIntegrity(data: Dataset): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const ids = <T>(table: string, rows: readonly T[], key: (r: T) => string) => {
    const seen = new Set<string>();
    rows.forEach((r, i) => {
      const k = key(r);
      if (seen.has(k))
        issues.push({ code: 'duplicate', path: `${table}[${String(i)}]` });
      seen.add(k);
    });
    return seen;
  };
  const profiles = ids('profiles', data.profiles, (p) => p.id);
  const sections = ids('sections', data.sections, (s) => s.id);
  const bills = ids('bills', data.bills, (b) => b.id);
  const occurrences = ids('occurrences', data.occurrences, occurrenceKey);
  const live = { profiles, sections, bills, occurrences };
  ids('tombstones', data.tombstones, (t) => JSON.stringify([t.table, t.key]));
  data.tombstones.forEach((t, i) => {
    if (live[t.table].has(t.key))
      issues.push({ code: 'duplicate', path: `tombstones[${String(i)}]` });
  });

  data.bills.forEach((b, i) => {
    if (!sections.has(b.sectionId))
      issues.push({
        code: 'missing-ref',
        path: `bills[${String(i)}].sectionId`,
      });
    if (!profiles.has(b.profileId))
      issues.push({
        code: 'missing-ref',
        path: `bills[${String(i)}].profileId`,
      });
  });
  data.occurrences.forEach((o, i) => {
    if (!bills.has(o.billId))
      issues.push({
        code: 'missing-ref',
        path: `occurrences[${String(i)}].billId`,
      });
  });
  return issues;
}
