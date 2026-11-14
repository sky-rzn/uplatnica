import { useEffect, useRef, useState } from 'preact/hooks';
import { todayIso } from '../../core/date';
import {
  occurrenceToDraft,
  validateOccurrence,
  type OccurrenceAction,
  type OccurrenceDraft,
} from '../../core/forms/occurrence';
import type { Bill, Profile } from '../../core/model';
import { formatAmount } from '../../core/money';
import { parseIpsQr, type ParsedIpsQr } from '../../core/serbia/ipsQr';
import { applyScanToOccurrence, type ScanNote } from '../../core/forms/scan';
import type { Block } from '../../core/timeline';
import { buildSlip, slipInput, type Slip } from '../../core/uplatnica/slip';
import { t } from '../../i18n';
import { useRepo } from '../data';
import { TextField, hasErrors, useFeedback } from '../form';
import { formatDate } from '../format';
import { qrIssueText } from '../messages';
import { STATUS_ICONS, periodLabel, statusLabel } from '../period-text';
import { navigate } from '../router';
import { QrCode } from '../uplatnica/QrCode';
import { QrFields } from '../uplatnica/QrFields';
import { Scanner } from '../scanner/Scanner';
import { ScanFailure, ScanNotes, readScan } from '../scanner/scan-result';

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])';

/** Keeps Tab and Shift+Tab inside the dialog. */
function trapTab(dialog: HTMLElement, e: KeyboardEvent): void {
  const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return;
  const at = items.indexOf(document.activeElement as HTMLElement);
  if (e.shiftKey ? at <= 0 : at === -1 || at === items.length - 1) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  }
}

function QrDetails({ slip }: { slip: Slip | null }) {
  if (!slip) return <p class="hint">{t.occurrence.fixErrors}</p>;
  const { qr } = slip;
  if (!qr) return <p class="hint">{t.occurrence.enterAmount}</p>;
  if (!qr.ok)
    return (
      <ul class="error">
        {qr.issues.map((issue, i) => (
          <li key={i}>{qrIssueText(issue)}</li>
        ))}
      </ul>
    );
  const parsed = parseIpsQr(qr.text);
  if (!parsed.ok) return null;
  return (
    <div class="qr-box">
      <QrCode text={qr.text} ecc={qr.ecc} label={t.occurrence.qrLabel} />
      <QrFields qr={parsed.value} />
      <p class="hint">{t.occurrence.qrHint}</p>
    </div>
  );
}

