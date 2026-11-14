import { useState } from 'preact/hooks';
import { todayIso } from '../../core/date';
import {
  EVERY_MONTHS,
  applyPreset,
  billToDraft,
  customPlaceholders,
  emptyBillDraft,
  validateBill,
  type BillDraft,
  type DueKind,
} from '../../core/forms/bill';
import { applyScanToBill, type ScanNote } from '../../core/forms/scan';
import type { Bill, Profile, ReferenceModel, Section } from '../../core/model';
import { formatAmount } from '../../core/money';
import { formatAccount, normalizeAccount } from '../../core/serbia/account';
import { PAYMENT_BASES, paymentBasis } from '../../core/serbia/paymentCodes';
import { PRESET_GROUPS, findPreset } from '../../core/serbia/presets';
import { paymentBasisName } from '../payment-basis';
import { newId } from '../../db/repo';
import { t } from '../../i18n';
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
import { Scanner } from '../scanner/Scanner';
import { ScanFailure, ScanNotes, readScan } from '../scanner/scan-result';
import { everyLabel } from '../schedule-text';

const MODELS: readonly ReferenceModel[] = ['', '97', '11'];
const DUE_KINDS: readonly DueKind[] = ['day', 'last', 'daysFromStart'];
const MONTH_OFFSETS = Array.from({ length: 13 }, (_, i) => i);

type TextKey = {
  [K in keyof BillDraft]: BillDraft[K] extends string ? K : never;
}[keyof BillDraft];

function PaymentCodeList() {
  return (
    <datalist id="payment-codes">
      {['2', '1'].flatMap((form) =>
        PAYMENT_BASES.map((b) => (
          <option key={form + b.code} value={form + b.code}>
            {paymentBasisName(b)}
          </option>
        )),
      )}
    </datalist>
  );
}

