import { periodReference } from '../core/forms/occurrence';
import { formatAmountPlain, type Para } from '../core/money';
import { resolveOccurrence } from '../core/schedule';
import { formatAccountShort } from '../core/serbia/account';
import { effectiveAmount } from '../core/status';
import type { Dataset } from '../db/schema';
import { t } from '../i18n';

const BOM = '\uFEFF';

function cell(value: string): string {
  return /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function amount(para: Para | undefined): string {
  return para === undefined ? '' : formatAmountPlain(para);
}

/**
 * Paid periods, oldest payment first, as CSV the way Excel opens it in a
 * Serbian locale: ";" between fields, "," in amounts and a BOM for UTF-8.
 */
export function paymentsCsv(data: Dataset): string {
  const bills = new Map(data.bills.map((b) => [b.id, b]));
  const sections = new Map(data.sections.map((s) => [s.id, s]));
  const profiles = new Map(data.profiles.map((p) => [p.id, p]));
  const paid = data.occurrences
    .flatMap((o) => (o.paidAt === undefined ? [] : [{ o, paidAt: o.paidAt }]))
    .sort((a, b) => (a.paidAt < b.paidAt ? -1 : a.paidAt > b.paidAt ? 1 : 0));

  const rows = [t.csv.header];
  for (const { o, paidAt } of paid) {
    const bill = bills.get(o.billId);
    if (!bill) continue;
    const occ = resolveOccurrence(bill, [o], o.periodKey);
    if (!occ) continue;
    const profile = profiles.get(bill.profileId);
    rows.push([
      paidAt,
      sections.get(bill.sectionId)?.name ?? '',
      bill.title,
      o.periodKey,
      occ.dueDate,
      amount(effectiveAmount(bill, occ)),
      amount(o.paidAmount ?? effectiveAmount(bill, occ)),
      bill.payee.name,
      formatAccountShort(bill.payee.account),
      bill.paymentCode,
      bill.model ?? '',
      o.reference ?? periodReference(bill, profile, occ.start) ?? '',
      profile?.name ?? '',
      o.note ?? '',
    ]);
  }
  return `${BOM}${rows.map((r) => r.map(cell).join(';')).join('\r\n')}\r\n`;
}
