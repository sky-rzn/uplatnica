import Dexie, { type Table } from 'dexie';
import type { Bill, Occurrence, Profile, Section } from '../core/model';

export const DB_NAME = 'uplatnica';

export type Stored<T> = T & { updatedAt: string };

export type TableName = 'profiles' | 'sections' | 'bills' | 'occurrences';

/**
 * Marks a deleted record so that a merge deletes it on other devices too.
 * The key of an occurrence is occurrenceKey().
 */
export interface Tombstone {
  table: TableName;
  key: string;
  deletedAt: string;
}

export interface Dataset {
  profiles: Stored<Profile>[];
  sections: Stored<Section>[];
  bills: Stored<Bill>[];
  occurrences: Stored<Occurrence>[];
  tombstones: Tombstone[];
}

export type OccurrenceKey = [billId: string, periodKey: string];

export class UplatnicaDb extends Dexie {
  declare profiles: Table<Stored<Profile>, string>;
  declare sections: Table<Stored<Section>, string>;
  declare bills: Table<Stored<Bill>, string>;
  declare occurrences: Table<Stored<Occurrence>, OccurrenceKey>;
  declare tombstones: Table<Tombstone, [TableName, string]>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(1).stores({
      profiles: 'id',
      sections: 'id, order',
      bills: 'id, sectionId, profileId',
      occurrences: '[billId+periodKey], billId',
    });
    this.version(2).stores({ tombstones: '[table+key]' });
  }
}
