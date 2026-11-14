const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

/** RFC 9285: bytes as text that QR codes hold in their compact alphanumeric mode. */
export function base45Encode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 2) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1];
    let n = b === undefined ? a : a * 256 + b;
    const digits = b === undefined ? 2 : 3;
    for (let d = 0; d < digits; d++) {
      out += ALPHABET.charAt(n % 45);
      n = Math.floor(n / 45);
    }
  }
  return out;
}

export function base45Decode(text: string): Uint8Array | null {
  if (text.length % 3 === 1) return null;
  const out = new Uint8Array(
    Math.floor(text.length / 3) * 2 + (text.length % 3 === 2 ? 1 : 0),
  );
  let o = 0;
  for (let i = 0; i < text.length; i += 3) {
    let n = 0;
    const group = text.slice(i, i + 3);
    for (let d = group.length - 1; d >= 0; d--) {
      const v = ALPHABET.indexOf(group[d] ?? '');
      if (v < 0) return null;
      n = n * 45 + v;
    }
    if (group.length === 3) {
      if (n > 0xffff) return null;
      out[o++] = n >> 8;
      out[o++] = n & 0xff;
    } else {
      if (n > 0xff) return null;
      out[o++] = n;
    }
  }
  return out;
}
