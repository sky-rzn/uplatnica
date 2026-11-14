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
import { t } from '../../i18n';
import {
  STATUS_ICONS,
  dueInText,
  periodLabel,
  statusLabel,
} from '../period-text';
import { href, navigate, type PeriodRef } from '../router';
import { SetupNotice } from '../SetupNotice';

const GROUPS: readonly { key: AgendaGroup; cls: string }[] = [
  { key: 'overdue', cls: 'st-overdue' },
  { key: 'now', cls: 'st-due' },
  { key: 'soon', cls: 'st-upcoming' },
];

function itemKey(item: AgendaItem): string {
  return `${item.bill.id}:${item.occ.periodKey}`;
}

function Item(props: {
  item: AgendaItem;
  today: string;
  picked: boolean;
  onPick: (picked: boolean) => void;
  onOpen: () => void;
}) {
  const { item, today } = props;
  const { bill, occ, status } = item;
  return (
    <li class={`card agenda-item st-${status}`}>
      <input
        type="checkbox"
        class="pick"
        aria-label={t.list.pick(`${bill.title}, ${periodLabel(occ)}`)}
        checked={props.picked}
        onChange={(e) => {
          props.onPick(e.currentTarget.checked);
        }}
      />
      <button type="button" onClick={props.onOpen}>
        <span class="swatch" style={{ background: item.section.color }} />
        <span class="card-main">
          <strong>{bill.title}</strong>
          <span class="muted">{periodLabel(occ)}</span>
          <span class="muted">
            {t.common.due(formatDate(occ.dueDate))},{' '}
            {dueInText(occ.dueDate, today)}
          </span>
        </span>
        <span class="amount">
          {item.remaining !== undefined &&
            `${formatAmount(item.remaining)} RSD`}
          <small>
            <span aria-hidden="true">{STATUS_ICONS[status]} </span>
            {statusLabel(status)}
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
  const [open, setOpen] = useState<PeriodRef>();
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  if (!data) return null;

  const today = todayIso();
  const ready = data.sections.length > 0 && data.profiles.length > 0;
  const hasBills = data.bills.some((b) => !b.archived);
  const items = agendaItems(data.sections, data.bills, data.occurrences, today);
  const totals = agendaTotals(items);
  const pickedItems = items.filter((i) => picked.has(itemKey(i)));
  const pick = (key: string, on: boolean) => {
    const next = new Set(picked);
    if (on) next.add(key);
    else next.delete(key);
    setPicked(next);
  };
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
          {t.overview.noBills((text) => (
            <a href={href({ name: 'bills' })}>{text}</a>
          ))}
        </p>
      ) : items.length === 0 ? (
        <p class="empty">{t.list.nothingAhead(AGENDA_AHEAD_DAYS)}</p>
      ) : (
        <div class="print-bar">
          <label>
            <input
              type="checkbox"
              checked={pickedItems.length === items.length}
              onChange={(e) => {
                setPicked(
                  new Set(e.currentTarget.checked ? items.map(itemKey) : []),
                );
              }}
            />{' '}
            {t.list.pickAll}
          </label>
          <button
            type="button"
            disabled={pickedItems.length === 0}
            onClick={() => {
              navigate({
                name: 'print',
                items: pickedItems.map((i) => ({
                  billId: i.bill.id,
                  periodKey: i.occ.periodKey,
                })),
              });
            }}
          >
            {t.list.print}
            {pickedItems.length > 0 && ` (${String(pickedItems.length)})`}
          </button>
        </div>
      )}
      {ready &&
        hasBills &&
        GROUPS.map(({ key, cls }) => {
          const own = items.filter((i) => agendaGroup(i.status) === key);
          if (own.length === 0) return null;
          return (
            <section
              key={key}
              class={`agenda-group ${cls}`}
              aria-labelledby={`agenda-${key}`}
            >
              <h2 id={`agenda-${key}`}>
                {t.list.groups[key]}{' '}
                <span class="muted">{totalText(totals[key])}</span>
              </h2>
              <ul class="cards">
                {own.map((item) => (
                  <Item
                    key={itemKey(item)}
                    item={item}
                    today={today}
                    picked={picked.has(itemKey(item))}
                    onPick={(on) => {
                      pick(itemKey(item), on);
                    }}
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
        })}

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