export function OccurrencePanel(props: {
  bill: Bill;
  block: Pick<Block, 'occ' | 'status'>;
  profile: Profile | undefined;
  /** A code scanned from the bill, taken over when the panel opens. */
  scan?: ParsedIpsQr;
  onClose: () => void;
}) {
  const { bill, block, onClose } = props;
  const { occ } = block;
  const repo = useRepo();
  const o = t.occurrence;
  const ctx = { bill, occ, profile: props.profile, today: todayIso() };
  const [initial] = useState(() => {
    const draft = occurrenceToDraft(ctx, formatAmount);
    return props.scan
      ? applyScanToOccurrence(draft, bill, props.scan, formatAmount)
      : { draft, notes: [] };
  });
  const [draft, setDraft] = useState<OccurrenceDraft>(initial.draft);
  const [notes, setNotes] = useState<readonly ScanNote[]>(initial.notes);
  const [scanning, setScanning] = useState(false);
  const [scanFailure, setScanFailure] = useState<string[]>();
  const [busy, setBusy] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const result = validateOccurrence(draft, ctx, 'pay');
  const fb = useFeedback(result);
  const heading = useRef<HTMLHeadingElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const paid = occ.stored?.paidAt !== undefined;

  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const opener = document.activeElement;
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab' && dialog.current) trapTab(dialog.current, e);
    };
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('keydown', onKey);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  const text = (
    name: keyof OccurrenceDraft,
    label: string,
    extra: Partial<Parameters<typeof TextField>[0]> = {},
  ) => (
    <TextField
      id={`occ-${name}`}
      name={name}
      label={label}
      feedback={fb}
      value={draft[name]}
      onInput={(v) => {
        setDraft({ ...draft, [name]: v });
      }}
      {...extra}
    />
  );

  const run = async (action: OccurrenceAction) => {
    const r = validateOccurrence(draft, ctx, action);
    if (!r.value || hasErrors(r)) {
      fb.submit();
      return;
    }
    setBusy(true);
    try {
      await repo.saveOccurrence(r.value);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const printSlip = async () => {
    const r = validateOccurrence(draft, ctx, 'save');
    if (!r.value || hasErrors(r)) {
      fb.submit();
      return;
    }
    setBusy(true);
    try {
      await repo.saveOccurrence(r.value);
    } finally {
      setBusy(false);
    }
    navigate({
      name: 'print',
      items: [{ billId: bill.id, periodKey: occ.periodKey }],
    });
  };

  const saved = validateOccurrence(draft, ctx, 'save').value;
  const slip =
    showQr && saved
      ? buildSlip(
          slipInput(
            bill,
            { ...occ, dueDate: saved.dueDate ?? occ.dueDate, stored: saved },
            props.profile,
          ),
        )
      : null;

  const onScan = (text: string) => {
    const read = readScan(text);
    if (!read.ok) {
      setScanFailure(read.messages);
      return;
    }
    const r = applyScanToOccurrence(draft, bill, read.qr, formatAmount);
    setDraft(r.draft);
    setNotes(r.notes);
    setScanFailure(undefined);
    setScanning(false);
  };

  const newAccount = notes.find((n) => n.code === 'account');
  const takeAccount = async (account: string) => {
    setBusy(true);
    try {
      await repo.saveBill({ ...bill, payee: { ...bill.payee, account } });
      setNotes(notes.filter((n) => n.code !== 'account'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await repo.deleteOccurrence(bill.id, occ.periodKey);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const fixed =
    bill.amountMode === 'fixed' && bill.amount !== undefined
      ? formatAmount(bill.amount)
      : undefined;
  const model = bill.model ?? '';

  return (
    <div class="panel-layer">
      <div class="panel-backdrop" onClick={onClose} />
      <div
        class="panel"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="occ-title"
      >
        <header class="panel-head">
          <div>
            <h2 id="occ-title" tabIndex={-1} ref={heading}>
              {bill.title}, {periodLabel(occ)}
            </h2>
            <p class={`status st-${block.status}`}>
              <span aria-hidden="true">{STATUS_ICONS[block.status]} </span>
              {statusLabel(block.status)}
              {occ.stored?.paidAt !== undefined &&
                ` ${formatDate(occ.stored.paidAt)}`}
            </p>
          </div>
          <button type="button" aria-label={t.common.close} onClick={onClose}>
            ×
          </button>
        </header>

        {occ.outOfSchedule && (
          <div class="card notice">
            <p>{o.outOfSchedule}</p>
            <button
              type="button"
              class="danger"
              disabled={busy}
              onClick={() => {
                void remove();
              }}
            >
              {o.deleteRecord}
            </button>
          </div>
        )}

        {notes.length > 0 && (
          <div class="card notice">
            <ScanNotes notes={notes} />
            {newAccount && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void takeAccount(newAccount.scanned);
                }}
              >
                {o.takeAccount}
              </button>
            )}
          </div>
        )}

        <form
          class="form"
          aria-label={o.form}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void run('save');
          }}
        >
          {text('amount', t.common.amountRsd, {
            input: {
              inputMode: 'decimal',
              autoComplete: 'off',
              ...(fixed !== undefined ? { placeholder: fixed } : {}),
            },
            hint:
              bill.amountMode === 'variable'
                ? o.amountVariableHint
                : o.amountFixedHint,
          })}
          {text('dueDate', t.common.dueDate, { input: { type: 'date' } })}
          {text(
            'reference',
            model ? o.referenceModel(model) : t.common.reference,
            {
              input: { autoComplete: 'off' },
              hint: o.referenceHint,
            },
          )}
          {text('note', t.common.note, { multiline: true })}

          <div class="actions">
            <button
              type="button"
              aria-expanded={scanning}
              aria-controls="occ-scan"
              onClick={() => {
                setScanning(!scanning);
                setScanFailure(undefined);
              }}
            >
              {t.common.scanBill}
            </button>
            <button
              type="button"
              aria-expanded={showQr}
              aria-controls="occ-qr"
              onClick={() => {
                setShowQr(!showQr);
              }}
            >
              {o.qr}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void printSlip();
              }}
            >
              {o.slip}
            </button>
          </div>
          {scanning && (
            <section id="occ-scan" aria-label={t.common.scanning}>
              <Scanner onScan={onScan} />
              {scanFailure && <ScanFailure messages={scanFailure} />}
            </section>
          )}
          {showQr && (
            <section id="occ-qr" aria-label={o.qrSection}>
              <QrDetails slip={slip} />
            </section>
          )}

          <fieldset>
            <legend>{o.payment}</legend>
            <div class="row">
              {text('paidAt', o.paidAt, { input: { type: 'date' } })}
              {text('paidAmount', o.paidAmount, {
                input: { inputMode: 'decimal', autoComplete: 'off' },
                hint: o.paidAmountHint,
              })}
            </div>
          </fieldset>

          <div class="actions sticky">
            {paid ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void run('unpay');
                }}
              >
                {o.unpay}
              </button>
            ) : (
              <button
                type="button"
                class="primary"
                disabled={busy}
                onClick={() => {
                  void run('pay');
                }}
              >
                {o.pay}
              </button>
            )}
            <button
              type="submit"
              class={paid ? 'primary' : undefined}
              disabled={busy}
            >
              {t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
