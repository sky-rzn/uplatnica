import { useEffect, useRef } from 'preact/hooks';
import type { Repo } from './db/repo';
import { todayIso } from './core/date';
import { locale, t } from './i18n';
import { BACKUP_REMIND_DAYS, backupAge, useLastBackup } from './ui/backup-mark';
import { DataView } from './ui/backup/DataView';
import { BillEditor } from './ui/bill-editor/BillEditor';
import { BillsView } from './ui/bills/BillsView';
import { ListView } from './ui/list/ListView';
import { RepoContext, useLive } from './ui/data';
import { usePreferencesVersion } from './ui/preferences';
import { ProfilesView } from './ui/profiles/ProfilesView';
import { href, useRoute, type Route } from './ui/router';
import { SectionsView } from './ui/sections/SectionsView';
import { SettingsView } from './ui/settings/SettingsView';
import { TimelineView } from './ui/timeline/TimelineView';
import { ScanView } from './ui/scanner/ScanView';
import { SyncView } from './ui/sync/SyncView';
import { PrintView } from './ui/uplatnica/PrintView';

const NAV = [
  'timeline',
  'bills',
  'sections',
  'profiles',
  'data',
  'settings',
] as const;

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'timeline':
      return <TimelineView />;
    case 'list':
      return <ListView />;
    case 'bills':
      return <BillsView />;
    case 'bill':
      return (
        <BillEditor
          id={route.id}
          {...(route.qr !== undefined ? { qr: route.qr } : {})}
        />
      );
    case 'sections':
      return <SectionsView />;
    case 'profiles':
      return <ProfilesView />;
    case 'print':
      return <PrintView items={route.items} />;
    case 'data':
      return <DataView />;
    case 'sync':
      return <SyncView />;
    case 'settings':
      return <SettingsView />;
    case 'scan':
      return <ScanView />;
  }
}

function BackupReminder() {
  const hasBills = useLive(async (r) => (await r.listBills()).length > 0);
  const age = backupAge(useLastBackup(), todayIso());
  if (!hasBills || (age !== null && age < BACKUP_REMIND_DAYS)) return null;
  return (
    <>
      {' '}
      <a href={href({ name: 'data' })}>
        {age === null ? t.app.backupNever : t.app.backupAge(age)}
      </a>
    </>
  );
}

function pageTitle(route: Route): string {
  switch (route.name) {
    case 'timeline':
    case 'list':
      return t.overview.title;
    case 'bill':
      return route.id === null ? t.common.newBill : t.app.nav.bills;
    case 'scan':
      return t.common.scanning;
    case 'sync':
      return t.sync.title;
    case 'print':
      return route.items.length === 1 ? t.print.one : t.print.many;
    default:
      return t.app.nav[route.name];
  }
}

function Shell() {
  const route = useRoute();
  const main = useRef<HTMLElement>(null);
  const shown = useRef(href(route));
  const current =
    route.name === 'bill'
      ? 'bills'
      : route.name === 'sync'
        ? 'data'
        : route.name === 'list' ||
            route.name === 'print' ||
            route.name === 'scan'
          ? 'timeline'
          : route.name;

  useEffect(() => {
    document.title = `${pageTitle(route)} - ${t.app.brand}`;
    const at = href(route);
    if (at === shown.current) return;
    shown.current = at;
    main.current?.focus();
  }, [route]);

  return (
    <>
      <a
        class="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        {t.app.skip}
      </a>
      <header class="top">
        <a class="brand" href={href({ name: 'timeline' })}>
          {t.app.brand}
        </a>
        <nav aria-label={t.app.mainMenu}>
          {NAV.map((name) => (
            <a
              key={name}
              href={href({ name })}
              {...(name === current ? { 'aria-current': 'page' } : {})}
            >
              {t.app.nav[name]}
            </a>
          ))}
        </nav>
      </header>
      <main
        id="main"
        ref={main}
        tabIndex={-1}
        class={route.name === 'timeline' ? 'wide' : undefined}
      >
        <Page route={route} />
      </main>
      <footer>
        {t.app.privacy}
        <BackupReminder />
      </footer>
    </>
  );
}

export function App({ repo }: { repo: Repo }) {
  usePreferencesVersion();
  return (
    <RepoContext.Provider value={repo}>
      <Shell key={locale()} />
    </RepoContext.Provider>
  );
}
