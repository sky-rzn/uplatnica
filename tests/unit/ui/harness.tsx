import 'fake-indexeddb/auto';
import { cleanup, render } from '@testing-library/preact';
import { afterEach } from 'vitest';
import { App } from '../../../src/app';
import { Repo, newId } from '../../../src/db/repo';
import { UplatnicaDb } from '../../../src/db/schema';

const dbs: UplatnicaDb[] = [];

afterEach(async () => {
  cleanup();
  location.hash = '';
  await Promise.all(dbs.splice(0).map((db) => db.delete()));
});

export function makeRepo(): Repo {
  const db = new UplatnicaDb(`ui-${newId()}`);
  dbs.push(db);
  return new Repo(db);
}

export function renderApp(repo: Repo, hash = '#/') {
  location.hash = hash;
  return render(<App repo={repo} />);
}
