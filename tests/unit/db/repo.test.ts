import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Profile, Section } from '../../../src/core/model';
import { IntegrityError, Repo, newId } from '../../../src/db/repo';
import { UplatnicaDb } from '../../../src/db/schema';
import { bill } from '../core/fixtures';
import { T0, dataset } from '../io/fixtures';

const profile: Profile = {
  id: 'p1',
  name: 'Petar Petrović',
  address: 'Beograd',
};
const section: Section = {
  id: 's1',
  name: 'Stan',
  color: '#888',
  order: 0,
  archived: false,
};
const monthly = bill({
  kind: 'periodic',
  everyMonths: 1,
  due: { day: 15 },
  start: '2026-01',
});

let db: UplatnicaDb;
let repo: Repo;
let clock: Date;

beforeEach(async () => {
  db = new UplatnicaDb(`test-${newId()}`);
  clock = new Date('2026-11-13T10:00:00Z');
  repo = new Repo(db, () => clock);
  await repo.saveProfile(profile);
  await repo.saveSection(section);
});

afterEach(async () => {
  await db.delete();
});

describe('Repo', () => {
  it('stamps updatedAt on every save', async () => {
    await repo.saveBill(monthly);
    clock = new Date('2026-11-14T08:00:00Z');
    await repo.saveBill({ ...monthly, title: 'Infostan' });
    expect(await repo.getBill('b1')).toMatchObject({
      title: 'Infostan',
      updatedAt: '2026-11-14T08:00:00.000Z',
    });
  });

  it('lists sections by order', async () => {
    await repo.saveSection({ ...section, id: 's2', name: 'Porezi', order: -1 });
    expect((await repo.listSections()).map((s) => s.id)).toEqual(['s2', 's1']);
  });

  it('renumbers sections in the given order', async () => {
    await repo.saveSection({ ...section, id: 's2', order: 3 });
    await repo.saveSection({ ...section, id: 's3', order: 2 });
    clock = new Date('2026-11-14T08:00:00Z');
    await repo.reorderSections(['s1', 's3', 's2']);
    const listed = await repo.listSections();
    expect(listed.map((s) => [s.id, s.order, s.updatedAt])).toEqual([
      ['s1', 0, '2026-11-13T10:00:00.000Z'],
      ['s3', 1, '2026-11-14T08:00:00.000Z'],
      ['s2', 2, '2026-11-14T08:00:00.000Z'],
    ]);
  });

  it('filters bills by section', async () => {
    await repo.saveSection({ ...section, id: 's2', order: 1 });
    await repo.saveBill(monthly);
    await repo.saveBill({ ...monthly, id: 'b2', sectionId: 's2' });
    expect((await repo.listBills('s2')).map((b) => b.id)).toEqual(['b2']);
    expect(await repo.listBills()).toHaveLength(2);
  });

  it('refuses a bill with a missing section or profile', async () => {
    await expect(
      repo.saveBill({ ...monthly, sectionId: 'nope' }),
    ).rejects.toThrow(IntegrityError);
    await expect(
      repo.saveBill({ ...monthly, profileId: 'nope' }),
    ).rejects.toThrow(IntegrityError);
    expect(await repo.listBills()).toEqual([]);
  });

  it('refuses to delete a section or profile in use', async () => {
    await repo.saveBill(monthly);
    await expect(repo.deleteSection('s1')).rejects.toThrow(IntegrityError);
    await expect(repo.deleteProfile('p1')).rejects.toThrow(IntegrityError);
    await repo.deleteBill('b1');
    await repo.deleteSection('s1');
    await repo.deleteProfile('p1');
    expect(await repo.listSections()).toEqual([]);
    expect(await repo.listProfiles()).toEqual([]);
  });

  it('keys occurrences by bill and period', async () => {
    await repo.saveBill(monthly);
    await repo.saveOccurrence({
      billId: 'b1',
      periodKey: '2026-10',
      amount: 5000,
    });
    await repo.saveOccurrence({
      billId: 'b1',
      periodKey: '2026-10',
      amount: 5000,
      paidAt: '2026-11-10',
    });
    expect(await repo.listOccurrences('b1')).toEqual([
      {
        billId: 'b1',
        periodKey: '2026-10',
        amount: 5000,
        paidAt: '2026-11-10',
        updatedAt: '2026-11-13T10:00:00.000Z',
      },
    ]);
  });

  it('drops an occurrence once it carries no user data', async () => {
    await repo.saveBill(monthly);
    await repo.saveOccurrence({
      billId: 'b1',
      periodKey: '2026-10',
      note: 'x',
    });
    expect(
      await repo.saveOccurrence({ billId: 'b1', periodKey: '2026-10' }),
    ).toBeUndefined();
    expect(await repo.getOccurrence('b1', '2026-10')).toBeUndefined();
  });

  it('refuses an occurrence of a missing bill', async () => {
    await expect(
      repo.saveOccurrence({ billId: 'nope', periodKey: '2026-10', amount: 1 }),
    ).rejects.toThrow(IntegrityError);
  });

  it('deletes occurrences with their bill', async () => {
    await repo.saveBill(monthly);
    await repo.saveBill({ ...monthly, id: 'b2' });
    await repo.saveOccurrence({
      billId: 'b1',
      periodKey: '2026-10',
      amount: 1,
    });
    await repo.saveOccurrence({
      billId: 'b2',
      periodKey: '2026-10',
      amount: 2,
    });
    await repo.deleteBill('b1');
    expect((await repo.listOccurrences()).map((o) => o.billId)).toEqual(['b2']);
  });

  it('replaces everything and keeps the imported updatedAt', async () => {
    await repo.saveSection({ ...section, id: 's9', order: 1 });
    await repo.replaceAll(dataset());
    const dump = await repo.dump();
    expect(dump).toEqual(dataset());
    expect(dump.bills[0]?.updatedAt).toBe(T0);
  });

  it('merges newer records and leaves the others alone', async () => {
    await repo.replaceAll(dataset());
    await repo.saveSection({ ...section, name: 'Moj stan' });
    const incoming = dataset();
    const [b] = incoming.bills;
    if (!b) throw new Error('fixture');
    b.title = 'Novo';
    b.updatedAt = '2026-11-02T10:00:00.000Z';
    expect(await repo.merge(incoming)).toEqual({
      added: 0,
      updated: 1,
      kept: 4,
    });
    expect((await repo.getSection('s1'))?.name).toBe('Moj stan');
    expect((await repo.getBill('b1'))?.title).toBe('Novo');
  });
});
