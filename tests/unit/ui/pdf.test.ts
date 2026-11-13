import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { slipShapes } from '../../../src/core/uplatnica/layout';
import { buildSlip } from '../../../src/core/uplatnica/slip';
import { slipsPdf } from '../../../src/ui/uplatnica/pdf';
import { bill } from '../core/fixtures';

describe('slipsPdf', () => {
  it('puts three slips on an A4 page', async () => {
    const slip = buildSlip({
      bill: bill(
        { kind: 'dates', dates: ['2026-11-20'] },
        { purpose: 'Porez na imovinu, Čačak đ' },
      ),
      profile: { id: 'p1', name: 'Мрђо Мачкатовић', address: 'Жупска 13' },
      amount: 370265,
      reference: undefined,
    });
    if (!slip.qr?.ok) throw new Error('no QR');
    const shapes = slipShapes(slip.data, slip.qr);
    const bytes = await slipsPdf([shapes, shapes, shapes, shapes]);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(2);
    const { width, height } = doc.getPage(0).getSize();
    expect([width, height].map((v) => Math.round((v * 25.4) / 72))).toEqual([
      210, 297,
    ]);
  });
});
