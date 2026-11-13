// @vitest-environment happy-dom
import { fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bill } from '../../../src/core/model';
import type { Repo } from '../../../src/db/repo';
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
  await repo.saveBill(eps);
  await repo.saveBill({
    ...eps,
    id: 'b2',
    title: 'Internet',
    amountMode: 'fixed',
    amount: 200000,
    schedule: {
      kind: 'periodic',
      everyMonths: 1,
      due: { day: 20 },
      start: '2026-11',
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function group(name: string) {
  return screen.findByRole('region', { name: new RegExp(`^${name} `) });
}

describe('ListView', () => {
  it('groups unpaid periods and sums them in the header', async () => {
    renderApp(repo, '#/list');
    const overdue = await group('Kasni');
    expect(
      within(overdue)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['EPSseptembar 2026rok 15.10.2026., pre 29 dana! kasni']);
    const now = await group('Za plaćanje');
    expect(within(now).getAllByRole('button')).toHaveLength(3);
    const soon = await group('Uskoro');
    expect(within(soon).getByRole('button').textContent).toMatch(
      /^Internetdecembar 2026rok 20\.12\.2026\., za 37 dana2\.000,00 RSD/,
    );

    expect(screen.getByText(/^Za plaćanje sada:/).textContent).toBe(
      'Za plaćanje sada: 3 računa, 2.000,00 RSD + 2 bez iznosa',
    );
    expect(screen.getByText(/Kasni:/).textContent).toBe(
      '! Kasni: 1 račun bez iznosa',
    );
  });

  it('marks a period paid from the list', async () => {
    renderApp(repo, '#/list');
    const now = await group('Za plaćanje');
    fireEvent.click(within(now).getByRole('button', { name: /^Internet/ }));
    screen.getByRole('dialog', { name: 'Internet, novembar 2026' });
    fireEvent.click(screen.getByRole('button', { name: 'Plaćeno' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    await waitFor(() => {
      expect(screen.getByText(/^Za plaćanje sada:/).textContent).toBe(
        'Za plaćanje sada: 2 računa bez iznosa',
      );
    });
    expect(await repo.getOccurrence('b2', '2026-11')).toMatchObject({
      paidAt: '2026-11-13',
    });
  });

  it('switches between the timeline and the list', async () => {
    renderApp(repo, '#/');
    fireEvent.click(await screen.findByRole('link', { name: 'Lista' }));
    await group('Kasni');
    expect(
      screen
        .getByRole('link', { name: 'Pregled' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(
      screen.getByRole('link', { name: 'Lista' }).getAttribute('aria-current'),
    ).toBe('page');
  });
});
