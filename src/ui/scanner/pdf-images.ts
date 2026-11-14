import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFString,
  decodePDFRawStream,
  type PDFObject,
} from 'pdf-lib';

export type PdfImage =
  | { kind: 'jpeg'; bytes: Uint8Array }
  | { kind: 'rgba'; width: number; height: number; data: Uint8ClampedArray };

type ColorSpace =
  | { kind: 'gray' | 'rgb' | 'cmyk' }
  | { kind: 'indexed'; base: 'gray' | 'rgb' | 'cmyk'; lookup: Uint8Array };

const NEEDS_RENDERER: readonly string[] = [
  '/DCTDecode',
  '/JPXDecode',
  '/CCITTFaxDecode',
  '/JBIG2Decode',
];

const COMPONENTS = { gray: 1, rgb: 3, cmyk: 4 } as const;

const name = (s: string) => PDFName.of(s);

function num(dict: PDFDict, key: string, fallback: number): number {
  const v = dict.lookup(name(key));
  return v instanceof PDFNumber ? v.asNumber() : fallback;
}

function streamBytes(stream: PDFRawStream): Uint8Array {
  return decodePDFRawStream(stream).decode();
}

function deviceSpace(
  obj: PDFObject | undefined,
): 'gray' | 'rgb' | 'cmyk' | null {
  if (obj instanceof PDFName) {
    switch (obj.asString()) {
      case '/DeviceGray':
      case '/CalGray':
      case '/G':
        return 'gray';
      case '/DeviceRGB':
      case '/CalRGB':
      case '/RGB':
        return 'rgb';
      case '/DeviceCMYK':
      case '/CMYK':
        return 'cmyk';
    }
    return null;
  }
  if (obj instanceof PDFArray) {
    const family = obj.lookup(0);
    if (family === name('ICCBased')) {
      const icc = obj.lookup(1);
      if (!(icc instanceof PDFRawStream)) return null;
      const n = num(icc.dict, 'N', 3);
      return n === 1 ? 'gray' : n === 4 ? 'cmyk' : 'rgb';
    }
    return deviceSpace(family);
  }
  return null;
}

