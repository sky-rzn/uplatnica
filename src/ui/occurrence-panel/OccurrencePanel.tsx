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
import { useRepo } from '../data';
import { TextField, hasErrors, useFeedback } from '../form';
import { formatDate } from '../format';
import { qrIssueText } from '../messages';
import { STATUS_ICONS, STATUS_LABELS, periodLabel } from '../period-text';
import { navigate } from '../router';
import { QrCode } from '../uplatnica/QrCode';
import { QrFields } from '../uplatnica/QrFields';
import { Scanner } from '../scanner/Scanner';
import { ScanFailure, ScanNotes, readScan } from '../scanner/scan-result';

function QrDetails({ slip }: { slip: Slip | null }) {
  if (!slip)
    return <p class="hint">Ispravite greške u formi da bi se video QR kod.</p>;
  const { qr } = slip;
  if (!qr) return <p class="hint">Unesite iznos da bi se napravio QR kod.</p>;
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
      <QrCode text={qr.text} ecc={qr.ecc} label="IPS QR kod za uplatu" />
      <QrFields qr={parsed.value} />
      <p class="hint">
        Skenirajte kod u aplikaciji banke i proverite podatke pre potvrde.
      </p>
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
  const paid = occ.stored?.paidAt !== undefined;

  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
    };
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('keydown', onKey);
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
              {STATUS_LABELS[block.status]}
              {occ.stored?.paidAt !== undefined &&
                ` ${formatDate(occ.stored.paidAt)}`}
            </p>
          </div>
          <button type="button" aria-label="Zatvori" onClick={onClose}>
            ×
          </button>
        </header>

        {occ.outOfSchedule && (
          <div class="card notice">
            <p>
              Ovaj period više nije u rasporedu računa. Podaci su sačuvani da se
              uplata ne bi izgubila.
            </p>
            <button
              type="button"
              class="danger"
              disabled={busy}
              onClick={() => {
                void remove();
              }}
            >
              Obriši zapis
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
                Upiši novi račun primaoca u račun
              </button>
            )}
          </div>
        )}

        <form
          class="form"
          aria-label="Period"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void run('save');
          }}
        >
          {text('amount', 'Iznos (RSD)', {
            input: {
              inputMode: 'decimal',
              autoComplete: 'off',
              ...(fixed !== undefined ? { placeholder: fixed } : {}),
            },
            hint:
              bill.amountMode === 'variable'
                ? 'Iznos sa računa za ovaj period.'
                : 'Ostavite prazno za iznos iz računa.',
          })}
          {text('dueDate', 'Rok plaćanja', { input: { type: 'date' } })}
          {text(
            'reference',
            model ? `Poziv na broj (model ${model})` : 'Poziv na broj',
            {
              input: { autoComplete: 'off' },
              hint: 'Ako je na računu drugačiji, prepišite ga.',
            },
          )}
          {text('note', 'Napomena', { multiline: true })}

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
              Skeniraj račun
            </button>
            <button
              type="button"
              aria-expanded={showQr}
              aria-controls="occ-qr"
              onClick={() => {
                setShowQr(!showQr);
              }}
            >
              QR kod
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void printSlip();
              }}
            >
              Uplatnica
            </button>
          </div>
          {scanning && (
            <section id="occ-scan" aria-label="Skeniranje računa">
              <Scanner onScan={onScan} />
              {scanFailure && <ScanFailure messages={scanFailure} />}
            </section>
          )}
          {showQr && (
            <section id="occ-qr" aria-label="IPS QR kod">
              <QrDetails slip={slip} />
            </section>
          )}

          <fieldset>
            <legend>Uplata</legend>
            <div class="row">
              {text('paidAt', 'Datum uplate', { input: { type: 'date' } })}
              {text('paidAmount', 'Uplaćeno (RSD)', {
                input: { inputMode: 'decimal', autoComplete: 'off' },
                hint: 'Prazno: ceo iznos.',
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
                Poništi uplatu
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
                Plaćeno
              </button>
            )}
            <button
              type="submit"
              class={paid ? 'primary' : undefined}
              disabled={busy}
            >
              Sačuvaj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
