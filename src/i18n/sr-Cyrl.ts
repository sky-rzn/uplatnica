import type { ComponentChildren } from 'preact';
import { pluralizer } from './plural';
import type { Messages } from './sr-Latn';

const p = pluralizer('sr-Cyrl');

const days = (n: number) =>
  `${String(n)} ${p(n, { one: 'дан', few: 'дана', other: 'дана' })}`;
const bills = (n: number) =>
  `${String(n)} ${p(n, { one: 'рачун', few: 'рачуна', other: 'рачуна' })}`;

export const srCyrl: Messages = {
  date: (d: string, m: string, y: string) => `${d}.${m}.${y}.`,
  months: [
    'јануар',
    'фебруар',
    'март',
    'април',
    'мај',
    'јун',
    'јул',
    'август',
    'септембар',
    'октобар',
    'новембар',
    'децембар',
  ],
  monthsShort: [
    'јан',
    'феб',
    'мар',
    'апр',
    'мај',
    'јун',
    'јул',
    'авг',
    'сеп',
    'окт',
    'нов',
    'дец',
  ],
  monthYear: (month: string, year: number) => `${month} ${String(year)}`,
  quarter: (q: string, year: string) => `${q}. квартал ${year}`,
  year: (year: string) => `${year}. година`,

  status: {
    paid: 'плаћено',
    partial: 'делимично плаћено',
    overdue: 'касни',
    'awaiting-amount': 'чека износ',
    due: 'за плаћање',
    upcoming: 'предстоји',
  },
  dueIn: {
    today: 'данас',
    tomorrow: 'сутра',
    yesterday: 'јуче',
    later: (n: number) => `за ${days(n)}`,
    earlier: (n: number) => `пре ${days(n)}`,
  },

  schedule: {
    every: {
      1: 'месечно',
      2: 'на 2 месеца',
      3: 'тромесечно',
      4: 'на 4 месеца',
      6: 'полугодишње',
      12: 'годишње',
    },
    daysFromStart: (day: number) => `${String(day)}. дан периода`,
    lastDay: 'последњи дан',
    day: (day: number) => `${String(day)}.`,
    sameMonth: (day: string) => `${day} у месецу`,
    nextMonth: (day: string) => `${day} наредног месеца`,
    laterMonth: (day: string, months: number) =>
      `${day} после ${String(months)} месеца`,
    once: 'једном',
    dates: (n: number) =>
      `${String(n)} ${p(n, { one: 'датум', few: 'датума', other: 'датума' })}`,
    periodic: (every: string, due: string) => `${every}, рок ${due}`,
  },

  common: {
    save: 'Сачувај',
    cancel: 'Откажи',
    edit: 'Измени',
    delete: 'Обриши',
    back: 'Назад',
    close: 'Затвори',
    all: 'сви',
    archived: 'Архивиран',
    archivedHidden: 'Архивиран (скривен са дијаграма)',
    optional: 'Необавезно.',
    section: 'Одељак',
    payer: 'Платилац',
    name: 'Назив',
    note: 'Напомена',
    amountRsd: 'Износ (RSD)',
    reference: 'Позив на број',
    paymentCode: 'Шифра плаћања',
    dueDate: 'Рок плаћања',
    scanBill: 'Скенирај рачун',
    scanning: 'Скенирање рачуна',
    newBill: 'Нови рачун',
    due: (date: string) => `рок ${date}`,
  },

  app: {
    brand: 'Уплатница',
    mainMenu: 'Главни мени',
    nav: {
      timeline: 'Преглед',
      bills: 'Рачуни',
      sections: 'Одељци',
      profiles: 'Платиоци',
      data: 'Подаци',
      settings: 'Подешавања',
    },
    privacy: 'Сви подаци остају у овом прегледачу.',
    backupNever: 'Направите резервну копију.',
    backupAge: (n: number) => `Последња резервна копија је од пре ${days(n)}.`,
  },

  settings: {
    title: 'Подешавања',
    language: 'Језик',
  },

  setup: {
    lead: 'Пре првог рачуна потребни су:',
    payer: (link: (text: string) => ComponentChildren) => [
      link('платилац'),
      ' - ко плаћа;',
    ],
    section: (link: (text: string) => ComponentChildren) => [
      link('одељак'),
      ' - група рачуна, на пример „Стан“.',
    ],
  },

  overview: {
    title: 'Преглед',
    view: 'Приказ',
    timeline: 'Дијаграм',
    list: 'Листа',
    nothing: 'Тренутно нема ништа за плаћање.',
    dueNow: 'За плаћање сада: ',
    overdue: 'Касни: ',
    noBills: (link: (text: string) => ComponentChildren) => [
      'Још нема рачуна. Додајте их на страници ',
      link('Рачуни'),
      '.',
    ],
    total: (count: number, sum: string) => `${bills(count)}, ${sum}`,
    totalUnknown: (count: number) => `${bills(count)} без износа`,
    totalPartly: (count: number, sum: string, unknown: number) =>
      `${bills(count)}, ${sum} + ${String(unknown)} без износа`,
  },

  timeline: {
    zoom: { '6m': '6 месеци', '1y': '1 година', '3y': '3 године' },
    scale: 'Размера',
    shift: 'Померање',
    earlier: 'Раније',
    today: 'Данас',
    later: 'Касније',
    unpaidOnly: 'Само неплаћено',
    rowTotal: 'Укупно са роком у приказаном периоду',
    noMatch: 'Ниједан рачун не одговара филтеру.',
    legend: 'Легенда',
  },

  list: {
    groups: { overdue: 'Касни', now: 'За плаћање', soon: 'Ускоро' },
    pick: (title: string) => `Изабери за штампу: ${title}`,
    nothingAhead: (n: number) =>
      `Нема неплаћених рачуна са роком у наредних ${String(n)} дана.`,
    pickAll: 'Изабери све',
    print: 'Штампај уплатнице',
  },

  bills: {
    title: 'Рачуни',
    empty: 'Још нема рачуна.',
    nextDue: (date: string) => `следећи рок ${date}`,
    variable: 'износ по рачуну',
  },

  billEditor: {
    notFound: 'Рачун није пронађен',
    backToBills: 'Назад на рачуне',
    editForm: 'Измена рачуна',
    confirmDelete: (title: string) =>
      `Обрисати рачун „${title}“ заједно са свим унетим износима и уплатама?`,
    fillFromQr: 'Попуни из QR кода',
    fillFromQrHint:
      'Прималац, рачун, шифра, сврха и позив на број преузимају се са IPS QR кода на рачуну.',
    basics: 'Основно',
    titleHint: 'Како ће се рачун звати на дијаграму, на пример „Инфостан“.',
    payee: 'Прималац',
    payeeName: 'Назив примаоца',
    payeeAddress: 'Адреса примаоца',
    account: 'Рачун примаоца',
    payment: 'Плаћање',
    paymentCodeHint:
      'Прва цифра: 1 готовинско, 2 безготовинско плаћање. Честе шифре: 289, 253, 221.',
    purpose: 'Сврха уплате',
    model: 'Модел',
    noModel: 'без модела',
    referenceHint:
      'Може шаблон: {JMBG}, {PIB}, {YYYY}, {YY}, {MM}, {Q} и сопствена поља, нпр. {NAPLATNI:11}.',
    referenceHint97: ' Контролни број за модел 97 се додаје сам.',
    varValue: (name: string) => `Вредност за {${name}}`,
    referencePreview: (period: string) => `Позив на број за период ${period}: `,
    amount: 'Износ',
    amountKind: 'Врста износа',
    fixed: 'Исти износ сваки пут',
    variable: 'Износ се уноси по пријему рачуна',
    schedule: 'Рокови',
    scheduleKind: 'Врста распореда',
    periodic: 'Периодично',
    dates: 'Одређени датуми',
    every: 'Период',
    start: 'Први период',
    end: 'Последњи период',
    monthPlaceholder: 'ГГГГ-ММ',
    dueKind: {
      day: 'одређени дан у месецу',
      last: 'последњи дан у месецу',
      daysFromStart: 'број дана од почетка периода',
    },
    daysFromStart: 'Дана од првог дана периода',
    daysFromStartHint: 'Порез на имовину: 44 (45. дан тромесечја).',
    day: 'Дан',
    month: 'Месец',
    monthOffset: (n: number) =>
      n === 0
        ? 'истог месеца кад почиње период'
        : n === 1
          ? 'наредног месеца'
          : `${String(n)}. месеца после почетка`,
    shiftToWorkday:
      'Ако рок падне на викенд или празник, помери га на први радни дан',
    date: (n: number) => `Датум ${String(n)}`,
    removeDate: (n: number) => `Уклони датум ${String(n)}`,
    remove: 'Уклони',
    addDate: 'Додај датум',
    graceDays: 'Дана толеранције после рока',
    graceDaysHint:
      'Необавезно. Толико дана после рока рачун се још не сматра доцњом.',
    nextDues: 'Следећи рокови: ',
    lastDue: 'Последњи рок: ',
    other: 'Остало',
  },

  occurrence: {
    fixErrors: 'Исправите грешке у форми да би се видео QR код.',
    enterAmount: 'Унесите износ да би се направио QR код.',
    qrLabel: 'IPS QR код за уплату',
    qrHint:
      'Скенирајте код у апликацији банке и проверите податке пре потврде.',
    outOfSchedule:
      'Овај период више није у распореду рачуна. Подаци су сачувани да се уплата не би изгубила.',
    deleteRecord: 'Обриши запис',
    takeAccount: 'Упиши нови рачун примаоца у рачун',
    form: 'Период',
    amountVariableHint: 'Износ са рачуна за овај период.',
    amountFixedHint: 'Оставите празно за износ из рачуна.',
    referenceModel: (model: string) => `Позив на број (модел ${model})`,
    referenceHint: 'Ако је на рачуну другачији, препишите га.',
    qr: 'QR код',
    qrSection: 'IPS QR код',
    slip: 'Уплатница',
    payment: 'Уплата',
    paidAt: 'Датум уплате',
    paidAmount: 'Уплаћено (RSD)',
    paidAmountHint: 'Празно: цео износ.',
    unpay: 'Поништи уплату',
    pay: 'Плаћено',
  },

  sections: {
    title: 'Одељци',
    add: 'Нови одељак',
    editForm: 'Измена одељка',
    color: 'Боја',
    lead: 'Одељци групишу рачуне на дијаграму, на пример „Стан“, „Порези“ или „Паушал“.',
    empty: 'Још нема одељака.',
    confirmDelete: (name: string) => `Обрисати одељак „${name}“?`,
    inUse: (name: string) =>
      `У одељку „${name}“ има рачуна. Преместите их или обришите, или архивирајте одељак.`,
    up: (name: string) => `Помери „${name}“ горе`,
    down: (name: string) => `Помери „${name}“ доле`,
  },

  profiles: {
    title: 'Платиоци',
    add: 'Нови платилац',
    editForm: 'Измена платиоца',
    name: 'Име и презиме',
    address: 'Адреса',
    jmbg: 'ЈМБГ',
    pib: 'ПИБ',
    jmbgHint: 'Необавезно. Користи се у шаблонима позива на број као {JMBG}.',
    pibHint: 'Необавезно, за предузетнике. У шаблонима: {PIB}.',
    lead: 'Платилац је онај ко плаћа: ви, супружник или ваша радња. Име и адреса иду у поље „платилац“ на уплатници.',
    empty: 'Још нема платилаца.',
    confirmDelete: (name: string) => `Обрисати платиоца „${name}“?`,
    inUse: (name: string) =>
      `Платилац „${name}“ се користи у рачунима. Прво их пребаците на другог платиоца или обришите.`,
  },

  data: {
    title: 'Подаци',
    lead: 'Подаци се чувају само у овом прегледачу. Резервна копија је датотека коју можете увести овде или у прегледачу на другом уређају.',
    backup: 'Резервна копија',
    noBackup: 'Резервна копија још није направљена.',
    lastBackup: (date: string, age: number) =>
      `Последња резервна копија: ${date} (${age === 0 ? 'данас' : `пре ${days(age)}`}).`,
    exportAll: 'Извези све (JSON)',
    sectionTemplate: 'Одељак као шаблон',
    sectionTemplateHint:
      'Рачуни из одељка и њихови платиоци, без историје плаћања и без ЈМБГ и ПИБ, да бисте их поделили са неким.',
    exportSection: 'Извези одељак',
    import: 'Увоз',
    importFile: 'Резервна копија (JSON)',
    cannotImport: (name: string) => `Датотеку „${name}“ није могуће увести:`,
    more: (n: number) => `и још ${String(n)}.`,
    contents: (
      name: string,
      date: string,
      c: { profiles: number; sections: number; bills: number; periods: number },
    ) =>
      `„${name}“ од ${date}: ` +
      [
        `${String(c.profiles)} ${p(c.profiles, { one: 'платилац', few: 'платиоца', other: 'платилаца' })}`,
        `${String(c.sections)} ${p(c.sections, { one: 'одељак', few: 'одељка', other: 'одељака' })}`,
        bills(c.bills),
        `${String(c.periods)} ${p(c.periods, { one: 'период', few: 'периода', other: 'периода' })}`,
      ].join(', ') +
      '.',
    mergeHint:
      'Спајање додаје нове записе, а постојеће мења само ако су у датотеци касније измењени. Ништа се не брише.',
    partialHint:
      ' Датотека садржи само део података, па њоме не можете заменити све.',
    merge: 'Споји',
    replace: 'Замени све',
    confirmReplace:
      'Заменити све податке садржајем датотеке? Пре замене преузима се резервна копија тренутних података.',
    merged: (added: number, updated: number, kept: number) =>
      `Увезено. Нових записа: ${String(added)}, измењених: ${String(updated)}, задржаних јер су овде исти или новији: ${String(kept)}.`,
    replaced: 'Подаци су замењени садржајем датотеке.',
    other: 'За друге програме',
    otherHint:
      'Историја плаћања отвара се у Екселу. Рокови неплаћених периода за наредну годину увозе се у календар телефона, који подсећа дан раније.',
    csv: 'Историја плаћања (CSV)',
    ics: 'Рокови за календар (ICS)',
    file: {
      beforeImport: 'uplatnica-pre-uvoza',
      payments: 'uplatnica-placanja',
      dues: 'uplatnica-rokovi',
    },
  },

  scan: {
    lead: 'Скенирајте IPS QR код са рачуна. Износ и позив на број уписују се у период рачуна, а за новог примаоца прави се нови рачун.',
    again: 'Скенирај други код',
    noMatch: 'Ниједан рачун нема овог примаоца.',
    otherAccount: 'Исти прималац, али други рачун примаоца.',
    noPeriods: 'Нема неплаћених периода.',
    pickPeriod: 'Изаберите период за који је рачун:',
    sameReference: ' (исти позив на број)',
    newBill: 'Нови рачун из овог кода',
    notIps: 'Ово није IPS QR код за плаћање.',
    invalid: 'QR код није исправан.',
  },

  scanner: {
    cameraDenied:
      'Приступ камери није дозвољен. Дозволите га у подешавањима прегледача или учитајте слику рачуна.',
    cameraMissing: 'Камера није пронађена. Учитајте слику рачуна.',
    cameraFailed: 'Камера није могла да се покрене. Учитајте слику рачуна.',
    video: 'Слика са камере',
    aim: 'Усмерите камеру тако да QR код буде унутар оквира.',
    noQrPdf:
      'У PDF-у није пронађен QR код. Ако је код нацртан, а не уметнут као слика, направите снимак екрана и учитајте њега.',
    noQrImage:
      'На слици није пронађен QR код. Пробајте оштрију слику на којој код заузима више места.',
    unreadable: 'Датотека није могла да се прочита.',
    camera: 'Камера',
    stopCamera: 'Заустави камеру',
    file: 'Слика или PDF рачуна',
    text: 'Текст кода',
    textLabel: 'Текст IPS QR кода',
    loadText: 'Учитај текст',
    searching: 'Тражим QR код…',
  },

  print: {
    one: 'Уплатница',
    many: 'Уплатнице',
    pdf: 'Преузми PDF',
    print: 'Штампај',
    hint: 'Штампајте на А4 без уклапања у страну, у размери 100 %, да би уплатница имала праву величину. На један лист стају три.',
    pdfFailed: 'PDF није направљен. Покушајте поново.',
    missing: (n: number) =>
      n === 1
        ? 'Један рачун или период више не постоји.'
        : `${String(n)} рачуна или периода више не постоје.`,
    none: 'Није изабрана ниједна уплатница.',
    noQr: 'Уплатница је без QR кода:',
    noAmount: 'Износ још није унет, па уплатница нема износ ни QR код.',
    overflow:
      'Текст не стаје у три реда од 35 знакова и одсечен је на уплатници.',
  },

  qrFields: {
    payee: 'Прималац',
    account: 'Рачун',
    amount: 'Износ',
    paymentCode: 'Шифра плаћања',
    purpose: 'Сврха',
    reference: 'Позив на број',
    payeeReference: 'Референца примаоца',
    payer: 'Платилац',
  },

  issue: {
    required: 'Обавезно поље.',
    tooLong: (max: number) =>
      `Највише ${String(max)} знакова, колико стаје у IPS QR код.`,
    chars: 'Садржи знакове које IPS QR код не дозвољава.',
    integer: (min: number, max: number) =>
      `Унесите цео број од ${String(min)} до ${String(max)}.`,
    notFound: 'Изабрана ставка више не постоји.',
    color: 'Боја у облику #rrggbb.',
    accountFormat: 'Рачун се пише као 160-602-16 или као 18 цифара.',
    accountChecksum: 'Контролни број рачуна није исправан. Проверите цифре.',
    jmbgFormat: 'ЈМБГ има 13 цифара.',
    jmbgChecksum: 'Контролна цифра ЈМБГ-а не одговара. Проверите број.',
    pibFormat: 'ПИБ има 9 цифара.',
    pibChecksum: 'Контролна цифра ПИБ-а не одговара. Проверите број.',
    payerTooLong:
      'Име и адреса заједно имају више од 70 знакова и неће стати у IPS QR код.',
    paymentCode: 'Непозната шифра плаћања.',
    paymentCodeNotQr: 'IPS QR код прихвата само шифре које почињу са 1 или 2.',
    amount: 'Неисправан износ.',
    month: 'Месец у облику ГГГГ-ММ.',
    date: 'Неисправан датум.',
    endBeforeStart: 'Крај је пре почетка.',
    noDates: 'Додајте бар један датум.',
    templateSyntax: 'Шаблон није исправан: проверите витичасте заграде.',
    templateTooLong: (width: number) =>
      `Вредност је дужа од ${String(width)} знакова.`,
    profileMissing: (field: 'JMBG' | 'PIB') =>
      `Платилац нема унет ${field === 'JMBG' ? 'ЈМБГ' : 'ПИБ'}.`,
    model97HasControl:
      'Изгледа да позив на број већ почиње контролним бројем. За модел 97 он се додаје сам: унесите позив на број без прве две цифре.',
    reference: {
      empty: 'Позив на број је празан.',
      chars: 'Позив на број садржи недозвољене знакове.',
      length: 'Позив на број је дужи од 23 знака.',
      structure: 'Позив на број нема структуру коју модел захтева.',
      checksum: 'Контролни број у позиву на број није исправан.',
    },
  },

  qrIssue: {
    tooLarge: 'Подаци не стају у IPS QR код.',
    general: 'Подаци нису исправни за IPS QR код.',
    fields: {
      R: 'Рачун примаоца',
      N: 'Назив примаоца',
      I: 'Износ',
      P: 'Платилац',
      SF: 'Шифра плаћања',
      S: 'Сврха уплате',
      RO: 'Позив на број',
    },
    codes: {
      missing: 'недостаје',
      invalid: 'није исправно',
      checksum: 'контролни број није исправан',
      length: 'предугачко',
      lines: 'превише редова',
      chars: 'недозвољени знакови',
    },
    field: (field: string, problem: string) => `${field}: ${problem}.`,
  },

  importIssue: {
    file: 'Датотека',
    notJson: 'Датотека није исправан JSON.',
    notBackup: 'Ово није резервна копија Уплатнице.',
    version: 'Датотека нема исправну верзију шеме.',
    newer: (version: number) =>
      `Датотеку је направила новија верзија апликације (шема ${String(version)}). Освежите страницу и покушајте поново.`,
    invalid: (path: string) => `${path}: неисправна вредност.`,
    unknownKeys: (path: string, keys: string) =>
      `${path}: непозната поља ${keys}.`,
    duplicate: (path: string) => `${path}: запис се понавља.`,
    missingRef: (path: string) =>
      `${path}: упућује на запис којег нема у датотеци.`,
  },

  scanNote: {
    noModel: 'без модела',
    model: (m: string) => `модел ${m}`,
    account: (scanned: string, current: string) =>
      `Рачун примаоца на коду је ${scanned}, а у рачуну је ${current}.`,
    modelMismatch: (scanned: string, current: string) =>
      `Позив на број на коду је ${scanned}, а рачун користи ${current}, па није преузет.`,
    unsupportedModel: (model: string) =>
      `Позив на број на коду је по моделу ${model}, који апликација не подржава, па није преузет.`,
    paymentCode: (scanned: string, current: string) =>
      `Шифра плаћања на коду је ${scanned}, а у рачуну ${current}. Уплатница користи шифру из рачуна.`,
    noAmount: 'Код нема износ, па износ није преузет.',
    payeeReference: (value: string) =>
      `Уместо позива на број код има референцу примаоца ${value}, која није преузета.`,
  },

  csv: {
    header: [
      'Датум плаћања',
      'Одељак',
      'Назив',
      'Период',
      'Рок',
      'Износ',
      'Плаћено',
      'Прималац',
      'Рачун примаоца',
      'Шифра плаћања',
      'Модел',
      'Позив на број',
      'Платилац',
      'Напомена',
    ],
  },

  ics: {
    period: 'Период',
    amount: 'Износ',
    noAmount: 'још није унет',
    payee: 'Прималац',
    account: 'Рачун',
    paymentCode: 'Шифра плаћања',
    reference: 'Позив на број',
  },
};
