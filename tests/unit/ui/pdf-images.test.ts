import jsQR from 'jsqr';
import { deflateSync } from 'node:zlib';
import { PDFDocument, PDFHexString, PDFName } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { qrMatrix } from '../../../src/core/uplatnica/qr';
import { pdfImages, type PdfImage } from '../../../src/ui/scanner/pdf-images';

const TEXT =
  'K:PR|V:01|C:1|R:200220618010100048|N:JKP INFOSTAN TEHNOLOGIJE BEOGRAD|I:RSD1287,60|SF:122|S:OBJEDINJENA NAPLATA|RO:11804071936013-26093-1';
const SCALE = 4;

const matrix = qrMatrix(TEXT, 'M');
const side = matrix.size * SCALE;
const dark = (x: number, y: number) =>
  matrix.dark(Math.floor(y / SCALE), Math.floor(x / SCALE));

function ascii85(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 4) {
    let n = [0, 1, 2, 3].reduce((acc, k) => acc * 256 + (bytes[i + k] ?? 0), 0);
    const digits: string[] = [];
    for (let k = 0; k < 5; k++) {
      digits.unshift(String.fromCharCode(33 + (n % 85)));
      n = Math.floor(n / 85);
    }
    out += digits.slice(0, Math.min(5, bytes.length - i + 1)).join('');
  }
  return `${out}~>`;
}

function maskBits(): Uint8Array {
  const rowBytes = Math.ceil(side / 8);
  const bits = new Uint8Array(rowBytes * side);
  for (let y = 0; y < side; y++)
    for (let x = 0; x < side; x++) {
      const i = y * rowBytes + (x >> 3);
      if (!dark(x, y)) bits[i] = (bits[i] ?? 0) | (0x80 >> (x & 7));
    }
  return bits;
}

function decode(image: PdfImage | undefined): string | undefined {
  if (image?.kind !== 'rgba') return undefined;
  const pad = 16;
  const w = image.width + 2 * pad;
  const rgba = new Uint8ClampedArray(w * w * 4).fill(255);
  for (let y = 0; y < image.height; y++)
    rgba.set(
      image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4),
      ((y + pad) * w + pad) * 4,
    );
  return jsQR(rgba, w, w)?.data;
}

describe('pdfImages', () => {
  it('reads an image mask inlined in page content', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    const data = ascii85(deflateSync(maskBits()));
    const content = `q 100 0 0 100 50 50 cm\nBI\n/W ${String(side)}\n/H ${String(side)}\n/BPC 1\n/IM true\n/F [/A85 /Fl]\nID\n${data}\nEI\nQ\n`;
    page.node.set(
      PDFName.of('Contents'),
      doc.context.register(doc.context.flateStream(content)),
    );
    const images = await pdfImages(await doc.save());
    expect(images).toHaveLength(1);
    expect(decode(images[0])).toBe(TEXT);
  });

  it('reads an indexed image with a PNG predictor', async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    const rows: number[] = [];
    let previous = new Uint8Array(side);
    for (let y = 0; y < side; y++) {
      const row = Uint8Array.from({ length: side }, (_, x) =>
        dark(x, y) ? 1 : 0,
      );
      rows.push(2, ...row.map((v, x) => (v - (previous[x] ?? 0)) & 0xff));
      previous = row;
    }
    const stream = doc.context.stream(deflateSync(Uint8Array.from(rows)), {
      Type: 'XObject',
      Subtype: 'Image',
      Width: side,
      Height: side,
      BitsPerComponent: 8,
      ColorSpace: ['Indexed', 'DeviceRGB', 1, PDFHexString.of('FFFFFF000000')],
      Filter: 'FlateDecode',
      DecodeParms: { Predictor: 12, Colors: 1, Columns: side },
    });
    doc.context.register(stream);
    const images = await pdfImages(await doc.save({ useObjectStreams: false }));
    expect(images.map((i) => i.kind)).toEqual(['rgba']);
    expect(decode(images[0])).toBe(TEXT);
  });
});
