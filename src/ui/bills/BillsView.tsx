import { todayIso } from '../../core/date';
import { compareBills, type Bill } from '../../core/model';
import { formatAmount } from '../../core/money';
import { upcomingPeriods } from '../../core/schedule';
import { formatAccountShort } from '../../core/serbia/account';
import { t } from '../../i18n';
import { useLive, useRepo } from '../data';
import { SetupNotice } from '../SetupNotice';
import { formatDate } from '../format';
import { href } from '../router';
import { scheduleText } from '../schedule-text';

function BillRow(props: {
  bill: Bill;
  today: string;
  onUp: (() => void) | undefined;
  onDown: (() => void) | undefined;
}) {
  const { bill, today } = props;
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
      <div class="actions">
        <button
          type="button"
          aria-label={t.common.up(bill.title)}
          disabled={!props.onUp}
          onClick={props.onUp}
        >
          ↑
        </button>
        <button
          type="button"
          aria-label={t.common.down(bill.title)}
          disabled={!props.onDown}
          onClick={props.onDown}
        >
          ↓
        </button>
      </div>
    </li>
  );
}

export function BillsView() {
  const repo = useRepo();
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
              Number(a.archived) - Number(b.archived) || compareBills(a, b),
          );
        if (own.length === 0) return null;
        const swap = (i: number, j: number) => () => {
          const ids = own.map((b) => b.id);
          [ids[i], ids[j]] = [ids[j] ?? '', ids[i] ?? ''];
          void repo.reorderBills(ids);
        };
        return (
          <section key={s.id} class="group">
            <h2>
              <span class="swatch" style={{ background: s.color }} />
              {s.name}
            </h2>
            <ul class="cards">
              {own.map((b, i) => (
                <BillRow
                  key={b.id}
                  bill={b}
                  today={today}
                  onUp={i > 0 ? swap(i, i - 1) : undefined}
                  onDown={i < own.length - 1 ? swap(i, i + 1) : undefined}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </section>
  );
}
