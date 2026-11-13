import type { AgendaTotal, AgendaGroup } from '../core/agenda';
import { formatAmount } from '../core/money';
import { plural } from './period-text';
import { href } from './router';

export function totalText(t: AgendaTotal): string {
  const count = `${String(t.count)} ${plural(t.count, 'račun', 'računa')}`;
  const sum = `${formatAmount(t.sum)} RSD`;
  if (t.unknown === 0) return `${count}, ${sum}`;
  if (t.unknown === t.count) return `${count} bez iznosa`;
  return `${count}, ${sum} + ${String(t.unknown)} bez iznosa`;
}

function Summary(props: { totals: Record<AgendaGroup, AgendaTotal> }) {
  const { overdue, now } = props.totals;
  if (overdue.count === 0 && now.count === 0)
    return <p class="summary muted">Trenutno nema ništa za plaćanje.</p>;
  return (
    <p class="summary">
      {now.count > 0 && (
        <span class="st-due">
          Za plaćanje sada: <strong>{totalText(now)}</strong>
        </span>
      )}
      {overdue.count > 0 && (
        <span class="st-overdue">
          <span aria-hidden="true">! </span>
          Kasni: <strong>{totalText(overdue)}</strong>
        </span>
      )}
    </p>
  );
}

export function OverviewHeader(props: {
  view: 'timeline' | 'list';
  ready: boolean;
  totals: Record<AgendaGroup, AgendaTotal> | null;
}) {
  return (
    <>
      <div class="toolbar">
        <h1>Pregled</h1>
        {props.ready && (
          <a class="button primary" href={href({ name: 'bill', id: null })}>
            Novi račun
          </a>
        )}
      </div>
      {props.totals && (
        <div class="overview-bar">
          <div class="segmented" role="group" aria-label="Prikaz">
            <a
              class="button"
              href={href({ name: 'timeline' })}
              {...(props.view === 'timeline' ? { 'aria-current': 'page' } : {})}
            >
              Dijagram
            </a>
            <a
              class="button"
              href={href({ name: 'list' })}
              {...(props.view === 'list' ? { 'aria-current': 'page' } : {})}
            >
              Lista
            </a>
          </div>
          <Summary totals={props.totals} />
        </div>
      )}
    </>
  );
}
