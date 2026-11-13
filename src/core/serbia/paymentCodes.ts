export interface PaymentBasis {
  code: string;
  sr: string;
  ru: string;
}

/** Osnovi plaćanja, Prilog 3 Odluke o platnim nalozima (Sl. glasnik 82/2024). */
export const PAYMENT_BASES: readonly PaymentBasis[] = [
  {
    code: '20',
    sr: 'Promet robe i usluga - međufazna potrošnja',
    ru: 'Оборот товаров и услуг - промежуточное потребление',
  },
  {
    code: '21',
    sr: 'Promet robe i usluga - finalna potrošnja',
    ru: 'Оборот товаров и услуг - конечное потребление',
  },
  {
    code: '22',
    sr: 'Usluge javnih preduzeća',
    ru: 'Услуги государственных (коммунальных) предприятий',
  },
  {
    code: '23',
    sr: 'Investicije u objekte i opremu',
    ru: 'Инвестиции в объекты и оборудование',
  },
  { code: '24', sr: 'Investicije - ostalo', ru: 'Инвестиции - прочее' },
  {
    code: '25',
    sr: 'Zakupnine stvari u javnoj svojini',
    ru: 'Аренда имущества в публичной собственности',
  },
  { code: '26', sr: 'Zakupnine', ru: 'Аренда' },
  {
    code: '27',
    sr: 'Subvencije, regresi i premije s posebnih računa',
    ru: 'Субсидии, компенсации и премии с особых счетов',
  },
  {
    code: '28',
    sr: 'Subvencije, regresi i premije sa ostalih računa',
    ru: 'Субсидии, компенсации и премии с прочих счетов',
  },
  { code: '29', sr: 'Digitalna imovina', ru: 'Цифровые активы' },
  { code: '30', sr: 'Promet nepokretnosti', ru: 'Сделки с недвижимостью' },
  {
    code: '31',
    sr: 'Carine i druge uvozne dažbine',
    ru: 'Таможенные пошлины и другие импортные сборы',
  },
  {
    code: '40',
    sr: 'Zarade i druga primanja zaposlenih',
    ru: 'Зарплаты и другие выплаты работникам',
  },
  {
    code: '41',
    sr: 'Neoporeziva primanja zaposlenih, socijalna i druga davanja izuzeta od oporezivanja',
    ru: 'Необлагаемые выплаты работникам, социальные и другие выплаты, освобождённые от налога',
  },
  {
    code: '42',
    sr: 'Naknade zarada na teret poslodavca',
    ru: 'Компенсации зарплаты за счёт работодателя',
  },
  {
    code: '44',
    sr: 'Isplate preko omladinskih i studentskih zadruga',
    ru: 'Выплаты через молодёжные и студенческие кооперативы',
  },
  { code: '45', sr: 'Penzije', ru: 'Пенсии' },
  {
    code: '46',
    sr: 'Obustave od penzija i zarada',
    ru: 'Удержания из пенсий и зарплат',
  },
  {
    code: '47',
    sr: 'Naknade zarada na teret drugih isplatilaca',
    ru: 'Компенсации зарплаты за счёт других плательщиков',
  },
  {
    code: '48',
    sr: 'Prihodi fizičkih lica od kapitala i drugih imovinskih prava',
    ru: 'Доходы физлиц от капитала и других имущественных прав',
  },
  {
    code: '49',
    sr: 'Ostali prihodi fizičkih lica',
    ru: 'Прочие доходы физлиц',
  },
  {
    code: '53',
    sr: 'Uplata javnih prihoda izuzev poreza i doprinosa po odbitku',
    ru: 'Уплата публичных доходов (налогов, сборов и т.п.), кроме налогов и взносов, удерживаемых у источника',
  },
  {
    code: '54',
    sr: 'Uplata poreza i doprinosa po odbitku',
    ru: 'Уплата налогов и взносов, удерживаемых у источника',
  },
  {
    code: '57',
    sr: 'Povraćaj više naplaćenih ili pogrešno naplaćenih tekućih prihoda',
    ru: 'Возврат излишне или ошибочно взысканных текущих доходов',
  },
  {
    code: '58',
    sr: 'Preknjižavanje više uplaćenih ili pogrešno uplaćenih tekućih prihoda',
    ru: 'Перенос излишне или ошибочно уплаченных текущих доходов',
  },
  {
    code: '60',
    sr: 'Premije osiguranja i nadoknada štete',
    ru: 'Страховые премии и возмещение ущерба',
  },
  {
    code: '61',
    sr: 'Raspored tekućih prihoda',
    ru: 'Распределение текущих доходов',
  },
  {
    code: '62',
    sr: 'Transferi u okviru državnih organa',
    ru: 'Трансферы внутри государственных органов',
  },
  { code: '63', sr: 'Ostali transferi', ru: 'Прочие трансферы' },
  {
    code: '64',
    sr: 'Prenos sredstava iz budžeta za obezbeđenje povraćaja više naplaćenih tekućih prihoda',
    ru: 'Перевод средств из бюджета для возврата излишне взысканных текущих доходов',
  },
  { code: '65', sr: 'Uplata pazara', ru: 'Сдача дневной выручки' },
  { code: '66', sr: 'Isplata gotovine', ru: 'Выдача наличных' },
  { code: '70', sr: 'Kratkoročni krediti', ru: 'Краткосрочные кредиты' },
  { code: '71', sr: 'Dugoročni krediti', ru: 'Долгосрочные кредиты' },
  { code: '72', sr: 'Aktivna kamata', ru: 'Проценты по кредитам (активные)' },
  {
    code: '73',
    sr: 'Polaganje oročenih depozita',
    ru: 'Размещение срочных депозитов',
  },
  { code: '75', sr: 'Ostali plasmani', ru: 'Прочие размещения средств' },
  {
    code: '76',
    sr: 'Otplata kratkoročnih kredita',
    ru: 'Погашение краткосрочных кредитов',
  },
  {
    code: '77',
    sr: 'Otplata dugoročnih kredita',
    ru: 'Погашение долгосрочных кредитов',
  },
  {
    code: '78',
    sr: 'Povraćaj oročenih depozita',
    ru: 'Возврат срочных депозитов',
  },
  { code: '79', sr: 'Pasivna kamata', ru: 'Проценты по депозитам (пассивные)' },
  {
    code: '80',
    sr: 'Eskont hartija od vrednosti',
    ru: 'Учёт (дисконт) ценных бумаг',
  },
  {
    code: '81',
    sr: 'Pozajmice osnivača za likvidnost',
    ru: 'Займы учредителя для ликвидности',
  },
  {
    code: '82',
    sr: 'Povraćaj pozajmice za likvidnost osnivaču',
    ru: 'Возврат займа для ликвидности учредителю',
  },
  { code: '83', sr: 'Naplata čekova građana', ru: 'Инкассо чеков граждан' },
  { code: '84', sr: 'Platne kartice', ru: 'Платёжные карты' },
  { code: '85', sr: 'Menjački poslovi', ru: 'Обменные операции' },
  {
    code: '86',
    sr: 'Kupoprodaja deviza',
    ru: 'Купля-продажа иностранной валюты',
  },
  {
    code: '87',
    sr: 'Donacije i sponzorstva',
    ru: 'Пожертвования и спонсорство',
  },
  {
    code: '88',
    sr: 'Donacije',
    ru: 'Пожертвования (по международным договорам)',
  },
  {
    code: '89',
    sr: 'Transakcije po nalogu građana',
    ru: 'Операции по поручению граждан',
  },
  { code: '90', sr: 'Druge transakcije', ru: 'Прочие операции' },
];

const BY_CODE = new Map(PAYMENT_BASES.map((b) => [b.code, b]));

/** Looks up the basis of a 3-digit šifra plaćanja or of a bare 2-digit basis. */
export function paymentBasis(code: string): PaymentBasis | undefined {
  if (/^\d{3}$/.test(code)) return BY_CODE.get(code.slice(1));
  if (/^\d{2}$/.test(code)) return BY_CODE.get(code);
  return undefined;
}

/** Form digit: 1 cash, 2 non-cash, 3 settlement, 9 rebooking. */
export function isValidPaymentCode(code: string): boolean {
  return /^[1239]\d{2}$/.test(code) && paymentBasis(code) !== undefined;
}

/** IPS QR accepts only the cash and non-cash forms. */
export function isValidQrPaymentCode(code: string): boolean {
  return /^[12]\d{2}$/.test(code) && paymentBasis(code) !== undefined;
}
