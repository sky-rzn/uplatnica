export const BACKUP_APP = 'uplatnica';
export const SCHEMA_VERSION = 2;

export type RawBackup = Record<string, unknown>;

/** Turns data of version n into version n + 1; keyed by n. */
export type Migrations = Readonly<
  Record<number, (data: RawBackup) => RawBackup>
>;

export const MIGRATIONS: Migrations = {
  1: (data) => ({ ...data, tombstones: [] }),
};

export type MigrateResult =
  | { ok: true; data: RawBackup }
  | { ok: false; error: 'not-backup' | 'version' }
  | { ok: false; error: 'newer'; version: number };

/** Brings a parsed backup file up to the current schema version. */
export function migrate(
  raw: unknown,
  migrations: Migrations = MIGRATIONS,
  target: number = SCHEMA_VERSION,
): MigrateResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
    return { ok: false, error: 'not-backup' };
  let data = raw as RawBackup;
  if (data.app !== BACKUP_APP) return { ok: false, error: 'not-backup' };
  const version = data.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1)
    return { ok: false, error: 'version' };
  if (version > target) return { ok: false, error: 'newer', version };
  for (let n = version; n < target; n++) {
    const step = migrations[n];
    if (!step) throw new Error(`No migration from schema version ${String(n)}`);
    data = { ...step(data), schemaVersion: n + 1 };
  }
  return { ok: true, data };
}
