import { useState } from 'preact/hooks';
import {
  sectionToDraft,
  validateSection,
  type SectionDraft,
} from '../../core/forms/section';
import type { Section } from '../../core/model';
import { IntegrityError, newId } from '../../db/repo';
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
      aria-label={props.section ? 'Izmena odeljka' : 'Novi odeljak'}
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
        label="Naziv"
        feedback={fb}
        value={draft.name}
        onInput={(name) => {
          set({ name });
        }}
      />
      <Field id="section-color" name="color" label="Boja" feedback={fb}>
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
          label="Arhiviran (skriven sa dijagrama)"
          checked={draft.archived}
          onChange={(archived) => {
            set({ archived });
          }}
        />
      )}
      <div class="actions">
        <button type="submit" class="primary">
          Sačuvaj
        </button>
        <button type="button" onClick={props.onDone}>
          Otkaži
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
    if (!confirm(`Obrisati odeljak „${s.name}“?`)) return;
    try {
      await repo.deleteSection(s.id);
      setMessage('');
    } catch (e) {
      if (!(e instanceof IntegrityError)) throw e;
      setMessage(
        `U odeljku „${s.name}“ ima računa. Premestite ih ili obrišite, ili arhivirajte odeljak.`,
      );
    }
  };

  return (
    <section>
      <div class="toolbar">
        <h1>Odeljci</h1>
        <button
          type="button"
          class="primary"
          disabled={editing !== null}
          onClick={() => {
            setEditing('new');
          }}
        >
          Novi odeljak
        </button>
      </div>
      <p class="lead">
        Odeljci grupišu račune na dijagramu, na primer „Stan“, „Porezi“ ili
        „Paušal“.
      </p>
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
        <p class="empty">Još nema odeljaka.</p>
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
                {s.archived && <div class="muted">Arhiviran</div>}
              </div>
              <div class="actions">
                <button
                  type="button"
                  aria-label={`Pomeri „${s.name}“ gore`}
                  disabled={i === 0}
                  onClick={() => void swap(i, i - 1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Pomeri „${s.name}“ dole`}
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
                  Izmeni
                </button>
                <button
                  type="button"
                  class="danger"
                  onClick={() => void remove(s)}
                >
                  Obriši
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
