import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { agendaItems, agendaTotals } from '../../core/agenda';
import { todayIso } from '../../core/date';
import { formatAmount } from '../../core/money';
import {
  monthColumns,
  timelineGroups,
  timelineRange,
  todayOffset,
  yearColumns,
  type Block,
  type BillRow,
  type TimelineFilter,
  type Zoom,
} from '../../core/timeline';
import { useLive } from '../data';
import { formatDate } from '../format';
import { OccurrencePanel } from '../occurrence-panel/OccurrencePanel';
import { OverviewHeader } from '../overview';
import { t } from '../../i18n';
import { STATUS_ICONS, periodLabel, statusLabel } from '../period-text';
import { href } from '../router';
import { SetupNotice } from '../SetupNotice';

const ZOOMS: readonly { value: Zoom; dayPx: number }[] = [
  { value: '6m', dayPx: 6 },
  { value: '1y', dayPx: 3 },
  { value: '3y', dayPx: 1.2 },
];

const MIN_AMOUNT_PX = 64;

function col(offset: number): number {
  return offset + 2;
}

function shortAmount(para: number): string {
  return formatAmount(para).replace(/,00$/, '');
}

function blockLabel(row: BillRow, block: Block): string {
  const parts = [
    row.bill.title,
    periodLabel(block.occ),
    t.common.due(formatDate(block.occ.dueDate)),
  ];
  if (block.amount !== undefined)
    parts.push(`${formatAmount(block.amount)} RSD`);
  parts.push(statusLabel(block.status));
  return parts.join(', ');
}

function Today({ offset }: { offset: number | null }) {
  if (offset === null) return null;
  return (
    <div
      class="tl-today"
      aria-hidden="true"
      style={{ gridColumn: String(col(offset)) }}
    />
  );
}

