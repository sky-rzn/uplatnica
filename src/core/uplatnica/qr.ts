import QRCode from 'qrcode';

/** NBS caps IPS QR at version 13. */
export const QR_MAX_VERSION = 13;

export interface QrMatrix {
  size: number;
  version: number;
  dark: (row: number, col: number) => boolean;
}

export function qrMatrix(text: string, ecc: 'M' | 'L'): QrMatrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: ecc });
  if (qr.version > QR_MAX_VERSION)
    throw new RangeError(`QR version ${String(qr.version)} is too large`);
  const { size, data } = qr.modules;
  return {
    size,
    version: qr.version,
    dark: (row, col) => data[row * size + col] === 1,
  };
}

/** SVG path of the dark modules, one subpath per horizontal run. */
export function qrPath(
  m: QrMatrix,
  x: number,
  y: number,
  cell: number,
): string {
  const n = (v: number) => String(Math.round(v * 1000) / 1000);
  const parts: string[] = [];
  for (let row = 0; row < m.size; row++) {
    let col = 0;
    while (col < m.size) {
      if (!m.dark(row, col)) {
        col++;
        continue;
      }
      const from = col;
      while (col < m.size && m.dark(row, col)) col++;
      parts.push(
        `M${n(x + from * cell)} ${n(y + row * cell)}h${n((col - from) * cell)}v${n(cell)}h${n(-(col - from) * cell)}z`,
      );
    }
  }
  return parts.join('');
}
