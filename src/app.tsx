import type { Repo } from './db/repo';
import { BillEditor } from './ui/bill-editor/BillEditor';
import { BillsView } from './ui/bills/BillsView';
import { ListView } from './ui/list/ListView';
import { RepoContext } from './ui/data';
import { ProfilesView } from './ui/profiles/ProfilesView';
import { href, useRoute, type Route } from './ui/router';
import { SectionsView } from './ui/sections/SectionsView';
import { TimelineView } from './ui/timeline/TimelineView';
import { PrintView } from './ui/uplatnica/PrintView';

const NAV: readonly { route: Route; label: string }[] = [
  { route: { name: 'timeline' }, label: 'Pregled' },
  { route: { name: 'bills' }, label: 'Računi' },
  { route: { name: 'sections' }, label: 'Odeljci' },
  { route: { name: 'profiles' }, label: 'Platioci' },
];

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'timeline':
      return <TimelineView />;
    case 'list':
      return <ListView />;
    case 'bills':
      return <BillsView />;
    case 'bill':
      return <BillEditor id={route.id} />;
    case 'sections':
      return <SectionsView />;
    case 'profiles':
      return <ProfilesView />;
    case 'print':
      return <PrintView items={route.items} />;
  }
}

export function App({ repo }: { repo: Repo }) {
  const route = useRoute();
  const current =
    route.name === 'bill'
      ? 'bills'
      : route.name === 'list' || route.name === 'print'
        ? 'timeline'
        : route.name;
  return (
    <RepoContext.Provider value={repo}>
      <header class="top">
        <a class="brand" href={href({ name: 'timeline' })}>
          Uplatnica
        </a>
        <nav aria-label="Glavni meni">
          {NAV.map(({ route: r, label }) => (
            <a
              key={r.name}
              href={href(r)}
              {...(r.name === current ? { 'aria-current': 'page' } : {})}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>
      <main class={route.name === 'timeline' ? 'wide' : undefined}>
        <Page route={route} />
      </main>
      <footer>Svi podaci ostaju u ovom pregledaču.</footer>
    </RepoContext.Provider>
  );
}
