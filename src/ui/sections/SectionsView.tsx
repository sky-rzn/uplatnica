import { useState } from 'preact/hooks';
import {
  sectionToDraft,
  validateSection,
  type SectionDraft,
} from '../../core/forms/section';
import type { Section } from '../../core/model';
import { IntegrityError, newId } from '../../db/repo';
import { t } from '../../i18n';
import { useLive, useRepo } from '../data';
import { CheckField, Field, TextField, hasErrors, useFeedback } from '../form';

function SectionForm(props: {
  section?: Section;
  nextOrder: number;
  onDone: () => void;
}) {
  const repo = useRepo();
  const [id] = useState(() => props.section?.id ?? newId());
  const [draft, setDraft] = useState(() => sectionToDraft(props.section));
  const result = validateSection(
    id,
    props.section?.order ?? props.nextOrder,
    draft,
  );
  const fb = useFeedback(result);
  const set = (patch: Partial<SectionDraft>) => {
    setDraft({ ...draft, ...patch });
  };

  return (
    <form
      class="card form"
      aria-label={props.section ? t.sections.editForm : t.sections.add}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        fb.submit();
        if (!result.value || hasErrors(result)) return;
        void repo.saveSection(result.value).then(props.onDone);
      }}
    >
      <TextField
        id="section-name"
        name="name"
        label={t.common.name}
        feedback={fb}
        value={draft.name}
        onInput={(name) => {
          set({ name });
        }}
      />
      <Field
        id="section-color"
        name="color"
        label={t.sections.color}
        feedback={fb}
      >
        {(aria) => (
          <input
            type="color"
            {...aria}
            value={draft.color}
            onInput={(e) => {
              set({ color: e.currentTarget.value });
            }}
          />
        )}
      </Field>
      {props.section && (
        <CheckField
          label={t.common.archivedHidden}
          checked={draft.archived}
          onChange={(archived) => {
            set({ archived });
          }}
        />
      )}
      <div class="actions">
        <button type="submit" class="primary">
          {t.common.save}
        </button>
        <button type="button" onClick={props.onDone}>
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}

export function SectionsView() {
  const repo = useRepo();
  const sections = useLive((r) => r.listSections());
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  if (!sections) return null;
  const nextOrder = Math.max(-1, ...sections.map((s) => s.order)) + 1;

  const swap = (i: number, j: number) => {
    const ids = sections.map((s) => s.id);
    [ids[i], ids[j]] = [ids[j] ?? '', ids[i] ?? ''];
    return repo.reorderSections(ids);
  };

  const remove = async (s: Section) => {
    if (!confirm(t.sections.confirmDelete(s.name))) return;
    try {
      await repo.deleteSection(s.id);
      setMessage('');
    } catch (e) {
      if (!(e instanceof IntegrityError)) throw e;
      setMessage(t.sections.inUse(s.name));
    }
  };

  return (
    <section>
      <div class="toolbar">
        <h1>{t.sections.title}</h1>
        <button
          type="button"
          class="primary"
          disabled={editing !== null}
          onClick={() => {
            setEditing('new');
          }}
        >
          {t.sections.add}
        </button>
      </div>
      <p class="lead">{t.sections.lead}</p>
      {message && (
        <p class="error" role="alert">
          {message}
        </p>
      )}
      {editing === 'new' && (
        <SectionForm
          nextOrder={nextOrder}
          onDone={() => {
            setEditing(null);
          }}
        />
      )}
      {sections.length === 0 && editing === null && (
        <p class="empty">{t.sections.empty}</p>
      )}
      <ul class="cards">
        {sections.map((s, i) =>
          editing === s.id ? (
            <li key={s.id}>
              <SectionForm
                section={s}
                nextOrder={nextOrder}
                onDone={() => {
                  setEditing(null);
                }}
              />
            </li>
          ) : (
            <li key={s.id} class={s.archived ? 'card archived' : 'card'}>
              <span class="swatch" style={{ background: s.color }} />
              <div class="card-main">
                <strong>{s.name}</strong>
                {s.archived && <div class="muted">{t.common.archived}</div>}
              </div>
              <div class="actions">
                <button
                  type="button"
                  aria-label={t.sections.up(s.name)}
                  disabled={i === 0}
                  onClick={() => void swap(i, i - 1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={t.sections.down(s.name)}
                  disabled={i === sections.length - 1}
                  onClick={() => void swap(i, i + 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={editing !== null}
                  onClick={() => {
                    setEditing(s.id);
                  }}
                >
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  class="danger"
                  onClick={() => void remove(s)}
                >
                  {t.common.delete}
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
