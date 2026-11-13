/** Amounts are integer para: 1 RSD = 100 para. */
export type Para = number;

export const MAX_PARA: Para = 99_999_999_999_999;

function splitDecimal(s: string): { int: string; frac: string } | null {
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma === -1 && lastDot === -1) return { int: s, frac: '' };

  let decimalSep: ',' | '.' | null;
  if (lastComma !== -1 && lastDot !== -1) {
    decimalSep = lastComma > lastDot ? ',' : '.';
  } else {
    const sep = lastComma !== -1 ? ',' : '.';
    const occurrences = s.split(sep).length - 1;
    const tail = s.slice(s.lastIndexOf(sep) + 1);
    // "1.287" and "1,287" read as thousands; "1287,6" and "2716.35" as decimals.
    decimalSep = occurrences === 1 && tail.length !== 3 ? sep : null;
  }

  if (decimalSep === null) {
    const groups = s.split(/[.,]/);
    if (!groups.slice(1).every((g) => g.length === 3)) return null;
    return { int: groups.join(''), frac: '' };
  }

  const at = s.lastIndexOf(decimalSep);
  const intPart = s.slice(0, at);
  const frac = s.slice(at + 1);
  const thousandsSep = decimalSep === ',' ? '.' : ',';
  if (intPart.includes(decimalSep)) return null;
  const groups = intPart.split(thousandsSep);
  if (groups.length > 1 && !groups.slice(1).every((g) => g.length === 3))
    return null;
  return { int: groups.join(''), frac };
}

/**
 * Parses an amount as people and bills write it: "1.287,60", "2716.35",
 * "=3.249,00", "**1234,5", "1 287,60". Returns null on anything ambiguous.
 */
export function parseAmount(input: string): Para | null {
  const s = input
    .replace(/[\s']/g, '')
    .replace(/^(=|\*\*)/, '')
    .replace(/(RSD|din\.?|дин\.?)$/i, '');
  if (!/^\d[\d.,]*$/.test(s) || /[.,]{2}/.test(s)) return null;
  const parts = splitDecimal(s);
  if (!parts || parts.int === '' || !/^\d+$/.test(parts.int)) return null;
  if (!/^\d{0,2}$/.test(parts.frac)) return null;
  const para = Number(parts.int) * 100 + Number(parts.frac.padEnd(2, '0'));
  if (!Number.isSafeInteger(para) || para > MAX_PARA) return null;
  return para;
}

function assertPara(para: Para): void {
  if (!Number.isSafeInteger(para) || para < 0)
    throw new RangeError(`Invalid amount: ${String(para)}`);
}

/** "1.287,60" */
export function formatAmount(para: Para): string {
  assertPara(para);
  const int = Math.floor(para / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${int},${String(para % 100).padStart(2, '0')}`;
}

/** "1287,60", the plain form used by IPS QR. */
export function formatAmountPlain(para: Para): string {
  assertPara(para);
  return `${String(Math.floor(para / 100))},${String(para % 100).padStart(2, '0')}`;
}
