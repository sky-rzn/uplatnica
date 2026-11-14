// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { FrameEncoder } from '../../../src/io/fountain';
import { packSync } from '../../../src/io/sync';
import { guessDeviceName } from '../../../src/ui/sync/SyncView';
import { dataset } from '../io/fixtures';
import { makeRepo, renderApp } from './harness';

const camera = vi.hoisted(() => ({
  onScan: undefined as ((text: string) => boolean) | undefined,
}));

vi.mock('../../../src/ui/scanner/Scanner', () => ({
  Camera: (props: { onScan: (text: string) => boolean }) => {
    camera.onScan = props.onScan;
    return <div>camera</div>;
  },
}));

Object.defineProperty(navigator, 'mediaDevices', {
  configurable: true,
  value: {},
});

describe('SyncView', () => {
  it('merges the code another device shows and offers a reply', async () => {
    const other = makeRepo();
    await other.device('Laptop');
    await other.replaceAll(dataset());
    await other.device('Laptop');
    const encoder = new FrameEncoder(
      await packSync(await other.outgoing(null)),
      288,
    );
    const repo = makeRepo();
    renderApp(repo, '#/sync');

    fireEvent.click(
      await screen.findByRole('button', { name: 'Pročitaj kod' }),
    );
    await waitFor(() => {
      expect(camera.onScan).toBeDefined();
    });
    expect(camera.onScan?.('K:PR|V:01')).toBe(true);
    await screen.findByText('Ovo nije kod za sinhronizaciju.');
    for (let i = 0; camera.onScan?.(encoder.frame(i)) === true; i++);

    await screen.findByText(
      'Sinhronizovano sa „Laptop“. Novih zapisa: 5, izmenjenih: 0, obrisanih: 0.',
    );
    expect((await repo.dump()).occurrences).toEqual(dataset().occurrences);

    fireEvent.click(screen.getByRole('button', { name: 'Pokaži odgovor' }));
    expect((await screen.findByLabelText('Za uređaj')).textContent).toContain(
      'Laptop, poslednji put',
    );
    await screen.findByRole('img', {
      name: 'Animirani QR kod za sinhronizaciju',
    });
  });

  it('names the device after its system', () => {
    expect(
      guessDeviceName('Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile'),
    ).toBe('Android');
    expect(guessDeviceName('Mozilla/5.0 (X11; Linux x86_64)')).toBe('Linux');
  });
});
