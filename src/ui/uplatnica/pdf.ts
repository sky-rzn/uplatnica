import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import regularUrl from '../../assets/fonts/NotoSans-Regular.ttf?inline';
import boldUrl from '../../assets/fonts/NotoSans-Bold.ttf?inline';
import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  SLIP_HEIGHT,
  SLIPS_PER_PAGE,
  STROKE,
  type Shape,
} from '../../core/uplatnica/layout';

const PT = 72 / 25.4;
const BLACK = rgb(0, 0, 0);

function dataUrlBytes(url: string): Uint8Array {
  const b64 = url.slice(url.indexOf(',') + 1);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function draw(
  page: PDFPage,
  shapes: readonly Shape[],
  top: number,
  fonts: { regular: PDFFont; bold: PDFFont },
): void {
  const x = (mm: number) => mm * PT;
  const y = (mm: number) => (PAGE_HEIGHT - top - mm) * PT;
  for (const s of shapes) {
    switch (s.kind) {
      case 'rect':
        page.drawRectangle({
          x: x(s.x),
          y: y(s.y + s.h),
          width: s.w * PT,
          height: s.h * PT,
          borderColor: BLACK,
          borderWidth: STROKE * PT,
          ...(s.dashed ? { borderDashArray: [1.5 * PT, 1.5 * PT] } : {}),
        });
        break;
      case 'line':
        page.drawLine({
          start: { x: x(s.x1), y: y(s.y1) },
          end: { x: x(s.x2), y: y(s.y2) },
          thickness: STROKE * PT,
          color: BLACK,
        });
        break;
      case 'text': {
        const font = s.bold ? fonts.bold : fonts.regular;
        const size = s.size * PT;
        const width = font.widthOfTextAtSize(s.text, size);
        const shift =
          s.anchor === 'middle' ? width / 2 : s.anchor === 'end' ? width : 0;
        page.drawText(s.text, {
          x: x(s.x) - shift,
          y: y(s.y),
          size,
          font,
          color: BLACK,
        });
        break;
      }
      case 'path':
        page.drawSvgPath(s.d, { x: 0, y: y(0), scale: PT, color: BLACK });
        break;
    }
  }
}

/** A4 pages with up to three slips each, stacked edge to edge. */
export async function slipsPdf(
  slips: readonly (readonly Shape[])[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle('Uplatnice');
  doc.setCreator('Uplatnica');
  doc.setProducer('Uplatnica');
  const fonts = {
    regular: await doc.embedFont(dataUrlBytes(regularUrl), { subset: true }),
    bold: await doc.embedFont(dataUrlBytes(boldUrl), { subset: true }),
  };
  let page: PDFPage | undefined;
  slips.forEach((shapes, i) => {
    const slot = i % SLIPS_PER_PAGE;
    if (slot === 0 || !page)
      page = doc.addPage([PAGE_WIDTH * PT, PAGE_HEIGHT * PT]);
    draw(page, shapes, slot * SLIP_HEIGHT, fonts);
  });
  return doc.save();
}
