import { useEffect, useRef, useState } from 'preact/hooks';
import { isPdf, scanCanvas, scanFile } from './decode';

const FRAME_MS = 250;

function cameraError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Pristup kameri nije dozvoljen. Dozvolite ga u podešavanjima pregledača ili učitajte sliku računa.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return 'Kamera nije pronađena. Učitajte sliku računa.';
  return 'Kamera nije mogla da se pokrene. Učitajte sliku računa.';
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
      <video ref={video} muted playsInline aria-label="Slika sa kamere" />
      <p class="hint">Usmerite kameru na QR kod na računu.</p>
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
      else
        setError(
          isPdf(file)
            ? 'U PDF-u nije pronađen QR kod. Ako je kod nacrtan, a ne umetnut kao slika, napravite snimak ekrana i učitajte njega.'
            : 'Na slici nije pronađen QR kod. Probajte oštriju sliku na kojoj kod zauzima više mesta.',
        );
    } catch {
      setError('Datoteka nije mogla da se pročita.');
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
            {camera ? 'Zaustavi kameru' : 'Kamera'}
          </button>
        )}
      </div>
      <label class="field">
        Slika ili PDF računa
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
        <summary>Tekst koda</summary>
        <div class="field">
          <label for="scan-text">Tekst IPS QR koda</label>
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
          Učitaj tekst
        </button>
      </details>
      {busy && (
        <p class="hint" aria-live="polite">
          Tražim QR kod…
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
