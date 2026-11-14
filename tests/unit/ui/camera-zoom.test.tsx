// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Scanner } from '../../../src/ui/scanner/Scanner';

function fakeTrack(capabilities: MediaTrackCapabilities) {
  return {
    stop: vi.fn(),
    applyConstraints: vi.fn(() => Promise.resolve()),
    getCapabilities: () => capabilities,
    getSettings: () => ({ zoom: 1 }),
  };
}

function useCamera(track: ReturnType<typeof fakeTrack>) {
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  };
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(() => Promise.resolve(stream)) },
  });
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'srcObject', 'set').mockImplementation(
    () => undefined,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('zooms the camera with a slider when the camera can zoom', async () => {
  const track = fakeTrack({ zoom: { min: 1, max: 5, step: 0.5 } } as never);
  useCamera(track);
  render(<Scanner onScan={() => undefined} />);
  fireEvent.click(screen.getByRole('button', { name: 'Kamera' }));

  const slider = await screen.findByLabelText('Uvećanje');
  expect(slider).toHaveProperty('max', '5');
  fireEvent.input(slider, { target: { value: '3' } });
  expect(track.applyConstraints).toHaveBeenLastCalledWith({
    advanced: [{ zoom: 3 }],
  });
});

it('shows no slider when the camera cannot zoom', async () => {
  const track = fakeTrack({});
  useCamera(track);
  render(<Scanner onScan={() => undefined} />);
  fireEvent.click(screen.getByRole('button', { name: 'Kamera' }));

  await vi.waitFor(() => {
    expect(track.applyConstraints).toHaveBeenCalled();
  });
  expect(screen.queryByLabelText('Uvećanje')).toBeNull();
});
