import type { Issue } from '../core/forms/issues';
import type { IpsQrIssue } from '../core/serbia/ipsQr';
import type { ImportIssue } from '../io/import';
import type { ReferenceError } from '../core/serbia/reference';
import type { SlipWarning } from '../core/uplatnica/slip';

const REFERENCE: Record<ReferenceError, string> = {
  empty: 'Poziv na broj je prazan.',
  chars: 'Poziv na broj sadrži nedozvoljene znakove.',
  length: 'Poziv na broj je duži od 23 znaka.',
  structure: 'Poziv na broj nema strukturu koju model zahteva.',
  checksum: 'Kontrolni broj u pozivu na broj nije ispravan.',
};

export function issueText(issue: Issue): string {
  switch (issue.code) {
    case 'required':
      return 'Obavezno polje.';
    case 'too-long':
      return `Najviše ${String(issue.max)} znakova, koliko staje u IPS QR kod.`;
    case 'chars':
      return 'Sadrži znakove koje IPS QR kod ne dozvoljava.';
    case 'integer':
      return `Unesite ceo broj od ${String(issue.min)} do ${String(issue.max)}.`;
    case 'not-found':
      return 'Izabrana stavka više ne postoji.';
    case 'color':
      return 'Boja u obliku #rrggbb.';
    case 'account-format':
      return 'Račun se piše kao 160-602-16 ili kao 18 cifara.';
    case 'account-checksum':
      return 'Kontrolni broj računa nije ispravan. Proverite cifre.';
    case 'jmbg-format':
      return 'JMBG ima 13 cifara.';
    case 'jmbg-checksum':
      return 'Kontrolna cifra JMBG-a ne odgovara. Proverite broj.';
    case 'pib-format':
      return 'PIB ima 9 cifara.';
    case 'pib-checksum':
      return 'Kontrolna cifra PIB-a ne odgovara. Proverite broj.';
    case 'payer-too-long':
      return 'Ime i adresa zajedno imaju više od 70 znakova i neće stati u IPS QR kod.';
    case 'payment-code':
      return 'Nepoznata šifra plaćanja.';
    case 'payment-code-not-qr':
      return 'IPS QR kod prihvata samo šifre koje počinju sa 1 ili 2.';
    case 'amount':
      return 'Neispravan iznos.';
    case 'month':
      return 'Mesec u obliku GGGG-MM.';
    case 'date':
      return 'Neispravan datum.';
    case 'end-before-start':
      return 'Kraj je pre početka.';
    case 'no-dates':
      return 'Dodajte bar jedan datum.';
    case 'reference':
      return REFERENCE[issue.reason];
    case 'template-syntax':
      return 'Šablon nije ispravan: proverite vitičaste zagrade.';
    case 'template-too-long':
      return `Vrednost je duža od ${String(issue.width)} znakova.`;
    case 'profile-missing':
      return `Platilac nema unet ${issue.field}.`;
    case 'model97-has-control':
      return 'Izgleda da poziv na broj već počinje kontrolnim brojem. Za model 97 on se dodaje sam: unesite poziv na broj bez prve dve cifre.';
  }
}

const QR_FIELDS: Record<string, string> = {
  R: 'račun primaoca',
  N: 'naziv primaoca',
  I: 'iznos',
  P: 'platilac',
  SF: 'šifra plaćanja',
  S: 'svrha uplate',
  RO: 'poziv na broj',
};

const QR_CODES: Record<string, string> = {
  missing: 'nedostaje',
  invalid: 'nije ispravno',
  checksum: 'kontrolni broj nije ispravan',
  length: 'predugačko',
  lines: 'previše redova',
  chars: 'nedozvoljeni znakovi',
};

export function qrIssueText(issue: IpsQrIssue): string {
  if (issue.code === 'too-large') return 'Podaci ne staju u IPS QR kod.';
  if (issue.tag === null) return 'Podaci nisu ispravni za IPS QR kod.';
  const field = QR_FIELDS[issue.tag] ?? issue.tag;
  return `${field.charAt(0).toUpperCase()}${field.slice(1)}: ${QR_CODES[issue.code] ?? 'nije ispravno'}.`;
}

export const SLIP_WARNINGS: Record<SlipWarning, string> = {
  'no-amount': 'Iznos još nije unet, pa uplatnica nema iznos ni QR kod.',
  overflow:
    'Tekst ne staje u tri reda od 35 znakova i odsečen je na uplatnici.',
};

export function importIssueText(issue: ImportIssue): string {
  switch (issue.code) {
    case 'not-json':
      return 'Datoteka nije ispravan JSON.';
    case 'not-backup':
      return 'Ovo nije rezervna kopija Uplatnice.';
    case 'version':
      return 'Datoteka nema ispravnu verziju šeme.';
    case 'newer':
      return `Datoteku je napravila novija verzija aplikacije (šema ${String(issue.version)}). Osvežite stranicu i pokušajte ponovo.`;
    case 'invalid':
      return `${issue.path || 'Datoteka'}: neispravna vrednost.`;
    case 'unknown-keys':
      return `${issue.path || 'Datoteka'}: nepoznata polja ${issue.keys.join(', ')}.`;
    case 'duplicate':
      return `${issue.path}: zapis se ponavlja.`;
    case 'missing-ref':
      return `${issue.path}: upućuje na zapis kojeg nema u datoteci.`;
  }
}
