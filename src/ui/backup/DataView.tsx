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
import { href } from '../router';
import { t } from '../../i18n';

const SHOWN_ISSUES = 20;

type Loaded =
  | { name: string; ok: true; backup: Backup }
  | { name: string; ok: false; issues: ImportIssue[] };

function saveJson(backup: Backup, name: string): void {
  download(backupJson(backup), 'application/json', name);
}

function BackupStatus() {
  const at = useLastBackup();
  const today = todayIso();
  const age = backupAge(at, today);
  if (at === null || age === null) return <p>{t.data.noBackup}</p>;
  return <p>{t.data.lastBackup(formatDate(todayIso(new Date(at))), age)}</p>;
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
    setMessage(t.data.merged(s.added, s.updated, s.kept, s.deleted));
  };

  const replace = async (backup: Backup) => {
    if (!confirm(t.data.confirmReplace)) return;
    const current = await repo.dump();
    if (!isEmpty(current)) {
      const now = new Date();
      saveJson(
        fullBackup(current, now),
        `${t.data.file.beforeImport}-${todayIso(now)}.json`,
      );
      markBackup(now);
    }
    await repo.replaceAll(backup);
    setLoaded(null);
    setMessage(t.data.replaced);
  };

  const issues = loaded && !loaded.ok ? loaded.issues : [];
  return (
    <section class="card" aria-labelledby="import-title">
      <h2 id="import-title">{t.data.import}</h2>
      <label class="field">
        {t.data.importFile}
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
          <p class="error">{t.data.cannotImport(loaded.name)}</p>
          <ul class="error">
            {issues.slice(0, SHOWN_ISSUES).map((issue, i) => (
              <li key={i}>{importIssueText(issue)}</li>
            ))}
            {issues.length > SHOWN_ISSUES && (
              <li>{t.data.more(issues.length - SHOWN_ISSUES)}</li>
            )}
          </ul>
        </div>
      )}
      {loaded?.ok && (
        <>
          <p>
            {t.data.contents(
              loaded.name,
              formatDate(todayIso(new Date(loaded.backup.exportedAt))),
              {
                profiles: loaded.backup.profiles.length,
                sections: loaded.backup.sections.length,
                bills: loaded.backup.bills.length,
                periods: loaded.backup.occurrences.length,
              },
            )}
          </p>
          <p class="hint">
            {t.data.mergeHint}
            {loaded.backup.partial && t.data.partialHint}
          </p>
          <div class="actions">
            <button
              type="button"
              class="primary"
              onClick={() => void merge(loaded.backup)}
            >
              {t.data.merge}
            </button>
            <button
              type="button"
              class="danger"
              disabled={loaded.backup.partial}
              onClick={() => void replace(loaded.backup)}
            >
              {t.data.replace}
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
      `${t.data.file.payments}-${todayIso()}.csv`,
    );
  };

  const exportIcs = async () => {
    const now = new Date();
    download(
      dueDatesIcs(await repo.dump(), todayIso(now), now),
      'text/calendar;charset=utf-8',
      `${t.data.file.dues}-${todayIso(now)}.ics`,
    );
  };

  return (
    <section class="data-view">
      <h1>{t.data.title}</h1>
      <p class="lead">{t.data.lead}</p>

      <section class="card" aria-labelledby="backup-title">
        <h2 id="backup-title">{t.data.backup}</h2>
        <BackupStatus />
        <div class="actions">
          <button
            type="button"
            class="primary"
            onClick={() => void exportAll()}
          >
            {t.data.exportAll}
          </button>
        </div>
      </section>

      {picked && (
        <section class="card" aria-labelledby="section-export-title">
          <h2 id="section-export-title">{t.data.sectionTemplate}</h2>
          <p class="hint">{t.data.sectionTemplateHint}</p>
          <div class="actions">
            <select
              aria-label={t.common.section}
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
              {t.data.exportSection}
            </button>
          </div>
        </section>
      )}

      <section class="card" aria-labelledby="sync-title">
        <h2 id="sync-title">{t.sync.title}</h2>
        <p class="hint">{t.sync.dataHint}</p>
        <div class="actions">
          <a class="button" href={href({ name: 'sync' })}>
            {t.sync.open}
          </a>
        </div>
      </section>

      <ImportCard />

      <section class="card" aria-labelledby="other-title">
        <h2 id="other-title">{t.data.other}</h2>
        <p class="hint">{t.data.otherHint}</p>
        <div class="actions">
          <button type="button" onClick={() => void exportCsv()}>
            {t.data.csv}
          </button>
          <button type="button" onClick={() => void exportIcs()}>
            {t.data.ics}
          </button>
        </div>
      </section>
    </section>
  );
}
