import * as z from 'zod/mini';
import { isIsoDate, parseYearMonth } from '../core/date';
import { MAX_PARA } from '../core/money';
import { periodKeyBounds } from '../core/schedule';
import { isValidAccount } from '../core/serbia/account';

const id = z.string().check(z.minLength(1));
const text = z.string();
const isoDate = z.string().check(z.refine(isIsoDate));
const yearMonth = z.string().check(z.refine((s) => parseYearMonth(s) !== null));
const para = z.int().check(z.gte(0), z.lte(MAX_PARA));
const updatedAt = z.iso.datetime();

function int(min: number, max: number) {
  return z.int().check(z.gte(min), z.lte(max));
}

const profile = z.strictObject({
  id,
  name: text,
  address: text,
  jmbg: z.optional(text),
  pib: z.optional(text),
  updatedAt,
});

const section = z.strictObject({
  id,
  name: text,
  color: z.string().check(z.regex(/^#[0-9a-fA-F]{6}$/)),
  order: z.int(),
  archived: z.boolean(),
  updatedAt,
});

const dueRule = z.union([
  z.strictObject({
    day: z.union([int(1, 31), z.literal('last')]),
    monthOffset: z.optional(int(0, 12)),
  }),
  z.strictObject({ daysFromStart: int(0, 366) }),
]);

const schedule = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('periodic'),
    everyMonths: z.literal([1, 2, 3, 4, 6, 12]),
    due: dueRule,
    start: yearMonth,
    end: z.optional(yearMonth),
    shiftToWorkday: z.optional(z.boolean()),
  }),
  z.strictObject({
    kind: z.literal('dates'),
    dates: z.array(isoDate).check(z.minLength(1)),
  }),
]);

const bill = z.strictObject({
  id,
  sectionId: id,
  profileId: id,
  title: text,
  payee: z.strictObject({
    name: text,
    address: z.optional(text),
    account: z.string().check(z.refine(isValidAccount)),
  }),
  paymentCode: z.string().check(z.regex(/^\d{3}$/)),
  purpose: text,
  model: z.optional(z.enum(['97', '11', ''])),
  referenceTemplate: z.optional(text),
  referenceVars: z.optional(z.record(z.string(), text)),
  amountMode: z.enum(['fixed', 'variable']),
  amount: z.optional(para),
  currency: z.literal('RSD'),
  schedule,
  graceDays: z.optional(z.int().check(z.gte(0))),
  notes: z.optional(text),
  archived: z.boolean(),
  updatedAt,
});

const occurrence = z.strictObject({
  billId: id,
  periodKey: z.string().check(z.refine((k) => periodKeyBounds(k) !== null)),
  dueDate: z.optional(isoDate),
  amount: z.optional(para),
  reference: z.optional(text),
  paidAt: z.optional(isoDate),
  paidAmount: z.optional(para),
  note: z.optional(text),
  updatedAt,
});

export const backupSchema = z.strictObject({
  app: z.literal('uplatnica'),
  schemaVersion: z.number(),
  exportedAt: z.iso.datetime(),
  partial: z.optional(z.literal(true)),
  profiles: z.array(profile),
  sections: z.array(section),
  bills: z.array(bill),
  occurrences: z.array(occurrence),
});
