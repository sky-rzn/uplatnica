// @vitest-environment happy-dom
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import type { Bill } from '../../../src/core/model';
import { makeRepo, renderApp } from './harness';

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
    due: { day: 15 },
    start: '2026-09',
  },
  archived: false,
};

describe('BillsView', () => {
  it('moves a bill within its section', async () => {
    const repo = makeRepo();
    await repo.saveProfile({ id: 'p1', name: 'Petar', address: 'Beograd' });
    await repo.saveSection({
      id: 's1',
      name: 'Stan',
      color: '#888888',
      order: 0,
      archived: false,
    });
    await repo.saveBill(eps);
    await repo.saveBill({ ...eps, id: 'b2', title: 'Internet' });
    renderApp(repo, '#/bills');

    const titles = () =>
      screen
        .getAllByRole('listitem')
        .map((li) => li.querySelector('strong')?.textContent);
    await screen.findByText('Internet');
    expect(titles()).toEqual(['EPS', 'Internet']);
    expect(
      screen.getByRole('button', { name: 'Pomeri „EPS“ gore' }),
    ).toHaveProperty('disabled', true);

    fireEvent.click(
      screen.getByRole('button', { name: 'Pomeri „Internet“ gore' }),
    );
    await waitFor(() => {
      expect(titles()).toEqual(['Internet', 'EPS']);
    });
  });
});
