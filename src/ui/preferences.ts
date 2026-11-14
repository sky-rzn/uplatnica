import { useEffect, useState } from 'preact/hooks';
import { detectLocale, isLocale, setLocale, type Locale } from '../i18n';

const LOCALE_KEY = 'uplatnica.locale';
const THEME_KEY = 'uplatnica.theme';
const EVENT = 'uplatnica-preferences';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

export function savedLocale(): Locale {
  const saved = read(LOCALE_KEY);
  return isLocale(saved) ? saved : detectLocale(navigator.languages);
}

export function chooseLocale(l: Locale): void {
  write(LOCALE_KEY, l);
  setLocale(l);
  dispatchEvent(new Event(EVENT));
}

export type Theme = 'system' | 'light' | 'dark';

export const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

export function savedTheme(): Theme {
  const saved = read(THEME_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

export function chooseTheme(theme: Theme): void {
  write(THEME_KEY, theme);
  applyTheme(theme);
  dispatchEvent(new Event(EVENT));
}

/** Changes whenever a preference does, so the tree can render again. */
export function usePreferencesVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const update = () => {
      setVersion((v) => v + 1);
    };
    addEventListener(EVENT, update);
    return () => {
      removeEventListener(EVENT, update);
    };
  }, []);
  return version;
}
