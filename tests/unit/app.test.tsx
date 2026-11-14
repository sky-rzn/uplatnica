// @vitest-environment happy-dom
import { screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { makeRepo, renderApp } from './ui/harness';

describe('App', () => {
  it('asks for a payer and a section before the first bill', async () => {
    renderApp(makeRepo());
    expect(
      await screen.findByText('Pre prvog računa potrebni su:'),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'platilac' }).getAttribute('href'),
    ).toBe('#/profiles');
    expect(screen.queryByRole('link', { name: 'Novi račun' })).toBeNull();
  });

  it('names the page and moves focus to it on navigation', async () => {
    renderApp(makeRepo());
    await screen.findByText('Pre prvog računa potrebni su:');
    expect(document.title).toBe('Pregled - Uplatnica');
    expect(document.activeElement).not.toBe(screen.getByRole('main'));

    location.hash = '#/profiles';
    await waitFor(() => {
      expect(document.title).toBe('Platioci - Uplatnica');
    });
    expect(document.activeElement).toBe(screen.getByRole('main'));
  });
});
