import { describe, expect, it } from 'vitest';
import {
  checkJmbg,
  checkPib,
  jmbgControl,
  pibControl,
} from '../../../../src/core/serbia/ids';

describe('JMBG', () => {
  it('computes the control digit', () => {
    expect(jmbgControl('010199071000')).toBe('8');
    expect(checkJmbg('0101990710008')).toBe('ok');
  });

  it('maps 10 and 11 to 0', () => {
    expect(jmbgControl('010199071004')).toBe('0');
    expect(checkJmbg('0101990710040')).toBe('ok');
  });

  it('tells a bad format from a bad checksum', () => {
    expect(checkJmbg('010199071000')).toBe('format');
    expect(checkJmbg('010199071000a')).toBe('format');
    expect(checkJmbg('0101990710009')).toBe('checksum');
  });
});

describe('PIB', () => {
  it.each(['103920327', '101134702', '100002532'])('accepts %s', (pib) => {
    expect(pibControl(pib.slice(0, 8))).toBe(pib.slice(8));
    expect(checkPib(pib)).toBe('ok');
  });

  it('tells a bad format from a bad checksum', () => {
    expect(checkPib('10392032')).toBe('format');
    expect(checkPib('103920328')).toBe('checksum');
  });
});
