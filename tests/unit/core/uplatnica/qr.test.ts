import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import {
  qrMatrix,
  qrPath,
  type QrMatrix,
} from '../../../../src/core/uplatnica/qr';

const INFOSTAN =
  'K:PR|V:01|C:1|R:200220618010100048|N:JKP INFOSTAN TEHNOLOGIJE BEOGRAD|I:RSD1287,60|SF:122|S:OBJEDINJENA NAPLATA|RO:11804071936013-26093-1';

function decode(m: QrMatrix): string | undefined {
  const scale = 4;
  const side = (m.size + 8) * scale;
  const rgba = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const row = Math.floor(y / scale) - 4;
      const col = Math.floor(x / scale) - 4;
      const inside = row >= 0 && col >= 0 && row < m.size && col < m.size;
      if (inside && m.dark(row, col))
        rgba.fill(0, (y * side + x) * 4, (y * side + x) * 4 + 3);
    }
  }
  return jsQR(rgba, side, side)?.data;
}

describe('qrMatrix', () => {
  it('encodes text that reads back unchanged, Serbian letters included', () => {
    for (const text of [
      INFOSTAN,
      `${INFOSTAN}|P:MRĐO MAČKATOVIĆ\r\nŽUPSKA 13`,
    ]) {
      expect(decode(qrMatrix(text, 'M'))).toBe(text);
    }
  });

  it('refuses text that needs a version above 13', () => {
    expect(qrMatrix('A'.repeat(425), 'L').version).toBeLessThanOrEqual(13);
    expect(() => qrMatrix('a'.repeat(500), 'L')).toThrow(RangeError);
  });
});

describe('qrPath', () => {
  it('draws each horizontal run of dark modules as one rectangle', () => {
    const m: QrMatrix = {
      size: 3,
      version: 1,
      dark: (r, c) => r === 1 && c > 0,
    };
    expect(qrPath(m, 10, 20, 0.5)).toBe('M10.5 20.5h1v0.5h-1z');
  });
});
