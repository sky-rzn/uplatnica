import { describe, expect, it } from 'vitest';
import {
  PAYMENT_BASES,
  isValidPaymentCode,
  isValidQrPaymentCode,
  paymentBasis,
} from '../../../../src/core/serbia/paymentCodes';

describe('payment codes', () => {
  it('has the 52 bases of Prilog 3', () => {
    expect(PAYMENT_BASES).toHaveLength(52);
  });

  it('looks up the basis of a code', () => {
    expect(paymentBasis('253')?.code).toBe('53');
    expect(paymentBasis('21')?.code).toBe('21');
    expect(paymentBasis('243')).toBeUndefined();
  });

  it.each([
    '120',
    '121',
    '129',
    '131',
    '153',
    '165',
    '189',
    '190',
    '229',
    '254',
    '288',
    '289',
    '290',
  ])('accepts %s in QR', (code) => {
    expect(isValidQrPaymentCode(code)).toBe(true);
  });

  it.each([
    '89',
    '101',
    '143',
    '150',
    '191',
    '199',
    '200',
    '243',
    '389',
    '999',
  ])('rejects %s in QR', (code) => {
    expect(isValidQrPaymentCode(code)).toBe(false);
  });

  it('allows forms 3 and 9 outside QR', () => {
    expect(isValidPaymentCode('389')).toBe(true);
    expect(isValidPaymentCode('953')).toBe(true);
    expect(isValidPaymentCode('453')).toBe(false);
  });
});
