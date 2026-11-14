import type { AgendaTotal, AgendaGroup } from '../core/agenda';
import { formatAmount } from '../core/money';
import { t } from '../i18n';
import { href } from './router';

export function totalText(total: AgendaTotal): string {
  const sum = `${formatAmount(total.sum)} RSD`;
  if (total.unknown === 0) return t.overview.total(total.count, sum);
  if (total.unknown === total.count)
    return t.overview.totalUnknown(total.count);
  return t.overview.totalPartly(total.count, sum, total.unknown);
}

function Summary(props: { totals: Record<AgendaGroup, AgendaTotal> }) {
  const { overdue, now } = props.totals;
  if (overdue.count === 0 && now.count === 0)
    return <p class="summary muted">{t.overview.nothing}</p>;
  return (
    <p class="summary">
      {now.count > 0 && (
        <span class="st-due">
          {t.overview.dueNow}
          <strong>{totalText(now)}</strong>
        </span>
      )}
      {overdue.count > 0 && (
        <span class="st-overdue">
          <span aria-hidden="true">! </span>
          {t.overview.overdue}
          <strong>{totalText(overdue)}</strong>
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
        <h1>{t.overview.title}</h1>
        {props.ready && (
          <div class="actions">
            <a class="button" href={href({ name: 'scan' })}>
              {t.common.scanBill}
            </a>
            <a class="button primary" href={href({ name: 'bill', id: null })}>
              {t.common.newBill}
            </a>
          </div>
        )}
      </div>
      {props.totals && (
        <div class="overview-bar">
          <div class="segmented" role="group" aria-label={t.overview.view}>
            <a
              class="button"
              href={href({ name: 'timeline' })}
              {...(props.view === 'timeline' ? { 'aria-current': 'page' } : {})}
            >
              {t.overview.timeline}
            </a>
            <a
              class="button"
              href={href({ name: 'list' })}
              {...(props.view === 'list' ? { 'aria-current': 'page' } : {})}
            >
              {t.overview.list}
            </a>
          </div>
          <Summary totals={props.totals} />
        </div>
      )}
    </>
  );
}
