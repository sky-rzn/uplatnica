import { describe, expect, it } from 'vitest';
import {
  buildReference,
  cleanReference,
  computeModel11,
  computeModel97,
  isValidModel11,
  isValidModel97,
  mod11Control,
  renderTemplate,
  validateReference,
} from '../../../../src/core/serbia/reference';

describe('model 97', () => {
  it.each([
    ['567812F48K012', '54567812F48K012'],
    ['123412', '14123412'],
    ['2015-123456', '152015123456'],
    ['0001234', '820001234'],
    ['3220000111111111000', '163220000111111111000'],
    ['020093177252605', '93020093177252605'],
  ])('%s', (body, ref) => {
    expect(computeModel97(body)).toBe(ref);
    expect(isValidModel97(ref)).toBe(true);
  });

  it('accepts lower case and blocks on input', () => {
    expect(computeModel97('567812f48k012')).toBe('54567812F48K012');
    expect(cleanReference('97', '50-300-011-4937106')).toBe('503000114937106');
  });

  it('rejects bodies it cannot encode', () => {
    expect(computeModel97('')).toBeNull();
    expect(computeModel97('1'.repeat(22))).toBeNull();
    expect(computeModel97('ČĆ12')).toBeNull();
  });

  it('detects a wrong control number', () => {
    expect(isValidModel97('15123412')).toBe(false);
    expect(isValidModel97('63220000111111111000')).toBe(false);
    expect(isValidModel97('14')).toBe(false);
  });
});

describe('model 11', () => {
  it('uses growing weights without a cycle', () => {
    expect(mod11Control('12345')).toBe('5');
    expect(mod11Control('2016')).toBe('8');
    expect(mod11Control('1234567')).toBe('9');
    expect(mod11Control('80407193601')).toBe('3');
    expect(mod11Control('2609')).toBe('3');
  });

  it('builds and validates the Infostan reference', () => {
    expect(computeModel11(['80407193601', '2609', '1'])).toBe(
      '804071936013-26093-1',
    );
    expect(isValidModel11('804071936013-26093-1')).toBe(true);
    expect(isValidModel11('804071936017-26093-1')).toBe(false);
    expect(isValidModel11('123455-20168-777')).toBe(true);
    expect(isValidModel11('123455')).toBe(true);
    expect(isValidModel11('1-20168')).toBe(false);
  });

  it('keeps dashes on input', () => {
    expect(cleanReference('11', ' 804071936013-26093-1 ')).toBe(
      '804071936013-26093-1',
    );
  });
});

describe('validateReference', () => {
  it('reports what is wrong', () => {
    expect(validateReference('97', '14123412')).toBeNull();
    expect(validateReference('97', '15123412')).toBe('checksum');
    expect(validateReference('97', '14-123412')).toBe('chars');
    expect(validateReference('97', '')).toBe('empty');
    expect(validateReference('97', '1'.repeat(24))).toBe('length');
    expect(validateReference('11', '804071936013-26093-1')).toBeNull();
    expect(validateReference('11', '804071936013-26093-1-1')).toBe('structure');
    expect(validateReference('11', '804071936012-26093-1')).toBe('checksum');
    expect(validateReference('', '009714-1342')).toBeNull();
    expect(validateReference('', '00123/24')).toBe('chars');
  });
});

describe('renderTemplate', () => {
  const ctx = {
    vars: { NAPLATNI: '2009317725', OPSTINA: '016', JMBG: undefined },
    periodStart: '2026-05-01',
  };

  it('substitutes period fields and pads custom values', () => {
    expect(renderTemplate('{NAPLATNI:11}{YY}{MM}', ctx)).toEqual({
      ok: true,
      value: '020093177252605',
    });
    expect(renderTemplate('{OPSTINA}-{YYYY}-Q{Q}', ctx)).toEqual({
      ok: true,
      value: '016-2026-Q2',
    });
  });

  it('reports missing and oversized values', () => {
    expect(renderTemplate('{JMBG}', ctx)).toEqual({
      ok: false,
      error: { kind: 'missing', name: 'JMBG' },
    });
    expect(renderTemplate('{NAPLATNI:5}', ctx)).toEqual({
      ok: false,
      error: { kind: 'too-long', name: 'NAPLATNI', width: 5 },
    });
  });

  it('reports broken braces', () => {
    expect(renderTemplate('{YY', ctx)).toEqual({
      ok: false,
      error: { kind: 'syntax' },
    });
    expect(renderTemplate('{yy}', ctx)).toEqual({
      ok: false,
      error: { kind: 'syntax' },
    });
  });
});

describe('buildReference', () => {
  it('predicts the EPS reference for a period', () => {
    const ctx = { vars: { NAPLATNI: '2009317725' }, periodStart: '2026-05-01' };
    expect(buildReference('97', '{NAPLATNI:11}{YY}{MM}', ctx)).toEqual({
      ok: true,
      value: '93020093177252605',
    });
  });

  it('passes other models through validation', () => {
    const ctx = { vars: {}, periodStart: '2026-09-01' };
    expect(buildReference('11', '804071936013-26093-1', ctx)).toEqual({
      ok: true,
      value: '804071936013-26093-1',
    });
    expect(buildReference('11', '804071936013-26094-1', ctx)).toEqual({
      ok: false,
      error: { kind: 'invalid', reason: 'checksum' },
    });
    expect(buildReference('', 'ABC-{YYYY}', ctx)).toEqual({
      ok: true,
      value: 'ABC-2026',
    });
  });

  it('rejects a model 97 body that is too long', () => {
    const ctx = { vars: {}, periodStart: '2026-09-01' };
    expect(buildReference('97', '1'.repeat(22), ctx)).toEqual({
      ok: false,
      error: { kind: 'invalid', reason: 'length' },
    });
    expect(buildReference('97', '', ctx)).toEqual({
      ok: false,
      error: { kind: 'invalid', reason: 'empty' },
    });
  });
});
