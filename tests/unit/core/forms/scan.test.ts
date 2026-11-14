import { describe, expect, it } from 'vitest';
import { emptyBillDraft } from '../../../../src/core/forms/bill';
import type { OccurrenceDraft } from '../../../../src/core/forms/occurrence';
import {
  applyScanToBill,
  applyScanToOccurrence,
  matchScan,
} from '../../../../src/core/forms/scan';
import { formatAmount } from '../../../../src/core/money';
import {
  parseIpsQr,
  type ParsedIpsQr,
} from '../../../../src/core/serbia/ipsQr';
import fixtures from '../../../fixtures/ips-qr.json';
import { bill } from '../fixtures';

function real(id: string): ParsedIpsQr {
  const qr = fixtures.real.find((f) => f.id === id)?.qr ?? '';
  const r = parseIpsQr(qr);
  if (!r.ok) throw new Error(id);
  return r.value;
}

const infostan = real('infostan-2026-09');
const mts = real('mts-2026-09');
const eps = real('eps-2026-05');

const monthly = {
  kind: 'periodic',
  everyMonths: 1,
  due: { day: 15 },
  start: '2026-01',
} as const;

const blank: OccurrenceDraft = {
  amount: '',
  dueDate: '2026-10-15',
  reference: '',
  paidAt: '2026-11-13',
  paidAmount: '',
  note: '',
};

describe('applyScanToOccurrence', () => {
  it('takes the amount and the poziv na broj of the same model', () => {
    const b = bill(monthly, {
      payee: { name: 'Infostan', account: infostan.account },
      paymentCode: '122',
      model: '11',
      amountMode: 'variable',
    });
    expect(applyScanToOccurrence(blank, b, infostan, formatAmount)).toEqual({
      draft: {
        ...blank,
        amount: '1.287,60',
        reference: '804071936013-26093-1',
      },
      notes: [],
    });
  });

  it('keeps the poziv na broj when the model differs and says what else differs', () => {
    const b = bill(monthly, {
      payee: { name: 'EPS', account: '200000000075409696' },
      model: '11',
    });
    const r = applyScanToOccurrence(blank, b, eps, formatAmount);
    expect(r.draft.reference).toBe('');
    expect(r.draft.amount).toBe('2.964,18');
    expect(r.notes).toEqual([
      { code: 'model', scanned: '97', current: '11' },
      {
        code: 'account',
        scanned: '190000000009987010',
        current: '200000000075409696',
      },
    ]);
  });

  it('leaves the amount of a code without one', () => {
    const r = applyScanToOccurrence(
      { ...blank, amount: '10,00' },
      bill(monthly, { payee: { name: 'EPS', account: eps.account } }),
      { ...eps, amount: 0, model: '97' },
      formatAmount,
    );
    expect(r.draft.amount).toBe('10,00');
    expect(r.notes).toContainEqual({ code: 'no-amount' });
  });
});

describe('applyScanToBill', () => {
  const empty = emptyBillDraft('s1', 'p1', '2026-11-13');

  it('fills the payee, splitting the name from the address lines', () => {
    const { draft, notes } = applyScanToBill(empty, mts, formatAmount);
    expect(notes).toEqual([]);
    expect(draft).toMatchObject({
      title: 'Telekom Srbija A.D.',
      payeeName: 'Telekom Srbija A.D.',
      payeeAddress: 'Zorana Žunkovića 23\nBeograd',
      account: '160-602-16',
      paymentCode: '189',
      purpose: 'MTS Račun 09/2026 31415926/2',
      model: '97',
      reference: '3000114937106',
      amount: '3.249,00',
    });
  });

  it('keeps a model 11 reference whole and the title the user typed', () => {
    const { draft } = applyScanToBill(
      { ...empty, title: 'Stan' },
      infostan,
      formatAmount,
    );
    expect(draft).toMatchObject({
      title: 'Stan',
      payeeAddress: '',
      model: '11',
      reference: '804071936013-26093-1',
      paymentCode: '122',
    });
  });

  it('does not take a reference of a model the app does not know', () => {
    const { draft, notes } = applyScanToBill(
      empty,
      { ...infostan, model: '22', reference: '123' },
      formatAmount,
    );
    expect(draft.reference).toBe('');
    expect(notes).toEqual([{ code: 'unsupported-model', model: '22' }]);
  });
});

describe('matchScan', () => {
  it('finds bills by account first, then by payee name', () => {
    const byAccount = bill(monthly, {
      id: 'a',
      payee: { name: 'Bilo ko', account: eps.account },
    });
    const byName = bill(monthly, {
      id: 'n',
      payee: { name: 'ЕПС АД  Београд', account: '200000000075409696' },
    });
    const archived = { ...byAccount, id: 'x', archived: true };
    const other = bill(monthly, { id: 'o' });
    expect(
      matchScan([other, byName, archived, byAccount], eps).map((m) => [
        m.bill.id,
        m.by,
      ]),
    ).toEqual([
      ['a', 'account'],
      ['n', 'name'],
    ]);
  });
});
