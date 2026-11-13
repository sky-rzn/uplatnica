import { useState } from 'preact/hooks';
import { todayIso } from '../../core/date';
import { resolveOccurrence } from '../../core/schedule';
import { cyrillicToLatin } from '../../core/serbia/translit';
import {
  SLIPS_PER_PAGE,
  slipShapes,
  type Shape,
} from '../../core/uplatnica/layout';
import { buildSlip, slipInput, type Slip } from '../../core/uplatnica/slip';
import { useLive } from '../data';
import { SLIP_WARNINGS, qrIssueText } from '../messages';
import { periodLabel } from '../period-text';
import type { PeriodRef } from '../router';
import { SlipSvg } from './SlipSvg';

interface PrintedSlip {
  key: string;
  title: string;
  slip: Slip;
  shapes: Shape[];
}

function fileSlug(s: string): string {
  return cyrillicToLatin(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'dj')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function download(bytes: Uint8Array, name: string): void {
  const url = URL.createObjectURL(
    new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

function Problems({ item }: { item: PrintedSlip }) {
  const { slip } = item;
  const texts = [
    ...slip.warnings.map((w) => SLIP_WARNINGS[w]),
    ...(slip.qr && !slip.qr.ok
      ? [
          'Uplatnica je bez QR koda:',
          ...slip.qr.issues.map((i) => qrIssueText(i)),
        ]
      : []),
  ];
  if (texts.length === 0) return null;
  return (
    <li>
      <strong>{item.title}</strong>: {texts.join(' ')}
    </li>
  );
}

export function PrintView({ items }: { items: readonly PeriodRef[] }) {
  const data = useLive(async (r) => ({
    profiles: await r.listProfiles(),
    bills: await r.listBills(),
    occurrences: await r.listOccurrences(),
  }));
  const [pdfState, setPdfState] = useState<'idle' | 'busy' | 'error'>('idle');
  if (!data) return null;

  const slips: PrintedSlip[] = [];
  let missing = 0;
  for (const ref of items) {
    const bill = data.bills.find((b) => b.id === ref.billId);
    const occ =
      bill &&
      resolveOccurrence(
        bill,
        data.occurrences.filter((o) => o.billId === bill.id),
        ref.periodKey,
      );
    if (!bill || !occ) {
      missing++;
      continue;
    }
    const profile = data.profiles.find((p) => p.id === bill.profileId);
    const slip = buildSlip(slipInput(bill, occ, profile));
    slips.push({
      key: `${bill.id}:${occ.periodKey}`,
      title: `${bill.title}, ${periodLabel(occ)}`,
      slip,
      shapes: slipShapes(slip.data, slip.qr?.ok ? slip.qr : undefined),
    });
  }

  const sheets: PrintedSlip[][] = [];
  for (let i = 0; i < slips.length; i += SLIPS_PER_PAGE)
    sheets.push(slips.slice(i, i + SLIPS_PER_PAGE));

  const pdf = async () => {
    setPdfState('busy');
    try {
      const { slipsPdf } = await import('./pdf');
      const bytes = await slipsPdf(slips.map((s) => s.shapes));
      const [only] = slips;
      download(
        bytes,
        slips.length === 1 && only
          ? `uplatnica-${fileSlug(only.title)}.pdf`
          : `uplatnice-${todayIso()}.pdf`,
      );
      setPdfState('idle');
    } catch (e) {
      console.error(e);
      setPdfState('error');
    }
  };

  return (
    <section class="print-view">
      <div class="no-print">
        <div class="toolbar">
          <h1>{slips.length === 1 ? 'Uplatnica' : 'Uplatnice'}</h1>
          <div class="actions">
            <button
              type="button"
              onClick={() => {
                history.back();
              }}
            >
              Nazad
            </button>
            <button
              type="button"
              disabled={pdfState === 'busy' || slips.length === 0}
              onClick={() => {
                void pdf();
              }}
            >
              Preuzmi PDF
            </button>
            <button
              type="button"
              class="primary"
              disabled={slips.length === 0}
              onClick={() => {
                print();
              }}
            >
              Štampaj
            </button>
          </div>
        </div>
        <p class="hint">
          Štampajte na A4 bez uklapanja u stranu, u razmeri 100 %, da bi
          uplatnica imala pravu veličinu. Na jedan list staju tri.
        </p>
        {pdfState === 'error' && (
          <p class="error" role="alert">
            PDF nije napravljen. Pokušajte ponovo.
          </p>
        )}
        {missing > 0 && (
          <p class="error">
            {missing === 1
              ? 'Jedan račun ili period više ne postoji.'
              : `${String(missing)} računa ili perioda više ne postoje.`}
          </p>
        )}
        {slips.length === 0 && missing === 0 && (
          <p class="empty">Nije izabrana nijedna uplatnica.</p>
        )}
        <ul class="notice-list">
          {slips.map((s) => (
            <Problems key={s.key} item={s} />
          ))}
        </ul>
      </div>
      {sheets.map((sheet, i) => (
        <div class="sheet" key={i}>
          {sheet.map((s) => (
            <SlipSvg key={s.key} shapes={s.shapes} label={s.title} />
          ))}
        </div>
      ))}
    </section>
  );
}
