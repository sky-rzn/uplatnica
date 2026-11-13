import type { IsoDate, YearMonth } from './date';
import type { Para } from './money';

export interface Profile {
  id: string;
  name: string;
  address: string;
  jmbg?: string;
  pib?: string;
}

export interface Section {
  id: string;
  name: string;
  color: string;
  order: number;
  archived: boolean;
}

export interface Payee {
  name: string;
  address?: string;
  account: string;
}

export type DueRule =
  { day: number | 'last'; monthOffset?: number } | { daysFromStart: number };

export type EveryMonths = 1 | 2 | 3 | 4 | 6 | 12;

export type Schedule =
  | {
      kind: 'periodic';
      everyMonths: EveryMonths;
      due: DueRule;
      start: YearMonth;
      end?: YearMonth;
      shiftToWorkday?: boolean;
    }
  | { kind: 'dates'; dates: IsoDate[] };

export type ReferenceModel = '97' | '11' | '';

export interface Bill {
  id: string;
  sectionId: string;
  profileId: string;
  title: string;
  payee: Payee;
  paymentCode: string;
  purpose: string;
  model?: ReferenceModel;
  referenceTemplate?: string;
  referenceVars?: Record<string, string>;
  amountMode: 'fixed' | 'variable';
  amount?: Para;
  currency: 'RSD';
  schedule: Schedule;
  graceDays?: number;
  notes?: string;
  archived: boolean;
}

export interface Occurrence {
  billId: string;
  periodKey: string;
  dueDate?: IsoDate;
  amount?: Para;
  reference?: string;
  paidAt?: IsoDate;
  paidAmount?: Para;
  note?: string;
}
