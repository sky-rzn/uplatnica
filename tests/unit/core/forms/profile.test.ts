import { describe, expect, it } from 'vitest';
import {
  profileToDraft,
  validateProfile,
  type ProfileDraft,
} from '../../../../src/core/forms/profile';
import { validateSection } from '../../../../src/core/forms/section';

const base: ProfileDraft = {
  name: ' Petar Petrović ',
  address: 'Beograd',
  jmbg: '',
  pib: '',
};

describe('validateProfile', () => {
  it('trims and drops empty identifiers', () => {
    expect(validateProfile('p1', base).value).toEqual({
      id: 'p1',
      name: 'Petar Petrović',
      address: 'Beograd',
    });
  });

  it('rejects malformed identifiers and warns on a bad control digit', () => {
    const r = validateProfile('p1', { ...base, jmbg: '123', pib: '10392032' });
    expect(r.errors).toEqual({
      jmbg: { code: 'jmbg-format' },
      pib: { code: 'pib-format' },
    });
    const w = validateProfile('p1', {
      ...base,
      jmbg: '0101990710009',
      pib: '103 920 328',
    });
    expect(w.value).toMatchObject({ jmbg: '0101990710009', pib: '103920328' });
    expect(w.warnings).toEqual({
      jmbg: { code: 'jmbg-checksum' },
      pib: { code: 'pib-checksum' },
    });
  });

  it('requires a name and warns when the payer will not fit IPS QR', () => {
    expect(validateProfile('p1', { ...base, name: '' }).errors).toEqual({
      name: { code: 'required' },
    });
    expect(
      validateProfile('p1', { ...base, address: 'x'.repeat(60) }).warnings,
    ).toEqual({ address: { code: 'payer-too-long' } });
  });

  it('round-trips through the draft', () => {
    const p = validateProfile('p1', { ...base, jmbg: '0101990710008' }).value;
    if (!p) throw new Error('invalid');
    expect(validateProfile('p1', profileToDraft(p)).value).toEqual(p);
  });
});

describe('validateSection', () => {
  it('normalizes the color and requires a name', () => {
    expect(
      validateSection('s1', 2, {
        name: 'Stan',
        color: '#AABBCC',
        archived: false,
      }).value,
    ).toEqual({
      id: 's1',
      name: 'Stan',
      color: '#aabbcc',
      order: 2,
      archived: false,
    });
    expect(
      validateSection('s1', 0, { name: ' ', color: 'red', archived: false })
        .errors,
    ).toEqual({ name: { code: 'required' }, color: { code: 'color' } });
  });
});
