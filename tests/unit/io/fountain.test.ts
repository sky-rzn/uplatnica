import { describe, expect, it } from 'vitest';
import { base45Decode, base45Encode } from '../../../src/io/base45';
import {
  FRAME_PREFIX,
  FrameDecoder,
  FrameEncoder,
  crc32,
} from '../../../src/io/fountain';

function bytes(n: number, seed = 1): Uint8Array {
  const out = new Uint8Array(n);
  let x = seed;
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    out[i] = x >>> 24;
  }
  return out;
}

describe('base45', () => {
  it('matches RFC 9285', () => {
    const enc = (s: string) => base45Encode(new TextEncoder().encode(s));
    expect(enc('AB')).toBe('BB8');
    expect(enc('Hello!!')).toBe('%69 VD92EX0');
    expect(enc('ietf!')).toBe('QED8WEX0');
  });

  it('round-trips any bytes and rejects other text', () => {
    for (const n of [0, 1, 2, 3, 299]) {
      const b = bytes(n);
      expect(base45Decode(base45Encode(b))).toEqual(b);
    }
    expect(base45Decode('GGW')).toBeNull();
    expect(base45Decode('abc')).toBeNull();
    expect(base45Decode('A')).toBeNull();
  });
});

describe('crc32', () => {
  it('gives the standard check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('frames', () => {
  it('rebuilds the message from the first frames', () => {
    const message = bytes(1000);
    const enc = new FrameEncoder(message, 288);
    const dec = new FrameDecoder();
    expect(enc.count).toBe(4);
    expect(enc.frame(0).startsWith(FRAME_PREFIX)).toBe(true);
    expect(dec.push(enc.frame(0))).toBe('progress');
    expect(dec.push(enc.frame(0))).toBe('progress');
    expect(dec.progress).toEqual({ received: 1, total: 4 });
    for (const i of [1, 2]) dec.push(enc.frame(i));
    expect(dec.push(enc.frame(3))).toBe('done');
    expect(dec.result).toEqual(message);
  });

  it('makes up for missed frames with later ones', () => {
    const message = bytes(5000, 7);
    const enc = new FrameEncoder(message, 288);
    const dec = new FrameDecoder();
    let pushed = 0;
    for (let i = 0; dec.result === undefined && i < 10 * enc.count; i++) {
      if (i % 3 === 0 || i < enc.count / 2) continue;
      dec.push(enc.frame(i));
      pushed++;
    }
    expect(dec.result).toEqual(message);
    expect(pushed).toBeLessThan(2 * enc.count);
  });

  it('ignores other codes and starts over on a new message', () => {
    const dec = new FrameDecoder();
    expect(dec.push('K:PR|V:01|C:1')).toBe('foreign');
    const first = new FrameEncoder(bytes(600, 1), 288);
    const second = new FrameEncoder(bytes(10, 2), 288);
    dec.push(first.frame(0));
    expect(dec.push(second.frame(0))).toBe('done');
    expect(dec.result).toEqual(bytes(10, 2));
  });
});
