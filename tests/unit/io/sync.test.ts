import { describe, expect, it } from 'vitest';
import { fullBackup } from '../../../src/io/export';
import { packSync, unpackSync } from '../../../src/io/sync';
import { dataset } from './fixtures';

const NOW = new Date('2026-11-13T10:00:00Z');
const device = { id: 'd1', name: 'Laptop' };

describe('sync messages', () => {
  it('read back what packSync() wrote', async () => {
    const message = {
      device,
      ack: '2026-11-12T10:00:00.000Z',
      backup: fullBackup(dataset(), NOW),
    };
    expect(await unpackSync(await packSync(message))).toEqual({
      ok: true,
      message,
    });
  });

  it('reject what is not a message or holds invalid data', async () => {
    expect(await unpackSync(new Uint8Array([1, 2, 3]))).toEqual({
      ok: false,
      error: 'not-sync',
    });
    const backup = fullBackup(dataset(), NOW);
    backup.profiles = [];
    expect(await unpackSync(await packSync({ device, backup }))).toMatchObject({
      ok: false,
      error: 'backup',
      issues: [{ code: 'missing-ref', path: 'bills[0].profileId' }],
    });
  });
});
