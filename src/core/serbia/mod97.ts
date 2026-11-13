/** Remainder of a long decimal string modulo 97, without BigInt. */
export function mod97(digits: string): number {
  let r = 0;
  for (const ch of digits) r = (r * 10 + Number(ch)) % 97;
  return r;
}

export function mod97Control(digits: string): string {
  return String(98 - mod97(digits + '00')).padStart(2, '0');
}
