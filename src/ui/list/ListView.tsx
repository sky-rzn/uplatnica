import { useState } from 'preact/hooks';
import {
  AGENDA_AHEAD_DAYS,
  agendaGroup,
  agendaItems,
  agendaTotals,
  type AgendaGroup,
  type AgendaItem,
} from '../../core/agenda';
import { todayIso } from '../../core/date';
import { formatAmount } from '../../core/money';
import { useLive } from '../data';
import { formatDate } from '../format';
import { OccurrencePanel } from '../occurrence-panel/OccurrencePanel';
import { OverviewHeader, totalText } from '../overview';
import {
  STATUS_ICONS,
  STATUS_LABELS,
  dueInText,
  periodLabel,
} from '../period-text';
import { href } from '../router';
import { SetupNotice } from '../SetupNotice';

const GROUPS: readonly { key: AgendaGroup; title: string; cls: string }[] = [
  { key: 'overdue', title: 'Kasni', cls: 'st-overdue' },
  { key: 'now', title: 'Za plaćanje', cls: 'st-due' },
  { key: 'soon', title: 'Uskoro', cls: 'st-upcoming' },
];

function Item(props: { item: AgendaItem; today: string; onOpen: () => void }) {
  const { item, today } = props;
  const { bill, occ, status } = item;
  return (
    <li class={`card agenda-item st-${status}`}>
      <button type="button" onClick={props.onOpen}>
        <span class="swatch" style={{ background: item.section.color }} />
        <span class="card-main">
          <strong>{bill.title}</strong>
          <span class="muted">{periodLabel(occ)}</span>
          <span class="muted">
            rok {formatDate(occ.dueDate)}, {dueInText(occ.dueDate, today)}
          </span>
        </span>
        <span class="amount">
          {item.remaining !== undefined &&
            `${formatAmount(item.remaining)} RSD`}
          <small>
            <span aria-hidden="true">{STATUS_ICONS[status]} </span>
            {STATUS_LABELS[status]}
          </small>
        </span>
      </button>
    </li>
  );
}

export function ListView() {
  const data = useLive(async (r) => ({
    sections: await r.listSections(),
    profiles: await r.listProfiles(),
    bills: await r.listBills(),
    occurrences: await r.listOccurrences(),
  }));
  const [open, setOpen] = useState<{ billId: string; periodKey: string }>();
  if (!data) return null;

  const today = todayIso();
  const ready = data.sections.length > 0 && data.profiles.length > 0;
  const hasBills = data.bills.some((b) => !b.archived);
  const items = agendaItems(data.sections, data.bills, data.occurrences, today);
  const totals = agendaTotals(items);
  const openItem = open
    ? items.find(
        (i) => i.bill.id === open.billId && i.occ.periodKey === open.periodKey,
      )
    : undefined;

  return (
    <section class="agenda">
      <OverviewHeader
        view="list"
        ready={ready}
        totals={ready && hasBills ? totals : null}
      />
      {!ready ? (
        <SetupNotice profiles={data.profiles} sections={data.sections} />
      ) : !hasBills ? (
        <p class="empty">
          Još nema računa. Dodajte ih na stranici{' '}
          <a href={href({ name: 'bills' })}>Računi</a>.
        </p>
      ) : items.length === 0 ? (
        <p class="empty">
          Nema neplaćenih računa sa rokom u narednih {String(AGENDA_AHEAD_DAYS)}{' '}
          dana.
        </p>
      ) : (
        GROUPS.map(({ key, title, cls }) => {
          const own = items.filter((i) => agendaGroup(i.status) === key);
          if (own.length === 0) return null;
          return (
            <section
              key={key}
              class={`agenda-group ${cls}`}
              aria-labelledby={`agenda-${key}`}
            >
              <h2 id={`agenda-${key}`}>
                {title} <span class="muted">{totalText(totals[key])}</span>
              </h2>
              <ul class="cards">
                {own.map((item) => (
                  <Item
                    key={`${item.bill.id}/${item.occ.periodKey}`}
                    item={item}
                    today={today}
                    onOpen={() => {
                      setOpen({
                        billId: item.bill.id,
                        periodKey: item.occ.periodKey,
                      });
                    }}
                  />
                ))}
              </ul>
            </section>
          );
        })
      )}

      {openItem && (
        <OccurrencePanel
          key={`${openItem.bill.id}/${openItem.occ.periodKey}`}
          bill={openItem.bill}
          block={openItem}
          profile={data.profiles.find((p) => p.id === openItem.bill.profileId)}
          onClose={() => {
            setOpen(undefined);
          }}
        />
      )}
    </section>
  );
}
