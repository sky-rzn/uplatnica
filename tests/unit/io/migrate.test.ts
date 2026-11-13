import { describe, expect, it } from 'vitest';
import { migrate } from '../../../src/io/migrate';

describe('migrate', () => {
  it('passes current data through', () => {
    const raw = { app: 'uplatnica', schemaVersion: 1, bills: [] };
    expect(migrate(raw)).toEqual({ ok: true, data: raw });
  });

  it('applies the steps in order up to the target', () => {
    const steps = {
      1: (d: Record<string, unknown>) => ({ ...d, trail: ['1->2'] }),
      2: (d: Record<string, unknown>) => ({
        ...d,
        trail: [...(d.trail as string[]), '2->3'],
      }),
    };
    expect(migrate({ app: 'uplatnica', schemaVersion: 1 }, steps, 3)).toEqual({
      ok: true,
      data: { app: 'uplatnica', schemaVersion: 3, trail: ['1->2', '2->3'] },
    });
  });

  it('rejects other files and newer versions', () => {
    expect(migrate([])).toEqual({ ok: false, error: 'not-backup' });
    expect(migrate({ app: 'other', schemaVersion: 1 })).toEqual({
      ok: false,
      error: 'not-backup',
    });
    expect(migrate({ app: 'uplatnica', schemaVersion: '1' })).toEqual({
      ok: false,
      error: 'version',
    });
    expect(migrate({ app: 'uplatnica', schemaVersion: 2 })).toEqual({
      ok: false,
      error: 'newer',
      version: 2,
    });
  });
});
