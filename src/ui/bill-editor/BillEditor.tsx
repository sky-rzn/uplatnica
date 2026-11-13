import { useState } from 'preact/hooks';
import { todayIso } from '../../core/date';
import {
  EVERY_MONTHS,
  billToDraft,
  customPlaceholders,
  emptyBillDraft,
  validateBill,
  type BillDraft,
  type DueKind,
} from '../../core/forms/bill';
import type { Bill, Profile, ReferenceModel, Section } from '../../core/model';
import { formatAmount } from '../../core/money';
import { formatAccount, normalizeAccount } from '../../core/serbia/account';
import { PAYMENT_BASES, paymentBasis } from '../../core/serbia/paymentCodes';
import { newId } from '../../db/repo';
import { useLive, useRepo } from '../data';
import {
  CheckField,
  Field,
  SelectField,
  TextField,
  hasErrors,
  useFeedback,
} from '../form';
import { formatDate } from '../format';
import { issueText } from '../messages';
import { href, navigate } from '../router';
import { EVERY_LABELS } from '../schedule-text';

const MODELS: readonly { value: ReferenceModel; label: string }[] = [
  { value: '', label: 'bez modela' },
  { value: '97', label: '97' },
  { value: '11', label: '11' },
];

const DUE_KINDS: readonly { value: DueKind; label: string }[] = [
  { value: 'day', label: 'određeni dan u mesecu' },
  { value: 'last', label: 'poslednji dan u mesecu' },
  { value: 'daysFromStart', label: 'broj dana od početka perioda' },
];

const MONTH_OFFSETS = Array.from({ length: 13 }, (_, i) => ({
  value: String(i),
  label:
    i === 0
      ? 'istog meseca kad počinje period'
      : i === 1
        ? 'narednog meseca'
        : `${String(i)}. meseca posle početka`,
}));

type TextKey = {
  [K in keyof BillDraft]: BillDraft[K] extends string ? K : never;
}[keyof BillDraft];

function PaymentCodeList() {
  return (
    <datalist id="payment-codes">
      {['2', '1'].flatMap((form) =>
        PAYMENT_BASES.map((b) => (
          <option key={form + b.code} value={form + b.code}>
            {b.sr}
          </option>
        )),
      )}
    </datalist>
  );
}

