import { qrMatrix, qrPath } from './qr';
import type { SlipData } from './slip';

/** Odluka, point 7: 99 x 210 mm, a third of A4. All units are millimetres. */
export const SLIP_WIDTH = 210;
export const SLIP_HEIGHT = 99;
export const SLIPS_PER_PAGE = 3;
export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;

/** Printed side of the QR symbol without the quiet zone; NBS asks for 25-33 mm. */
export const QR_SIZE = 25;

export const STROKE = 0.25;
const LABEL = 2.3;
const VALUE = 3;
const LINE_STEP = 3.4;

export type Shape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; dashed?: true }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | {
      kind: 'text';
      x: number;
      y: number;
      size: number;
      text: string;
      anchor: 'start' | 'middle' | 'end';
      bold?: true;
    }
  | { kind: 'path'; d: string };

type TextShape = Extract<Shape, { kind: 'text' }>;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The layout follows Obrazac br. 1 of Prilog 1, measured from the raster
 * image there (about 3 mm off), with the QR code in the free lower right.
 */
const BOX = {
  payer: { x: 5, y: 9, w: 95, h: 12 },
  purpose: { x: 5, y: 30, w: 95, h: 12 },
  payee: { x: 5, y: 50, w: 95, h: 13 },
  code: { x: 110, y: 18, w: 11, h: 7 },
  currency: { x: 125, y: 18, w: 13, h: 7 },
  amount: { x: 142, y: 18, w: 62, h: 7 },
  account: { x: 112, y: 33, w: 92, h: 7 },
  model: { x: 112, y: 47, w: 11, h: 7 },
  reference: { x: 127, y: 47, w: 77, h: 7 },
  urgent: { x: 158, y: 66, w: 5, h: 5 },
  qr: { x: 178, y: 57, w: QR_SIZE, h: QR_SIZE },
} satisfies Record<string, Box>;

function text(
  x: number,
  y: number,
  value: string,
  size: number,
  anchor: TextShape['anchor'] = 'start',
): TextShape {
  return { kind: 'text', x, y, size, text: value, anchor };
}

function frame(b: Box): Shape {
  return { kind: 'rect', ...b };
}

function labelAbove(b: Box, value: string): Shape {
  return text(b.x, b.y - 1.2, value, LABEL);
}

function lines(b: Box, values: readonly string[]): Shape[] {
  return values.map((v, i) =>
    text(b.x + 1.5, b.y + (i + 1) * LINE_STEP, v, VALUE),
  );
}

/** One value on a single-line box, vertically centred. */
function single(b: Box, value: string, centred = false): Shape[] {
  if (value === '') return [];
  const y = b.y + b.h / 2 + VALUE * 0.36;
  return [
    centred
      ? text(b.x + b.w / 2, y, value, VALUE, 'middle')
      : text(b.x + 1.5, y, value, VALUE),
  ];
}

function underline(x1: number, x2: number, y: number, label: string): Shape[] {
  return [
    { kind: 'line', x1, y1: y, x2, y2: y },
    text((x1 + x2) / 2, y + 2.8, label, LABEL, 'middle'),
  ];
}

/** Shapes of one filled slip with its top left corner at (0, 0). */
export function slipShapes(
  data: SlipData,
  qr?: { text: string; ecc: 'M' | 'L' },
): Shape[] {
  const shapes: Shape[] = [
    {
      kind: 'rect',
      x: 0.5,
      y: 0.5,
      w: SLIP_WIDTH - 1,
      h: SLIP_HEIGHT - 1,
      dashed: true,
    },
    { ...text(204, 6.5, 'NALOG ZA UPLATU', 4, 'end'), bold: true },

    labelAbove(BOX.payer, 'platilac'),
    frame(BOX.payer),
    ...lines(BOX.payer, data.payer),
    labelAbove(BOX.purpose, 'svrha uplate'),
    frame(BOX.purpose),
    ...lines(BOX.purpose, data.purpose),
    labelAbove(BOX.payee, 'primalac'),
    frame(BOX.payee),
    ...lines(BOX.payee, data.payee),
    ...underline(6, 74, 71, 'potpis platioca'),
    ...underline(38, 100, 82, 'mesto i datum prijema'),

    { kind: 'line', x1: 105, y1: 11, x2: 105, y2: 84 },

    text(BOX.code.x, BOX.code.y - 4, 'šifra', LABEL),
    labelAbove(BOX.code, 'plaćanja'),
    frame(BOX.code),
    ...single(BOX.code, data.paymentCode, true),
    labelAbove(BOX.currency, 'valuta'),
    frame(BOX.currency),
    ...single(BOX.currency, data.currency, true),
    labelAbove(BOX.amount, 'iznos'),
    frame(BOX.amount),
    ...single(BOX.amount, data.amount),
    labelAbove(BOX.account, 'račun primaoca'),
    frame(BOX.account),
    ...single(BOX.account, data.account),
    labelAbove(BOX.model, 'model i poziv na broj (odobrenje)'),
    frame(BOX.model),
    ...single(BOX.model, data.model, true),
    frame(BOX.reference),
    ...single(BOX.reference, data.reference),

    frame(BOX.urgent),
    text(
      BOX.urgent.x + BOX.urgent.w / 2,
      BOX.urgent.y + BOX.urgent.h + 2.8,
      'hitno',
      LABEL,
      'middle',
    ),
    ...underline(113, 151, 82, 'datum izvršenja'),

    text(SLIP_WIDTH / 2, 96, 'Obrazac br. 1', LABEL, 'middle'),
  ];

  if (qr) {
    const m = qrMatrix(qr.text, qr.ecc);
    shapes.push({
      kind: 'path',
      d: qrPath(m, BOX.qr.x, BOX.qr.y, BOX.qr.w / m.size),
    });
  }
  return shapes;
}
