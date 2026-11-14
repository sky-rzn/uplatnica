import * as z from 'zod/mini';
import type { Backup } from './export';
import { readBackup, type ImportIssue } from './import';

const SYNC_APP = 'uplatnica-sync';
const SYNC_VERSION = 1;

export interface Device {
  id: string;
  name: string;
}

/** What one device shows another: its data and how much of the other's it holds. */
export interface SyncMessage {
  device: Device;
  /** exportedAt of the last message from the receiver merged here. */
  ack?: string;
  backup: Backup;
}

export type UnpackResult =
  | { ok: true; message: SyncMessage }
  | { ok: false; error: 'not-sync' | 'newer' }
  | { ok: false; error: 'backup'; issues: ImportIssue[] };

const envelope = z.object({
  app: z.literal(SYNC_APP),
  version: z.number(),
  device: z.strictObject({
    id: z.string().check(z.minLength(1)),
    name: z.string(),
  }),
  ack: z.optional(z.iso.datetime()),
  backup: z.unknown(),
});

async function pipe(bytes: Uint8Array, through: GenericTransformStream) {
  const stream = new Blob([bytes as Uint8Array<ArrayBuffer>])
    .stream()
    .pipeThrough(through);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export function packSync(message: SyncMessage): Promise<Uint8Array> {
  const json = JSON.stringify({
    app: SYNC_APP,
    version: SYNC_VERSION,
    ...message,
  });
  return pipe(
    new TextEncoder().encode(json),
    new CompressionStream('deflate-raw'),
  );
}

export async function unpackSync(bytes: Uint8Array): Promise<UnpackResult> {
  let raw: unknown;
  try {
    const json = await pipe(bytes, new DecompressionStream('deflate-raw'));
    raw = JSON.parse(new TextDecoder().decode(json));
  } catch {
    return { ok: false, error: 'not-sync' };
  }
  const parsed = envelope.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'not-sync' };
  const { version, device, ack, backup } = parsed.data;
  if (version > SYNC_VERSION) return { ok: false, error: 'newer' };
  const read = readBackup(backup);
  if (!read.ok) return { ok: false, error: 'backup', issues: read.issues };
  return {
    ok: true,
    message: {
      device,
      ...(ack !== undefined ? { ack } : {}),
      backup: read.backup,
    },
  };
}
