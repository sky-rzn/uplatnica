import type { Bill, Schedule } from '../../../src/core/model';

export function bill(schedule: Schedule, extra: Partial<Bill> = {}): Bill {
  return {
    id: 'b1',
    sectionId: 's1',
    profileId: 'p1',
    title: 'Test',
    payee: { name: 'Primalac', account: '845000000040484987' },
    paymentCode: '289',
    purpose: 'Test',
    amountMode: 'fixed',
    amount: 100000,
    currency: 'RSD',
    schedule,
    archived: false,
    ...extra,
  };
}
