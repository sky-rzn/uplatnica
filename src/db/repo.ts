import type { Bill, Occurrence, Profile, Section } from '../core/model';
import { mergeDatasets, occurrenceKey, type MergeStats } from '../io/merge';
import type {
  Dataset,
  OccurrenceKey,
  Stored,
  TableName,
  UplatnicaDb,
} from './schema';

export class IntegrityError extends Error {
  override name = 'IntegrityError';
}

const OCCURRENCE_DATA = [
  'dueDate',
  'amount',
  'reference',
  'paidAt',
  'paidAmount',
  'note',
] as const satisfies readonly (keyof Occurrence)[];

export function hasUserData(occ: Occurrence): boolean {
  return OCCURRENCE_DATA.some((k) => occ[k] !== undefined);
}

export function newId(): string {
  return crypto.randomUUID();
}

export class Repo {
  constructor(
    readonly db: UplatnicaDb,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private stamp<T>(entity: T): Stored<T> {
    return { ...entity, updatedAt: this.now().toISOString() };
  }

  private async put<T>(
    table: TableName,
    key: string,
    write: (stored: Stored<T>) => Promise<unknown>,
    entity: T,
  ): Promise<Stored<T>> {
    const stored = this.stamp(entity);
    await write(stored);
    await this.db.tombstones.delete([table, key]);
    return stored;
  }

  private bury(table: TableName, key: string): Promise<unknown> {
    return this.db.tombstones.put({
      table,
      key,
      deletedAt: this.now().toISOString(),
    });
  }

  listProfiles(): Promise<Stored<Profile>[]> {
    return this.db.profiles.toArray();
  }

  getProfile(id: string): Promise<Stored<Profile> | undefined> {
    return this.db.profiles.get(id);
  }

  saveProfile(profile: Profile): Promise<Stored<Profile>> {
    const { db } = this;
    return db.transaction('rw', db.profiles, db.tombstones, () =>
      this.put('profiles', profile.id, (p) => db.profiles.put(p), profile),
    );
  }

  deleteProfile(id: string): Promise<void> {
    const { db } = this;
    return db.transaction(
      'rw',
      db.profiles,
      db.bills,
      db.tombstones,
      async () => {
        if ((await db.bills.where('profileId').equals(id).count()) > 0)
          throw new IntegrityError(`profile ${id} has bills`);
        await db.profiles.delete(id);
        await this.bury('profiles', id);
      },
    );
  }

  listSections(): Promise<Stored<Section>[]> {
    return this.db.sections.orderBy('order').toArray();
  }

  getSection(id: string): Promise<Stored<Section> | undefined> {
    return this.db.sections.get(id);
  }

  saveSection(section: Section): Promise<Stored<Section>> {
    const { db } = this;
    return db.transaction('rw', db.sections, db.tombstones, () =>
      this.put('sections', section.id, (s) => db.sections.put(s), section),
    );
  }

  /** Sets order to each section's position in ids. */
  reorderSections(ids: readonly string[]): Promise<void> {
    const { db } = this;
    return db.transaction('rw', db.sections, async () => {
      const sections = await db.sections.bulkGet([...ids]);
      await db.sections.bulkPut(
        sections.flatMap((s, i) =>
          s && s.order !== i ? [this.stamp({ ...s, order: i })] : [],
        ),
      );
    });
  }

  deleteSection(id: string): Promise<void> {
    const { db } = this;
    return db.transaction(
      'rw',
      db.sections,
      db.bills,
      db.tombstones,
      async () => {
        if ((await db.bills.where('sectionId').equals(id).count()) > 0)
          throw new IntegrityError(`section ${id} has bills`);
        await db.sections.delete(id);
        await this.bury('sections', id);
      },
    );
  }

  listBills(sectionId?: string): Promise<Stored<Bill>[]> {
    return sectionId === undefined
      ? this.db.bills.toArray()
      : this.db.bills.where('sectionId').equals(sectionId).toArray();
  }

  getBill(id: string): Promise<Stored<Bill> | undefined> {
    return this.db.bills.get(id);
  }

  saveBill(bill: Bill): Promise<Stored<Bill>> {
    const { db } = this;
    return db.transaction(
      'rw',
      db.bills,
      db.sections,
      db.profiles,
      db.tombstones,
      async () => {
        if (!(await db.sections.get(bill.sectionId)))
          throw new IntegrityError(`section ${bill.sectionId} does not exist`);
        if (!(await db.profiles.get(bill.profileId)))
          throw new IntegrityError(`profile ${bill.profileId} does not exist`);
        return this.put('bills', bill.id, (b) => db.bills.put(b), bill);
      },
    );
  }

  deleteBill(id: string): Promise<void> {
    const { db } = this;
    return db.transaction(
      'rw',
      db.bills,
      db.occurrences,
      db.tombstones,
      async () => {
        await db.occurrences.where('billId').equals(id).delete();
        await db.bills.delete(id);
        await this.bury('bills', id);
      },
    );
  }

  listOccurrences(billId?: string): Promise<Stored<Occurrence>[]> {
    return billId === undefined
      ? this.db.occurrences.toArray()
      : this.db.occurrences.where('billId').equals(billId).toArray();
  }

  getOccurrence(
    billId: string,
    periodKey: string,
  ): Promise<Stored<Occurrence> | undefined> {
    return this.db.occurrences.get([billId, periodKey]);
  }

  saveOccurrence(occ: Occurrence): Promise<Stored<Occurrence> | undefined> {
    const { db } = this;
    return db.transaction(
      'rw',
      db.occurrences,
      db.bills,
      db.tombstones,
      async () => {
        if (!hasUserData(occ)) {
          await this.deleteOccurrence(occ.billId, occ.periodKey);
          return undefined;
        }
        if (!(await db.bills.get(occ.billId)))
          throw new IntegrityError(`bill ${occ.billId} does not exist`);
        return this.put(
          'occurrences',
          occurrenceKey(occ),
          (o) => db.occurrences.put(o),
          occ,
        );
      },
    );
  }

  deleteOccurrence(billId: string, periodKey: string): Promise<void> {
    const { db } = this;
    return db.transaction('rw', db.occurrences, db.tombstones, async () => {
      if (!(await db.occurrences.get([billId, periodKey]))) return;
      await db.occurrences.delete([billId, periodKey]);
      await this.bury('occurrences', occurrenceKey({ billId, periodKey }));
    });
  }

  dump(): Promise<Dataset> {
    const { db } = this;
    return db.transaction('r', this.tables(), async () => ({
      profiles: await db.profiles.toArray(),
      sections: await db.sections.orderBy('order').toArray(),
      bills: await db.bills.toArray(),
      occurrences: await db.occurrences.toArray(),
      tombstones: await db.tombstones.toArray(),
    }));
  }

  /** Writes the records as they are, keeping their updatedAt. */
  replaceAll(data: Dataset): Promise<void> {
    const { db } = this;
    return db.transaction('rw', this.tables(), async () => {
      await Promise.all(this.tables().map((t) => t.clear()));
      await db.profiles.bulkAdd(data.profiles);
      await db.sections.bulkAdd(data.sections);
      await db.bills.bulkAdd(data.bills);
      await db.occurrences.bulkAdd(data.occurrences);
      await db.tombstones.bulkAdd(data.tombstones);
    });
  }

  /** Takes the changes and deletions the incoming data has newer. */
  merge(incoming: Dataset): Promise<MergeStats> {
    const { db } = this;
    return db.transaction('rw', this.tables(), async () => {
      const { put, drop, stats } = mergeDatasets(await this.dump(), incoming);
      const keys = (table: TableName) =>
        drop.filter((r) => r.table === table).map((r) => r.key);
      await db.occurrences.bulkDelete(
        keys('occurrences').map((k) => JSON.parse(k) as OccurrenceKey),
      );
      await db.bills.bulkDelete(keys('bills'));
      await db.sections.bulkDelete(keys('sections'));
      await db.profiles.bulkDelete(keys('profiles'));
      await db.profiles.bulkPut(put.profiles);
      await db.sections.bulkPut(put.sections);
      await db.bills.bulkPut(put.bills);
      await db.occurrences.bulkPut(put.occurrences);
      await db.tombstones.bulkDelete([
        ...put.profiles.map((p): [TableName, string] => ['profiles', p.id]),
        ...put.sections.map((s): [TableName, string] => ['sections', s.id]),
        ...put.bills.map((b): [TableName, string] => ['bills', b.id]),
        ...put.occurrences.map((o): [TableName, string] => [
          'occurrences',
          occurrenceKey(o),
        ]),
      ]);
      await db.tombstones.bulkPut(put.tombstones);
      return stats;
    });
  }

  private tables() {
    const { db } = this;
    return [
      db.profiles,
      db.sections,
      db.bills,
      db.occurrences,
      db.tombstones,
    ] as const;
  }
}
