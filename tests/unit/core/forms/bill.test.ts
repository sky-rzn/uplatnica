import { describe, expect, it } from 'vitest';
import {
  billToDraft,
  customPlaceholders,
  emptyBillDraft,
  validateBill,
  type BillContext,
  type BillDraft,
} from '../../../../src/core/forms/bill';
import type { Profile, Section } from '../../../../src/core/model';
import { formatAmount } from '../../../../src/core/money';

const section: Section = {
  id: 's1',
  name: 'Stan',
  color: '#4a7bd0',
  order: 0,
  archived: false,
};
const profile: Profile = {
  id: 'p1',
  name: 'Petar Petrović',
  address: 'Beograd',
  jmbg: '0101990710008',
};
const ctx: BillContext = {
  id: 'b1',
  sections: [section],
  profiles: [profile],
  today: '2026-11-13',
};

function draft(extra: Partial<BillDraft> = {}): BillDraft {
  return {
    ...emptyBillDraft('s1', 'p1', ctx.today),
    title: 'Infostan',
    payeeName: 'JKP Infostan tehnologije',
    account: '160-602-16',
    purpose: 'Objedinjena naplata',
    amount: '1.287,60',
    ...extra,
  };
}

describe('validateBill', () => {
  it('builds a monthly bill from a minimal draft', () => {
    const r = validateBill(draft(), ctx);
    expect(r.errors).toEqual({});
    expect(r.value).toEqual({
      id: 'b1',
      sectionId: 's1',
      profileId: 'p1',
      title: 'Infostan',
      payee: {
        name: 'JKP Infostan tehnologije',
        account: '160000000000060216',
      },
      paymentCode: '289',
      purpose: 'Objedinjena naplata',
      amountMode: 'fixed',
      amount: 128760,
      currency: 'RSD',
      schedule: {
        kind: 'periodic',
        everyMonths: 1,
        due: { day: 15 },
        start: '2026-11',
      },
      archived: false,
    });
  });

  it('reports every missing required field', () => {
    const r = validateBill(
      draft({
        title: ' ',
        sectionId: '',
        profileId: 'gone',
        payeeName: '',
        account: '',
        paymentCode: '',
        purpose: '',
        amount: '',
        start: '',
      }),
      ctx,
    );
    expect(r.value).toBeNull();
    expect(r.errors).toEqual({
      title: { code: 'required' },
      sectionId: { code: 'required' },
      profileId: { code: 'not-found' },
      payeeName: { code: 'required' },
      account: { code: 'required' },
      paymentCode: { code: 'required' },
      purpose: { code: 'required' },
      amount: { code: 'required' },
      start: { code: 'required' },
    });
  });

  it('checks the account', () => {
    expect(validateBill(draft({ account: '160-602-17' }), ctx).errors).toEqual({
      account: { code: 'account-checksum' },
    });
    expect(validateBill(draft({ account: '160602' }), ctx).errors).toEqual({
      account: { code: 'account-format' },
    });
  });

  it('checks the payment code and warns when QR cannot carry it', () => {
    expect(validateBill(draft({ paymentCode: '299' }), ctx).errors).toEqual({
      paymentCode: { code: 'payment-code' },
    });
    const r = validateBill(draft({ paymentCode: '389' }), ctx);
    expect(r.value).not.toBeNull();
    expect(r.warnings).toEqual({
      paymentCode: { code: 'payment-code-not-qr' },
    });
  });

  it('applies the IPS QR limits to the payee name and purpose', () => {
    const r = validateBill(
      draft({ payeeName: 'x'.repeat(71), purpose: 'Свrha ✓' }),
      ctx,
    );
    expect(r.errors).toEqual({
      payeeName: { code: 'too-long', max: 70 },
      purpose: { code: 'chars' },
    });
    expect(
      validateBill(draft({ purpose: 'Комуналије' }), ctx).value?.purpose,
    ).toBe('Комуналије');
  });

  it('needs an amount only for fixed bills', () => {
    expect(validateBill(draft({ amount: '0' }), ctx).errors).toEqual({
      amount: { code: 'amount' },
    });
    expect(validateBill(draft({ amount: '12,345,6' }), ctx).errors).toEqual({
      amount: { code: 'amount' },
    });
    const r = validateBill(
      draft({ amountMode: 'variable', amount: 'junk' }),
      ctx,
    );
    expect(r.value?.amount).toBeUndefined();
  });

  it('builds the due rules', () => {
    const due = (extra: Partial<BillDraft>) => {
      const s = validateBill(draft(extra), ctx).value?.schedule;
      return s?.kind === 'periodic' ? s.due : undefined;
    };
    expect(due({ dueKind: 'last', monthOffset: '1' })).toEqual({
      day: 'last',
      monthOffset: 1,
    });
    expect(due({ dueKind: 'daysFromStart', daysFromStart: '44' })).toEqual({
      daysFromStart: 44,
    });
    expect(validateBill(draft({ dueDay: '32' }), ctx).errors).toEqual({
      dueDay: { code: 'integer', min: 1, max: 31 },
    });
  });

  it('keeps end and the workday shift', () => {
    const r = validateBill(
      draft({
        everyMonths: 3,
        start: '2026-01',
        end: '2027-12',
        shiftToWorkday: true,
      }),
      ctx,
    );
    expect(r.value?.schedule).toEqual({
      kind: 'periodic',
      everyMonths: 3,
      due: { day: 15 },
      start: '2026-01',
      end: '2027-12',
      shiftToWorkday: true,
    });
    expect(
      validateBill(draft({ start: '2026-05', end: '2026-04' }), ctx).errors,
    ).toEqual({ end: { code: 'end-before-start' } });
    expect(validateBill(draft({ start: '2026-13' }), ctx).errors).toEqual({
      start: { code: 'month' },
    });
  });

  it('sorts and dedupes dates, skipping empty rows', () => {
    const r = validateBill(
      draft({
        scheduleKind: 'dates',
        dates: ['2027-03-31', '', '2026-12-01', '2027-03-31'],
      }),
      ctx,
    );
    expect(r.value?.schedule).toEqual({
      kind: 'dates',
      dates: ['2026-12-01', '2027-03-31'],
    });
    expect(
      validateBill(draft({ scheduleKind: 'dates', dates: [''] }), ctx).errors,
    ).toEqual({ dates: { code: 'no-dates' } });
    expect(
      validateBill(
        draft({ scheduleKind: 'dates', dates: ['2026-12-01', '2026-02-30'] }),
        ctx,
      ).errors,
    ).toEqual({ 'dates.1': { code: 'date' } });
  });

  it('previews the next due dates with the workday shift', () => {
    const r = validateBill(
      draft({
        dueKind: 'daysFromStart',
        daysFromStart: '44',
        everyMonths: 3,
        start: '2026-01',
        shiftToWorkday: true,
      }),
      ctx,
    );
    expect(r.preview.next.map((p) => [p.periodKey, p.dueDate])).toEqual([
      ['2026-Q4', '2026-11-16'],
      ['2027-Q1', '2027-02-17'],
      ['2027-Q2', '2027-05-17'],
    ]);
  });

  it('falls back to the last period of a finished schedule', () => {
    const r = validateBill(draft({ start: '2025-01', end: '2025-06' }), ctx);
    expect(r.preview.next.map((p) => p.periodKey)).toEqual(['2025-06']);
  });

  describe('poziv na broj', () => {
    it('renders the template for the next period', () => {
      const r = validateBill(
        draft({
          model: '97',
          reference: '{NAPLATNI:11}{YY}{MM}',
          referenceVars: { NAPLATNI: '2004937106', UNUSED: '1' },
          dueKind: 'day',
          dueDay: '28',
          monthOffset: '1',
          start: '2026-01',
        }),
        ctx,
      );
      expect(r.errors).toEqual({});
      expect(r.preview.reference).toEqual({
        periodKey: '2026-10',
        value: '35020049371062610',
      });
      expect(r.value?.referenceVars).toEqual({ NAPLATNI: '2004937106' });
      expect(r.value?.referenceTemplate).toBe('{NAPLATNI:11}{YY}{MM}');
    });

    it('takes JMBG from the profile', () => {
      const r = validateBill(draft({ model: '97', reference: '{JMBG}' }), ctx);
      expect(r.preview.reference?.value.slice(2)).toBe('0101990710008');
      expect(
        validateBill(draft({ model: '97', reference: '{PIB}' }), ctx).errors,
      ).toEqual({ reference: { code: 'profile-missing', field: 'PIB' } });
    });

    it('puts template errors on the field that can fix them', () => {
      expect(
        validateBill(draft({ reference: '{NAPLATNI:3}' }), ctx).errors,
      ).toEqual({ 'referenceVars.NAPLATNI': { code: 'required' } });
      expect(
        validateBill(
          draft({ reference: '{N:3}', referenceVars: { N: '12345' } }),
          ctx,
        ).errors,
      ).toEqual({ 'referenceVars.N': { code: 'template-too-long', width: 3 } });
      expect(validateBill(draft({ reference: '{YY' }), ctx).errors).toEqual({
        reference: { code: 'template-syntax' },
      });
    });

    it('needs a reference when a model is set', () => {
      expect(validateBill(draft({ model: '11' }), ctx).errors).toEqual({
        reference: { code: 'required' },
      });
      expect(
        validateBill(
          draft({ model: '11', reference: '804071936013-26094-1' }),
          ctx,
        ).errors,
      ).toEqual({ reference: { code: 'reference', reason: 'checksum' } });
      expect(
        validateBill(
          draft({ model: '11', reference: '804071936013-26093-1' }),
          ctx,
        ).errors,
      ).toEqual({});
    });

    it('warns when a model 97 reference already carries its control number', () => {
      const r = validateBill(
        draft({ model: '97', reference: '14123412' }),
        ctx,
      );
      expect(r.value).not.toBeNull();
      expect(r.warnings).toEqual({
        reference: { code: 'model97-has-control' },
      });
      expect(r.preview.reference?.value.slice(2)).toBe('14123412');
    });
  });
});

