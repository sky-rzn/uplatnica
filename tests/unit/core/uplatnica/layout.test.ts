import { describe, expect, it } from 'vitest';
import {
  SLIP_HEIGHT,
  SLIP_WIDTH,
  slipShapes,
  type Shape,
} from '../../../../src/core/uplatnica/layout';
import type { SlipData } from '../../../../src/core/uplatnica/slip';

const data: SlipData = {
  payer: ['Petar Petrović', 'Knez Mihailova 1', 'Beograd'],
  purpose: ['Struja'],
  payee: ['JP EPS BEOGRAD'],
  paymentCode: '289',
  currency: 'RSD',
  amount: '=3.702,65',
  account: '845-0000000404849-87',
  model: '97',
  reference: '163220000111111111000',
};

function texts(shapes: Shape[]): string[] {
  return shapes.flatMap((s) => (s.kind === 'text' ? [s.text] : []));
}

describe('slipShapes', () => {
  it('writes every value and keeps everything on the slip', () => {
    const shapes = slipShapes(data, {
      text: 'K:PR|V:01|C:1|R:845000000040484987|N:JP EPS BEOGRAD|I:RSD3702,65|SF:289',
      ecc: 'M',
    });
    expect(texts(shapes)).toEqual(
      expect.arrayContaining([
        'NALOG ZA UPLATU',
        ...data.payer,
        'Struja',
        'JP EPS BEOGRAD',
        '289',
        'RSD',
        '=3.702,65',
        '845-0000000404849-87',
        '97',
        '163220000111111111000',
      ]),
    );
    for (const s of shapes) {
      if (s.kind === 'path') continue;
      const [x1, y1, x2, y2] =
        s.kind === 'rect'
          ? [s.x, s.y, s.x + s.w, s.y + s.h]
          : s.kind === 'line'
            ? [s.x1, s.y1, s.x2, s.y2]
            : [s.x, s.y, s.x, s.y];
      expect(Math.min(x1, x2)).toBeGreaterThanOrEqual(0);
      expect(Math.min(y1, y2)).toBeGreaterThanOrEqual(0);
      expect(Math.max(x1, x2)).toBeLessThanOrEqual(SLIP_WIDTH);
      expect(Math.max(y1, y2)).toBeLessThanOrEqual(SLIP_HEIGHT);
    }
    expect(shapes.filter((s) => s.kind === 'path')).toHaveLength(1);
  });

  it('leaves empty fields and the code area blank', () => {
    const shapes = slipShapes({
      ...data,
      amount: '',
      model: '',
      reference: '',
    });
    expect(texts(shapes)).not.toContain('');
    expect(shapes.some((s) => s.kind === 'path')).toBe(false);
  });
});
