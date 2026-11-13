// @vitest-environment happy-dom
import { fireEvent, screen, waitFor } from '@testing-library/preact';
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

describe('batch printing', () => {
  it('prints the periods picked in the list', async () => {
    renderApp(repo, '#/list');
    const print = await screen.findByRole('button', {
      name: 'Štampaj uplatnice',
    });
    expect(print).toHaveProperty('disabled', true);
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Izaberi za štampu: EPS, oktobar 2026',
      }),
    );
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Izaberi za štampu: Internet, novembar 2026',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Štampaj uplatnice (2)' }),
    );

    await screen.findByRole('heading', { name: 'Uplatnice' });
    expect(
      screen.getAllByRole('img').map((img) => img.getAttribute('aria-label')),
    ).toEqual(['EPS, oktobar 2026', 'Internet, novembar 2026']);
    expect(screen.getByRole('listitem').textContent).toBe(
      'EPS, oktobar 2026: Iznos još nije unet, pa uplatnica nema iznos ni QR kod.',
    );
  });

  it('picks every period at once', async () => {
    renderApp(repo, '#/list');
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'Izaberi sve' }),
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^Štampaj uplatnice \(\d+\)$/ }),
      ).toBeTruthy();
    });
    const boxes = screen.getAllByRole('checkbox', {
      name: /^Izaberi za štampu/,
    });
    expect(boxes.every((b) => (b as HTMLInputElement).checked)).toBe(true);
  });
});