describe('customPlaceholders', () => {
  it('lists the placeholders neither the period nor the profile fills', () => {
    expect(
      customPlaceholders('{OPSTINA}{JMBG}{YY}{NAPLATNI:11}{OPSTINA}'),
    ).toEqual(['OPSTINA', 'NAPLATNI']);
  });
});

describe('billToDraft', () => {
  it.each<Partial<BillDraft>>([
    {},
    {
      model: '97',
      reference: '{NAPLATNI:11}{YY}{MM}',
      referenceVars: { NAPLATNI: '2004937106' },
      payeeAddress: 'Beograd',
      graceDays: '5',
      notes: 'Napomena',
      archived: true,
    },
    { dueKind: 'last', monthOffset: '1', everyMonths: 12, end: '2030-12' },
    { dueKind: 'daysFromStart', daysFromStart: '44', shiftToWorkday: true },
    { amountMode: 'variable', amount: '' },
    { scheduleKind: 'dates', dates: ['2026-12-01', '2027-03-31'], start: '' },
  ])('round-trips %j', (extra) => {
    const bill = validateBill(draft(extra), ctx).value;
    if (!bill) throw new Error('invalid draft');
    expect(validateBill(billToDraft(bill, formatAmount), ctx).value).toEqual(
      bill,
    );
  });
});