function colorSpace(obj: PDFObject | undefined): ColorSpace | null {
  if (obj instanceof PDFArray && obj.lookup(0) === name('Indexed')) {
    const base = deviceSpace(obj.lookup(1));
    const table = obj.lookup(3);
    if (!base) return null;
    const lookup =
      table instanceof PDFRawStream
        ? streamBytes(table)
        : table instanceof PDFString || table instanceof PDFHexString
          ? table.asBytes()
          : null;
    return lookup ? { kind: 'indexed', base, lookup } : null;
  }
  const kind = deviceSpace(obj);
  return kind ? { kind } : null;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Undoes the PNG predictors (Predictor 10 to 15) of a FlateDecode stream. */
export function unpredictPng(
  input: Uint8Array,
  rowBytes: number,
  bpp: number,
): Uint8Array {
  const rows = Math.floor(input.length / (rowBytes + 1));
  const out = new Uint8Array(rows * rowBytes);
  for (let r = 0; r < rows; r++) {
    const type = input[r * (rowBytes + 1)] ?? 0;
    const src = r * (rowBytes + 1) + 1;
    const dst = r * rowBytes;
    for (let i = 0; i < rowBytes; i++) {
      const x = input[src + i] ?? 0;
      const a = i >= bpp ? (out[dst + i - bpp] ?? 0) : 0;
      const b = r > 0 ? (out[dst - rowBytes + i] ?? 0) : 0;
      const c = r > 0 && i >= bpp ? (out[dst - rowBytes + i - bpp] ?? 0) : 0;
      const pred =
        type === 1
          ? a
          : type === 2
            ? b
            : type === 3
              ? (a + b) >> 1
              : type === 4
                ? paeth(a, b, c)
                : 0;
      out[dst + i] = (x + pred) & 0xff;
    }
  }
  return out;
}

function filters(dict: PDFDict): string[] {
  const f = dict.lookup(name('Filter'));
  if (f instanceof PDFName) return [f.asString()];
  if (f instanceof PDFArray)
    return f.asArray().map((_, i) => f.lookup(i, PDFName).asString());
  return [];
}

function setRgb(
  out: Uint8ClampedArray,
  i: number,
  space: 'gray' | 'rgb' | 'cmyk',
  src: ArrayLike<number>,
  at: number,
  max: number,
): void {
  const v = (k: number) => ((src[at + k] ?? 0) * 255) / max;
  if (space === 'gray') {
    out[i] = out[i + 1] = out[i + 2] = v(0);
  } else if (space === 'rgb') {
    out[i] = v(0);
    out[i + 1] = v(1);
    out[i + 2] = v(2);
  } else {
    const k = v(3);
    out[i] = 255 - Math.min(255, v(0) + k);
    out[i + 1] = 255 - Math.min(255, v(1) + k);
    out[i + 2] = 255 - Math.min(255, v(2) + k);
  }
  out[i + 3] = 255;
}

function rawImage(stream: PDFRawStream): PdfImage | null {
  const { dict } = stream;
  const width = num(dict, 'Width', 0);
  const height = num(dict, 'Height', 0);
  if (width < 21 || height < 21) return null;
  const mask = dict.lookup(name('ImageMask'));
  const isMask = mask instanceof PDFBool && mask.asBoolean();
  const space: ColorSpace | null = isMask
    ? { kind: 'gray' }
    : colorSpace(dict.lookup(name('ColorSpace')));
  if (!space) return null;
  const bpc = isMask ? 1 : num(dict, 'BitsPerComponent', 8);
  const comps = space.kind === 'indexed' ? 1 : COMPONENTS[space.kind];
  const rowBytes = Math.ceil((width * comps * bpc) / 8);

  let bytes = streamBytes(stream);
  const parms = dict.lookup(name('DecodeParms'));
  const predictor = parms instanceof PDFDict ? num(parms, 'Predictor', 1) : 1;
  if (predictor >= 10)
    bytes = unpredictPng(bytes, rowBytes, Math.max(1, (comps * bpc) >> 3));
  if (bytes.length < rowBytes * height) return null;

  const sample = (row: number, index: number): number => {
    if (bpc === 8) return bytes[row * rowBytes + index] ?? 0;
    if (bpc === 16) return bytes[row * rowBytes + index * 2] ?? 0;
    const bit = index * bpc;
    const byte = bytes[row * rowBytes + (bit >> 3)] ?? 0;
    return (byte >> (8 - bpc - (bit & 7))) & ((1 << bpc) - 1);
  };
  const max = bpc === 16 ? 255 : (1 << bpc) - 1;
  const data = new Uint8ClampedArray(width * height * 4);
  const pixel: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (space.kind === 'indexed') {
        const n = COMPONENTS[space.base];
        setRgb(data, i, space.base, space.lookup, sample(y, x) * n, 255);
      } else {
        for (let k = 0; k < comps; k++) pixel[k] = sample(y, x * comps + k);
        setRgb(data, i, space.kind, pixel, 0, max);
      }
    }
  }
  return { kind: 'rgba', width, height, data };
}

const INLINE_KEYS: Record<string, string> = {
  W: 'Width',
  H: 'Height',
  BPC: 'BitsPerComponent',
  IM: 'ImageMask',
  CS: 'ColorSpace',
  F: 'Filter',
  DP: 'DecodeParms',
  D: 'Decode',
};

const INLINE_NAMES: Record<string, string> = {
  G: 'DeviceGray',
  RGB: 'DeviceRGB',
  CMYK: 'DeviceCMYK',
  AHx: 'ASCIIHexDecode',
  A85: 'ASCII85Decode',
  LZW: 'LZWDecode',
  Fl: 'FlateDecode',
  RL: 'RunLengthDecode',
  CCF: 'CCITTFaxDecode',
  DCT: 'DCTDecode',
};

type InlineValue = string | number | boolean | InlineValue[];

