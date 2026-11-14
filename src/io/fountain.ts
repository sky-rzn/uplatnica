import { base45Decode, base45Encode } from './base45';

export const FRAME_PREFIX = 'UPL1:';
const HEADER = 12;

export function crc32(bytes: Uint8Array): number {
  let crc = ~0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The chunks frame index XORs together. The first count frames carry one
 * chunk each, the later ones a mix whose size follows the ideal soliton
 * distribution, so that missed frames are made up by any later ones.
 */
export function frameChunks(
  id: number,
  count: number,
  index: number,
): number[] {
  if (index < count) return [index];
  const random = mulberry32(id ^ Math.imul(index, 0x9e3779b9));
  const u = random();
  const degree =
    u < 1 / count ? 1 : Math.min(count, Math.ceil(1 / (1 + 1 / count - u)));
  const pool = Array.from({ length: count }, (_, i) => i);
  for (let i = 0; i < degree; i++) {
    const j = i + Math.floor(random() * (count - i));
    [pool[i], pool[j]] = [pool[j] ?? 0, pool[i] ?? 0];
  }
  return pool.slice(0, degree).sort((a, b) => a - b);
}

export class FrameEncoder {
  readonly id: number;
  readonly count: number;
  private readonly chunks: Uint8Array[];

  constructor(
    readonly message: Uint8Array,
    chunkSize: number,
  ) {
    this.id = crc32(message);
    this.count = Math.max(1, Math.ceil(message.length / chunkSize));
    this.chunks = Array.from({ length: this.count }, (_, i) => {
      const chunk = new Uint8Array(chunkSize);
      chunk.set(message.subarray(i * chunkSize, (i + 1) * chunkSize));
      return chunk;
    });
  }

  /** Text of a QR code; frames go on without end. */
  frame(index: number): string {
    const size = this.chunks[0]?.length ?? 0;
    const bytes = new Uint8Array(HEADER + size);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, this.id);
    view.setUint32(4, this.message.length);
    view.setUint32(8, index);
    for (const c of frameChunks(this.id, this.count, index)) {
      const chunk = this.chunks[c];
      if (chunk) xor(bytes.subarray(HEADER), chunk);
    }
    return FRAME_PREFIX + base45Encode(bytes);
  }
}

export interface Progress {
  received: number;
  total: number;
}

export type PushResult = 'foreign' | 'progress' | 'done' | 'corrupt';

interface Pending {
  chunks: Set<number>;
  data: Uint8Array;
}

/** Puts a message back together from frames read in any order. */
export class FrameDecoder {
  private id: number | undefined;
  private length = 0;
  private size = 0;
  private known = new Map<number, Uint8Array>();
  private pending: Pending[] = [];
  private seen = new Set<number>();
  private message: Uint8Array | undefined;

  get progress(): Progress {
    return {
      received: this.known.size,
      total: this.id === undefined ? 0 : Math.ceil(this.length / this.size),
    };
  }

  get result(): Uint8Array | undefined {
    return this.message;
  }

  push(text: string): PushResult {
    if (!text.startsWith(FRAME_PREFIX)) return 'foreign';
    const bytes = base45Decode(text.slice(FRAME_PREFIX.length));
    if (!bytes || bytes.length <= HEADER) return 'foreign';
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    const id = view.getUint32(0);
    const length = view.getUint32(4);
    const index = view.getUint32(8);
    const data = bytes.slice(HEADER);
    if (id !== this.id || length !== this.length || data.length !== this.size)
      this.reset(id, length, data.length);
    if (this.message) return 'done';
    if (this.seen.has(index)) return 'progress';
    this.seen.add(index);

    const total = Math.max(1, Math.ceil(length / data.length));
    const chunks = new Set(frameChunks(id, total, index));
    for (const c of chunks) {
      const k = this.known.get(c);
      if (!k) continue;
      xor(data, k);
      chunks.delete(c);
    }
    if (chunks.size === 1) this.learn([...chunks][0] ?? 0, data);
    else if (chunks.size > 1) this.pending.push({ chunks, data });

    if (this.known.size < total) return 'progress';
    const message = new Uint8Array(total * data.length);
    for (const [i, chunk] of this.known) message.set(chunk, i * data.length);
    const out = message.slice(0, length);
    if (crc32(out) !== id) {
      this.reset(undefined, 0, 0);
      return 'corrupt';
    }
    this.message = out;
    return 'done';
  }

  private reset(id: number | undefined, length: number, size: number) {
    this.id = id;
    this.length = length;
    this.size = size;
    this.known = new Map();
    this.pending = [];
    this.seen = new Set();
    this.message = undefined;
  }

  private learn(chunk: number, data: Uint8Array) {
    const queue: [number, Uint8Array][] = [[chunk, data]];
    for (let next = queue.pop(); next; next = queue.pop()) {
      const [c, d] = next;
      if (this.known.has(c)) continue;
      this.known.set(c, d);
      this.pending = this.pending.filter((p) => {
        if (!p.chunks.delete(c)) return true;
        xor(p.data, d);
        if (p.chunks.size === 1) queue.push([[...p.chunks][0] ?? 0, p.data]);
        return p.chunks.size > 1;
      });
    }
  }
}

function xor(into: Uint8Array, from: Uint8Array) {
  for (let i = 0; i < into.length; i++)
    into[i] = (into[i] ?? 0) ^ (from[i] ?? 0);
}
