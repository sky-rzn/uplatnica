import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  formatAmountPlain,
  parseAmount,
} from '../../../src/core/money';

describe('parseAmount', () => {
  it.each([
    ['1287,60', 128760],
    ['1.287,60', 128760],
    ['=3.249,00', 324900],
    ['=2716.35', 271635],
    ['**1234,5', 123450],
    ['1 287,60', 128760],
    ['1287', 128700],
    ['1025,', 102500],
    ['0,01', 1],
    ['1.287', 128700],
    ['12.345.678', 1234567800],
    ['1,234.56', 123456],
    ['999999999999,99', 99999999999999],
    ['3.249,00 RSD', 324900],
    ['12,345', 1234500],
  ])('%s', (input, para) => {
    expect(parseAmount(input)).toBe(para);
  });

  it.each([
    '',
    'abc',
    '1,2,3',
    '1.2.3',
    '1,234,5',
    '1..2',
    ',01',
    '-5',
    '1000000000000,00',
  ])('rejects %j', (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});

describe('formatAmount', () => {
  it('groups thousands with dots', () => {
    expect(formatAmount(128760)).toBe('1.287,60');
    expect(formatAmount(1)).toBe('0,01');
    expect(formatAmount(123456789)).toBe('1.234.567,89');
  });

  it('formats the plain QR form', () => {
    expect(formatAmountPlain(128760)).toBe('1287,60');
    expect(formatAmountPlain(0)).toBe('0,00');
  });

  it('rejects fractional para', () => {
    expect(() => formatAmount(1.5)).toThrow(RangeError);
  });
});
