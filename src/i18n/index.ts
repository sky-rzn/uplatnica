import { en } from './en';
import { ru } from './ru';
import { srCyrl } from './sr-Cyrl';
import { srLatn, type Messages } from './sr-Latn';

export type { Messages } from './sr-Latn';

export type Locale = 'sr-Latn' | 'sr-Cyrl' | 'en' | 'ru';

export const LOCALES: readonly { value: Locale; label: string }[] = [
  { value: 'sr-Latn', label: 'Srpski (latinica)' },
  { value: 'sr-Cyrl', label: 'Српски (ћирилица)' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
];

const CATALOGS: Record<Locale, Messages> = {
  'sr-Latn': srLatn,
  'sr-Cyrl': srCyrl,
  en,
  ru,
};

/** Messages of the current locale; the object stays the same, its contents change. */
export const t: Messages = { ...srLatn };

let current: Locale = 'sr-Latn';

export function locale(): Locale {
  return current;
}

export function setLocale(l: Locale): void {
  current = l;
  Object.assign(t, CATALOGS[l]);
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}

export function isLocale(s: unknown): s is Locale {
  return LOCALES.some((l) => l.value === s);
}

/** The first browser language the app speaks; plain "sr" means Latin script. */
export function detectLocale(languages: readonly string[]): Locale {
  for (const lang of languages) {
    const tag = lang.toLowerCase();
    if (tag.startsWith('sr'))
      return tag.includes('cyrl') ? 'sr-Cyrl' : 'sr-Latn';
    if (/^(hr|bs|cnr|sh)\b/.test(tag)) return 'sr-Latn';
    if (tag.startsWith('ru')) return 'ru';
    if (tag.startsWith('en')) return 'en';
  }
  return 'sr-Latn';
}
