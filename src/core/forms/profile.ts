import type { Profile } from '../model';
import { checkJmbg, checkPib } from '../serbia/ids';
import { checkQrText } from '../serbia/ipsQr';
import type { FormResult, Issues } from './issues';

export interface ProfileDraft {
  name: string;
  address: string;
  jmbg: string;
  pib: string;
}

export function profileToDraft(p?: Profile): ProfileDraft {
  return {
    name: p?.name ?? '',
    address: p?.address ?? '',
    jmbg: p?.jmbg ?? '',
    pib: p?.pib ?? '',
  };
}

export function validateProfile(
  id: string,
  d: ProfileDraft,
): FormResult<Profile> {
  const errors: Issues = {};
  const warnings: Issues = {};
  const name = d.name.trim();
  const address = d.address.trim();
  const jmbg = d.jmbg.replace(/\s+/g, '');
  const pib = d.pib.replace(/\s+/g, '');

  if (name === '') errors.name = { code: 'required' };

  if (jmbg !== '') {
    const check = checkJmbg(jmbg);
    if (check === 'format') errors.jmbg = { code: 'jmbg-format' };
    if (check === 'checksum') warnings.jmbg = { code: 'jmbg-checksum' };
  }
  if (pib !== '') {
    const check = checkPib(pib);
    if (check === 'format') errors.pib = { code: 'pib-format' };
    if (check === 'checksum') warnings.pib = { code: 'pib-checksum' };
  }

  if (checkQrText('P', `${name}\n${address}`).length > 0)
    warnings.address = { code: 'payer-too-long' };

  if (Object.keys(errors).length > 0) return { value: null, errors, warnings };
  const value: Profile = { id, name, address };
  if (jmbg !== '') value.jmbg = jmbg;
  if (pib !== '') value.pib = pib;
  return { value, errors, warnings };
}
