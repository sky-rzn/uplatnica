// @vitest-environment happy-dom
import { fireEvent, screen, waitFor } from '@testing-library/preact';
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

describe('OverviewHeader', () => {
  it('sums the unpaid periods', async () => {
    renderApp(repo, '#/');
    await waitFor(() => {
      expect(screen.getByText(/^Za plaćanje sada:/).textContent).toBe(
        'Za plaćanje sada: 3 računa, 2.000,00 RSD + 2 bez iznosa',
      );
    });
    expect(screen.getByText(/Kasni:/).textContent).toBe(
      '! Kasni: 1 račun bez iznosa',
    );
  });

  it('updates the sums when a period is paid', async () => {
    renderApp(repo, '#/');
    fireEvent.click(
      await screen.findByRole('button', { name: /^Internet, novembar 2026,/ }),
    );
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
});
