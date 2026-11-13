import { describe, expect, it } from 'vitest';
import {
  occurrenceToDraft,
  periodReference,
  validateOccurrence,
  type OccurrenceContext,
} from '../../../../src/core/forms/occurrence';
import type { Bill, Occurrence } from '../../../../src/core/model';
import { formatAmount } from '../../../../src/core/money';
import { resolveOccurrences } from '../../../../src/core/schedule';
import { computeModel97 } from '../../../../src/core/serbia/reference';
import { bill } from '../fixtures';

const eps = bill(
  {
    kind: 'periodic',
    everyMonths: 1,
    due: { day: 28, monthOffset: 1 },
    start: '2026-01',
    shiftToWorkday: true,
  },
  {
    amountMode: 'variable',
    model: '97',
    referenceTemplate: '{NAPLATNI:11}{YY}{MM}',
    referenceVars: { NAPLATNI: '2004937106' },
  },
);
delete eps.amount;

function ctx(b: Bill, stored?: Partial<Occurrence>): OccurrenceContext {
  const [occ] = resolveOccurrences(
    b,
    stored ? [{ billId: b.id, periodKey: '2026-10', ...stored }] : [],
    '2026-10-01',
    '2026-11-01',
  );
  if (!occ) throw new Error('no occurrence');
  return { bill: b, occ, profile: undefined, today: '2026-11-13' };
}

describe('periodReference', () => {
  it('renders the template for the period', () => {
    expect(periodReference(eps, undefined, '2026-10-01')).toBe(
      computeModel97('020049371062610'),
    );
  });

  it('is undefined without a template or when a value is missing', () => {
    expect(
      periodReference(
        bill({ kind: 'dates', dates: [] }),
        undefined,
        '2026-10-01',
      ),
    ).toBeUndefined();
    const jmbg = { ...eps, referenceTemplate: '{JMBG}', referenceVars: {} };
    expect(periodReference(jmbg, undefined, '2026-10-01')).toBeUndefined();
  });
});

describe('occurrenceToDraft', () => {
  it('prefills the scheduled values', () => {
    const c = ctx(eps);
    expect(occurrenceToDraft(c, formatAmount)).toEqual({
      amount: '',
      dueDate: '2026-11-30',
      reference: periodReference(eps, undefined, '2026-10-01'),
      paidAt: '2026-11-13',
      paidAmount: '',
      note: '',
    });
  });

  it('prefills the stored values', () => {
    const c = ctx(eps, {
      amount: 287035,
      paidAt: '2026-11-10',
      paidAmount: 287035,
      note: 'e-banking',
    });
    expect(occurrenceToDraft(c, formatAmount)).toMatchObject({
      amount: '2.870,35',
      paidAt: '2026-11-10',
      paidAmount: '2.870,35',
      note: 'e-banking',
    });
  });
});

describe('validateOccurrence', () => {
  it('stores only what differs from the bill', () => {
    const c = ctx(eps);
    const draft = occurrenceToDraft(c, formatAmount);
    expect(validateOccurrence(draft, c, 'save').value).toEqual({
      billId: 'b1',
      periodKey: '2026-10',
    });
    expect(
      validateOccurrence(
        {
          ...draft,
          amount: '2.870,35',
          dueDate: '2026-12-01',
          note: ' e-banking ',
        },
        c,
        'save',
      ).value,
    ).toEqual({
      billId: 'b1',
      periodKey: '2026-10',
      amount: 287035,
      dueDate: '2026-12-01',
      note: 'e-banking',
    });
  });

  it('does not store the fixed amount of the bill', () => {
    const fixed = bill({
      kind: 'periodic',
      everyMonths: 1,
      due: { day: 15 },
      start: '2026-01',
    });
    const c = ctx(fixed);
    const draft = occurrenceToDraft(c, formatAmount);
    expect(
      validateOccurrence({ ...draft, amount: '1.000,00' }, c, 'save').value,
    ).toEqual({ billId: 'b1', periodKey: '2026-10' });
  });

  it('records a payment of the whole amount by default', () => {
    const c = ctx(eps);
    const draft = occurrenceToDraft(c, formatAmount);
    expect(
      validateOccurrence({ ...draft, amount: '2716.35' }, c, 'pay').value,
    ).toMatchObject({
      amount: 271635,
      paidAt: '2026-11-13',
      paidAmount: 271635,
    });
    expect(
      validateOccurrence(
        { ...draft, amount: '2716.35', paidAmount: '1000' },
        c,
        'pay',
      ).value,
    ).toMatchObject({ paidAmount: 100000 });
    expect(validateOccurrence(draft, c, 'pay').value).toEqual({
      billId: 'b1',
      periodKey: '2026-10',
      paidAt: '2026-11-13',
    });
  });

  it('keeps the payment on save and drops it on unpay', () => {
    const c = ctx(eps, {
      amount: 100000,
      paidAt: '2026-11-10',
      paidAmount: 100000,
    });
    const draft = occurrenceToDraft(c, formatAmount);
    expect(validateOccurrence(draft, c, 'save').value).toMatchObject({
      paidAt: '2026-11-10',
      paidAmount: 100000,
    });
    expect(validateOccurrence(draft, c, 'unpay').value).toEqual({
      billId: 'b1',
      periodKey: '2026-10',
      amount: 100000,
    });
  });

  it('keeps a reference typed from a paper bill', () => {
    const c = ctx(eps);
    const draft = occurrenceToDraft(c, formatAmount);
    const other = periodReference(eps, undefined, '2026-11-01') ?? '';
    expect(
      validateOccurrence({ ...draft, reference: other }, c, 'save').value
        ?.reference,
    ).toBe(other);
    expect(
      validateOccurrence({ ...draft, reference: '' }, c, 'save').value
        ?.reference,
    ).toBeUndefined();
  });

  it('reports invalid fields', () => {
    const c = ctx(eps);
    const draft = occurrenceToDraft(c, formatAmount);
    const result = validateOccurrence(
      {
        ...draft,
        amount: '1,2,3',
        dueDate: '2026-02-30',
        reference: '1102004937106',
        paidAt: '',
        paidAmount: '0',
      },
      c,
      'pay',
    );
    expect(result.value).toBeNull();
    expect(result.errors).toEqual({
      amount: { code: 'amount' },
      dueDate: { code: 'date' },
      reference: { code: 'reference', reason: 'checksum' },
      paidAt: { code: 'date' },
      paidAmount: { code: 'amount' },
    });
  });

  it('requires a reference when the template does not render', () => {
    const c = ctx({ ...eps, referenceVars: {} });
    const draft = occurrenceToDraft(c, formatAmount);
    expect(draft.reference).toBe('');
    expect(validateOccurrence(draft, c, 'save').errors).toEqual({
      reference: { code: 'required' },
    });
  });
});
