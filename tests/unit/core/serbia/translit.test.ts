import { describe, expect, it } from 'vitest';
import {
  cyrillicToLatin,
  hasCyrillic,
  latinToCyrillic,
} from '../../../../src/core/serbia/translit';

describe('cyrillicToLatin', () => {
  it.each([
    ['ЈКП ИНФОСТАН ТЕХНОЛОГИЈЕ БЕОГРАД', 'JKP INFOSTAN TEHNOLOGIJE BEOGRAD'],
    ['Жупска 13, Београд', 'Župska 13, Beograd'],
    ['Ђорђе Чворовић', 'Đorđe Čvorović'],
    ['Љубица Његош', 'Ljubica Njegoš'],
    ['ЉУБИЦА ЊЕГОШ', 'LJUBICA NJEGOŠ'],
    ['Џеј ЏЕЈ', 'Džej DŽEJ'],
    ['Ћуприја', 'Ćuprija'],
    ['Уплата по рачуну', 'Uplata po računu'],
    ['Щука Юля', 'Ščuka Julja'],
    ['Mixed Ћ text 123', 'Mixed Ć text 123'],
  ])('%s', (cyr, lat) => {
    expect(cyrillicToLatin(cyr)).toBe(lat);
    expect(hasCyrillic(cyrillicToLatin(cyr))).toBe(false);
  });
});

describe('latinToCyrillic', () => {
  it.each([
    ['Porez na imovinu', 'Порез на имовину'],
    ['Đorđe Čvorović', 'Ђорђе Чворовић'],
    ['Ljubica Njegoš', 'Љубица Његош'],
    ['LJUBICA NJEGOŠ', 'ЉУБИЦА ЊЕГОШ'],
    ['Džep DŽEP', 'Џеп ЏЕП'],
    ['Ćuprija 12', 'Ћуприја 12'],
    ['Excel', 'Еxцел'],
  ])('%s', (lat, cyr) => {
    expect(latinToCyrillic(lat)).toBe(cyr);
    expect(cyrillicToLatin(cyr)).toBe(lat);
  });
});
