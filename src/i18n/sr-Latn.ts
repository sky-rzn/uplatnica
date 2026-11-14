import type { ComponentChildren } from 'preact';
import { pluralizer } from './plural';

const p = pluralizer('sr-Latn');

const days = (n: number) =>
  `${String(n)} ${p(n, { one: 'dan', few: 'dana', other: 'dana' })}`;
const bills = (n: number) =>
  `${String(n)} ${p(n, { one: 'račun', few: 'računa', other: 'računa' })}`;

export const srLatn = {
  date: (d: string, m: string, y: string) => `${d}.${m}.${y}.`,
  months: [
    'januar',
    'februar',
    'mart',
    'april',
    'maj',
    'jun',
    'jul',
    'avgust',
    'septembar',
    'oktobar',
    'novembar',
    'decembar',
  ],
  monthsShort: [
    'jan',
    'feb',
    'mar',
    'apr',
    'maj',
    'jun',
    'jul',
    'avg',
    'sep',
    'okt',
    'nov',
    'dec',
  ],
  monthYear: (month: string, year: number) => `${month} ${String(year)}`,
  quarter: (q: string, year: string) => `${q}. kvartal ${year}`,
  year: (year: string) => `${year}. godina`,

  status: {
    paid: 'plaćeno',
    partial: 'delimično plaćeno',
    overdue: 'kasni',
    'awaiting-amount': 'čeka iznos',
    due: 'za plaćanje',
    upcoming: 'predstoji',
  },
  dueIn: {
    today: 'danas',
    tomorrow: 'sutra',
    yesterday: 'juče',
    later: (n: number) => `za ${days(n)}`,
    earlier: (n: number) => `pre ${days(n)}`,
  },

  schedule: {
    every: {
      1: 'mesečno',
      2: 'na 2 meseca',
      3: 'tromesečno',
      4: 'na 4 meseca',
      6: 'polugodišnje',
      12: 'godišnje',
    },
    daysFromStart: (day: number) => `${String(day)}. dan perioda`,
    lastDay: 'poslednji dan',
    day: (day: number) => `${String(day)}.`,
    sameMonth: (day: string) => `${day} u mesecu`,
    nextMonth: (day: string) => `${day} narednog meseca`,
    laterMonth: (day: string, months: number) =>
      `${day} posle ${String(months)} meseca`,
    once: 'jednom',
    dates: (n: number) =>
      `${String(n)} ${p(n, { one: 'datum', few: 'datuma', other: 'datuma' })}`,
    periodic: (every: string, due: string) => `${every}, rok ${due}`,
  },

  common: {
    save: 'Sačuvaj',
    cancel: 'Otkaži',
    edit: 'Izmeni',
    delete: 'Obriši',
    back: 'Nazad',
    close: 'Zatvori',
    all: 'svi',
    archived: 'Arhiviran',
    archivedHidden: 'Arhiviran (skriven sa dijagrama)',
    optional: 'Neobavezno.',
    section: 'Odeljak',
    payer: 'Platilac',
    name: 'Naziv',
    note: 'Napomena',
    amountRsd: 'Iznos (RSD)',
    reference: 'Poziv na broj',
    paymentCode: 'Šifra plaćanja',
    dueDate: 'Rok plaćanja',
    scanBill: 'Skeniraj račun',
    scanning: 'Skeniranje računa',
    newBill: 'Novi račun',
    due: (date: string) => `rok ${date}`,
  },

  app: {
    brand: 'Uplatnica',
    mainMenu: 'Glavni meni',
    nav: {
      timeline: 'Pregled',
      bills: 'Računi',
      sections: 'Odeljci',
      profiles: 'Platioci',
      data: 'Podaci',
      settings: 'Podešavanja',
    },
    privacy: 'Svi podaci ostaju u ovom pregledaču.',
    backupNever: 'Napravite rezervnu kopiju.',
    backupAge: (n: number) => `Poslednja rezervna kopija je od pre ${days(n)}.`,
  },

  settings: {
    title: 'Podešavanja',
    language: 'Jezik',
  },

  setup: {
    lead: 'Pre prvog računa potrebni su:',
    payer: (link: (text: string) => ComponentChildren) => [
      link('platilac'),
      ' - ko plaća;',
    ],
    section: (link: (text: string) => ComponentChildren) => [
      link('odeljak'),
      ' - grupa računa, na primer „Stan“.',
    ],
  },

  overview: {
    title: 'Pregled',
    view: 'Prikaz',
    timeline: 'Dijagram',
    list: 'Lista',
    nothing: 'Trenutno nema ništa za plaćanje.',
    dueNow: 'Za plaćanje sada: ',
    overdue: 'Kasni: ',
    noBills: (link: (text: string) => ComponentChildren) => [
      'Još nema računa. Dodajte ih na stranici ',
      link('Računi'),
      '.',
    ],
    total: (count: number, sum: string) => `${bills(count)}, ${sum}`,
    totalUnknown: (count: number) => `${bills(count)} bez iznosa`,
    totalPartly: (count: number, sum: string, unknown: number) =>
      `${bills(count)}, ${sum} + ${String(unknown)} bez iznosa`,
  },

  timeline: {
    zoom: { '6m': '6 meseci', '1y': '1 godina', '3y': '3 godine' },
    scale: 'Razmera',
    shift: 'Pomeranje',
    earlier: 'Ranije',
    today: 'Danas',
    later: 'Kasnije',
    unpaidOnly: 'Samo neplaćeno',
    rowTotal: 'Ukupno sa rokom u prikazanom periodu',
    noMatch: 'Nijedan račun ne odgovara filteru.',
    legend: 'Legenda',
  },

  list: {
    groups: { overdue: 'Kasni', now: 'Za plaćanje', soon: 'Uskoro' },
    pick: (title: string) => `Izaberi za štampu: ${title}`,
    nothingAhead: (n: number) =>
      `Nema neplaćenih računa sa rokom u narednih ${String(n)} dana.`,
    pickAll: 'Izaberi sve',
    print: 'Štampaj uplatnice',
  },

  bills: {
    title: 'Računi',
    empty: 'Još nema računa.',
    nextDue: (date: string) => `sledeći rok ${date}`,
    variable: 'iznos po računu',
  },

  billEditor: {
    notFound: 'Račun nije pronađen',
    backToBills: 'Nazad na račune',
    editForm: 'Izmena računa',
    confirmDelete: (title: string) =>
      `Obrisati račun „${title}“ zajedno sa svim unetim iznosima i uplatama?`,
    fillFromQr: 'Popuni iz QR koda',
    fillFromQrHint:
      'Primalac, račun, šifra, svrha i poziv na broj preuzimaju se sa IPS QR koda na računu.',
    basics: 'Osnovno',
    titleHint: 'Kako će se račun zvati na dijagramu, na primer „Infostan“.',
    payee: 'Primalac',
    payeeName: 'Naziv primaoca',
    payeeAddress: 'Adresa primaoca',
    account: 'Račun primaoca',
    payment: 'Plaćanje',
    paymentCodeHint:
      'Prva cifra: 1 gotovinsko, 2 bezgotovinsko plaćanje. Česte šifre: 289, 253, 221.',
    purpose: 'Svrha uplate',
    model: 'Model',
    noModel: 'bez modela',
    referenceHint:
      'Može šablon: {JMBG}, {PIB}, {YYYY}, {YY}, {MM}, {Q} i sopstvena polja, npr. {NAPLATNI:11}.',
    referenceHint97: ' Kontrolni broj za model 97 se dodaje sam.',
    varValue: (name: string) => `Vrednost za {${name}}`,
    referencePreview: (period: string) => `Poziv na broj za period ${period}: `,
    amount: 'Iznos',
    amountKind: 'Vrsta iznosa',
    fixed: 'Isti iznos svaki put',
    variable: 'Iznos se unosi po prijemu računa',
    schedule: 'Rokovi',
    scheduleKind: 'Vrsta rasporeda',
    periodic: 'Periodično',
    dates: 'Određeni datumi',
    every: 'Period',
    start: 'Prvi period',
    end: 'Poslednji period',
    monthPlaceholder: 'GGGG-MM',
    dueKind: {
      day: 'određeni dan u mesecu',
      last: 'poslednji dan u mesecu',
      daysFromStart: 'broj dana od početka perioda',
    },
    daysFromStart: 'Dana od prvog dana perioda',
    daysFromStartHint: 'Porez na imovinu: 44 (45. dan tromesečja).',
    day: 'Dan',
    month: 'Mesec',
    monthOffset: (n: number) =>
      n === 0
        ? 'istog meseca kad počinje period'
        : n === 1
          ? 'narednog meseca'
          : `${String(n)}. meseca posle početka`,
    shiftToWorkday:
      'Ako rok padne na vikend ili praznik, pomeri ga na prvi radni dan',
    date: (n: number) => `Datum ${String(n)}`,
    removeDate: (n: number) => `Ukloni datum ${String(n)}`,
    remove: 'Ukloni',
    addDate: 'Dodaj datum',
    graceDays: 'Dana tolerancije posle roka',
    graceDaysHint:
      'Neobavezno. Toliko dana posle roka račun se još ne smatra docnjom.',
    nextDues: 'Sledeći rokovi: ',
    lastDue: 'Poslednji rok: ',
    other: 'Ostalo',
  },

  occurrence: {
    fixErrors: 'Ispravite greške u formi da bi se video QR kod.',
    enterAmount: 'Unesite iznos da bi se napravio QR kod.',
    qrLabel: 'IPS QR kod za uplatu',
    qrHint:
      'Skenirajte kod u aplikaciji banke i proverite podatke pre potvrde.',
    outOfSchedule:
      'Ovaj period više nije u rasporedu računa. Podaci su sačuvani da se uplata ne bi izgubila.',
    deleteRecord: 'Obriši zapis',
    takeAccount: 'Upiši novi račun primaoca u račun',
    form: 'Period',
    amountVariableHint: 'Iznos sa računa za ovaj period.',
    amountFixedHint: 'Ostavite prazno za iznos iz računa.',
    referenceModel: (model: string) => `Poziv na broj (model ${model})`,
    referenceHint: 'Ako je na računu drugačiji, prepišite ga.',
    qr: 'QR kod',
    qrSection: 'IPS QR kod',
    slip: 'Uplatnica',
    payment: 'Uplata',
    paidAt: 'Datum uplate',
    paidAmount: 'Uplaćeno (RSD)',
    paidAmountHint: 'Prazno: ceo iznos.',
    unpay: 'Poništi uplatu',
    pay: 'Plaćeno',
  },

  sections: {
    title: 'Odeljci',
    add: 'Novi odeljak',
    editForm: 'Izmena odeljka',
    color: 'Boja',
    lead: 'Odeljci grupišu račune na dijagramu, na primer „Stan“, „Porezi“ ili „Paušal“.',
    empty: 'Još nema odeljaka.',
    confirmDelete: (name: string) => `Obrisati odeljak „${name}“?`,
    inUse: (name: string) =>
      `U odeljku „${name}“ ima računa. Premestite ih ili obrišite, ili arhivirajte odeljak.`,
    up: (name: string) => `Pomeri „${name}“ gore`,
    down: (name: string) => `Pomeri „${name}“ dole`,
  },

  profiles: {
    title: 'Platioci',
    add: 'Novi platilac',
    editForm: 'Izmena platioca',
    name: 'Ime i prezime',
    address: 'Adresa',
    jmbg: 'JMBG',
    pib: 'PIB',
    jmbgHint: 'Neobavezno. Koristi se u šablonima poziva na broj kao {JMBG}.',
    pibHint: 'Neobavezno, za preduzetnike. U šablonima: {PIB}.',
    lead: 'Platilac je onaj ko plaća: vi, supružnik ili vaša radnja. Ime i adresa idu u polje „platilac“ na uplatnici.',
    empty: 'Još nema platilaca.',
    confirmDelete: (name: string) => `Obrisati platioca „${name}“?`,
    inUse: (name: string) =>
      `Platilac „${name}“ se koristi u računima. Prvo ih prebacite na drugog platioca ili obrišite.`,
  },

  data: {
    title: 'Podaci',
    lead: 'Podaci se čuvaju samo u ovom pregledaču. Rezervna kopija je datoteka koju možete uvesti ovde ili u pregledaču na drugom uređaju.',
    backup: 'Rezervna kopija',
    noBackup: 'Rezervna kopija još nije napravljena.',
    lastBackup: (date: string, age: number) =>
      `Poslednja rezervna kopija: ${date} (${age === 0 ? 'danas' : `pre ${days(age)}`}).`,
    exportAll: 'Izvezi sve (JSON)',
    sectionTemplate: 'Odeljak kao šablon',
    sectionTemplateHint:
      'Računi iz odeljka i njihovi platioci, bez istorije plaćanja i bez JMBG i PIB, da biste ih podelili sa nekim.',
    exportSection: 'Izvezi odeljak',
    import: 'Uvoz',
    importFile: 'Rezervna kopija (JSON)',
    cannotImport: (name: string) => `Datoteku „${name}“ nije moguće uvesti:`,
    more: (n: number) => `i još ${String(n)}.`,
    contents: (
      name: string,
      date: string,
      c: { profiles: number; sections: number; bills: number; periods: number },
    ) =>
      `„${name}“ od ${date}: ` +
      [
        `${String(c.profiles)} ${p(c.profiles, { one: 'platilac', few: 'platioca', other: 'platilaca' })}`,
        `${String(c.sections)} ${p(c.sections, { one: 'odeljak', few: 'odeljka', other: 'odeljaka' })}`,
        bills(c.bills),
        `${String(c.periods)} ${p(c.periods, { one: 'period', few: 'perioda', other: 'perioda' })}`,
      ].join(', ') +
      '.',
    mergeHint:
      'Spajanje dodaje nove zapise, a postojeće menja samo ako su u datoteci kasnije izmenjeni. Ništa se ne briše.',
    partialHint:
      ' Datoteka sadrži samo deo podataka, pa njome ne možete zameniti sve.',
    merge: 'Spoji',
    replace: 'Zameni sve',
    confirmReplace:
      'Zameniti sve podatke sadržajem datoteke? Pre zamene preuzima se rezervna kopija trenutnih podataka.',
    merged: (added: number, updated: number, kept: number) =>
      `Uvezeno. Novih zapisa: ${String(added)}, izmenjenih: ${String(updated)}, zadržanih jer su ovde isti ili noviji: ${String(kept)}.`,
    replaced: 'Podaci su zamenjeni sadržajem datoteke.',
    other: 'Za druge programe',
    otherHint:
      'Istorija plaćanja otvara se u Excelu. Rokovi neplaćenih perioda za narednu godinu uvoze se u kalendar telefona, koji podseća dan ranije.',
    csv: 'Istorija plaćanja (CSV)',
    ics: 'Rokovi za kalendar (ICS)',
    file: {
      beforeImport: 'uplatnica-pre-uvoza',
      payments: 'uplatnica-placanja',
      dues: 'uplatnica-rokovi',
    },
  },

  scan: {
    lead: 'Skenirajte IPS QR kod sa računa. Iznos i poziv na broj upisuju se u period računa, a za novog primaoca pravi se novi račun.',
    again: 'Skeniraj drugi kod',
    noMatch: 'Nijedan račun nema ovog primaoca.',
    otherAccount: 'Isti primalac, ali drugi račun primaoca.',
    noPeriods: 'Nema neplaćenih perioda.',
    pickPeriod: 'Izaberite period za koji je račun:',
    sameReference: ' (isti poziv na broj)',
    newBill: 'Novi račun iz ovog koda',
    notIps: 'Ovo nije IPS QR kod za plaćanje.',
    invalid: 'QR kod nije ispravan.',
  },

  scanner: {
    cameraDenied:
      'Pristup kameri nije dozvoljen. Dozvolite ga u podešavanjima pregledača ili učitajte sliku računa.',
    cameraMissing: 'Kamera nije pronađena. Učitajte sliku računa.',
    cameraFailed: 'Kamera nije mogla da se pokrene. Učitajte sliku računa.',
    video: 'Slika sa kamere',
    aim: 'Usmerite kameru na QR kod na računu.',
    noQrPdf:
      'U PDF-u nije pronađen QR kod. Ako je kod nacrtan, a ne umetnut kao slika, napravite snimak ekrana i učitajte njega.',
    noQrImage:
      'Na slici nije pronađen QR kod. Probajte oštriju sliku na kojoj kod zauzima više mesta.',
    unreadable: 'Datoteka nije mogla da se pročita.',
    camera: 'Kamera',
    stopCamera: 'Zaustavi kameru',
    file: 'Slika ili PDF računa',
    text: 'Tekst koda',
    textLabel: 'Tekst IPS QR koda',
    loadText: 'Učitaj tekst',
    searching: 'Tražim QR kod…',
  },

  print: {
    one: 'Uplatnica',
    many: 'Uplatnice',
    pdf: 'Preuzmi PDF',
    print: 'Štampaj',
    hint: 'Štampajte na A4 bez uklapanja u stranu, u razmeri 100 %, da bi uplatnica imala pravu veličinu. Na jedan list staju tri.',
    pdfFailed: 'PDF nije napravljen. Pokušajte ponovo.',
    missing: (n: number) =>
      n === 1
        ? 'Jedan račun ili period više ne postoji.'
        : `${String(n)} računa ili perioda više ne postoje.`,
    none: 'Nije izabrana nijedna uplatnica.',
    noQr: 'Uplatnica je bez QR koda:',
    noAmount: 'Iznos još nije unet, pa uplatnica nema iznos ni QR kod.',
    overflow:
      'Tekst ne staje u tri reda od 35 znakova i odsečen je na uplatnici.',
  },

  qrFields: {
    payee: 'Primalac',
    account: 'Račun',
    amount: 'Iznos',
    paymentCode: 'Šifra plaćanja',
    purpose: 'Svrha',
    reference: 'Poziv na broj',
    payeeReference: 'Referenca primaoca',
    payer: 'Platilac',
  },

  issue: {
    required: 'Obavezno polje.',
    tooLong: (max: number) =>
      `Najviše ${String(max)} znakova, koliko staje u IPS QR kod.`,
    chars: 'Sadrži znakove koje IPS QR kod ne dozvoljava.',
    integer: (min: number, max: number) =>
      `Unesite ceo broj od ${String(min)} do ${String(max)}.`,
    notFound: 'Izabrana stavka više ne postoji.',
    color: 'Boja u obliku #rrggbb.',
    accountFormat: 'Račun se piše kao 160-602-16 ili kao 18 cifara.',
    accountChecksum: 'Kontrolni broj računa nije ispravan. Proverite cifre.',
    jmbgFormat: 'JMBG ima 13 cifara.',
    jmbgChecksum: 'Kontrolna cifra JMBG-a ne odgovara. Proverite broj.',
    pibFormat: 'PIB ima 9 cifara.',
    pibChecksum: 'Kontrolna cifra PIB-a ne odgovara. Proverite broj.',
    payerTooLong:
      'Ime i adresa zajedno imaju više od 70 znakova i neće stati u IPS QR kod.',
    paymentCode: 'Nepoznata šifra plaćanja.',
    paymentCodeNotQr: 'IPS QR kod prihvata samo šifre koje počinju sa 1 ili 2.',
    amount: 'Neispravan iznos.',
    month: 'Mesec u obliku GGGG-MM.',
    date: 'Neispravan datum.',
    endBeforeStart: 'Kraj je pre početka.',
    noDates: 'Dodajte bar jedan datum.',
    templateSyntax: 'Šablon nije ispravan: proverite vitičaste zagrade.',
    templateTooLong: (width: number) =>
      `Vrednost je duža od ${String(width)} znakova.`,
    profileMissing: (field: 'JMBG' | 'PIB') =>
      `Platilac nema unet ${field === 'JMBG' ? 'JMBG' : 'PIB'}.`,
    model97HasControl:
      'Izgleda da poziv na broj već počinje kontrolnim brojem. Za model 97 on se dodaje sam: unesite poziv na broj bez prve dve cifre.',
    reference: {
      empty: 'Poziv na broj je prazan.',
      chars: 'Poziv na broj sadrži nedozvoljene znakove.',
      length: 'Poziv na broj je duži od 23 znaka.',
      structure: 'Poziv na broj nema strukturu koju model zahteva.',
      checksum: 'Kontrolni broj u pozivu na broj nije ispravan.',
    },
  },

  qrIssue: {
    tooLarge: 'Podaci ne staju u IPS QR kod.',
    general: 'Podaci nisu ispravni za IPS QR kod.',
    fields: {
      R: 'Račun primaoca',
      N: 'Naziv primaoca',
      I: 'Iznos',
      P: 'Platilac',
      SF: 'Šifra plaćanja',
      S: 'Svrha uplate',
      RO: 'Poziv na broj',
    } as Record<string, string>,
    codes: {
      missing: 'nedostaje',
      invalid: 'nije ispravno',
      checksum: 'kontrolni broj nije ispravan',
      length: 'predugačko',
      lines: 'previše redova',
      chars: 'nedozvoljeni znakovi',
    } as Record<string, string>,
    field: (field: string, problem: string) => `${field}: ${problem}.`,
  },

  importIssue: {
    file: 'Datoteka',
    notJson: 'Datoteka nije ispravan JSON.',
    notBackup: 'Ovo nije rezervna kopija Uplatnice.',
    version: 'Datoteka nema ispravnu verziju šeme.',
    newer: (version: number) =>
      `Datoteku je napravila novija verzija aplikacije (šema ${String(version)}). Osvežite stranicu i pokušajte ponovo.`,
    invalid: (path: string) => `${path}: neispravna vrednost.`,
    unknownKeys: (path: string, keys: string) =>
      `${path}: nepoznata polja ${keys}.`,
    duplicate: (path: string) => `${path}: zapis se ponavlja.`,
    missingRef: (path: string) =>
      `${path}: upućuje na zapis kojeg nema u datoteci.`,
  },

  scanNote: {
    noModel: 'bez modela',
    model: (m: string) => `model ${m}`,
    account: (scanned: string, current: string) =>
      `Račun primaoca na kodu je ${scanned}, a u računu je ${current}.`,
    modelMismatch: (scanned: string, current: string) =>
      `Poziv na broj na kodu je ${scanned}, a račun koristi ${current}, pa nije preuzet.`,
    unsupportedModel: (model: string) =>
      `Poziv na broj na kodu je po modelu ${model}, koji aplikacija ne podržava, pa nije preuzet.`,
    paymentCode: (scanned: string, current: string) =>
      `Šifra plaćanja na kodu je ${scanned}, a u računu ${current}. Uplatnica koristi šifru iz računa.`,
    noAmount: 'Kod nema iznos, pa iznos nije preuzet.',
    payeeReference: (value: string) =>
      `Umesto poziva na broj kod ima referencu primaoca ${value}, koja nije preuzeta.`,
  },

  csv: {
    header: [
      'Datum plaćanja',
      'Odeljak',
      'Naziv',
      'Period',
      'Rok',
      'Iznos',
      'Plaćeno',
      'Primalac',
      'Račun primaoca',
      'Šifra plaćanja',
      'Model',
      'Poziv na broj',
      'Platilac',
      'Napomena',
    ],
  },

  ics: {
    period: 'Period',
    amount: 'Iznos',
    noAmount: 'još nije unet',
    payee: 'Primalac',
    account: 'Račun',
    paymentCode: 'Šifra plaćanja',
    reference: 'Poziv na broj',
  },
};

export type Messages = typeof srLatn;
