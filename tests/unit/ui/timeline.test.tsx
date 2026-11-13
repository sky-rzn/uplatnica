// @vitest-environment happy-dom
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repo } from '../../../src/db/repo';
import { makeRepo, renderApp } from './harness';

let repo: Repo;

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
  await repo.saveBill({
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
      start: '2026-01',
    },
    archived: false,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function block(name: RegExp) {
  return screen.findByRole('button', { name });
}

describe('TimelineView', () => {
  it('records an amount and a payment for a period', async () => {
    renderApp(repo, '#/');
    fireEvent.click(await block(/^EPS, oktobar 2026, .*čeka iznos$/));
    screen.getByRole('dialog', { name: 'EPS, oktobar 2026' });

    fireEvent.input(screen.getByLabelText('Iznos (RSD)'), {
      target: { value: '2.870,35' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plaćeno' }));

    await block(
      /^EPS, oktobar 2026, rok 15\.11\.2026\., 2\.870,35 RSD, plaćeno$/,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await repo.getOccurrence('b1', '2026-10')).toMatchObject({
      amount: 287035,
      paidAt: '2026-11-13',
      paidAmount: 287035,
    });

    fireEvent.click(await block(/^EPS, oktobar 2026, .*plaćeno$/));
    fireEvent.click(screen.getByRole('button', { name: 'Poništi uplatu' }));
    await block(/^EPS, oktobar 2026, .*za plaćanje$/);
    const occ = await repo.getOccurrence('b1', '2026-10');
    expect(occ?.amount).toBe(287035);
    expect(occ?.paidAt).toBeUndefined();
  });

  it('keeps the panel open on invalid input', async () => {
    renderApp(repo, '#/');
    fireEvent.click(await block(/^EPS, oktobar 2026/));
    fireEvent.input(screen.getByLabelText('Iznos (RSD)'), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj' }));
    expect(await screen.findByText('Neispravan iznos.')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await repo.listOccurrences()).toEqual([]);
  });

  it('changes the zoom, the window and the filters', async () => {
    renderApp(repo, '#/');
    await block(/^EPS, avgust 2026/);
    expect(screen.queryByRole('button', { name: /^EPS, jul 2026/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Ranije' }));
    await block(/^EPS, jul 2026/);
    fireEvent.click(screen.getByRole('button', { name: 'Danas' }));
    fireEvent.click(screen.getByRole('button', { name: '3 godine' }));
    await block(/^EPS, januar 2026/);

    fireEvent.click(screen.getByRole('button', { name: 'Stan' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^EPS,/ })).toBeNull();
    });
  });
});
