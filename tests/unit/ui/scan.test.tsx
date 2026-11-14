// @vitest-environment happy-dom
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bill } from '../../../src/core/model';
import type { Repo } from '../../../src/db/repo';
import { href } from '../../../src/ui/router';
import fixtures from '../../fixtures/ips-qr.json';
import { makeRepo, renderApp } from './harness';

const qr = (id: string) => fixtures.real.find((f) => f.id === id)?.qr ?? '';
const INFOSTAN = qr('infostan-2026-09');
const EPS = qr('eps-2026-05');

let repo: Repo;

const infostan: Bill = {
  id: 'b1',
  sectionId: 's1',
  profileId: 'p1',
  title: 'Infostan',
  payee: { name: 'JKP Infostan tehnologije', account: '200220618010100048' },
  paymentCode: '122',
  purpose: 'Objedinjena naplata',
  model: '11',
  referenceTemplate: '804071936013-26093-1',
  amountMode: 'variable',
  currency: 'RSD',
  schedule: {
    kind: 'periodic',
    everyMonths: 1,
    due: { day: 15, monthOffset: 1 },
    start: '2026-09',
  },
  archived: false,
};

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 13, 12));
  repo = makeRepo();
  await repo.saveProfile({ id: 'p1', name: 'Petar', address: 'Beograd' });
  await repo.saveSection({
    id: 's1',
    name: 'Stan',
    color: '#888888',
    order: 0,
    archived: false,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

async function paste(text: string) {
  fireEvent.input(await screen.findByLabelText('Tekst IPS QR koda'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Učitaj tekst' }));
}

describe('ScanView', () => {
  it('fills the amount of a period of the bill with the same account', async () => {
    await repo.saveBill(infostan);
    renderApp(repo, '#/scan');
    await paste(INFOSTAN);

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'septembar 2026, rok 15.10.2026. (isti poziv na broj)',
      }),
    );
    screen.getByRole('dialog', { name: 'Infostan, septembar 2026' });
    expect(screen.getByLabelText<HTMLInputElement>('Iznos (RSD)').value).toBe(
      '1.287,60',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Plaćeno' }));
    await waitFor(async () => {
      const occ = await repo.getOccurrence('b1', '2026-09');
      expect(occ?.reference).toBeUndefined();
      expect(occ).toMatchObject({
        amount: 128760,
        paidAt: '2026-11-13',
        paidAmount: 128760,
      });
    });
  });

  it('offers to update the account when only the payee name matches', async () => {
    await repo.saveBill({
      ...infostan,
      title: 'EPS',
      payee: { name: 'EPS AD Beograd', account: '200000000075409696' },
      paymentCode: '289',
      model: '97',
      referenceTemplate: '{NAPLATNI:11}{YY}{MM}',
      referenceVars: { NAPLATNI: '2009317725' },
    });
    renderApp(repo, '#/scan');
    await paste(EPS);
    await screen.findByText('Isti primalac, ali drugi račun primaoca.');
    fireEvent.click(
      screen.getByRole('button', { name: /^septembar 2026, rok/ }),
    );
    screen.getByText(
      'Račun primaoca na kodu je 190-0000000099870-10, a u računu je 200-0000000754096-96.',
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Upiši novi račun primaoca u račun',
      }),
    );
    await waitFor(async () => {
      expect((await repo.getBill('b1'))?.payee.account).toBe(
        '190000000009987010',
      );
    });
  });

  it('turns a code for an unknown payee into a new bill', async () => {
    renderApp(repo, '#/scan');
    await paste(INFOSTAN);
    await screen.findByText('Nijedan račun nema ovog primaoca.');
    const link = screen.getByRole('link', { name: 'Novi račun iz ovog koda' });
    expect(link.getAttribute('href')).toBe(
      href({ name: 'bill', id: null, qr: INFOSTAN }),
    );

    location.hash = link.getAttribute('href') ?? '';
    const name =
      await screen.findByLabelText<HTMLInputElement>('Naziv primaoca');
    expect(name.value).toBe('JKP INFOSTAN TEHNOLOGIJE BEOGRAD');
    expect(screen.getByLabelText<HTMLInputElement>('Naziv').value).toBe(
      'JKP INFOSTAN TEHNOLOGIJE BEOGRAD',
    );
    expect(
      screen.getByLabelText<HTMLInputElement>('Račun primaoca').value,
    ).toBe('200-2206180101000-48');
    expect(screen.getByLabelText<HTMLInputElement>('Poziv na broj').value).toBe(
      '804071936013-26093-1',
    );
  });

  it('says when the code is not an IPS payment code', async () => {
    renderApp(repo, '#/scan');
    await paste('https://example.com');
    await screen.findByText('Ovo nije IPS QR kod za plaćanje.');
  });
});
