import { useState } from 'preact/hooks';
import {
  profileToDraft,
  validateProfile,
  type ProfileDraft,
} from '../../core/forms/profile';
import type { Profile } from '../../core/model';
import { IntegrityError, newId } from '../../db/repo';
import { useLive, useRepo } from '../data';
import { TextField, hasErrors, useFeedback } from '../form';

function ProfileForm(props: { profile?: Profile; onDone: () => void }) {
  const repo = useRepo();
  const [id] = useState(() => props.profile?.id ?? newId());
  const [draft, setDraft] = useState(() => profileToDraft(props.profile));
  const result = validateProfile(id, draft);
  const fb = useFeedback(result);
  const set = (patch: Partial<ProfileDraft>) => {
    setDraft({ ...draft, ...patch });
  };

  return (
    <form
      class="card form"
      aria-label={props.profile ? 'Izmena platioca' : 'Novi platilac'}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        fb.submit();
        if (!result.value || hasErrors(result)) return;
        void repo.saveProfile(result.value).then(props.onDone);
      }}
    >
      <TextField
        id="profile-name"
        name="name"
        label="Ime i prezime"
        feedback={fb}
        value={draft.name}
        onInput={(name) => {
          set({ name });
        }}
      />
      <TextField
        id="profile-address"
        name="address"
        label="Adresa"
        feedback={fb}
        multiline
        value={draft.address}
        onInput={(address) => {
          set({ address });
        }}
      />
      <TextField
        id="profile-jmbg"
        name="jmbg"
        label="JMBG"
        hint="Neobavezno. Koristi se u šablonima poziva na broj kao {JMBG}."
        feedback={fb}
        input={{ inputMode: 'numeric', autoComplete: 'off' }}
        value={draft.jmbg}
        onInput={(jmbg) => {
          set({ jmbg });
        }}
      />
      <TextField
        id="profile-pib"
        name="pib"
        label="PIB"
        hint="Neobavezno, za preduzetnike. U šablonima: {PIB}."
        feedback={fb}
        input={{ inputMode: 'numeric', autoComplete: 'off' }}
        value={draft.pib}
        onInput={(pib) => {
          set({ pib });
        }}
      />
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

export function ProfilesView() {
  const repo = useRepo();
  const profiles = useLive((r) => r.listProfiles());
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const remove = async (p: Profile) => {
    if (!confirm(`Obrisati platioca „${p.name}“?`)) return;
    try {
      await repo.deleteProfile(p.id);
      setMessage('');
    } catch (e) {
      if (!(e instanceof IntegrityError)) throw e;
      setMessage(
        `Platilac „${p.name}“ se koristi u računima. Prvo ih prebacite na drugog platioca ili obrišite.`,
      );
    }
  };

  if (!profiles) return null;
  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <section>
      <div class="toolbar">
        <h1>Platioci</h1>
        <button
          type="button"
          class="primary"
          disabled={editing !== null}
          onClick={() => {
            setEditing('new');
          }}
        >
          Novi platilac
        </button>
      </div>
      <p class="lead">
        Platilac je onaj ko plaća: vi, supružnik ili vaša radnja. Ime i adresa
        idu u polje „platilac“ na uplatnici.
      </p>
      {message && (
        <p class="error" role="alert">
          {message}
        </p>
      )}
      {editing === 'new' && (
        <ProfileForm
          onDone={() => {
            setEditing(null);
          }}
        />
      )}
      {sorted.length === 0 && editing === null && (
        <p class="empty">Još nema platilaca.</p>
      )}
      <ul class="cards">
        {sorted.map((p) =>
          editing === p.id ? (
            <li key={p.id}>
              <ProfileForm
                profile={p}
                onDone={() => {
                  setEditing(null);
                }}
              />
            </li>
          ) : (
            <li key={p.id} class="card">
              <div class="card-main">
                <strong>{p.name}</strong>
                {p.address && <div class="muted pre">{p.address}</div>}
                {(p.jmbg ?? p.pib) && (
                  <div class="muted">
                    {p.jmbg && `JMBG ${p.jmbg}`}
                    {p.jmbg && p.pib && ' · '}
                    {p.pib && `PIB ${p.pib}`}
                  </div>
                )}
              </div>
              <div class="actions">
                <button
                  type="button"
                  disabled={editing !== null}
                  onClick={() => {
                    setEditing(p.id);
                  }}
                >
                  Izmeni
                </button>
                <button
                  type="button"
                  class="danger"
                  onClick={() => void remove(p)}
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
