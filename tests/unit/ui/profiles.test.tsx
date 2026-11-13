// @vitest-environment happy-dom
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { bill } from '../core/fixtures';
import { makeRepo, renderApp } from './harness';

function type(label: string, value: string) {
  fireEvent.input(screen.getByLabelText(label), { target: { value } });
}

describe('ProfilesView', () => {
  it('creates and edits a payer', async () => {
    const repo = makeRepo();
    renderApp(repo, '#/profiles');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Novi platilac' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj' }));
    expect(screen.getByText('Obavezno polje.')).toBeTruthy();

    type('Ime i prezime', 'Petar Petrović');
    type('Adresa', 'Knez Mihailova 1\nBeograd');
    type('JMBG', '0101990710009');
    expect(
      screen.getByText('Kontrolna cifra JMBG-a ne odgovara. Proverite broj.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj' }));

    await screen.findByText('JMBG 0101990710009');
    const [saved] = await repo.listProfiles();
    expect(saved).toMatchObject({
      name: 'Petar Petrović',
      address: 'Knez Mihailova 1\nBeograd',
      jmbg: '0101990710009',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Izmeni' }));
    type('JMBG', '');
    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj' }));
    await waitFor(async () => {
      expect((await repo.listProfiles())[0]?.jmbg).toBeUndefined();
    });
  });

  it('explains why a payer in use cannot be deleted', async () => {
    const repo = makeRepo();
    await repo.saveProfile({ id: 'p1', name: 'Petar', address: '' });
    await repo.saveSection({
      id: 's1',
      name: 'Stan',
      color: '#888888',
      order: 0,
      archived: false,
    });
    await repo.saveBill(
      bill({
        kind: 'periodic',
        everyMonths: 1,
        due: { day: 15 },
        start: '2026-01',
      }),
    );
    vi.stubGlobal('confirm', () => true);
    renderApp(repo, '#/profiles');
    fireEvent.click(await screen.findByRole('button', { name: 'Obriši' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'se koristi u računima',
    );
    expect(await repo.listProfiles()).toHaveLength(1);
  });
});
