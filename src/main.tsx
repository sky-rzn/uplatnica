import { render } from 'preact';
import { App } from './app';
import { requestPersistence } from './db/persist';
import { Repo } from './db/repo';
import { UplatnicaDb } from './db/schema';
import './styles.css';

const root = document.getElementById('app');
if (!root) throw new Error('#app not found');
render(<App repo={new Repo(new UplatnicaDb())} />, root);
void requestPersistence();
