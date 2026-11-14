import { describe, expect, it } from 'vitest';
import {
  applyPreset,
  emptyBillDraft,
  validateBill,
  type BillContext,
  type BillDraft,
} from '../../../../src/core/forms/bill';
import type { Profile, Section } from '../../../../src/core/model';
import { periods } from '../../../../src/core/schedule';
import { PRESET_GROUPS, findPreset } from '../../../../src/core/serbia/presets';

const section: Section = {
  id: 's1',
  name: 'Porezi',
  color: '#4a7bd0',
  order: 0,
  archived: false,
};
const profile: Profile = {
  id: 'p1',
  name: 'Petar Petrović',
  address: 'Beograd',
};
const ctx: BillContext = {
  id: 'b1',
  sections: [section],
  profiles: [profile],
  today: '2026-11-13',
};

function fromPreset(id: string, today = ctx.today): BillDraft {
  const found = findPreset(id);
  if (!found) throw new Error(`no preset ${id}`);
  return applyPreset(emptyBillDraft('s1', 'p1', today), found.preset);
}

/** What the payer still has to copy from the tax decision or the bill. */
function userValues(d: BillDraft): Partial<BillDraft> {
  return {
    ...(d.amountMode === 'fixed' ? { amount: '5.000,00' } : {}),
    ...(d.reference === '' ? { reference: '501123456789' } : {}),
    ...(d.payeeName === '' ? { payeeName: 'Grad Beograd' } : {}),
    referenceVars: { NAPLATNI: '2009317725' },
  };
}

const ALL = PRESET_GROUPS.flatMap((g) => g.bills.map((b) => [b.id] as const));

describe('presets', () => {
  it('have unique ids and a check date', () => {
    expect(new Set(ALL.map(([id]) => id)).size).toBe(ALL.length);
    for (const g of PRESET_GROUPS) {
      expect(g.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(g.sources.length).toBeGreaterThan(0);
    }
  });

  it.each(ALL)('%s asks only for what the payer has to supply', (id) => {
    const d = fromPreset(id);
    const { errors } = validateBill(d, ctx);
    expect(
      Object.keys(errors).every((k) =>
        ['amount', 'reference', 'payeeName', 'referenceVars.NAPLATNI'].includes(
          k,
        ),
      ),
    ).toBe(true);
    const r = validateBill({ ...d, ...userValues(d) }, ctx);
    expect(r.errors).toEqual({});
    expect(r.warnings).toEqual({});
    expect(r.value?.sectionId).toBe('s1');
  });

  it('dues paušal on the 15th of the next month, moved past holidays', () => {
    const d = fromPreset('pausal-pension', '2026-01-10');
    expect(d.start).toBe('2026-01');
    const bill = validateBill({ ...d, ...userValues(d) }, ctx).value;
    if (!bill) throw new Error('invalid');
    const [jan, feb] = periods(bill.schedule, '2026-01-01', '2026-03-01');
    expect(jan?.dueDate).toBe('2026-02-18');
    expect(feb?.dueDate).toBe('2026-03-16');
  });

  it('starts property tax at the quarter and dues it on its 45th day', () => {
    const d = fromPreset('property-tax');
    expect(d.start).toBe('2026-10');
    const bill = validateBill({ ...d, ...userValues(d) }, ctx).value;
    if (!bill) throw new Error('invalid');
    const [q4, q1] = periods(bill.schedule, '2026-10-01', '2027-04-01');
    expect(q4).toMatchObject({ periodKey: '2026-Q4', dueDate: '2026-11-16' });
    expect(q1).toMatchObject({ periodKey: '2027-Q1', dueDate: '2027-02-17' });
  });

  it('builds the EPS poziv na broj from the billing period', () => {
    const d = fromPreset('eps-beograd', '2026-05-10');
    const r = validateBill(
      { ...d, ...userValues(d) },
      {
        ...ctx,
        today: '2026-05-10',
      },
    );
    expect(r.preview.reference).toEqual({
      periodKey: '2026-05',
      value: '9302009317725' + '2605',
    });
  });
});
