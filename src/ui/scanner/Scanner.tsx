import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import { centerSquare, isPdf, scanFile, scanFrame } from './decode';

const FRAME_MS = 250;

function cameraError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return t.scanner.cameraDenied;
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return t.scanner.cameraMissing;
  return t.scanner.cameraFailed;
}

/** Reads codes for as long as onScan() returns true. */
export function Camera(props: {
  onScan: (text: string) => boolean;
  onError: (message: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const finder = useRef<HTMLDivElement>(null);
  const handlers = useRef(props);
  handlers.current = props;

  useEffect(() => {
    let stream: MediaStream | undefined;
    const release = () => {
      stream?.getTracks().forEach((t) => {
        t.stop();
      });
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const isStopped = () => stopped;
    let frame = 0;

    const placeFinder = (v: HTMLVideoElement) => {
      const box = finder.current;
      if (!box) return;
      const { videoWidth: w, videoHeight: h } = v;
      const r = centerSquare(w, h);
      const pct = (n: number, of: number) => String((100 * n) / of) + '%';
      box.style.left = pct(r.x, w);
      box.style.top = pct(r.y, h);
      box.style.width = pct(r.w, w);
      box.style.height = pct(r.h, h);
      box.hidden = false;
    };

    const tick = async () => {
      const v = video.current;
      if (isStopped() || !v) return;
      if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && v.videoWidth) {
        placeFinder(v);
        const text = await scanFrame(v, frame++).catch(() => null);
        if (isStopped()) return;
        if (text !== null && !handlers.current.onScan(text)) return;
      }
      timer = setTimeout(() => void tick(), FRAME_MS);
    };

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (isStopped() || !video.current) {
          release();
          return;
        }
        const [track] = stream.getVideoTracks();
        await track
          ?.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
          })
          .catch(() => undefined);
        video.current.srcObject = stream;
        await video.current.play();
        void tick();
      } catch (e) {
        if (!isStopped()) handlers.current.onError(cameraError(e));
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      release();
    };
  }, []);

  return (
    <div class="camera">
      <div class="viewport">
        <video ref={video} muted playsInline aria-label={t.scanner.video} />
        <div ref={finder} class="finder" hidden />
      </div>
      <p class="hint">{t.scanner.aim}</p>
    </div>
  );
}

/** Finds an IPS QR code with the camera, in a picture or PDF, or as pasted text. */
export function Scanner(props: { onScan: (text: string) => void }) {
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [pasted, setPasted] = useState('');
  const canUseCamera =
    typeof navigator !== 'undefined' && 'mediaDevices' in navigator;

  const found = (text: string) => {
    setCamera(false);
    setError(undefined);
    props.onScan(text);
  };

  const open = async (file: File) => {
    setCamera(false);
    setError(undefined);
    setBusy(true);
    try {
      const text = await scanFile(file);
      if (text !== null) found(text);
      else setError(isPdf(file) ? t.scanner.noQrPdf : t.scanner.noQrImage);
    } catch {
      setError(t.scanner.unreadable);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="scanner">
      {camera && (
        <Camera
          onScan={(text) => {
            found(text);
            return false;
          }}
          onError={(message) => {
            setCamera(false);
            setError(message);
          }}
        />
      )}
      <div class="actions">
        {canUseCamera && (
          <button
            type="button"
            aria-pressed={camera}
            onClick={() => {
              setError(undefined);
              setCamera(!camera);
            }}
          >
            {camera ? t.scanner.stopCamera : t.scanner.camera}
          </button>
        )}
      </div>
      <label class="field">
        {t.scanner.file}
        <input
          type="file"
          accept="image/*,application/pdf,.pdf"
          disabled={busy}
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (file) void open(file);
          }}
        />
      </label>
      <details>
        <summary>{t.scanner.text}</summary>
        <div class="field">
          <label for="scan-text">{t.scanner.textLabel}</label>
          <textarea
            id="scan-text"
            rows={3}
            placeholder="K:PR|V:01|C:1|R:…"
            value={pasted}
            onInput={(e) => {
              setPasted(e.currentTarget.value);
            }}
          />
        </div>
        <button
          type="button"
          disabled={pasted.trim() === ''}
          onClick={() => {
            found(pasted.trim());
          }}
        >
          {t.scanner.loadText}
        </button>
      </details>
      {busy && (
        <p class="hint" aria-live="polite">
          {t.scanner.searching}
        </p>
      )}
      {error && (
        <p class="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
