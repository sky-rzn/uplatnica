// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { detectLocale, setLocale, t } from '../../../src/i18n';
import { srCyrl } from '../../../src/i18n/sr-Cyrl';
import { pluralizer } from '../../../src/i18n/plural';

afterEach(() => {
  setLocale('sr-Latn');
});

describe('pluralizer', () => {
  it('uses the few form for 2-4 in Serbian', () => {
    const p = pluralizer('sr-Latn');
    const forms = { one: 'platilac', few: 'platioca', other: 'platilaca' };
    expect([1, 2, 5, 11, 21, 22, 25].map((n) => p(n, forms))).toEqual([
      'platilac',
      'platioca',
      'platilaca',
      'platilaca',
      'platilac',
      'platioca',
      'platilaca',
    ]);
  });

  it('uses the many form in Russian', () => {
    const p = pluralizer('ru');
    const forms = { one: 'день', few: 'дня', many: 'дней', other: 'дня' };
    expect([1, 3, 5, 11, 21].map((n) => p(n, forms))).toEqual([
      'день',
      'дня',
      'дней',
      'дней',
      'день',
    ]);
  });
});

describe('detectLocale', () => {
  it.each([
    [['sr-RS'], 'sr-Latn'],
    [['sr-Cyrl-RS'], 'sr-Cyrl'],
    [['hr'], 'sr-Latn'],
    [['de-DE', 'ru-RU'], 'ru'],
    [['en-GB'], 'en'],
    [['de-DE'], 'sr-Latn'],
    [[], 'sr-Latn'],
  ])('%j -> %s', (languages, expected) => {
    expect(detectLocale(languages)).toBe(expected);
  });
});

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object')
    return Object.values(value).flatMap(strings);
  return [];
}

describe('catalogs', () => {
  it('switches the messages and the document language', () => {
    setLocale('en');
    expect(t.app.nav.bills).toBe('Bills');
    expect(document.documentElement.lang).toBe('en');
    setLocale('sr-Cyrl');
    expect(t.app.nav.bills).toBe('Рачуни');
  });

  it('keeps Latin in sr-Cyrl only for codes, acronyms and file names', () => {
    const latin = strings(srCyrl)
      .filter((s) => !s.startsWith('uplatnica-'))
      .flatMap(
        (s) => s.replace(/\{[^}]*\}|#rrggbb/g, '').match(/[a-z]+/gi) ?? [],
      )
      .filter((w) => w !== w.toUpperCase());
    expect(latin).toEqual([]);
  });
});
