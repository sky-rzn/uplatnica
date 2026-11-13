import { describe, expect, it } from 'vitest';
import type { Bill, Profile } from '../../../../src/core/model';
import { resolveOccurrence } from '../../../../src/core/schedule';
import {
  buildSlip,
  slipInput,
  wrapText,
} from '../../../../src/core/uplatnica/slip';
import { bill as makeBill } from '../fixtures';

const infostan: Bill = makeBill(
  { kind: 'periodic', everyMonths: 1, due: { day: 'last' }, start: '2026-01' },
  {
    payee: {
      name: 'JKP INFOSTAN TEHNOLOGIJE BEOGRAD',
      address: 'Danijelova 33, Beograd',
      account: '200-2206180101000-48',
    },
    paymentCode: '122',
    purpose: 'OBJEDINJENA NAPLATA',
    model: '11',
    amountMode: 'variable',
  },
);

const profile: Profile = {
  id: 'p1',
  name: 'Petar Petrović',
  address: 'Knez Mihailova 1\nBeograd',
};

describe('wrapText', () => {
  it('breaks at spaces, keeps existing line breaks and cuts long words', () => {
    expect(wrapText('jedan dva tri četiri', 9)).toEqual([
      'jedan dva',
      'tri',
      'četiri',
    ]);
    expect(wrapText('a\n\nb  c', 9)).toEqual(['a', 'b c']);
    expect(wrapText('ab 0123456789012', 5)).toEqual([
      'ab',
      '01234',
      '56789',
      '012',
    ]);
  });
});

describe('buildSlip', () => {
  it('reproduces the code printed on a real Infostan bill', () => {
    const slip = buildSlip({
      bill: infostan,
      profile: undefined,
      amount: 128760,
      reference: '804071936013-26093-1',
    });
    expect(slip.qr).toMatchObject({
      ok: true,
      text: 'K:PR|V:01|C:1|R:200220618010100048|N:JKP INFOSTAN TEHNOLOGIJE BEOGRAD|I:RSD1287,60|SF:122|S:OBJEDINJENA NAPLATA|RO:11804071936013-26093-1',
    });
    expect(slip.data).toEqual({
      payer: [],
      purpose: ['OBJEDINJENA NAPLATA'],
      payee: ['JKP INFOSTAN TEHNOLOGIJE BEOGRAD', 'Danijelova 33, Beograd'],
      paymentCode: '122',
      currency: 'RSD',
      amount: '=1.287,60',
      account: '200-2206180101000-48',
      model: '11',
      reference: '804071936013-26093-1',
    });
    expect(slip.warnings).toEqual([]);
  });

  it('puts the payer on paper and, transliterated, into the code', () => {
    const slip = buildSlip({
      bill: infostan,
      profile: { ...profile, name: 'Петар Петровић' },
      amount: 100,
      reference: undefined,
    });
    expect(slip.data.payer).toEqual([
      'Петар Петровић',
      'Knez Mihailova 1',
      'Beograd',
    ]);
    expect(slip.data.model).toBe('');
    expect(slip.qr?.ok && slip.qr.text).toContain(
      '|P:Petar Petrović\r\nKnez Mihailova 1\r\nBeograd|',
    );
  });

  it('keeps only the payer name in the code when the address does not fit', () => {
    const slip = buildSlip({
      bill: infostan,
      profile: { ...profile, address: 'Ulica '.repeat(14) },
      amount: 100,
      reference: undefined,
    });
    expect(slip.qr?.ok && slip.qr.text).toContain('|P:Petar Petrović|');
    expect(slip.warnings).toEqual(['overflow']);
  });

  it('leaves the amount blank and skips the code while the amount is unknown', () => {
    const slip = buildSlip({
      bill: infostan,
      profile,
      amount: undefined,
      reference: undefined,
    });
    expect(slip.data.amount).toBe('');
    expect(slip.qr).toBeNull();
    expect(slip.warnings).toEqual(['no-amount']);
  });

  it('reports what keeps the code from being built', () => {
    const slip = buildSlip({
      bill: {
        ...infostan,
        payee: { ...infostan.payee, account: '200-2206180101000-49' },
      },
      profile,
      amount: 100,
      reference: undefined,
    });
    expect(slip.qr).toEqual({
      ok: false,
      issues: [{ tag: 'R', code: 'checksum' }],
    });
    expect(slip.data.account).toBe('200-2206180101000-49');
  });
});

describe('slipInput', () => {
  const fixed = makeBill(
    { kind: 'periodic', everyMonths: 1, due: { day: 20 }, start: '2026-01' },
    { model: '97', referenceTemplate: '{YYYY}{MM}' },
  );

  it('asks for what is left after a short payment', () => {
    const occ = resolveOccurrence(
      fixed,
      [
        {
          billId: 'b1',
          periodKey: '2026-11',
          paidAt: '2026-11-02',
          paidAmount: 40000,
        },
      ],
      '2026-11',
    );
    if (!occ) throw new Error('no period');
    expect(slipInput(fixed, occ, profile)).toMatchObject({
      amount: 60000,
      reference: '67202611',
    });
  });

  it('repeats the whole amount for a paid period and prefers a stored reference', () => {
    const occ = resolveOccurrence(
      fixed,
      [
        {
          billId: 'b1',
          periodKey: '2026-11',
          paidAt: '2026-11-02',
          reference: '0512',
        },
      ],
      '2026-11',
    );
    if (!occ) throw new Error('no period');
    expect(slipInput(fixed, occ, profile)).toMatchObject({
      amount: 100000,
      reference: '0512',
    });
  });
});
