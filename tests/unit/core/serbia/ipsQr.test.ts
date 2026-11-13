import { describe, expect, it } from 'vitest';
import fixtures from '../../../fixtures/ips-qr.json';
import {
  buildIpsQr,
  parseIpsQr,
  validateIpsQr,
  type IpsQrPayment,
} from '../../../../src/core/serbia/ipsQr';

const valid = [...fixtures.valid, ...fixtures.real];

function parsed(qr: string): IpsQrPayment {
  const r = parseIpsQr(qr);
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.value;
}

const base: IpsQrPayment = {
  account: '845000000040484987',
  payeeName: 'JP EPS BEOGRAD',
  amount: 370265,
  paymentCode: '289',
};

describe('validateIpsQr', () => {
  it.each(valid.map((f) => [f.id, f.qr]))('accepts %s', (_, qr) => {
    expect(validateIpsQr(qr)).toEqual([]);
  });

  it.each(fixtures.invalid.map((f) => [f.id, f.qr]))('rejects %s', (_, qr) => {
    expect(validateIpsQr(qr)).not.toEqual([]);
  });

  it('rejects RO together with RL', () => {
    expect(
      validateIpsQr(
        'K:PR|V:01|C:1|R:845000000040484987|N:A|I:RSD1,00|SF:289|RO:001234|RL:ABC',
      ),
    ).toContainEqual({
      tag: null,
      code: 'exclusive',
    });
  });

  it('rejects unknown and repeated tags', () => {
    const issues = validateIpsQr(
      'K:PR|V:01|C:1|R:845000000040484987|N:A|I:RSD1,00|SF:289|S:a|S:b|M:1234',
    );
    expect(issues).toContainEqual({ tag: 'S', code: 'duplicate' });
    expect(issues).toContainEqual({ tag: 'M', code: 'unknown' });
  });

  it('rejects a byte order mark', () => {
    expect(validateIpsQr(`\ufeff${fixtures.valid[0]?.qr ?? ''}`)).not.toEqual(
      [],
    );
  });
});

describe('parseIpsQr', () => {
  it('reads the Infostan bill', () => {
    expect(parsed(fixtures.real[0]?.qr ?? '')).toEqual({
      account: '200220618010100048',
      payeeName: 'JKP INFOSTAN TEHNOLOGIJE BEOGRAD',
      amount: 128760,
      paymentCode: '122',
      purpose: 'OBJEDINJENA NAPLATA',
      model: '11',
      reference: '804071936013-26093-1',
    });
  });

  it('reads multi-line fields of the mts bill', () => {
    const v = parsed(fixtures.real[1]?.qr ?? '');
    expect(v.payeeName).toBe(
      'Telekom Srbija A.D.\nZorana Žunkovića 23\nBeograd',
    );
    expect(v.payer).toBe('PETAR PETROVIĆ\nKNEZA MILOŠA 7\n11000 BEOGRAD');
    expect(v.model).toBe('97');
    expect(v.reference).toBe('503000114937106');
  });

  it('maps model 00 to no model', () => {
    const v = parsed(
      'K:PR|V:01|C:1|R:845000000040484987|N:JP EPS BEOGRAD|I:RSD3702,65|SF:289|RO:001234',
    );
    expect(v.model).toBe('');
    expect(v.reference).toBe('1234');
  });

  it('tolerates tag order, stray separators and whitespace', () => {
    const r = parseIpsQr(fixtures.invalid[0]?.qr ?? '');
    expect(r.ok).toBe(true);
    const x2 = parseIpsQr(fixtures.invalid[1]?.qr ?? '');
    expect(x2.ok && x2.value.amount).toBe(359613);
    expect(x2.ok && x2.warnings).toContainEqual({
      tag: 'RO',
      code: 'checksum',
    });
  });

  it('does not touch the payment code', () => {
    expect(
      parsed('K:PR|V:01|C:1|R:845000000040484987|N:A|I:RSD1,|SF:121')
        .paymentCode,
    ).toBe('121');
  });

  it('fails on unusable codes', () => {
    expect(parseIpsQr('')).toMatchObject({ ok: false });
    expect(
      parseIpsQr('K:PT|V:01|C:1|R:845000000040484987|N:A|I:RSD1,00|SF:289'),
    ).toMatchObject({ ok: false });
    expect(parseIpsQr(fixtures.invalid[2]?.qr ?? '')).toEqual({
      ok: false,
      issues: [{ tag: 'I', code: 'invalid' }],
    });
    expect(
      parseIpsQr('K:PR|V:01|C:1|R:845000000040484988|N:A|I:RSD1,00|SF:289'),
    ).toEqual({
      ok: false,
      issues: [{ tag: 'R', code: 'checksum' }],
    });
    expect(parseIpsQr('K:PR|V:01|C:1|R:845000000040484987|N:A|SF:289')).toEqual(
      {
        ok: false,
        issues: [{ tag: 'I', code: 'missing' }],
      },
    );
  });
});

