import { render } from 'preact';
import { App } from './app';
import { requestPersistence } from './db/persist';
import { Repo } from './db/repo';
import { UplatnicaDb } from './db/schema';
import { setLocale } from './i18n';
import { applyTheme, savedLocale, savedTheme } from './ui/preferences';
import './styles.css';

const root = document.getElementById('app');
if (!root) throw new Error('#app not found');
setLocale(savedLocale());
applyTheme(savedTheme());
if (!location.hash && matchMedia('(max-width: 40rem)').matches)
  location.replace('#/list');
render(<App repo={new Repo(new UplatnicaDb())} />, root);
void requestPersistence();
