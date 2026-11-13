import type { Repo } from './db/repo';
import { BillEditor } from './ui/bill-editor/BillEditor';
import { BillsView } from './ui/bills/BillsView';
import { RepoContext } from './ui/data';
import { ProfilesView } from './ui/profiles/ProfilesView';
import { href, useRoute, type Route } from './ui/router';
import { SectionsView } from './ui/sections/SectionsView';

const NAV: readonly { route: Route; label: string }[] = [
  { route: { name: 'bills' }, label: 'Računi' },
  { route: { name: 'sections' }, label: 'Odeljci' },
  { route: { name: 'profiles' }, label: 'Platioci' },
];

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'bills':
      return <BillsView />;
    case 'bill':
      return <BillEditor id={route.id} />;
    case 'sections':
      return <SectionsView />;
    case 'profiles':
      return <ProfilesView />;
  }
}

export function App({ repo }: { repo: Repo }) {
  const route = useRoute();
  const current = route.name === 'bill' ? 'bills' : route.name;
  return (
    <RepoContext.Provider value={repo}>
      <header class="top">
        <a class="brand" href={href({ name: 'bills' })}>
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
      <main>
        <Page route={route} />
      </main>
      <footer>Svi podaci ostaju u ovom pregledaču.</footer>
    </RepoContext.Provider>
  );
}
