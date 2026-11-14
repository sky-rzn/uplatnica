interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: HTMLCanvasElement): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorClass {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats(): Promise<string[]>;
}

let native: Promise<BarcodeDetectorLike | null> | undefined;

function nativeDetector(): Promise<BarcodeDetectorLike | null> {
  native ??= (async () => {
    const Detector = (globalThis as { BarcodeDetector?: BarcodeDetectorClass })
      .BarcodeDetector;
    if (!Detector) return null;
    try {
      const formats = await Detector.getSupportedFormats();
      return formats.includes('qr_code')
        ? new Detector({ formats: ['qr_code'] })
        : null;
    } catch {
      return null;
    }
  })();
  return native;
}

export function looksLikeIps(text: string): boolean {
  return (
    /^\s*K\s*:\s*PR\s*(\||$)/.test(text) ||
    /\|\s*K\s*:\s*PR\s*(\||$)/.test(text)
  );
}

/**
 * Reads a QR code on the canvas, natively where the browser can. Of several
 * codes on a bill, as e-Sanduče prints next to IPS, the IPS one wins.
 */
export async function scanCanvas(
  canvas: HTMLCanvasElement,
): Promise<string | null> {
  const detector = await nativeDetector();
  if (detector) {
    const codes = await detector
      .detect(canvas)
      .catch((): DetectedBarcode[] => []);
    const code = codes.find((c) => looksLikeIps(c.rawValue)) ?? codes[0];
    if (code) return code.rawValue;
  }
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const { data, width, height } = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const { default: jsQR } = await import('jsqr');
  return jsQR(data, width, height)?.data ?? null;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Draws part of the image on a white canvas with a quiet zone around it,
 * so a code cropped to its modules, as in a PDF, still reads. Images
 * shorter than minSide are scaled up by up to three times without
 * smoothing, staying within maxSide, larger ones down to maxSide.
 */
export function drawPadded(
  source: CanvasImageSource,
  rect: Rect,
  maxSide: number,
  minSide = 400,
): HTMLCanvasElement {
  const longest = Math.max(rect.w, rect.h);
  const scale =
    longest > maxSide
      ? maxSide / longest
      : longest < minSide
        ? Math.max(1, Math.min(3, Math.floor(maxSide / longest)))
        : 1;
  const w = Math.round(rect.w * scale);
  const h = Math.round(rect.h * scale);
  const pad = Math.round(Math.max(w, h) * 0.08) + 8;
  const canvas = document.createElement('canvas');
  canvas.width = w + 2 * pad;
  canvas.height = h + 2 * pad;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D canvas is not available');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = scale < 1;
  ctx.drawImage(source, rect.x, rect.y, rect.w, rect.h, pad, pad, w, h);
  return canvas;
}

/** The whole image, then overlapping halves of it, for when other codes and noise get in the way. */
function regions(width: number, height: number): Rect[] {
  const whole = { x: 0, y: 0, w: width, h: height };
  const w = Math.round(width / 2);
  const h = Math.round(height / 2);
  const parts: Rect[] = [];
  for (const fy of [0, 0.5, 1])
    for (const fx of [0, 0.5, 1])
      parts.push({
        x: Math.round((width - w) * fx),
        y: Math.round((height - h) * fy),
        w,
        h,
      });
  return [whole, ...parts];
}

const MAX_SIDE = 1600;

/** The centred square the camera viewfinder marks, as a fraction of the shorter side. */
export const VIEWFINDER = 0.6;

export function centerSquare(width: number, height: number): Rect {
  const side = Math.round(Math.min(width, height) * VIEWFINDER);
  return {
    x: Math.round((width - side) / 2),
    y: Math.round((height - side) / 2),
    w: side,
    h: side,
  };
}

/**
 * Reads one camera frame, alternating between the whole frame and the
 * viewfinder square scaled up, where a code that fills little of the frame
 * still has modules large enough to decode.
 */
export function scanFrame(
  video: HTMLVideoElement,
  frame: number,
): Promise<string | null> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  const rect =
    frame % 2 === 0
      ? { x: 0, y: 0, w: width, h: height }
      : centerSquare(width, height);
  return scanCanvas(drawPadded(video, rect, MAX_SIDE, 1200));
}

async function scanBitmap(bitmap: ImageBitmap): Promise<string | null> {
  let other: string | null = null;
  for (const rect of regions(bitmap.width, bitmap.height)) {
    const text = await scanCanvas(drawPadded(bitmap, rect, MAX_SIDE));
    if (text === null) continue;
    if (looksLikeIps(text)) return text;
    other ??= text;
  }
  return other;
}

async function scanPdf(file: Blob): Promise<string | null> {
  const { pdfImages } = await import('./pdf-images');
  const images = await pdfImages(new Uint8Array(await file.arrayBuffer()));
  for (const image of images) {
    let bitmap: ImageBitmap;
    try {
      bitmap =
        image.kind === 'jpeg'
          ? await createImageBitmap(
              new Blob([image.bytes as Uint8Array<ArrayBuffer>], {
                type: 'image/jpeg',
              }),
            )
          : await createImageBitmap(
              new ImageData(
                image.data as Uint8ClampedArray<ArrayBuffer>,
                image.width,
                image.height,
              ),
            );
    } catch {
      continue;
    }
    const text = await scanBitmap(bitmap);
    bitmap.close();
    if (text !== null) return text;
  }
  return null;
}

export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

/** Looks for a QR code in a photo, a screenshot or an e-bill PDF. */
export async function scanFile(file: File): Promise<string | null> {
  if (isPdf(file)) return scanPdf(file);
  const bitmap = await createImageBitmap(file);
  try {
    return await scanBitmap(bitmap);
  } finally {
    bitmap.close();
  }
}
