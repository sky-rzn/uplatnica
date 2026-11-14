import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import { isPdf, scanCanvas, scanFile } from './decode';

const FRAME_MS = 250;

function cameraError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return t.scanner.cameraDenied;
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return t.scanner.cameraMissing;
  return t.scanner.cameraFailed;
}

function Camera(props: {
  onScan: (text: string) => void;
  onError: (message: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
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
    const canvas = document.createElement('canvas');

    const tick = async () => {
      const v = video.current;
      if (isStopped() || !v) return;
      if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        canvas.getContext('2d')?.drawImage(v, 0, 0);
        const text = await scanCanvas(canvas).catch(() => null);
        if (isStopped()) return;
        if (text !== null) {
          handlers.current.onScan(text);
          return;
        }
      }
      timer = setTimeout(() => void tick(), FRAME_MS);
    };

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (isStopped() || !video.current) {
          release();
          return;
        }
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
      <video ref={video} muted playsInline aria-label={t.scanner.video} />
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
          onScan={found}
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
