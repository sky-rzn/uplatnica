import { todayIso } from '../../core/date';
import type { Bill } from '../../core/model';
import { formatAmount } from '../../core/money';
import { upcomingPeriods } from '../../core/schedule';
import { formatAccountShort } from '../../core/serbia/account';
import { t } from '../../i18n';
import { useLive } from '../data';
import { SetupNotice } from '../SetupNotice';
import { formatDate } from '../format';
import { href } from '../router';
import { scheduleText } from '../schedule-text';

function BillRow({ bill, today }: { bill: Bill; today: string }) {
  const [next] = upcomingPeriods(bill.schedule, today, 1);
  return (
    <li class={bill.archived ? 'card archived' : 'card'}>
      <a class="card-main" href={href({ name: 'bill', id: bill.id })}>
        <strong>{bill.title}</strong>
        <div class="muted">
          {bill.payee.name} · {formatAccountShort(bill.payee.account)}
        </div>
        <div class="muted">
          {scheduleText(bill.schedule)}
          {next &&
            next.dueDate >= today &&
            ` · ${t.bills.nextDue(formatDate(next.dueDate))}`}
        </div>
      </a>
      <div class="amount">
        {bill.amount !== undefined
          ? `${formatAmount(bill.amount)} RSD`
          : t.bills.variable}
      </div>
    </li>
  );
}

export function BillsView() {
  const data = useLive(async (r) => ({
    sections: await r.listSections(),
    profiles: await r.listProfiles(),
    bills: await r.listBills(),
  }));
  if (!data) return null;
  const { sections, profiles, bills } = data;
  const today = todayIso();
  const ready = sections.length > 0 && profiles.length > 0;

  return (
    <section>
      <div class="toolbar">
        <h1>{t.bills.title}</h1>
        {ready && (
          <a class="button primary" href={href({ name: 'bill', id: null })}>
            {t.common.newBill}
          </a>
        )}
      </div>
      {!ready && <SetupNotice profiles={profiles} sections={sections} />}
      {ready && bills.length === 0 && <p class="empty">{t.bills.empty}</p>}
      {sections.map((s) => {
        const own = bills
          .filter((b) => b.sectionId === s.id)
          .sort(
            (a, b) =>
              Number(a.archived) - Number(b.archived) ||
              a.title.localeCompare(b.title),
          );
        if (own.length === 0) return null;
        return (
          <section key={s.id} class="group">
            <h2>
              <span class="swatch" style={{ background: s.color }} />
              {s.name}
            </h2>
            <ul class="cards">
              {own.map((b) => (
                <BillRow key={b.id} bill={b} today={today} />
              ))}
            </ul>
          </section>
        );
      })}
    </section>
  );
}