function Editor(props: {
  bill?: Bill;
  sections: readonly Section[];
  profiles: readonly Profile[];
}) {
  const repo = useRepo();
  const today = todayIso();
  const [id] = useState(() => props.bill?.id ?? newId());
  const [draft, setDraft] = useState<BillDraft>(() =>
    props.bill
      ? billToDraft(props.bill, formatAmount)
      : emptyBillDraft(
          props.sections.find((s) => !s.archived)?.id ?? '',
          props.profiles[0]?.id ?? '',
          today,
        ),
  );
  const [saving, setSaving] = useState(false);
  const result = validateBill(draft, {
    id,
    sections: props.sections,
    profiles: props.profiles,
    today,
  });
  const fb = useFeedback(result);
  const set = (patch: Partial<BillDraft>) => {
    setDraft({ ...draft, ...patch });
  };
  const text = (
    name: TextKey,
    label: string,
    extra: Partial<Parameters<typeof TextField>[0]> = {},
  ) => (
    <TextField
      id={`bill-${name}`}
      name={name}
      label={label}
      feedback={fb}
      value={draft[name]}
      onInput={(v) => {
        set({ [name]: v });
      }}
      {...extra}
    />
  );

  const account = normalizeAccount(draft.account);
  const basis = paymentBasis(draft.paymentCode.trim());
  const vars = customPlaceholders(draft.reference);
  const { preview } = result;
  const datesError = fb.error('dates');

  const save = async () => {
    fb.submit();
    if (!result.value || hasErrors(result)) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setSaving(true);
    try {
      await repo.saveBill(result.value);
      navigate({ name: 'bills' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (
      !props.bill ||
      !confirm(
        `Obrisati račun „${props.bill.title}“ zajedno sa svim unetim iznosima i uplatama?`,
      )
    )
      return;
    await repo.deleteBill(props.bill.id);
    navigate({ name: 'bills' });
  };

  return (
    <form
      class="form bill-editor"
      aria-label={props.bill ? 'Izmena računa' : 'Novi račun'}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <fieldset>
        <legend>Osnovno</legend>
        {text('title', 'Naziv', {
          hint: 'Kako će se račun zvati na dijagramu, na primer „Infostan“.',
        })}
        <SelectField
          id="bill-section"
          name="sectionId"
          label="Odeljak"
          feedback={fb}
          value={draft.sectionId}
          options={props.sections
            .filter((s) => !s.archived || s.id === draft.sectionId)
            .map((s) => ({ value: s.id, label: s.name }))}
          onChange={(sectionId) => {
            set({ sectionId });
          }}
        />
        <SelectField
          id="bill-profile"
          name="profileId"
          label="Platilac"
          feedback={fb}
          value={draft.profileId}
          options={props.profiles.map((p) => ({ value: p.id, label: p.name }))}
          onChange={(profileId) => {
            set({ profileId });
          }}
        />
      </fieldset>

      <fieldset>
        <legend>Primalac</legend>
        {text('payeeName', 'Naziv primaoca')}
        {text('payeeAddress', 'Adresa primaoca', { multiline: true })}
        {text('account', 'Račun primaoca', {
          input: {
            inputMode: 'numeric',
            autoComplete: 'off',
            placeholder: '160-602-16',
          },
          hint: account.ok ? formatAccount(account.value) : undefined,
        })}
      </fieldset>

      <fieldset>
        <legend>Plaćanje</legend>
        {text('paymentCode', 'Šifra plaćanja', {
          input: { inputMode: 'numeric', list: 'payment-codes', maxLength: 3 },
          hint:
            basis?.sr ??
            'Prva cifra: 1 gotovinsko, 2 bezgotovinsko plaćanje. Česte šifre: 289, 253, 221.',
        })}
        <PaymentCodeList />
        {text('purpose', 'Svrha uplate')}
        <div class="row">
          <SelectField
            id="bill-model"
            name="model"
            label="Model"
            feedback={fb}
            value={draft.model}
            options={MODELS}
            onChange={(model) => {
              set({ model });
            }}
          />
          {text('reference', 'Poziv na broj', {
            input: { autoComplete: 'off' },
            hint: (
              <>
                Može šablon: {'{JMBG}'}, {'{PIB}'}, {'{YYYY}'}, {'{YY}'},{' '}
                {'{MM}'}, {'{Q}'} i sopstvena polja, npr. {'{NAPLATNI:11}'}.
                {draft.model === '97' &&
                  ' Kontrolni broj za model 97 se dodaje sam.'}
              </>
            ),
          })}
        </div>
        {vars.map((name) => (
          <TextField
            key={name}
            id={`bill-var-${name}`}
            name={`referenceVars.${name}`}
            label={`Vrednost za {${name}}`}
            feedback={fb}
            input={{ autoComplete: 'off' }}
            value={draft.referenceVars[name] ?? ''}
            onInput={(v) => {
              set({ referenceVars: { ...draft.referenceVars, [name]: v } });
            }}
          />
        ))}
        {preview.reference && (
          <p class="preview" aria-live="polite">
            Poziv na broj za period {preview.reference.periodKey}:{' '}
            <output>
              {draft.model ? `${draft.model} ` : ''}
              {preview.reference.value}
            </output>
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>Iznos</legend>
        <div class="radios" role="radiogroup" aria-label="Vrsta iznosa">
          <label class="check">
            <input
              type="radio"
              name="amountMode"
              checked={draft.amountMode === 'fixed'}
              onChange={() => {
                set({ amountMode: 'fixed' });
              }}
            />
            Isti iznos svaki put
          </label>
          <label class="check">
            <input
              type="radio"
              name="amountMode"
              checked={draft.amountMode === 'variable'}
              onChange={() => {
                set({ amountMode: 'variable' });
              }}
            />
            Iznos se unosi po prijemu računa
          </label>
        </div>
        {draft.amountMode === 'fixed' &&
          text('amount', 'Iznos (RSD)', {
            input: {
              inputMode: 'decimal',
              autoComplete: 'off',
              placeholder: '1.287,60',
            },
          })}
      </fieldset>

      <fieldset>
        <legend>Rokovi</legend>
        <div class="radios" role="radiogroup" aria-label="Vrsta rasporeda">
          <label class="check">
            <input
              type="radio"
              name="scheduleKind"
              checked={draft.scheduleKind === 'periodic'}
              onChange={() => {
                set({ scheduleKind: 'periodic' });
              }}
            />
            Periodično
          </label>
          <label class="check">
            <input
              type="radio"
              name="scheduleKind"
              checked={draft.scheduleKind === 'dates'}
              onChange={() => {
                set({
                  scheduleKind: 'dates',
                  dates: draft.dates.length > 0 ? draft.dates : [''],
                });
              }}
            />
            Određeni datumi
          </label>
        </div>

        {draft.scheduleKind === 'periodic' ? (
          <>
            <SelectField
              id="bill-every"
              name="everyMonths"
              label="Period"
              feedback={fb}
              value={String(draft.everyMonths)}
              options={EVERY_MONTHS.map((m) => ({
                value: String(m),
                label: EVERY_LABELS[m],
              }))}
              onChange={(v) => {
                set({ everyMonths: Number(v) as BillDraft['everyMonths'] });
              }}
            />
            <div class="row">
              {text('start', 'Prvi period', {
                input: { type: 'month', placeholder: 'GGGG-MM' },
              })}
              {text('end', 'Poslednji period', {
                input: { type: 'month', placeholder: 'GGGG-MM' },
                hint: 'Neobavezno.',
              })}
            </div>
            <SelectField
              id="bill-due-kind"
              name="dueKind"
              label="Rok plaćanja"
              feedback={fb}
              value={draft.dueKind}
              options={DUE_KINDS}
              onChange={(dueKind) => {
                set({ dueKind });
              }}
            />
            {draft.dueKind === 'daysFromStart' ? (
              text('daysFromStart', 'Dana od prvog dana perioda', {
                input: { inputMode: 'numeric' },
                hint: 'Porez na imovinu: 44 (45. dan tromesečja).',
              })
            ) : (
              <div class="row">
                {draft.dueKind === 'day' &&
                  text('dueDay', 'Dan', { input: { inputMode: 'numeric' } })}
                <SelectField
                  id="bill-month-offset"
                  name="monthOffset"
                  label="Mesec"
                  feedback={fb}
                  value={draft.monthOffset}
                  options={MONTH_OFFSETS}
                  onChange={(monthOffset) => {
                    set({ monthOffset });
                  }}
                />
              </div>
            )}
            <CheckField
              label="Ako rok padne na vikend ili praznik, pomeri ga na prvi radni dan"
              checked={draft.shiftToWorkday}
              onChange={(shiftToWorkday) => {
                set({ shiftToWorkday });
              }}
            />
          </>
        ) : (
          <div class="dates">
            {draft.dates.map((date, i) => (
              <div class="row" key={i}>
                <Field
                  id={`bill-date-${String(i)}`}
                  name={`dates.${String(i)}`}
                  label={`Datum ${String(i + 1)}`}
                  feedback={fb}
                >
                  {(aria) => (
                    <input
                      type="date"
                      {...aria}
                      value={date}
                      onInput={(e) => {
                        const dates = [...draft.dates];
                        dates[i] = e.currentTarget.value;
                        set({ dates });
                      }}
                    />
                  )}
                </Field>
                <button
                  type="button"
                  aria-label={`Ukloni datum ${String(i + 1)}`}
                  onClick={() => {
                    set({ dates: draft.dates.filter((_, j) => j !== i) });
                  }}
                >
                  Ukloni
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                set({ dates: [...draft.dates, ''] });
              }}
            >
              Dodaj datum
            </button>
            {datesError && (
              <p class="error" role="alert">
                {issueText(datesError)}
              </p>
            )}
          </div>
        )}
        {text('graceDays', 'Dana tolerancije posle roka', {
          input: { inputMode: 'numeric' },
          hint: 'Neobavezno. Toliko dana posle roka račun se još ne smatra docnjom.',
        })}
        {preview.next.length > 0 && (
          <p class="preview" aria-live="polite">
            {preview.next.some((p) => p.dueDate >= today)
              ? 'Sledeći rokovi: '
              : 'Poslednji rok: '}
            {preview.next.map((p) => formatDate(p.dueDate)).join(', ')}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>Ostalo</legend>
        {text('notes', 'Napomena', { multiline: true })}
        {props.bill && (
          <CheckField
            label="Arhiviran (skriven sa dijagrama)"
            checked={draft.archived}
            onChange={(archived) => {
              set({ archived });
            }}
          />
        )}
      </fieldset>

      <div class="actions sticky">
        <button type="submit" class="primary" disabled={saving}>
          Sačuvaj
        </button>
        <a class="button" href={href({ name: 'bills' })}>
          Otkaži
        </a>
        {props.bill && (
          <button type="button" class="danger" onClick={() => void remove()}>
            Obriši
          </button>
        )}
      </div>
    </form>
  );
}

export function BillEditor({ id }: { id: string | null }) {
  const data = useLive(
    async (r) => ({
      sections: await r.listSections(),
      profiles: await r.listProfiles(),
      bill: id === null ? undefined : await r.getBill(id),
    }),
    [id],
  );
  if (!data) return null;
  if (id !== null && !data.bill)
    return (
      <section>
        <h1>Račun nije pronađen</h1>
        <a href={href({ name: 'bills' })}>Nazad na račune</a>
      </section>
    );
  return (
    <section>
      <h1>{data.bill ? data.bill.title : 'Novi račun'}</h1>
      <Editor
        key={id ?? 'new'}
        {...(data.bill ? { bill: data.bill } : {})}
        sections={data.sections}
        profiles={data.profiles}
      />
    </section>
  );
}
