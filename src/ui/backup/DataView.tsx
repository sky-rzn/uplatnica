import { useState } from 'preact/hooks';
import { todayIso } from '../../core/date';
import { dueDatesIcs } from '../../io/ics';
import { paymentsCsv } from '../../io/csv';
import {
  backupJson,
  fullBackup,
  isEmpty,
  sectionBackup,
  type Backup,
} from '../../io/export';
import type { ImportIssue } from '../../io/import';
import { backupAge, markBackup, useLastBackup } from '../backup-mark';
import { useLive, useRepo } from '../data';
import { download, fileSlug } from '../download';
import { formatDate } from '../format';
import { importIssueText } from '../messages';
import { plural } from '../period-text';

const SHOWN_ISSUES = 20;

type Loaded =
  | { name: string; ok: true; backup: Backup }
  | { name: string; ok: false; issues: ImportIssue[] };

function saveJson(backup: Backup, name: string): void {
  download(backupJson(backup), 'application/json', name);
}

function count(n: number, one: string, few: string): string {
  return `${String(n)} ${plural(n, one, few)}`;
}

function BackupStatus() {
  const at = useLastBackup();
  const today = todayIso();
  const age = backupAge(at, today);
  if (at === null || age === null)
    return <p>Rezervna kopija još nije napravljena.</p>;
  const when = age === 0 ? 'danas' : `pre ${count(age, 'dan', 'dana')}`;
  return (
    <p>
      Poslednja rezervna kopija: {formatDate(todayIso(new Date(at)))} ({when}).
    </p>
  );
}

