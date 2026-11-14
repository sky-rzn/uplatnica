// @vitest-environment happy-dom
import { fireEvent, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '../../../src/i18n';
import { savedLocale } from '../../../src/ui/preferences';
import { makeRepo, renderApp } from './harness';

afterEach(() => {
  localStorage.clear();
  setLocale('sr-Latn');
});

describe('SettingsView', () => {
  it('switches the language and remembers it', async () => {
    renderApp(makeRepo(), '#/settings');
    fireEvent.change(await screen.findByLabelText('Jezik'), {
      target: { value: 'ru' },
    });
    expect(
      await screen.findByRole('heading', { name: 'Настройки' }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Счета' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('ru');
    expect(savedLocale()).toBe('ru');

    fireEvent.change(screen.getByLabelText('Язык'), {
      target: { value: 'sr-Cyrl' },
    });
    expect(await screen.findByRole('link', { name: 'Рачуни' })).toBeTruthy();
  });
});
