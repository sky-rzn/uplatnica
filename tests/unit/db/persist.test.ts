import { describe, expect, it } from 'vitest';
import { requestPersistence } from '../../../src/db/persist';

function storage(persisted: boolean, grant: boolean | Error) {
  return {
    persisted: () => Promise.resolve(persisted),
    persist: () =>
      grant instanceof Error ? Promise.reject(grant) : Promise.resolve(grant),
  };
}

describe('requestPersistence', () => {
  it('does not ask again once persisted', async () => {
    expect(await requestPersistence(storage(true, new Error()))).toBe(
      'persisted',
    );
  });

  it('reports what the browser granted', async () => {
    expect(await requestPersistence(storage(false, true))).toBe('persisted');
    expect(await requestPersistence(storage(false, false))).toBe('best-effort');
    expect(await requestPersistence(storage(false, new Error()))).toBe(
      'best-effort',
    );
  });

  it('copes without the Storage API', async () => {
    expect(await requestPersistence({})).toBe('unsupported');
  });
});