function Row(props: {
  row: BillRow;
  dayPx: number;
  today: number | null;
  onOpen: (block: Block) => void;
}) {
  const { row, dayPx } = props;
  const total =
    row.total > 0 || row.unknown === 0
      ? `${formatAmount(row.total)} RSD${row.unknown > 0 ? ' + ?' : ''}`
      : '';
  return (
    <div
      class="tl-row"
      style={{ gridTemplateRows: `repeat(${String(row.lanes)}, var(--lane))` }}
    >
      <div class="tl-label">
        <a href={href({ name: 'bill', id: row.bill.id })}>{row.bill.title}</a>
        {total && (
          <span class="tl-total" title={t.timeline.rowTotal}>
            {total}
          </span>
        )}
      </div>
      <Today offset={props.today} />
      {row.blocks.map((b) => {
        const wide = (b.end - b.start) * dayPx >= MIN_AMOUNT_PX;
        const cls = [
          'tl-block',
          `st-${b.status}`,
          b.clippedStart && 'clip-start',
          b.clippedEnd && 'clip-end',
          b.occ.outOfSchedule && 'stale',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={b.occ.periodKey}
            type="button"
            class={cls}
            aria-label={blockLabel(row, b)}
            title={blockLabel(row, b)}
            style={{
              gridColumn: `${String(col(b.start))} / ${String(col(b.end))}`,
              gridRow: String(b.lane + 1),
            }}
            onClick={() => {
              props.onOpen(b);
            }}
          >
            <span aria-hidden="true">
              {STATUS_ICONS[b.status]}
              {wide && b.amount !== undefined && ` ${shortAmount(b.amount)}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function TimelineView() {
  const data = useLive(async (r) => ({
    sections: await r.listSections(),
    profiles: await r.listProfiles(),
    bills: await r.listBills(),
    occurrences: await r.listOccurrences(),
  }));
  const [zoom, setZoom] = useState<Zoom>('1y');
  const [shift, setShift] = useState(0);
  const [filter, setFilter] = useState<TimelineFilter>({});
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [open, setOpen] = useState<{ billId: string; periodKey: string }>();
  const scroller = useRef<HTMLDivElement>(null);
  const loaded = data !== undefined;

  useLayoutEffect(() => {
    const el = scroller.current;
    const line = el?.querySelector<HTMLElement>('.tl-head .tl-today');
    const label = el?.querySelector<HTMLElement>('.tl-head .tl-label');
    if (!el || !line || !label) return;
    el.scrollLeft = line.offsetLeft - label.offsetWidth - el.clientWidth / 4;
  }, [loaded, zoom, shift]);

  if (!data) return null;

  const today = todayIso();
  const range = timelineRange(zoom, today, shift);
  const months = monthColumns(range);
  const years = yearColumns(months);
  const todayAt = todayOffset(range, today);
  const dayPx = ZOOMS.find((z) => z.value === zoom)?.dayPx ?? 3;
  const groups = timelineGroups(
    data.sections,
    data.bills,
    data.occurrences,
    range,
    today,
    filter,
  );
  const ready = data.sections.length > 0 && data.profiles.length > 0;
  const activeBills = data.bills.filter((b) => !b.archived);
  const openRow = open
    ? groups.flatMap((g) => g.rows).find((r) => r.bill.id === open.billId)
    : undefined;
  const openBlock = openRow?.blocks.find(
    (b) => b.occ.periodKey === open?.periodKey,
  );
  const setFilterId = (key: 'sectionId' | 'profileId', id: string) => {
    setFilter({ ...filter, [key]: id || undefined });
  };
  const toggle = (id: string) => {
    const next = new Set(collapsed);
    if (!next.delete(id)) next.add(id);
    setCollapsed(next);
  };

  return (
    <section class="timeline">
      <OverviewHeader
        view="timeline"
        ready={ready}
        totals={
          ready && activeBills.length > 0
            ? agendaTotals(
                agendaItems(data.sections, data.bills, data.occurrences, today),
              )
            : null
        }
      />

      {!ready ? (
        <SetupNotice profiles={data.profiles} sections={data.sections} />
      ) : activeBills.length === 0 ? (
        <p class="empty">
          {t.overview.noBills((text) => (
            <a href={href({ name: 'bills' })}>{text}</a>
          ))}
        </p>
      ) : (
        <>
          <div class="tl-controls">
            <div class="segmented" role="group" aria-label={t.timeline.scale}>
              {ZOOMS.map((z) => (
                <button
                  key={z.value}
                  type="button"
                  aria-pressed={zoom === z.value}
                  onClick={() => {
                    setZoom(z.value);
                    setShift(0);
                  }}
                >
                  {t.timeline.zoom[z.value]}
                </button>
              ))}
            </div>
            <div class="segmented" role="group" aria-label={t.timeline.shift}>
              <button
                type="button"
                aria-label={t.timeline.earlier}
                onClick={() => {
                  setShift(shift - 1);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                disabled={shift === 0}
                onClick={() => {
                  setShift(0);
                }}
              >
                {t.timeline.today}
              </button>
              <button
                type="button"
                aria-label={t.timeline.later}
                onClick={() => {
                  setShift(shift + 1);
                }}
              >
                ›
              </button>
            </div>
            <label class="inline">
              {t.common.section}{' '}
              <select
                value={filter.sectionId ?? ''}
                onChange={(e) => {
                  setFilterId('sectionId', e.currentTarget.value);
                }}
              >
                <option value="">{t.common.all}</option>
                {data.sections
                  .filter((s) => !s.archived)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            {data.profiles.length > 1 && (
              <label class="inline">
                {t.common.payer}{' '}
                <select
                  value={filter.profileId ?? ''}
                  onChange={(e) => {
                    setFilterId('profileId', e.currentTarget.value);
                  }}
                >
                  <option value="">{t.common.all}</option>
                  {data.profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label class="check">
              <input
                type="checkbox"
                checked={filter.unpaidOnly === true}
                onChange={(e) => {
                  setFilter({ ...filter, unpaidOnly: e.currentTarget.checked });
                }}
              />
              {t.timeline.unpaidOnly}
            </label>
          </div>

          <div class="tl-scroll" ref={scroller}>
            <div
              class="tl"
              style={{
                '--days': String(range.days),
                '--day': `${String(dayPx)}px`,
              }}
            >
              <div class="tl-head" aria-hidden="true">
                <div class="tl-label tl-corner" />
                {years.map((y) => (
                  <div
                    key={y.year}
                    class="tl-year"
                    style={{
                      gridColumn: `${String(col(y.start))} / ${String(col(y.end))}`,
                    }}
                  >
                    <span>{y.year}</span>
                  </div>
                ))}
                {months.map((m) => (
                  <div
                    key={`${String(m.year)}-${String(m.month)}`}
                    class={m.month === 1 ? 'tl-month new-year' : 'tl-month'}
                    style={{
                      gridColumn: `${String(col(m.start))} / ${String(col(m.end))}`,
                    }}
                  >
                    {zoom === '3y'
                      ? (t.monthsShort[m.month - 1] ?? '').charAt(0)
                      : t.monthsShort[m.month - 1]}
                  </div>
                ))}
                <Today offset={todayAt} />
              </div>

              {groups.length === 0 && (
                <p class="empty tl-empty">{t.timeline.noMatch}</p>
              )}
              {groups.map(({ section, rows }) => {
                const isCollapsed = collapsed.has(section.id);
                return (
                  <section
                    key={section.id}
                    class="tl-section"
                    aria-label={section.name}
                  >
                    <div class="tl-row tl-section-head">
                      <div class="tl-label">
                        <button
                          type="button"
                          class="tl-toggle"
                          aria-expanded={!isCollapsed}
                          onClick={() => {
                            toggle(section.id);
                          }}
                        >
                          <span
                            class="swatch"
                            style={{ background: section.color }}
                          />
                          {section.name}
                        </button>
                      </div>
                      <Today offset={todayAt} />
                    </div>
                    {!isCollapsed &&
                      rows.map((row) => (
                        <Row
                          key={row.bill.id}
                          row={row}
                          dayPx={dayPx}
                          today={todayAt}
                          onOpen={(b) => {
                            setOpen({
                              billId: row.bill.id,
                              periodKey: b.occ.periodKey,
                            });
                          }}
                        />
                      ))}
                  </section>
                );
              })}
            </div>
          </div>

          <ul class="tl-legend" aria-label={t.timeline.legend}>
            {(
              [
                'paid',
                'due',
                'awaiting-amount',
                'partial',
                'overdue',
                'upcoming',
              ] as const
            ).map((s) => (
              <li key={s}>
                <span class={`tl-block st-${s}`} aria-hidden="true">
                  {STATUS_ICONS[s]}
                </span>
                {statusLabel(s)}
              </li>
            ))}
          </ul>
        </>
      )}

      {openRow && openBlock && (
        <OccurrencePanel
          key={`${openRow.bill.id}/${openBlock.occ.periodKey}`}
          bill={openRow.bill}
          block={openBlock}
          profile={data.profiles.find((p) => p.id === openRow.bill.profileId)}
          onClose={() => {
            setOpen(undefined);
          }}
        />
      )}
    </section>
  );
}
