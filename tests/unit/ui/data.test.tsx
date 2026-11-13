// @vitest-environment happy-dom
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { backupJson, fullBackup, sectionBackup } from '../../../src/io/export';
import { dataset } from '../io/fixtures';
import { makeRepo, renderApp } from './harness';

const NOW = new Date('2026-11-13T10:00:00Z');

let downloads: Blob[];

beforeEach(() => {
  downloads = [];
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    downloads.push(blob as Blob);
    return 'blob:x';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
    () => undefined,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function upload(text: string, name = 'kopija.json') {
  const input = screen.getByLabelText('Rezervna kopija (JSON)');
  fireEvent.change(input, {
    target: { files: [new File([text], name, { type: 'application/json' })] },
  });
}

describe('DataView', () => {
  it('merges a backup into empty storage', async () => {
    const repo = makeRepo();
    renderApp(repo, '#/data');
    await screen.findByRole('heading', { name: 'Uvoz' });
    upload(backupJson(fullBackup(dataset(), NOW)));
    fireEvent.click(await screen.findByRole('button', { name: 'Spoji' }));
    expect((await screen.findByRole('status')).textContent).toContain(
      'Novih zapisa: 5',
    );
    expect(await repo.dump()).toEqual(dataset());
  });

  it('lists what is wrong with a file', async () => {
    renderApp(makeRepo(), '#/data');
    await screen.findByRole('heading', { name: 'Uvoz' });
    upload('{"app":"uplatnica","schemaVersion":1}');
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('profiles: neispravna vrednost.');
    expect(screen.queryByRole('button', { name: 'Spoji' })).toBeNull();
  });

  it('downloads the current data before replacing it', async () => {
    const repo = makeRepo();
    await repo.replaceAll(dataset());
    vi.stubGlobal('confirm', () => true);
    renderApp(repo, '#/data');
    await screen.findByRole('heading', { name: 'Uvoz' });
    const other = dataset();
    other.occurrences = [];
    upload(backupJson(fullBackup(other, NOW)));
    fireEvent.click(await screen.findByRole('button', { name: 'Zameni sve' }));
    await screen.findByText('Podaci su zamenjeni sadržajem datoteke.');
    expect(downloads).toHaveLength(1);
    const [saved] = downloads;
    expect(JSON.parse((await saved?.text()) ?? '')).toMatchObject({
      occurrences: dataset().occurrences,
    });
    expect(await repo.listOccurrences()).toEqual([]);
  });

  it('does not replace everything with a section export', async () => {
    renderApp(makeRepo(), '#/data');
    await screen.findByRole('heading', { name: 'Uvoz' });
    upload(backupJson(sectionBackup(dataset(), 's1', NOW)));
    expect(
      (
        await screen.findByRole<HTMLButtonElement>('button', {
          name: 'Zameni sve',
        })
      ).disabled,
    ).toBe(true);
  });

  it('reminds of a backup until one is made', async () => {
    const repo = makeRepo();
    await repo.replaceAll(dataset());
    renderApp(repo, '#/data');
    await screen.findByRole('link', { name: 'Napravite rezervnu kopiju.' });
    fireEvent.click(screen.getByRole('button', { name: 'Izvezi sve (JSON)' }));
    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'Napravite rezervnu kopiju.' }),
      ).toBeNull();
    });
    expect(screen.getByText(/Poslednja rezervna kopija: .* \(danas\)\./));
    expect(downloads).toHaveLength(1);
  });
});
