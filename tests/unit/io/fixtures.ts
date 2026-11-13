import type { Dataset } from '../../../src/db/schema';
import { bill } from '../core/fixtures';

export const T0 = '2026-11-01T10:00:00.000Z';

export function dataset(): Dataset {
  return {
    profiles: [
      {
        id: 'p1',
        name: 'Petar Petrović',
        address: 'Beograd',
        jmbg: '0101990710006',
        updatedAt: T0,
      },
    ],
    sections: [
      {
        id: 's1',
        name: 'Stan',
        color: '#4a7bd0',
        order: 0,
        archived: false,
        updatedAt: T0,
      },
    ],
    bills: [
      {
        ...bill(
          {
            kind: 'periodic',
            everyMonths: 1,
            due: { day: 15 },
            start: '2026-09',
          },
          { title: 'Infostan', model: '97', referenceTemplate: '{YYYY}{MM}' },
        ),
        updatedAt: T0,
      },
    ],
    occurrences: [
      {
        billId: 'b1',
        periodKey: '2026-09',
        paidAt: '2026-09-14',
        updatedAt: T0,
      },
      {
        billId: 'b1',
        periodKey: '2026-10',
        amount: 123456,
        paidAt: '2026-10-20',
        paidAmount: 100000,
        note: 'deo; ostatak "kasnije"',
        updatedAt: T0,
      },
    ],
  };
}
