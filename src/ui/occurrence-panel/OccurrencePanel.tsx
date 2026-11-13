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
import type { Block } from '../../core/timeline';
import { useRepo } from '../data';
import { TextField, hasErrors, useFeedback } from '../form';
import { formatDate } from '../format';
import { STATUS_ICONS, STATUS_LABELS, periodLabel } from '../period-text';

export function OccurrencePanel(props: {
  bill: Bill;
  block: Block;
  profile: Profile | undefined;
  onClose: () => void;
}) {
  const { bill, block, onClose } = props;
  const { occ } = block;
  const repo = useRepo();
  const ctx = { bill, occ, profile: props.profile, today: todayIso() };
  const [draft, setDraft] = useState<OccurrenceDraft>(() =>
    occurrenceToDraft(ctx, formatAmount),
  );
  const [busy, setBusy] = useState(false);
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
