import { describe, expect, it } from 'vitest';
import {
  accountControl,
  formatAccount,
  formatAccountShort,
  isValidAccount,
  normalizeAccount,
} from '../../../../src/core/serbia/account';

describe('normalizeAccount', () => {
  it.each([
    ['840-955845-10', '840000000095584510'],
    ['165-55-74', '165000000000005574'],
    ['310-1234567891211-86', '310123456789121186'],
    ['160-602-16', '160000000000060216'],
    ['200-2206180101000-48', '200220618010100048'],
    ['840-713121843-57', '840000071312184357'],
    ['845000000040484987', '845000000040484987'],
    [' 160 - 602 - 16 ', '160000000000060216'],
  ])('%s', (input, digits) => {
    expect(normalizeAccount(input)).toEqual({ ok: true, value: digits });
  });

  it.each([
    '',
    '16-602-16',
    '160-602-6',
    '160-602',
    '845-0000000404849-87-1',
    '84500000004048498',
    '160-60a-16',
  ])('rejects the format of %j', (input) => {
    expect(normalizeAccount(input)).toEqual({ ok: false, error: 'format' });
  });

  it('rejects a wrong control number', () => {
    expect(normalizeAccount('845000000040484988')).toEqual({
      ok: false,
      error: 'checksum',
    });
    expect(normalizeAccount('160-602-17')).toEqual({
      ok: false,
      error: 'checksum',
    });
  });
});

describe('account helpers', () => {
  it('computes the control number', () => {
    expect(accountControl('8400000000955845')).toBe('10');
    expect(accountControl('1650000000000055')).toBe('74');
  });

  it('validates 18 digits only', () => {
    expect(isValidAccount('160000000000060216')).toBe(true);
    expect(isValidAccount('160-602-16')).toBe(false);
  });

  it('formats long and short forms', () => {
    expect(formatAccount('160000000000060216')).toBe('160-0000000000602-16');
    expect(formatAccountShort('160000000000060216')).toBe('160-602-16');
    expect(formatAccountShort('160000000000000076')).toBe('160-0-76');
  });
});
