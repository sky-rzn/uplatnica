import { useState } from 'preact/hooks';
import {
  profileToDraft,
  validateProfile,
  type ProfileDraft,
} from '../../core/forms/profile';
import type { Profile } from '../../core/model';
import { IntegrityError, newId } from '../../db/repo';
import { t } from '../../i18n';
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
      aria-label={props.profile ? t.profiles.editForm : t.profiles.add}
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
        label={t.profiles.name}
        feedback={fb}
        value={draft.name}
        onInput={(name) => {
          set({ name });
        }}
      />
      <TextField
        id="profile-address"
        name="address"
        label={t.profiles.address}
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
        label={t.profiles.jmbg}
        hint={t.profiles.jmbgHint}
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
        label={t.profiles.pib}
        hint={t.profiles.pibHint}
        feedback={fb}
        input={{ inputMode: 'numeric', autoComplete: 'off' }}
        value={draft.pib}
        onInput={(pib) => {
          set({ pib });
        }}
      />
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

export function ProfilesView() {
  const repo = useRepo();
  const profiles = useLive((r) => r.listProfiles());
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const remove = async (p: Profile) => {
    if (!confirm(t.profiles.confirmDelete(p.name))) return;
    try {
      await repo.deleteProfile(p.id);
      setMessage('');
    } catch (e) {
      if (!(e instanceof IntegrityError)) throw e;
      setMessage(t.profiles.inUse(p.name));
    }
  };

  if (!profiles) return null;
  const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <section>
      <div class="toolbar">
        <h1>{t.profiles.title}</h1>
        <button
          type="button"
          class="primary"
          disabled={editing !== null}
          onClick={() => {
            setEditing('new');
          }}
        >
          {t.profiles.add}
        </button>
      </div>
      <p class="lead">{t.profiles.lead}</p>
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
        <p class="empty">{t.profiles.empty}</p>
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
                    {p.jmbg && `${t.profiles.jmbg} ${p.jmbg}`}
                    {p.jmbg && p.pib && ' · '}
                    {p.pib && `${t.profiles.pib} ${p.pib}`}
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
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  class="danger"
                  onClick={() => void remove(p)}
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
