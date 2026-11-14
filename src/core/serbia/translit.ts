// prettier-ignore
const UPPER: Record<string, string> = {
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Ђ: 'Đ', Е: 'E', Ж: 'Ž', З: 'Z', И: 'I',
  Ј: 'J', К: 'K', Л: 'L', Љ: 'Lj', М: 'M', Н: 'N', Њ: 'Nj', О: 'O', П: 'P', Р: 'R',
  С: 'S', Т: 'T', Ћ: 'Ć', У: 'U', Ф: 'F', Х: 'H', Ц: 'C', Ч: 'Č', Џ: 'Dž', Ш: 'Š',
  // Not Serbian, but users type them and IPS QR rejects any Cyrillic.
  Ё: 'Jo', Й: 'J', Щ: 'Šč', Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Ju', Я: 'Ja',
  Є: 'Je', І: 'I', Ї: 'Ji', Ґ: 'G', Ў: 'U',
};

const MAP = new Map<string, string>();
for (const [cyr, lat] of Object.entries(UPPER)) {
  MAP.set(cyr, lat);
  MAP.set(cyr.toLowerCase(), lat.toLowerCase());
}

function isUpperLetter(ch: string | undefined): boolean {
  return ch !== undefined && ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

function isLetter(ch: string | undefined): boolean {
  return ch !== undefined && ch.toLowerCase() !== ch.toUpperCase();
}

/** Serbian Cyrillic to Latin; digraphs follow the case of their neighbours. */
export function cyrillicToLatin(input: string): string {
  const chars = Array.from(input);
  let out = '';
  chars.forEach((ch, i) => {
    const lat = MAP.get(ch);
    if (lat === undefined) {
      out += ch;
      return;
    }
    if (lat.length > 1 && isUpperLetter(ch)) {
      const next = chars[i + 1];
      const prev = chars[i - 1];
      const allCaps = isLetter(next)
        ? isUpperLetter(next)
        : isUpperLetter(prev);
      out += allCaps ? lat.toUpperCase() : lat;
      return;
    }
    out += lat;
  });
  return out;
}

export function hasCyrillic(s: string): boolean {
  return /[Ѐ-ӿ]/.test(s);
}

// prettier-ignore
const LATIN: Record<string, string> = {
  a: 'а', b: 'б', c: 'ц', č: 'ч', ć: 'ћ', d: 'д', dž: 'џ', đ: 'ђ', e: 'е', f: 'ф',
  g: 'г', h: 'х', i: 'и', j: 'ј', k: 'к', l: 'л', lj: 'љ', m: 'м', n: 'н', nj: 'њ',
  o: 'о', p: 'п', r: 'р', s: 'с', š: 'ш', t: 'т', u: 'у', v: 'в', z: 'з', ž: 'ж',
};

/** Serbian Latin to Cyrillic; letters outside the Serbian alphabet stay as they are. */
export function latinToCyrillic(input: string): string {
  return input.replace(/[dD][žŽ]|[lLnN][jJ]|\p{L}/gu, (ch) => {
    const cyr = LATIN[ch.toLowerCase()];
    if (cyr === undefined) return ch;
    return ch.charAt(0) === ch.charAt(0).toLowerCase()
      ? cyr
      : cyr.toUpperCase();
  });
}
