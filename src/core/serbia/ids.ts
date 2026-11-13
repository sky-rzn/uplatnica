export type IdCheck = 'ok' | 'format' | 'checksum';

const JMBG_WEIGHTS = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function jmbgControl(first12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++)
    sum += Number(first12[i]) * (JMBG_WEIGHTS[i] ?? 0);
  const k = 11 - (sum % 11);
  return k > 9 ? '0' : String(k);
}

/** Some JMBGs in circulation fail the control digit, so callers should only warn on 'checksum'. */
export function checkJmbg(s: string): IdCheck {
  if (!/^\d{13}$/.test(s)) return 'format';
  return jmbgControl(s.slice(0, 12)) === s.slice(12) ? 'ok' : 'checksum';
}

/** ISO 7064 MOD 11,10. */
export function pibControl(first8: string): string {
  let p = 10;
  for (const ch of first8) {
    const s = (p + Number(ch)) % 10 || 10;
    p = (2 * s) % 11;
  }
  return String((11 - p) % 10);
}

export function checkPib(s: string): IdCheck {
  if (!/^\d{9}$/.test(s)) return 'format';
  return pibControl(s.slice(0, 8)) === s.slice(8) ? 'ok' : 'checksum';
}
