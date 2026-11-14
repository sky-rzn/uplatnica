import type { DueRule, EveryMonths, ReferenceModel } from '../../model';
import pausal from './pausal.json';
import propertyTax from './property-tax.json';
import utilities from './utilities.json';

export type PresetGroupId = 'pausal' | 'property-tax' | 'utilities';

export interface BillPreset {
  id: string;
  title: string;
  /** Empty when it differs between payers and comes from their own papers. */
  payeeName: string;
  account: string;
  paymentCode: string;
  purpose: string;
  model: ReferenceModel;
  reference?: string;
  amountMode: 'fixed' | 'variable';
  everyMonths: EveryMonths;
  due: DueRule;
  shiftToWorkday: boolean;
}

export interface PresetGroup {
  group: PresetGroupId;
  /** When the payment details were last checked against the sources. */
  verifiedAt: string;
  sources: string[];
  bills: BillPreset[];
}

export const PRESET_GROUPS = [pausal, propertyTax, utilities] as PresetGroup[];

export function findPreset(
  id: string,
): { group: PresetGroup; preset: BillPreset } | undefined {
  for (const group of PRESET_GROUPS) {
    const preset = group.bills.find((b) => b.id === id);
    if (preset) return { group, preset };
  }
  return undefined;
}
