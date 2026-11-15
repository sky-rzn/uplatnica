// @vitest-environment happy-dom
import { fireEvent, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bill } from '../../../src/core/model';
import type { Repo } from '../../../src/db/repo';
import { href, parseRoute } from '../../../src/ui/router';
import { makeRepo, renderApp } from './harness';

let repo: Repo;

const eps: Bill = {
  id: 'b1',
  sectionId: 's1',
  profileId: 'p1',
  title: 'EPS',
  payee: { name: 'JP EPS', account: '160000000000060216' },
  paymentCode: '289',
  purpose: 'Struja',
  amountMode: 'variable',
  currency: 'RSD',
  schedule: {
    kind: 'periodic',
    everyMonths: 1,
    due: { day: 15, monthOffset: 1 },
    start: '2026-10',
  },
  archived: false,
};

const internet: Bill = {
  ...eps,
  id: 'b2',
  title: 'Internet',
  payee: { name: 'SBB', account: '160000000000060216' },
  amountMode: 'fixed',
  amount: 200000,
  schedule: {
    kind: 'periodic',
    everyMonths: 1,
    due: { day: 20 },
    start: '2026-11',
  },
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
  await repo.saveBill(eps);
  await repo.saveBill(internet);
});

afterEach(() => {
  vi.useRealTimers();
});

async function openPanel(title: RegExp) {
  renderApp(repo, '#/');
  fireEvent.click(await screen.findByRole('button', { name: title }));
  return screen.getByRole('dialog');
}

describe('router', () => {
  it('round-trips the periods to print', () => {
    const route = {
      name: 'print' as const,
      items: [
        { billId: 'a:b,c', periodKey: '2026-Q4' },
        { billId: 'x', periodKey: '2026-11-15' },
      ],
    };
    expect(parseRoute(href(route))).toEqual(route);
  });
});

describe('the period panel', () => {
  it('shows the IPS QR code with what the bank will read from it', async () => {
    const panel = await openPanel(/^Internet, novembar 2026,/);
    fireEvent.click(within(panel).getByRole('button', { name: 'QR kod' }));
    const qr = within(panel).getByRole('region', { name: 'IPS QR kod' });
    within(qr).getByRole('img', { name: 'IPS QR kod za uplatu' });
    expect(
      [...qr.querySelectorAll('dt')].map(
        (dt) => `${dt.textContent}: ${dt.nextSibling?.textContent ?? ''}`,
      ),
    ).toEqual([
      'Primalac: SBB',
      'Račun: 160-0000000000602-16',
      'Iznos: 2.000,00 RSD',
      'Šifra plaćanja: 289',
      'Svrha: Struja',
      'Platilac: Petar\nBeograd',
    ]);
  });

  it('waits for the amount of a variable bill before making a code', async () => {
    const panel = await openPanel(/^EPS, novembar 2026,/);
    fireEvent.click(within(panel).getByRole('button', { name: 'QR kod' }));
    within(panel).getByText('Unesite iznos da bi se napravio QR kod.');
    fireEvent.input(within(panel).getByLabelText('Iznos (RSD)'), {
      target: { value: '3.702,65' },
    });
    expect(within(panel).getByText('3.702,65 RSD')).toBeTruthy();
  });

  it('saves the period and opens its slip', async () => {
    const panel = await openPanel(/^EPS, novembar 2026,/);
    fireEvent.input(within(panel).getByLabelText('Iznos (RSD)'), {
      target: { value: '1500' },
    });
    fireEvent.click(within(panel).getByRole('button', { name: 'Uplatnica' }));
    await screen.findByRole('img', { name: 'EPS, novembar 2026' });
    expect(location.hash).toBe('#/print/b1:2026-11');
    expect(await repo.getOccurrence('b1', '2026-11')).toMatchObject({
      amount: 150000,
    });
    expect(screen.getByText('=1.500,00')).toBeTruthy();
  });
});