function PresetPicker(props: { value: string; onPick: (id: string) => void }) {
  const found = findPreset(props.value);
  const p = t.presets;
  return (
    <div class="field preset">
      <label for="bill-preset">{p.label}</label>
      <select
        id="bill-preset"
        aria-describedby={found ? 'bill-preset-note' : undefined}
        value={props.value}
        onChange={(ev) => {
          props.onPick(ev.currentTarget.value);
        }}
      >
        <option value="">{p.none}</option>
        {PRESET_GROUPS.map((g) => (
          <optgroup key={g.group} label={p.groups[g.group]}>
            {g.bills.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {found && (
        <div class="hint" id="bill-preset-note">
          <p>{p.notes[found.group.group]}</p>
          <p>{p.checked(formatDate(found.group.verifiedAt))}</p>
        </div>
      )}
    </div>
  );
}

function Editor(props: {
  bill?: Bill;
  sections: readonly Section[];
  profiles: readonly Profile[];
  qr?: string;
}) {
  const repo = useRepo();
  const e = t.billEditor;
  const today = todayIso();
  const [id] = useState(() => props.bill?.id ?? newId());
  const [initial] = useState(() => {
    const draft = props.bill
      ? billToDraft(props.bill, formatAmount)
      : emptyBillDraft(
          props.sections.find((s) => !s.archived)?.id ?? '',
          props.profiles[0]?.id ?? '',
          today,
        );
    const read = props.qr === undefined ? undefined : readScan(props.qr);
    if (!read?.ok) return { draft, notes: [], failure: read?.messages };
    return {
      ...applyScanToBill(draft, read.qr, formatAmount),
      failure: undefined,
    };
  });
  const [draft, setDraft] = useState<BillDraft>(initial.draft);
  const [notes, setNotes] = useState<readonly ScanNote[]>(initial.notes);
  const [scanning, setScanning] = useState(false);
  const [scanFailure, setScanFailure] = useState(initial.failure);
  const [saving, setSaving] = useState(false);
  const [presetId, setPresetId] = useState('');
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

  const onScan = (text: string) => {
    const read = readScan(text);
    if (!read.ok) {
      setScanFailure(read.messages);
      return;
    }
    const r = applyScanToBill(draft, read.qr, formatAmount);
    setDraft(r.draft);
    setNotes(r.notes);
    setScanFailure(undefined);
    setScanning(false);
  };

  const pickPreset = (pid: string) => {
    setPresetId(pid);
    const found = findPreset(pid);
    if (!found) return;
    setDraft(applyPreset(draft, found.preset));
    setNotes([]);
    fb.reset();
  };

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
    if (!props.bill || !confirm(e.confirmDelete(props.bill.title))) return;
    await repo.deleteBill(props.bill.id);
    navigate({ name: 'bills' });
  };

  return (
    <form
      class="form bill-editor"
      aria-label={props.bill ? e.editForm : t.common.newBill}
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault();
        void save();
      }}
    >
      {!props.bill && <PresetPicker value={presetId} onPick={pickPreset} />}
      <div class="scan-fill">
        <button
          type="button"
          aria-expanded={scanning}
          aria-controls="bill-scan"
          onClick={() => {
            setScanning(!scanning);
            setScanFailure(undefined);
          }}
        >
          {e.fillFromQr}
        </button>
        <p class="hint">{e.fillFromQrHint}</p>
        {scanning && (
          <section id="bill-scan" aria-label={t.common.scanning}>
            <Scanner onScan={onScan} />
          </section>
        )}
        {scanFailure && <ScanFailure messages={scanFailure} />}
        <ScanNotes notes={notes} />
      </div>

      <fieldset>
        <legend>{e.basics}</legend>
        {text('title', t.common.name, { hint: e.titleHint })}
        <SelectField
          id="bill-section"
          name="sectionId"
          label={t.common.section}
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
          label={t.common.payer}
          feedback={fb}
          value={draft.profileId}
          options={props.profiles.map((p) => ({ value: p.id, label: p.name }))}
          onChange={(profileId) => {
            set({ profileId });
          }}
        />
      </fieldset>

      <fieldset>
        <legend>{e.payee}</legend>
        {text('payeeName', e.payeeName)}
        {text('payeeAddress', e.payeeAddress, { multiline: true })}
        {text('account', e.account, {
          input: {
            inputMode: 'numeric',
            autoComplete: 'off',
            placeholder: '160-602-16',
          },
          hint: account.ok ? formatAccount(account.value) : undefined,
        })}
      </fieldset>

      <fieldset>
        <legend>{e.payment}</legend>
        {text('paymentCode', t.common.paymentCode, {
          input: { inputMode: 'numeric', list: 'payment-codes', maxLength: 3 },
          hint: (basis && paymentBasisName(basis)) ?? e.paymentCodeHint,
        })}
        <PaymentCodeList />
        {text('purpose', e.purpose)}
        <div class="row">
          <SelectField
            id="bill-model"
            name="model"
            label={e.model}
            feedback={fb}
            value={draft.model}
            options={MODELS.map((m) => ({ value: m, label: m || e.noModel }))}
            onChange={(model) => {
              set({ model });
            }}
          />
          {text('reference', t.common.reference, {
            input: { autoComplete: 'off' },
            hint:
              e.referenceHint + (draft.model === '97' ? e.referenceHint97 : ''),
          })}
        </div>
        {vars.map((name) => (
          <TextField
            key={name}
            id={`bill-var-${name}`}
            name={`referenceVars.${name}`}
            label={e.varValue(name)}
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
            {e.referencePreview(preview.reference.periodKey)}
            <output>
              {draft.model ? `${draft.model} ` : ''}
              {preview.reference.value}
            </output>
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>{e.amount}</legend>
        <div class="radios" role="radiogroup" aria-label={e.amountKind}>
          <label class="check">
            <input
              type="radio"
              name="amountMode"
              checked={draft.amountMode === 'fixed'}
              onChange={() => {
                set({ amountMode: 'fixed' });
              }}
            />
            {e.fixed}
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
            {e.variable}
          </label>
        </div>
        {draft.amountMode === 'fixed' &&
          text('amount', t.common.amountRsd, {
            input: {
              inputMode: 'decimal',
              autoComplete: 'off',
              placeholder: '1.287,60',
            },
          })}
      </fieldset>

      <fieldset>
        <legend>{e.schedule}</legend>
        <div class="radios" role="radiogroup" aria-label={e.scheduleKind}>
          <label class="check">
            <input
              type="radio"
              name="scheduleKind"
              checked={draft.scheduleKind === 'periodic'}
              onChange={() => {
                set({ scheduleKind: 'periodic' });
              }}
            />
            {e.periodic}
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
            {e.dates}
          </label>
        </div>

        {draft.scheduleKind === 'periodic' ? (
          <>
            <SelectField
              id="bill-every"
              name="everyMonths"
              label={e.every}
              feedback={fb}
              value={String(draft.everyMonths)}
              options={EVERY_MONTHS.map((m) => ({
                value: String(m),
                label: everyLabel(m),
              }))}
              onChange={(v) => {
                set({ everyMonths: Number(v) as BillDraft['everyMonths'] });
              }}
            />
            <div class="row">
              {text('start', e.start, {
                input: { type: 'month', placeholder: e.monthPlaceholder },
              })}
              {text('end', e.end, {
                input: { type: 'month', placeholder: e.monthPlaceholder },
                hint: t.common.optional,
              })}
            </div>
            <SelectField
              id="bill-due-kind"
              name="dueKind"
              label={t.common.dueDate}
              feedback={fb}
              value={draft.dueKind}
              options={DUE_KINDS.map((k) => ({
                value: k,
                label: e.dueKind[k],
              }))}
              onChange={(dueKind) => {
                set({ dueKind });
              }}
            />
            {draft.dueKind === 'daysFromStart' ? (
              text('daysFromStart', e.daysFromStart, {
                input: { inputMode: 'numeric' },
                hint: e.daysFromStartHint,
              })
            ) : (
              <div class="row">
                {draft.dueKind === 'day' &&
                  text('dueDay', e.day, { input: { inputMode: 'numeric' } })}
                <SelectField
                  id="bill-month-offset"
                  name="monthOffset"
                  label={e.month}
                  feedback={fb}
                  value={draft.monthOffset}
                  options={MONTH_OFFSETS.map((i) => ({
                    value: String(i),
                    label: e.monthOffset(i),
                  }))}
                  onChange={(monthOffset) => {
                    set({ monthOffset });
                  }}
                />
              </div>
            )}
            <CheckField
              label={e.shiftToWorkday}
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
                  label={e.date(i + 1)}
                  feedback={fb}
                >
                  {(aria) => (
                    <input
                      type="date"
                      {...aria}
                      value={date}
                      onInput={(ev) => {
                        const dates = [...draft.dates];
                        dates[i] = ev.currentTarget.value;
                        set({ dates });
                      }}
                    />
                  )}
                </Field>
                <button
                  type="button"
                  aria-label={e.removeDate(i + 1)}
                  onClick={() => {
                    set({ dates: draft.dates.filter((_, j) => j !== i) });
                  }}
                >
                  {e.remove}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                set({ dates: [...draft.dates, ''] });
              }}
            >
              {e.addDate}
            </button>
            {datesError && (
              <p class="error" role="alert">
                {issueText(datesError)}
              </p>
            )}
          </div>
        )}
        {text('graceDays', e.graceDays, {
          input: { inputMode: 'numeric' },
          hint: e.graceDaysHint,
        })}
        {preview.next.length > 0 && (
          <p class="preview" aria-live="polite">
            {preview.next.some((p) => p.dueDate >= today)
              ? e.nextDues
              : e.lastDue}
            {preview.next.map((p) => formatDate(p.dueDate)).join(', ')}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>{e.other}</legend>
        {text('notes', t.common.note, { multiline: true })}
        {props.bill && (
          <CheckField
            label={t.common.archivedHidden}
            checked={draft.archived}
            onChange={(archived) => {
              set({ archived });
            }}
          />
        )}
      </fieldset>

      <div class="actions sticky">
        <button type="submit" class="primary" disabled={saving}>
          {t.common.save}
        </button>
        <a class="button" href={href({ name: 'bills' })}>
          {t.common.cancel}
        </a>
        {props.bill && (
          <button type="button" class="danger" onClick={() => void remove()}>
            {t.common.delete}
          </button>
        )}
      </div>
    </form>
  );
}

export function BillEditor({ id, qr }: { id: string | null; qr?: string }) {
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
        <h1>{t.billEditor.notFound}</h1>
        <a href={href({ name: 'bills' })}>{t.billEditor.backToBills}</a>
      </section>
    );
  return (
    <section>
      <h1>{data.bill ? data.bill.title : t.common.newBill}</h1>
      <Editor
        key={id ?? `new:${qr ?? ''}`}
        {...(data.bill ? { bill: data.bill } : {})}
        {...(qr !== undefined && id === null ? { qr } : {})}
        sections={data.sections}
        profiles={data.profiles}
      />
    </section>
  );
}
