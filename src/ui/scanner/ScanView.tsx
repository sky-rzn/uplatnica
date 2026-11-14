import { useState } from 'preact/hooks';
import { agendaItems, type AgendaItem } from '../../core/agenda';
import { todayIso } from '../../core/date';
import { periodReference } from '../../core/forms/occurrence';
import { matchScan } from '../../core/forms/scan';
import type { Profile } from '../../core/model';
import type { ParsedIpsQr } from '../../core/serbia/ipsQr';
import { t } from '../../i18n';
import { useLive } from '../data';
import { formatDate } from '../format';
import { OccurrencePanel } from '../occurrence-panel/OccurrencePanel';
import { periodLabel } from '../period-text';
import { href, type PeriodRef } from '../router';
import { SetupNotice } from '../SetupNotice';
import { QrFields } from '../uplatnica/QrFields';
import { Scanner } from './Scanner';
import { ScanFailure, readScan } from './scan-result';

const CANDIDATE_DAYS = 400;
const CANDIDATE_COUNT = 6;

function expectedReference(
  item: AgendaItem,
  profile: Profile | undefined,
): string | undefined {
  return (
    item.occ.stored?.reference ??
    periodReference(item.bill, profile, item.occ.start)
  );
}

/** The period the code is for: the one whose poziv na broj it carries, else the earliest unpaid. */
function suggested(
  items: readonly AgendaItem[],
  qr: ParsedIpsQr,
  profile: Profile | undefined,
): { item: AgendaItem; byReference: boolean } | undefined {
  const byRef =
    qr.reference === undefined
      ? undefined
      : items.find((i) => expectedReference(i, profile) === qr.reference);
  if (byRef) return { item: byRef, byReference: true };
  const first = items[0];
  return first && { item: first, byReference: false };
}

export function ScanView() {
  const data = useLive(async (r) => ({
    sections: await r.listSections(),
    profiles: await r.listProfiles(),
    bills: await r.listBills(),
    occurrences: await r.listOccurrences(),
  }));
  const [text, setText] = useState<string>();
  const [open, setOpen] = useState<PeriodRef>();
  if (!data) return null;

  const today = todayIso();
  const ready = data.sections.length > 0 && data.profiles.length > 0;
  const read = text === undefined ? undefined : readScan(text);

  if (!read?.ok)
    return (
      <section class="scan-view">
        <h1>{t.common.scanning}</h1>
        <p class="hint">{t.scan.lead}</p>
        <Scanner onScan={setText} />
        {read && <ScanFailure messages={read.messages} />}
      </section>
    );

  const { qr } = read;
  const profileOf = (id: string) => data.profiles.find((p) => p.id === id);
  const matches = matchScan(data.bills, qr).map((m) => {
    const items = agendaItems(
      data.sections,
      [m.bill],
      data.occurrences,
      today,
      CANDIDATE_DAYS,
    ).slice(0, CANDIDATE_COUNT);
    return {
      ...m,
      items,
      pick: suggested(items, qr, profileOf(m.bill.profileId)),
    };
  });
  const all = matches.flatMap((m) => m.items);
  const openItem = open
    ? all.find(
        (i) => i.bill.id === open.billId && i.occ.periodKey === open.periodKey,
      )
    : undefined;

  return (
    <section class="scan-view">
      <h1>{t.common.scanning}</h1>
      <div class="card scan-found">
        <QrFields qr={qr} />
        <button
          type="button"
          onClick={() => {
            setText(undefined);
          }}
        >
          {t.scan.again}
        </button>
      </div>

      {!ready ? (
        <SetupNotice profiles={data.profiles} sections={data.sections} />
      ) : (
        <>
          {matches.length === 0 && <p>{t.scan.noMatch}</p>}
          {matches.map(({ bill, by, items, pick }) => (
            <section
              key={bill.id}
              class="scan-match"
              aria-labelledby={`scan-${bill.id}`}
            >
              <h2 id={`scan-${bill.id}`}>{bill.title}</h2>
              {by === 'name' && <p class="warning">{t.scan.otherAccount}</p>}
              {items.length === 0 ? (
                <p class="muted">{t.scan.noPeriods}</p>
              ) : (
                <>
                  <p class="hint">{t.scan.pickPeriod}</p>
                  <ul class="scan-periods">
                    {items.map((item) => {
                      const isPick = pick?.item === item;
                      return (
                        <li key={item.occ.periodKey}>
                          <button
                            type="button"
                            class={isPick ? 'primary' : undefined}
                            onClick={() => {
                              setOpen({
                                billId: bill.id,
                                periodKey: item.occ.periodKey,
                              });
                            }}
                          >
                            {periodLabel(item.occ)},{' '}
                            {t.common.due(formatDate(item.occ.dueDate))}
                            {isPick && pick.byReference
                              ? t.scan.sameReference
                              : ''}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>
          ))}
          <p>
            <a
              class={matches.length === 0 ? 'button primary' : 'button'}
              href={href({ name: 'bill', id: null, qr: text ?? '' })}
            >
              {t.scan.newBill}
            </a>
          </p>
        </>
      )}

      {openItem && (
        <OccurrencePanel
          key={`${openItem.bill.id}/${openItem.occ.periodKey}`}
          bill={openItem.bill}
          block={openItem}
          profile={profileOf(openItem.bill.profileId)}
          scan={qr}
          onClose={() => {
            setOpen(undefined);
          }}
        />
      )}
    </section>
  );
}