/** Reads the "/Key value" pairs between BI and ID; null if they hold a dictionary. */
function inlineDict(src: string): Record<string, InlineValue> | null {
  const tokens = src.match(/\/[^\s/[\]<>()]*|\[|\]|[^\s/[\]]+|<<|>>/g) ?? [];
  const out: Record<string, InlineValue> = {};
  let i = 0;
  const value = (): InlineValue | null => {
    const t = tokens[i++];
    if (t === undefined || t === '<<' || t === ']') return null;
    if (t === '[') {
      const arr: InlineValue[] = [];
      while (i < tokens.length && tokens[i] !== ']') {
        const v = value();
        if (v === null) return null;
        arr.push(v);
      }
      i++;
      return arr;
    }
    if (t.startsWith('/')) {
      const n = t.slice(1);
      return INLINE_NAMES[n] ?? n;
    }
    if (t === 'true' || t === 'false') return t === 'true';
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };
  while (i < tokens.length) {
    const key = tokens[i++] ?? '';
    if (!key.startsWith('/')) return null;
    const v = value();
    if (v === null) return null;
    out[INLINE_KEYS[key.slice(1)] ?? key.slice(1)] = v;
  }
  return out;
}

function inlineEnd(text: string, from: number, firstFilter: unknown): number {
  const eod =
    firstFilter === 'ASCII85Decode'
      ? text.indexOf('~>', from)
      : firstFilter === 'ASCIIHexDecode'
        ? text.indexOf('>', from)
        : -1;
  const after = eod === -1 ? from : eod;
  const m = /\sEI(?=\s|$)/.exec(text.slice(after));
  return m ? after + m.index : -1;
}

/** Images written straight into content streams between BI and EI. */
function inlineImages(doc: PDFDocument, content: Uint8Array): PdfImage[] {
  const text = new TextDecoder('latin1').decode(content);
  const images: PdfImage[] = [];
  const begin = /(?:^|\s)BI\s/g;
  let m: RegExpExecArray | null;
  while ((m = begin.exec(text))) {
    const dictStart = m.index + m[0].length;
    const id = /\sID\s/.exec(text.slice(dictStart));
    if (!id) break;
    const dataStart = dictStart + id.index + id[0].length;
    const fields = inlineDict(text.slice(dictStart, dictStart + id.index));
    const filter = fields?.Filter;
    const first = Array.isArray(filter) ? filter[0] : filter;
    const end = inlineEnd(text, dataStart, first);
    if (end === -1) break;
    begin.lastIndex = end + 3;
    if (!fields) continue;
    const data = content.subarray(dataStart, end);
    if (filter === 'DCTDecode') {
      images.push({ kind: 'jpeg', bytes: data });
      continue;
    }
    const chain = Array.isArray(filter) ? filter : filter ? [filter] : [];
    if (chain.some((f) => NEEDS_RENDERER.includes(`/${String(f)}`))) continue;
    try {
      const image = rawImage(PDFRawStream.of(doc.context.obj(fields), data));
      if (image) images.push(image);
    } catch {
      continue;
    }
  }
  return images;
}

/**
 * The raster images of a PDF, where QR codes on e-bills usually are, both
 * image objects and images inlined in page content. Images in encodings
 * that need a full renderer (JPEG 2000, CCITT, JBIG2) are skipped.
 */
export async function pdfImages(bytes: Uint8Array): Promise<PdfImage[]> {
  const doc = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  const images: PdfImage[] = [];
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const subtype = obj.dict.lookup(name('Subtype'));
    const chain = filters(obj.dict);
    try {
      if (subtype !== name('Image')) {
        if (subtype === undefined || subtype === name('Form'))
          images.push(...inlineImages(doc, streamBytes(obj)));
      } else if (chain.length === 1 && chain[0] === '/DCTDecode') {
        images.push({ kind: 'jpeg', bytes: obj.contents });
      } else if (!chain.some((f) => NEEDS_RENDERER.includes(f))) {
        const image = rawImage(obj);
        if (image) images.push(image);
      }
    } catch {
      continue;
    }
  }
  return images;
}
