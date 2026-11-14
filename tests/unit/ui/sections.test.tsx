// @vitest-environment happy-dom
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { makeRepo, renderApp } from './harness';

describe('SectionsView', () => {
  it('appends new sections and reorders them', async () => {
    const repo = makeRepo();
    renderApp(repo, '#/sections');
    for (const name of ['Stan', 'Porezi']) {
      fireEvent.click(
        await screen.findByRole('button', { name: 'Novi odeljak' }),
      );
      fireEvent.input(screen.getByLabelText('Naziv'), {
        target: { value: name },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj' }));
      await waitFor(() => {
        expect(screen.queryByRole('form')).toBeNull();
      });
      await screen.findByText(name);
    }
    expect((await repo.listSections()).map((s) => s.name)).toEqual([
      'Stan',
      'Porezi',
    ]);

    fireEvent.click(
      screen.getByRole('button', { name: 'Pomeri „Porezi“ gore' }),
    );
    await waitFor(async () => {
      expect((await repo.listSections()).map((s) => s.name)).toEqual([
        'Porezi',
        'Stan',
      ]);
    });
  });
});
