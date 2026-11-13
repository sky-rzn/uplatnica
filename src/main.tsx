import { render } from 'preact';
import { App } from './app';
import { requestPersistence } from './db/persist';
import './styles.css';

const root = document.getElementById('app');
if (!root) throw new Error('#app not found');
render(<App />, root);
void requestPersistence();
