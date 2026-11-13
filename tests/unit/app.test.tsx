// @vitest-environment happy-dom
import { screen } from '@testing-library/preact';
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
});
