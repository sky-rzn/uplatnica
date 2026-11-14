// @vitest-environment happy-dom
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repo } from '../../../src/db/repo';
import { makeRepo, renderApp } from './harness';

function type(label: string, value: string) {
  fireEvent.input(screen.getByLabelText(label), { target: { value } });
}

let repo: Repo;

beforeEach(async () => {
  repo = makeRepo();
  await repo.saveProfile({
    id: 'p1',
    name: 'Petar Petrović',
    address: 'Beograd',
    jmbg: '0101990710008',
  });
  await repo.saveSection({
    id: 's1',
    name: 'Stan',
    color: '#888888',
    order: 0,
    archived: false,
  });
});

describe('BillEditor', () => {
  it('creates a bill with a reference template', async () => {
    renderApp(repo, '#/bills');
    fireEvent.click(await screen.findByRole('link', { name: 'Novi račun' }));
    await screen.findByRole('form', { name: 'Novi račun' });

    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj' }));
    expect(screen.getAllByText('Obavezno polje.').length).toBeGreaterThan(0);
    expect(await repo.listBills()).toEqual([]);

    type('Naziv', 'EPS');
    type('Naziv primaoca', 'JP EPS Beograd');
    type('Račun primaoca', '160-602-17');
    expect(
      screen.getByText(/Kontrolni broj računa nije ispravan/),
    ).toBeTruthy();
    type('Račun primaoca', '160-602-16');
    expect(screen.getByText('160-0000000000602-16')).toBeTruthy();
    type('Svrha uplate', 'Račun za struju');
    fireEvent.change(screen.getByLabelText('Model'), {
      target: { value: '97' },
    });
    type('Poziv na broj', '{NAPLATNI:11}{YY}{MM}');
    type('Vrednost za {NAPLATNI}', '2004937106');
    expect(screen.getByRole('status').textContent).toMatch(
      /^97 \d{2}02004937106\d{4}$/,
    );
    fireEvent.click(screen.getByLabelText('Iznos se unosi po prijemu računa'));
    type('Dan', '28');
    fireEvent.change(screen.getByLabelText('Mesec'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj' }));

    await screen.findByRole('link', { name: /EPS/ });
    const [saved] = await repo.listBills();
    expect(saved).toMatchObject({
      title: 'EPS',
      payee: { name: 'JP EPS Beograd', account: '160000000000060216' },
      model: '97',
      referenceTemplate: '{NAPLATNI:11}{YY}{MM}',
      referenceVars: { NAPLATNI: '2004937106' },
      amountMode: 'variable',
      schedule: { kind: 'periodic', due: { day: 28, monthOffset: 1 } },
    });
    expect(saved?.amount).toBeUndefined();
  });

  it('edits and deletes an existing bill', async () => {
    await repo.saveBill({
      id: 'b1',
      sectionId: 's1',
      profileId: 'p1',
      title: 'Infostan',
      payee: { name: 'JKP Infostan', account: '160000000000060216' },
      paymentCode: '289',
      purpose: 'Objedinjena naplata',
      amountMode: 'fixed',
      amount: 128760,
      currency: 'RSD',
      schedule: { kind: 'dates', dates: ['2026-12-15'] },
      archived: false,
    });
    renderApp(repo, '#/bill/b1');
    expect(
      (await screen.findByLabelText<HTMLInputElement>('Iznos (RSD)')).value,
    ).toBe('1.287,60');
    fireEvent.click(screen.getByRole('button', { name: 'Dodaj datum' }));
    fireEvent.input(screen.getByLabelText('Datum 2'), {
      target: { value: '2027-01-15' },
    });
    type('Iznos (RSD)', '1300');
    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj' }));
    await waitFor(async () => {
      expect(await repo.getBill('b1')).toMatchObject({
        amount: 130000,
        schedule: { kind: 'dates', dates: ['2026-12-15', '2027-01-15'] },
      });
    });

    location.hash = '#/bill/b1';
    vi.stubGlobal('confirm', () => true);
    fireEvent.click(await screen.findByRole('button', { name: 'Obriši' }));
    await waitFor(async () => {
      expect(await repo.listBills()).toEqual([]);
    });
  });

  it('fills a new bill from a preset', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 13, 12));
    renderApp(repo, '#/bill/new');
    fireEvent.change(await screen.findByLabelText('Šablon'), {
      target: { value: 'pausal-pension' },
    });
    expect(screen.getByText(/rešenja Poreske uprave u ePorezi/)).toBeTruthy();
    expect(screen.getByText(/provereni 13\.11\.2026\./)).toBeTruthy();
    expect(
      screen.getByLabelText<HTMLInputElement>('Račun primaoca').value,
    ).toBe('840-721313843-74');

    type('Iznos (RSD)', '12.345,67');
    type('Poziv na broj', '50123456789');
    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj' }));
    await screen.findByRole('heading', { name: 'Računi' });
    const [saved] = await repo.listBills();
    expect(saved).toMatchObject({
      title: 'Paušal - PIO',
      sectionId: 's1',
      profileId: 'p1',
      payee: { name: 'Republika Srbija', account: '840000072131384374' },
      paymentCode: '253',
      model: '97',
      referenceTemplate: '50123456789',
      amount: 1234567,
      schedule: {
        kind: 'periodic',
        everyMonths: 1,
        due: { day: 15, monthOffset: 1 },
        start: '2026-11',
        shiftToWorkday: true,
      },
    });
    vi.useRealTimers();
  });
});
