export interface PaymentBasis {
  code: string;
  sr: string;
  en: string;
  ru: string;
}

/** Osnovi plaćanja, Prilog 3 Odluke o platnim nalozima (Sl. glasnik 82/2024). */
export const PAYMENT_BASES: readonly PaymentBasis[] = [
  {
    code: '20',
    sr: 'Promet robe i usluga - međufazna potrošnja',
    en: 'Trade in goods and services - intermediate consumption',
    ru: 'Оборот товаров и услуг - промежуточное потребление',
  },
  {
    code: '21',
    sr: 'Promet robe i usluga - finalna potrošnja',
    en: 'Trade in goods and services - final consumption',
    ru: 'Оборот товаров и услуг - конечное потребление',
  },
  {
    code: '22',
    sr: 'Usluge javnih preduzeća',
    en: 'Public utility services',
    ru: 'Услуги государственных (коммунальных) предприятий',
  },
  {
    code: '23',
    sr: 'Investicije u objekte i opremu',
    en: 'Investment in buildings and equipment',
    ru: 'Инвестиции в объекты и оборудование',
  },
  {
    code: '24',
    sr: 'Investicije - ostalo',
    en: 'Investment - other',
    ru: 'Инвестиции - прочее',
  },
  {
    code: '25',
    sr: 'Zakupnine stvari u javnoj svojini',
    en: 'Rent of publicly owned property',
    ru: 'Аренда имущества в публичной собственности',
  },
  { code: '26', sr: 'Zakupnine', en: 'Rent', ru: 'Аренда' },
  {
    code: '27',
    sr: 'Subvencije, regresi i premije s posebnih računa',
    en: 'Subsidies, refunds and premiums from special accounts',
    ru: 'Субсидии, компенсации и премии с особых счетов',
  },
  {
    code: '28',
    sr: 'Subvencije, regresi i premije sa ostalih računa',
    en: 'Subsidies, refunds and premiums from other accounts',
    ru: 'Субсидии, компенсации и премии с прочих счетов',
  },
  {
    code: '29',
    sr: 'Digitalna imovina',
    en: 'Digital assets',
    ru: 'Цифровые активы',
  },
  {
    code: '30',
    sr: 'Promet nepokretnosti',
    en: 'Real estate transactions',
    ru: 'Сделки с недвижимостью',
  },
  {
    code: '31',
    sr: 'Carine i druge uvozne dažbine',
    en: 'Customs and other import duties',
    ru: 'Таможенные пошлины и другие импортные сборы',
  },
  {
    code: '40',
    sr: 'Zarade i druga primanja zaposlenih',
    en: 'Salaries and other employee income',
    ru: 'Зарплаты и другие выплаты работникам',
  },
  {
    code: '41',
    sr: 'Neoporeziva primanja zaposlenih, socijalna i druga davanja izuzeta od oporezivanja',
    en: 'Non-taxable employee income, social and other tax-exempt benefits',
    ru: 'Необлагаемые выплаты работникам, социальные и другие выплаты, освобождённые от налога',
  },
  {
    code: '42',
    sr: 'Naknade zarada na teret poslodavca',
    en: 'Salary compensation paid by the employer',
    ru: 'Компенсации зарплаты за счёт работодателя',
  },
  {
    code: '44',
    sr: 'Isplate preko omladinskih i studentskih zadruga',
    en: 'Payments through youth and student cooperatives',
    ru: 'Выплаты через молодёжные и студенческие кооперативы',
  },
  { code: '45', sr: 'Penzije', en: 'Pensions', ru: 'Пенсии' },
  {
    code: '46',
    sr: 'Obustave od penzija i zarada',
    en: 'Deductions from pensions and salaries',
    ru: 'Удержания из пенсий и зарплат',
  },
  {
    code: '47',
    sr: 'Naknade zarada na teret drugih isplatilaca',
    en: 'Salary compensation paid by other payers',
    ru: 'Компенсации зарплаты за счёт других плательщиков',
  },
  {
    code: '48',
    sr: 'Prihodi fizičkih lica od kapitala i drugih imovinskih prava',
    en: 'Personal income from capital and other property rights',
    ru: 'Доходы физлиц от капитала и других имущественных прав',
  },
  {
    code: '49',
    sr: 'Ostali prihodi fizičkih lica',
    en: 'Other personal income',
    ru: 'Прочие доходы физлиц',
  },
  {
    code: '53',
    sr: 'Uplata javnih prihoda izuzev poreza i doprinosa po odbitku',
    en: 'Payment of public revenue except withholding taxes and contributions',
    ru: 'Уплата публичных доходов (налогов, сборов и т.п.), кроме налогов и взносов, удерживаемых у источника',
  },
  {
    code: '54',
    sr: 'Uplata poreza i doprinosa po odbitku',
    en: 'Payment of withholding taxes and contributions',
    ru: 'Уплата налогов и взносов, удерживаемых у источника',
  },
  {
    code: '57',
    sr: 'Povraćaj više naplaćenih ili pogrešno naplaćenih tekućih prihoda',
    en: 'Refund of overpaid or wrongly collected current revenue',
    ru: 'Возврат излишне или ошибочно взысканных текущих доходов',
  },
  {
    code: '58',
    sr: 'Preknjižavanje više uplaćenih ili pogrešno uplaćenih tekućih prihoda',
    en: 'Rebooking of overpaid or wrongly paid current revenue',
    ru: 'Перенос излишне или ошибочно уплаченных текущих доходов',
  },
  {
    code: '60',
    sr: 'Premije osiguranja i nadoknada štete',
    en: 'Insurance premiums and damage compensation',
    ru: 'Страховые премии и возмещение ущерба',
  },
  {
    code: '61',
    sr: 'Raspored tekućih prihoda',
    en: 'Allocation of current revenue',
    ru: 'Распределение текущих доходов',
  },
  {
    code: '62',
    sr: 'Transferi u okviru državnih organa',
    en: 'Transfers within government bodies',
    ru: 'Трансферы внутри государственных органов',
  },
  {
    code: '63',
    sr: 'Ostali transferi',
    en: 'Other transfers',
    ru: 'Прочие трансферы',
  },
  {
    code: '64',
    sr: 'Prenos sredstava iz budžeta za obezbeđenje povraćaja više naplaćenih tekućih prihoda',
    en: 'Budget transfer to refund overpaid current revenue',
    ru: 'Перевод средств из бюджета для возврата излишне взысканных текущих доходов',
  },
  {
    code: '65',
    sr: 'Uplata pazara',
    en: 'Deposit of daily takings',
    ru: 'Сдача дневной выручки',
  },
  {
    code: '66',
    sr: 'Isplata gotovine',
    en: 'Cash withdrawal',
    ru: 'Выдача наличных',
  },
  {
    code: '70',
    sr: 'Kratkoročni krediti',
    en: 'Short-term loans',
    ru: 'Краткосрочные кредиты',
  },
  {
    code: '71',
    sr: 'Dugoročni krediti',
    en: 'Long-term loans',
    ru: 'Долгосрочные кредиты',
  },
  {
    code: '72',
    sr: 'Aktivna kamata',
    en: 'Interest received on loans',
    ru: 'Проценты по кредитам (активные)',
  },
  {
    code: '73',
    sr: 'Polaganje oročenih depozita',
    en: 'Placement of term deposits',
    ru: 'Размещение срочных депозитов',
  },
  {
    code: '75',
    sr: 'Ostali plasmani',
    en: 'Other placements',
    ru: 'Прочие размещения средств',
  },
  {
    code: '76',
    sr: 'Otplata kratkoročnih kredita',
    en: 'Repayment of short-term loans',
    ru: 'Погашение краткосрочных кредитов',
  },
  {
    code: '77',
    sr: 'Otplata dugoročnih kredita',
    en: 'Repayment of long-term loans',
    ru: 'Погашение долгосрочных кредитов',
  },
  {
    code: '78',
    sr: 'Povraćaj oročenih depozita',
    en: 'Return of term deposits',
    ru: 'Возврат срочных депозитов',
  },
  {
    code: '79',
    sr: 'Pasivna kamata',
    en: 'Interest paid on deposits',
    ru: 'Проценты по депозитам (пассивные)',
  },
  {
    code: '80',
    sr: 'Eskont hartija od vrednosti',
    en: 'Discounting of securities',
    ru: 'Учёт (дисконт) ценных бумаг',
  },
  {
    code: '81',
    sr: 'Pozajmice osnivača za likvidnost',
    en: 'Founder loans for liquidity',
    ru: 'Займы учредителя для ликвидности',
  },
  {
    code: '82',
    sr: 'Povraćaj pozajmice za likvidnost osnivaču',
    en: 'Repayment of a liquidity loan to the founder',
    ru: 'Возврат займа для ликвидности учредителю',
  },
  {
    code: '83',
    sr: 'Naplata čekova građana',
    en: 'Collection of personal cheques',
    ru: 'Инкассо чеков граждан',
  },
  {
    code: '84',
    sr: 'Platne kartice',
    en: 'Payment cards',
    ru: 'Платёжные карты',
  },
  {
    code: '85',
    sr: 'Menjački poslovi',
    en: 'Currency exchange',
    ru: 'Обменные операции',
  },
  {
    code: '86',
    sr: 'Kupoprodaja deviza',
    en: 'Purchase and sale of foreign currency',
    ru: 'Купля-продажа иностранной валюты',
  },
  {
    code: '87',
    sr: 'Donacije i sponzorstva',
    en: 'Donations and sponsorships',
    ru: 'Пожертвования и спонсорство',
  },
  {
    code: '88',
    sr: 'Donacije',
    en: 'Donations (under international agreements)',
    ru: 'Пожертвования (по международным договорам)',
  },
  {
    code: '89',
    sr: 'Transakcije po nalogu građana',
    en: 'Transactions ordered by individuals',
    ru: 'Операции по поручению граждан',
  },
  {
    code: '90',
    sr: 'Druge transakcije',
    en: 'Other transactions',
    ru: 'Прочие операции',
  },
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
