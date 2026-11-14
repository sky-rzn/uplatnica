import { useEffect, useState } from 'preact/hooks';
import { todayIso } from '../../core/date';
import { OwnMessageError } from '../../db/repo';
import type { Peer } from '../../db/schema';
import { FrameDecoder, FrameEncoder, type Progress } from '../../io/fountain';
import { t } from '../../i18n';
import { useLive, useRepo } from '../data';
import { formatDate } from '../format';
import { Camera } from '../scanner/Scanner';
import { QrCode } from '../uplatnica/QrCode';

const CHUNK = 288;
const FRAME_MS = 400;
const MAX_VERSION = 20;

export function guessDeviceName(ua = navigator.userAgent): string {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'Mac';
  if (/Linux/.test(ua)) return 'Linux';
  return '';
}

function AnimatedQr(props: { peerId: string | null }) {
  const repo = useRepo();
  const [encoder, setEncoder] = useState<FrameEncoder>();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const gone = new AbortController();
    void (async () => {
      const { packSync } = await import('../../io/sync');
      const bytes = await packSync(await repo.outgoing(props.peerId));
      if (!gone.signal.aborted) setEncoder(new FrameEncoder(bytes, CHUNK));
    })();
    return () => {
      gone.abort();
    };
  }, [repo, props.peerId]);

  useEffect(() => {
    if (!encoder || encoder.count === 1) return;
    setIndex(0);
    const timer = setInterval(() => {
      setIndex((i) => i + 1);
    }, FRAME_MS);
    return () => {
      clearInterval(timer);
    };
  }, [encoder]);

  if (!encoder) return null;
  return (
    <div class="qr-box sync-qr">
      <QrCode
        text={encoder.frame(index)}
        ecc="M"
        label={t.sync.qrLabel}
        maxVersion={MAX_VERSION}
      />
      <p class="hint">{t.sync.frames(encoder.count)}</p>
    </div>
  );
}

type Outcome =
  | { kind: 'error'; message: string }
  | { kind: 'synced'; peer: Peer; message: string };

function Reader(props: { onDone: (outcome: Outcome) => void }) {
  const repo = useRepo();
  const [decoder] = useState(() => new FrameDecoder());
  const [progress, setProgress] = useState<Progress>();
  const [foreign, setForeign] = useState(false);
  const [error, setError] = useState<string>();

  const finish = async (bytes: Uint8Array) => {
    const { unpackSync } = await import('../../io/sync');
    const read = await unpackSync(bytes);
    if (!read.ok) {
      props.onDone({
        kind: 'error',
        message: read.error === 'newer' ? t.sync.newer : t.sync.invalid,
      });
      return;
    }
    try {
      const s = await repo.acceptSync(read.message);
      props.onDone({
        kind: 'synced',
        peer: s.peer,
        message: t.sync.done(s.peer.name, s.added, s.updated, s.deleted),
      });
    } catch (e) {
      if (!(e instanceof OwnMessageError)) throw e;
      props.onDone({ kind: 'error', message: t.sync.own });
    }
  };

  const scanned = (text: string): boolean => {
    const result = decoder.push(text);
    setForeign(result === 'foreign');
    setProgress(decoder.progress);
    const bytes = decoder.result;
    if (result !== 'done' || !bytes) return true;
    void finish(bytes);
    return false;
  };

  if (error)
    return (
      <p class="error" role="alert">
        {error}
      </p>
    );
  return (
    <>
      <Camera onScan={scanned} onError={setError} />
      <p class="hint" aria-live="polite">
        {progress && progress.total > 0
          ? t.sync.received(progress.received, progress.total)
          : t.sync.waiting}
      </p>
      {foreign && <p class="error">{t.sync.foreign}</p>}
    </>
  );
}

function DeviceName() {
  const repo = useRepo();
  const device = useLive((r) => r.getDevice());
  if (!device) return null;
  return (
    <div class="field">
      <label for="device-name">{t.sync.deviceName}</label>
      <input
        id="device-name"
        value={device.name}
        onChange={(e) => {
          void repo.renameDevice(e.currentTarget.value.trim());
        }}
      />
      <p class="hint">{t.sync.deviceNameHint}</p>
    </div>
  );
}

const NEW = '';

type Mode =
  { kind: 'idle' } | { kind: 'show'; peerId: string } | { kind: 'scan' };

export function SyncView() {
  const repo = useRepo();
  const peers = useLive((r) => r.listPeers());
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [outcome, setOutcome] = useState<Outcome>();
  useEffect(() => {
    void repo.device(guessDeviceName()).then(() => {
      setReady(true);
    });
  }, [repo]);
  if (!peers || !ready) return null;

  const latest = [...peers].sort((a, b) =>
    b.syncedAt.localeCompare(a.syncedAt),
  )[0];
  const canUseCamera =
    typeof navigator !== 'undefined' && 'mediaDevices' in navigator;

  return (
    <section class="sync-view">
      <h1>{t.sync.title}</h1>
      <p class="lead">{t.sync.lead}</p>
      <DeviceName />

      <div class="actions">
        <button
          type="button"
          aria-pressed={mode.kind === 'show'}
          onClick={() => {
            setOutcome(undefined);
            setMode({ kind: 'show', peerId: latest?.id ?? NEW });
          }}
        >
          {t.sync.show}
        </button>
        {canUseCamera && (
          <button
            type="button"
            aria-pressed={mode.kind === 'scan'}
            onClick={() => {
              setOutcome(undefined);
              setMode(
                mode.kind === 'scan' ? { kind: 'idle' } : { kind: 'scan' },
              );
            }}
          >
            {mode.kind === 'scan' ? t.sync.stop : t.sync.scan}
          </button>
        )}
      </div>
      {!canUseCamera && <p class="hint">{t.sync.noCamera}</p>}

      {mode.kind === 'show' && (
        <section class="card" aria-labelledby="sync-show-title">
          <h2 id="sync-show-title">{t.sync.show}</h2>
          <div class="field">
            <label for="sync-peer">{t.sync.target}</label>
            <select
              id="sync-peer"
              value={mode.peerId}
              onChange={(e) => {
                setMode({ kind: 'show', peerId: e.currentTarget.value });
              }}
            >
              {peers.map((p) => (
                <option key={p.id} value={p.id}>
                  {t.sync.peer(
                    p.name,
                    formatDate(todayIso(new Date(p.syncedAt))),
                  )}
                </option>
              ))}
              <option value={NEW}>{t.sync.newDevice}</option>
            </select>
          </div>
          <AnimatedQr
            key={mode.peerId}
            peerId={mode.peerId === NEW ? null : mode.peerId}
          />
        </section>
      )}

      {mode.kind === 'scan' && (
        <section class="card" aria-labelledby="sync-scan-title">
          <h2 id="sync-scan-title">{t.sync.scan}</h2>
          <Reader
            onDone={(o) => {
              setOutcome(o);
              setMode({ kind: 'idle' });
            }}
          />
        </section>
      )}

      {outcome?.kind === 'error' && (
        <p class="error" role="alert">
          {outcome.message}
        </p>
      )}
      {outcome?.kind === 'synced' && (
        <div class="card" role="status">
          <p>{outcome.message}</p>
          <p class="hint">{t.sync.replyHint(outcome.peer.name)}</p>
          <div class="actions">
            <button
              type="button"
              class="primary"
              onClick={() => {
                setMode({ kind: 'show', peerId: outcome.peer.id });
                setOutcome(undefined);
              }}
            >
              {t.sync.reply}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
