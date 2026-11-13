import type { Dataset } from '../db/schema';
import { BACKUP_APP, SCHEMA_VERSION } from './migrate';

export interface Backup extends Dataset {
  app: typeof BACKUP_APP;
  schemaVersion: number;
  exportedAt: string;
  /** Holds a part of the data, so it can be merged but cannot replace all. */
  partial?: true;
}

export function isEmpty(data: Dataset): boolean {
  return (
    data.profiles.length === 0 &&
    data.sections.length === 0 &&
    data.bills.length === 0 &&
    data.occurrences.length === 0
  );
}

export function fullBackup(data: Dataset, now: Date): Backup {
  return {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    profiles: data.profiles,
    sections: data.sections,
    bills: data.bills,
    occurrences: data.occurrences,
  };
}

/**
 * One section with its bills and their payers, to share as templates. The
 * payment history stays out, and so do JMBG and PIB of the payers.
 */
export function sectionBackup(
  data: Dataset,
  sectionId: string,
  now: Date,
): Backup {
  const bills = data.bills.filter((b) => b.sectionId === sectionId);
  const payers = new Set(bills.map((b) => b.profileId));
  return {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    partial: true,
    profiles: data.profiles
      .filter((p) => payers.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        updatedAt: p.updatedAt,
      })),
    sections: data.sections.filter((s) => s.id === sectionId),
    bills,
    occurrences: [],
  };
}

export function backupJson(backup: Backup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}