describe('buildIpsQr', () => {
  it.each(valid.filter((f) => f.id !== 'P-LF').map((f) => [f.id, f.qr]))(
    'reproduces %s',
    (_, qr) => {
      expect(buildIpsQr(parsed(qr))).toMatchObject({ ok: true, text: qr });
    },
  );

  it('writes line breaks as CRLF in the canonical tag order', () => {
    const lf = fixtures.valid.find((f) => f.id === 'P-LF')?.qr ?? '';
    expect(buildIpsQr(parsed(lf))).toMatchObject({
      ok: true,
      text: 'K:PR|V:01|C:1|R:845000000040484987|N:JP EPS BEOGRAD|I:RSD3702,65|P:PERA PERIC\r\nULICA 1\r\nBEOGRAD|SF:289',
    });
  });

  it('normalizes what a person types from a paper bill', () => {
    const r = buildIpsQr({
      account: '160-602-16',
      payeeName: '  Телеком   Србија а.д.\n\nЗорана Жунковића 23 ',
      amount: 324900,
      payer: 'Петар Петровић',
      paymentCode: '189',
      purpose: 'Рачун 09/2026',
      model: '97',
      reference: '50-300-011-4937106',
    });
    expect(r).toEqual({
      ok: true,
      text:
        'K:PR|V:01|C:1|R:160000000000060216|N:Telekom Srbija a.d.\r\nZorana Žunkovića 23|I:RSD3249,00' +
        '|P:Petar Petrović|SF:189|S:Račun 09/2026|RO:97503000114937106',
      bytes: 155,
      ecc: 'M',
    });
  });

  it('writes RO:00 for a reference without a model', () => {
    expect(buildIpsQr({ ...base, model: '', reference: '1234' })).toMatchObject(
      { text: expect.stringMatching(/\|RO:001234$/) as unknown },
    );
  });

  it('allows a zero amount', () => {
    expect(buildIpsQr({ ...base, amount: 0 })).toMatchObject({
      text: expect.stringContaining('|I:RSD0,00|') as unknown,
    });
  });

  it.each<[string, Partial<IpsQrPayment>, unknown]>([
    [
      'account checksum',
      { account: '160-602-17' },
      { tag: 'R', code: 'checksum' },
    ],
    ['account format', { account: '160602' }, { tag: 'R', code: 'invalid' }],
    ['empty name', { payeeName: ' \n ' }, { tag: 'N', code: 'missing' }],
    ['four lines', { payeeName: 'A\nB\nC\nD' }, { tag: 'N', code: 'lines' }],
    ['long name', { payeeName: 'A'.repeat(71) }, { tag: 'N', code: 'length' }],
    ['long purpose', { purpose: 'A'.repeat(36) }, { tag: 'S', code: 'length' }],
    [
      'pipe',
      { purpose: 'A|B' },
      { tag: null, code: 'format', message: 'field without ":": B' },
    ],
    ['euro sign', { purpose: '10 €' }, { tag: 'S', code: 'chars' }],
    ['payment code', { paymentCode: '389' }, { tag: 'SF', code: 'invalid' }],
    ['negative amount', { amount: -1 }, { tag: 'I', code: 'invalid' }],
    ['fractional amount', { amount: 1.5 }, { tag: 'I', code: 'invalid' }],
    [
      'model 97 control',
      { model: '97', reference: '15123412' },
      { tag: 'RO', code: 'checksum' },
    ],
    [
      'long reference',
      { model: '00', reference: '1'.repeat(24) },
      { tag: 'RO', code: 'length' },
    ],
    ['model', { model: '9', reference: '123' }, { tag: 'RO', code: 'invalid' }],
  ])('rejects %s', (_, patch, issue) => {
    const r = buildIpsQr({ ...base, ...patch });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.issues).toContainEqual(issue);
  });

  it('switches to ECC L above 331 bytes', () => {
    const r = buildIpsQr({
      ...base,
      payeeName: 'Č'.repeat(70),
      purpose: 'Š'.repeat(35),
      payer: 'A'.repeat(70),
    });
    expect(r).toMatchObject({ ok: true, ecc: 'L' });
    expect(r.ok && r.bytes).toBeGreaterThan(331);
  });

  it('refuses codes that do not fit version 13', () => {
    const r = buildIpsQr({
      ...base,
      payeeName: 'Č'.repeat(70),
      purpose: 'Š'.repeat(35),
      payer: 'Ž'.repeat(70),
      model: '00',
      reference: '1'.repeat(23),
    });
    expect(r).toEqual({
      ok: false,
      issues: [{ tag: null, code: 'too-large' }],
    });
  });
});