function ImportCard() {
  const repo = useRepo();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [message, setMessage] = useState('');

  const open = async (file: File) => {
    setMessage('');
    const { parseBackup } = await import('../../io/import');
    const result = parseBackup(await file.text());
    setLoaded({ name: file.name, ...result });
  };

  const merge = async (backup: Backup) => {
    const s = await repo.merge(backup);
    setLoaded(null);
    setMessage(
      `Uvezeno. Novih zapisa: ${String(s.added)}, izmenjenih: ${String(s.updated)}, ` +
        `zadržanih jer su ovde isti ili noviji: ${String(s.kept)}.`,
    );
  };

  const replace = async (backup: Backup) => {
    if (
      !confirm(
        'Zameniti sve podatke sadržajem datoteke? Pre zamene preuzima se rezervna kopija trenutnih podataka.',
      )
    )
      return;
    const current = await repo.dump();
    if (!isEmpty(current)) {
      const now = new Date();
      saveJson(
        fullBackup(current, now),
        `uplatnica-pre-uvoza-${todayIso(now)}.json`,
      );
      markBackup(now);
    }
    await repo.replaceAll(backup);
    setLoaded(null);
    setMessage('Podaci su zamenjeni sadržajem datoteke.');
  };

  const issues = loaded && !loaded.ok ? loaded.issues : [];
  return (
    <section class="card" aria-labelledby="import-title">
      <h2 id="import-title">Uvoz</h2>
      <label class="field">
        Rezervna kopija (JSON)
        <input
          type="file"
          accept=".json,application/json"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (file) void open(file);
          }}
        />
      </label>
      {loaded?.ok === false && (
        <div role="alert">
          <p class="error">Datoteku „{loaded.name}“ nije moguće uvesti:</p>
          <ul class="error">
            {issues.slice(0, SHOWN_ISSUES).map((issue, i) => (
              <li key={i}>{importIssueText(issue)}</li>
            ))}
            {issues.length > SHOWN_ISSUES && (
              <li>i još {String(issues.length - SHOWN_ISSUES)}.</li>
            )}
          </ul>
        </div>
      )}
      {loaded?.ok && (
        <>
          <p>
            „{loaded.name}“ od{' '}
            {formatDate(todayIso(new Date(loaded.backup.exportedAt)))}:{' '}
            {count(loaded.backup.profiles.length, 'platilac', 'platilaca')},{' '}
            {count(loaded.backup.sections.length, 'odeljak', 'odeljaka')},{' '}
            {count(loaded.backup.bills.length, 'račun', 'računa')},{' '}
            {count(loaded.backup.occurrences.length, 'period', 'perioda')}.
          </p>
          <p class="hint">
            Spajanje dodaje nove zapise, a postojeće menja samo ako su u
            datoteci kasnije izmenjeni. Ništa se ne briše.
            {loaded.backup.partial &&
              ' Datoteka sadrži samo deo podataka, pa njome ne možete zameniti sve.'}
          </p>
          <div class="actions">
            <button
              type="button"
              class="primary"
              onClick={() => void merge(loaded.backup)}
            >
              Spoji
            </button>
            <button
              type="button"
              class="danger"
              disabled={loaded.backup.partial}
              onClick={() => void replace(loaded.backup)}
            >
              Zameni sve
            </button>
          </div>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

export function DataView() {
  const repo = useRepo();
  const sections = useLive((r) => r.listSections());
  const [sectionId, setSectionId] = useState('');
  if (!sections) return null;
  const picked = sections.find((s) => s.id === sectionId) ?? sections[0];

  const exportAll = async () => {
    const now = new Date();
    saveJson(
      fullBackup(await repo.dump(), now),
      `uplatnica-${todayIso(now)}.json`,
    );
    markBackup(now);
  };

  const exportSection = async () => {
    if (!picked) return;
    const now = new Date();
    saveJson(
      sectionBackup(await repo.dump(), picked.id, now),
      `uplatnica-${fileSlug(picked.name)}-${todayIso(now)}.json`,
    );
  };

  const exportCsv = async () => {
    download(
      paymentsCsv(await repo.dump()),
      'text/csv;charset=utf-8',
      `uplatnica-placanja-${todayIso()}.csv`,
    );
  };

  const exportIcs = async () => {
    const now = new Date();
    download(
      dueDatesIcs(await repo.dump(), todayIso(now), now),
      'text/calendar;charset=utf-8',
      `uplatnica-rokovi-${todayIso(now)}.ics`,
    );
  };

  return (
    <section class="data-view">
      <h1>Podaci</h1>
      <p class="lead">
        Podaci se čuvaju samo u ovom pregledaču. Rezervna kopija je datoteka
        koju možete uvesti ovde ili u pregledaču na drugom uređaju.
      </p>

      <section class="card" aria-labelledby="backup-title">
        <h2 id="backup-title">Rezervna kopija</h2>
        <BackupStatus />
        <div class="actions">
          <button
            type="button"
            class="primary"
            onClick={() => void exportAll()}
          >
            Izvezi sve (JSON)
          </button>
        </div>
      </section>

      {picked && (
        <section class="card" aria-labelledby="section-export-title">
          <h2 id="section-export-title">Odeljak kao šablon</h2>
          <p class="hint">
            Računi iz odeljka i njihovi platioci, bez istorije plaćanja i bez
            JMBG i PIB, da biste ih podelili sa nekim.
          </p>
          <div class="actions">
            <select
              aria-label="Odeljak"
              value={picked.id}
              onChange={(e) => {
                setSectionId(e.currentTarget.value);
              }}
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => void exportSection()}>
              Izvezi odeljak
            </button>
          </div>
        </section>
      )}

      <ImportCard />

      <section class="card" aria-labelledby="other-title">
        <h2 id="other-title">Za druge programe</h2>
        <p class="hint">
          Istorija plaćanja otvara se u Excelu. Rokovi neplaćenih perioda za
          narednu godinu uvoze se u kalendar telefona, koji podseća dan ranije.
        </p>
        <div class="actions">
          <button type="button" onClick={() => void exportCsv()}>
            Istorija plaćanja (CSV)
          </button>
          <button type="button" onClick={() => void exportIcs()}>
            Rokovi za kalendar (ICS)
          </button>
        </div>
      </section>
    </section>
  );
}
