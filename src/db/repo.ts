import type { Bill, Occurrence, Profile, Section } from '../core/model';
import { changesBackup, fullBackup } from '../io/export';
import { mergeDatasets, occurrenceKey, type MergeStats } from '../io/merge';
import type { Device, SyncMessage } from '../io/sync';
import type {
  Dataset,
  OccurrenceKey,
  Peer,
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

export class OwnMessageError extends Error {
  override name = 'OwnMessageError';
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
    await this.log([{ table, key }], stored.updatedAt);
    return stored;
  }

  private async bury(table: TableName, key: string): Promise<void> {
    const deletedAt = this.now().toISOString();
    await this.db.tombstones.put({ table, key, deletedAt });
    await this.log([{ table, key }], deletedAt);
  }

  private log(
    refs: readonly { table: TableName; key: string }[],
    at = this.now().toISOString(),
  ): Promise<unknown> {
    return this.db.changes.bulkPut(refs.map((r) => ({ ...r, at })));
  }

  listProfiles(): Promise<Stored<Profile>[]> {
    return this.db.profiles.toArray();
  }

  getProfile(id: string): Promise<Stored<Profile> | undefined> {
    return this.db.profiles.get(id);
  }

  saveProfile(profile: Profile): Promise<Stored<Profile>> {
    const { db } = this;
    return db.transaction('rw', db.profiles, db.tombstones, db.changes, () =>
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
      db.changes,
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
    return db.transaction('rw', db.sections, db.tombstones, db.changes, () =>
      this.put('sections', section.id, (s) => db.sections.put(s), section),
    );
  }

  /** Sets order to each section's position in ids. */
  reorderSections(ids: readonly string[]): Promise<void> {
    const { db } = this;
    return db.transaction('rw', db.sections, db.changes, async () => {
      const sections = (await db.sections.bulkGet([...ids])).flatMap((s, i) =>
        s && s.order !== i ? [this.stamp({ ...s, order: i })] : [],
      );
      await db.sections.bulkPut(sections);
      await this.log(sections.map((s) => ({ table: 'sections', key: s.id })));
    });
  }

  deleteSection(id: string): Promise<void> {
    const { db } = this;
    return db.transaction(
      'rw',
      db.sections,
      db.bills,
      db.tombstones,
      db.changes,
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
      db.changes,
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
      db.changes,
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
      db.changes,
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
    return db.transaction(
      'rw',
      db.occurrences,
      db.tombstones,
      db.changes,
      async () => {
        if (!(await db.occurrences.get([billId, periodKey]))) return;
        await db.occurrences.delete([billId, periodKey]);
        await this.bury('occurrences', occurrenceKey({ billId, periodKey }));
      },
    );
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

  /**
   * Writes the records as they are, keeping their updatedAt. The device
   * starts over under a new identity, as what other devices know it holds
   * no longer stands.
   */
  replaceAll(data: Dataset): Promise<void> {
    const { db } = this;
    const local = [db.changes, db.peers, db.meta];
    return db.transaction('rw', [...this.tables(), ...local], async () => {
      await Promise.all([...this.tables(), ...local].map((t) => t.clear()));
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
    return db.transaction('rw', [...this.tables(), db.changes], async () => {
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
      const written: { table: TableName; key: string }[] = [
        ...put.profiles.map((p) => ({ table: 'profiles' as const, key: p.id })),
        ...put.sections.map((x) => ({ table: 'sections' as const, key: x.id })),
        ...put.bills.map((b) => ({ table: 'bills' as const, key: b.id })),
        ...put.occurrences.map((o) => ({
          table: 'occurrences' as const,
          key: occurrenceKey(o),
        })),
      ];
      await db.tombstones.bulkDelete(written.map((w) => [w.table, w.key]));
      await db.tombstones.bulkPut(put.tombstones);
      await this.log([...written, ...put.tombstones]);
      return stats;
    });
  }

  /** This device as others know it, created on first use. */
  device(name = ''): Promise<Device> {
    const { db } = this;
    return db.transaction('rw', db.meta, async () => {
      const stored = await db.meta.get('device');
      if (stored) return stored.value;
      const value = { id: newId(), name };
      await db.meta.put({ key: 'device', value });
      return value;
    });
  }

  async getDevice(): Promise<Device | undefined> {
    return (await this.db.meta.get('device'))?.value;
  }

  async renameDevice(name: string): Promise<void> {
    const { db } = this;
    await db.transaction('rw', db.meta, async () => {
      const value = await this.device(name);
      await db.meta.put({ key: 'device', value: { ...value, name } });
    });
  }

  listPeers(): Promise<Peer[]> {
    return this.db.peers.toArray();
  }

  /**
   * The message for the peer: what changed here since the last message it
   * merged, or everything for a device not synced with yet.
   */
  outgoing(peerId: string | null): Promise<SyncMessage> {
    const { db } = this;
    const now = this.now();
    return db.transaction(
      'r',
      [...this.tables(), db.changes, db.peers, db.meta],
      async () => {
        const device = (await db.meta.get('device'))?.value;
        if (!device) throw new Error('device() has not been called');
        const peer = peerId === null ? undefined : await db.peers.get(peerId);
        const data = await this.dump();
        let backup = fullBackup(data, now);
        if (peer?.acked) {
          const since = await db.changes
            .where('at')
            .aboveOrEqual(peer.acked)
            .toArray();
          const keys = new Set(
            since.map((c) => JSON.stringify([c.table, c.key])),
          );
          backup = changesBackup(
            data,
            (table, key) => keys.has(JSON.stringify([table, key])),
            now,
          );
        }
        return {
          device,
          ...(peer?.received ? { ack: peer.received } : {}),
          backup,
        };
      },
    );
  }

  /** Merges a message from another device and remembers what each side holds. */
  acceptSync(message: SyncMessage): Promise<MergeStats & { peer: Peer }> {
    const { db } = this;
    return db.transaction(
      'rw',
      [...this.tables(), db.changes, db.peers, db.meta],
      async () => {
        const own = (await db.meta.get('device'))?.value;
        if (own?.id === message.device.id) throw new OwnMessageError();
        const stats = await this.merge(message.backup);
        const before = await db.peers.get(message.device.id);
        const acked = [before?.acked, message.ack]
          .filter((a) => a !== undefined)
          .sort()
          .at(-1);
        const peer: Peer = {
          id: message.device.id,
          name: message.device.name,
          received: message.backup.exportedAt,
          ...(acked !== undefined ? { acked } : {}),
          syncedAt: this.now().toISOString(),
        };
        await db.peers.put(peer);
        return { ...stats, peer };
      },
    );
  }

  private tables() {
    const { db } = this;
    return [
      db.profiles,
      db.sections,
      db.bills,
      db.occurrences,
      db.tombstones,
      db.changes,
    ] as const;
  }
}
