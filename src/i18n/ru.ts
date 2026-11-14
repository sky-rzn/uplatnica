import type { ComponentChildren } from 'preact';
import { pluralizer } from './plural';
import type { Messages } from './sr-Latn';

const p = pluralizer('ru');

const days = (n: number) =>
  `${String(n)} ${p(n, { one: 'день', few: 'дня', many: 'дней', other: 'дня' })}`;
const bills = (n: number) =>
  `${String(n)} ${p(n, { one: 'счёт', few: 'счёта', many: 'счетов', other: 'счёта' })}`;

export const ru: Messages = {
  date: (d: string, m: string, y: string) => `${d}.${m}.${y}`,
  months: [
    'январь',
    'февраль',
    'март',
    'апрель',
    'май',
    'июнь',
    'июль',
    'август',
    'сентябрь',
    'октябрь',
    'ноябрь',
    'декабрь',
  ],
  monthsShort: [
    'янв',
    'фев',
    'мар',
    'апр',
    'май',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
  ],
  monthYear: (month: string, year: number) => `${month} ${String(year)}`,
  quarter: (q: string, year: string) => `${q} квартал ${year}`,
  year: (year: string) => `${year} год`,

  status: {
    paid: 'оплачено',
    partial: 'оплачено частично',
    overdue: 'просрочено',
    'awaiting-amount': 'ждёт сумму',
    due: 'к оплате',
    upcoming: 'предстоит',
  },
  dueIn: {
    today: 'сегодня',
    tomorrow: 'завтра',
    yesterday: 'вчера',
    later: (n: number) => `через ${days(n)}`,
    earlier: (n: number) => `${days(n)} назад`,
  },

  schedule: {
    every: {
      1: 'ежемесячно',
      2: 'раз в 2 месяца',
      3: 'ежеквартально',
      4: 'раз в 4 месяца',
      6: 'раз в полгода',
      12: 'ежегодно',
    },
    daysFromStart: (day: number) => `${String(day)}-й день периода`,
    lastDay: 'последнее число',
    day: (day: number) => `${String(day)}-е число`,
    sameMonth: (day: string) => `${day} месяца`,
    nextMonth: (day: string) => `${day} следующего месяца`,
    laterMonth: (day: string, months: number) =>
      `${day} через ${String(months)} ${p(months, { one: 'месяц', few: 'месяца', many: 'месяцев', other: 'месяца' })}`,
    once: 'однократно',
    dates: (n: number) =>
      `${String(n)} ${p(n, { one: 'дата', few: 'даты', many: 'дат', other: 'даты' })}`,
    periodic: (every: string, due: string) => `${every}, срок — ${due}`,
  },

  common: {
    save: 'Сохранить',
    cancel: 'Отмена',
    edit: 'Изменить',
    delete: 'Удалить',
    back: 'Назад',
    close: 'Закрыть',
    all: 'все',
    archived: 'В архиве',
    archivedHidden: 'В архиве (скрыт с диаграммы)',
    optional: 'Необязательно.',
    section: 'Раздел',
    payer: 'Плательщик',
    name: 'Название',
    note: 'Заметка',
    amountRsd: 'Сумма (RSD)',
    reference: 'Poziv na broj',
    paymentCode: 'Šifra plaćanja',
    dueDate: 'Срок оплаты',
    scanBill: 'Сканировать счёт',
    scanning: 'Сканирование счёта',
    newBill: 'Новый счёт',
    due: (date: string) => `срок ${date}`,
  },

  app: {
    brand: 'Uplatnica',
    mainMenu: 'Главное меню',
    skip: 'К содержимому',
    nav: {
      timeline: 'Обзор',
      bills: 'Счета',
      sections: 'Разделы',
      profiles: 'Плательщики',
      data: 'Данные',
      settings: 'Настройки',
    },
    privacy: 'Все данные остаются в этом браузере.',
    backupNever: 'Сделайте резервную копию.',
    backupAge: (n: number) => `Последняя резервная копия — ${days(n)} назад.`,
  },

  settings: {
    title: 'Настройки',
    language: 'Язык',
    theme: 'Тема',
    themes: {
      system: 'как в системе',
      light: 'светлая',
      dark: 'тёмная',
    },
  },

  setup: {
    lead: 'Перед первым счётом нужны:',
    payer: (link: (text: string) => ComponentChildren) => [
      link('плательщик'),
      ' — кто платит;',
    ],
    section: (link: (text: string) => ComponentChildren) => [
      link('раздел'),
      ' — группа счетов, например «Квартира».',
    ],
  },

  overview: {
    title: 'Обзор',
    view: 'Вид',
    timeline: 'Диаграмма',
    list: 'Список',
    nothing: 'Сейчас платить нечего.',
    dueNow: 'К оплате сейчас: ',
    overdue: 'Просрочено: ',
    noBills: (link: (text: string) => ComponentChildren) => [
      'Счетов пока нет. Добавьте их на странице ',
      link('Счета'),
      '.',
    ],
    total: (count: number, sum: string) => `${bills(count)}, ${sum}`,
    totalUnknown: (count: number) => `${bills(count)} без суммы`,
    totalPartly: (count: number, sum: string, unknown: number) =>
      `${bills(count)}, ${sum} + ${String(unknown)} без суммы`,
  },

  timeline: {
    zoom: { '6m': '6 месяцев', '1y': '1 год', '3y': '3 года' },
    scale: 'Масштаб',
    shift: 'Сдвиг',
    earlier: 'Раньше',
    today: 'Сегодня',
    later: 'Позже',
    unpaidOnly: 'Только неоплаченные',
    rowTotal: 'Итого со сроком в показанном периоде',
    noMatch: 'Ни один счёт не подходит под фильтр.',
    legend: 'Легенда',
  },

  list: {
    groups: { overdue: 'Просрочено', now: 'К оплате', soon: 'Скоро' },
    pick: (title: string) => `Выбрать для печати: ${title}`,
    nothingAhead: (n: number) =>
      `Нет неоплаченных счетов со сроком в ближайшие ${String(n)} дней.`,
    pickAll: 'Выбрать все',
    print: 'Печать уплатниц',
  },

  bills: {
    title: 'Счета',
    empty: 'Счетов пока нет.',
    nextDue: (date: string) => `следующий срок ${date}`,
    variable: 'сумма по счёту',
  },

  billEditor: {
    notFound: 'Счёт не найден',
    backToBills: 'Назад к счетам',
    editForm: 'Изменение счёта',
    confirmDelete: (title: string) =>
      `Удалить счёт «${title}» вместе со всеми введёнными суммами и оплатами?`,
    fillFromQr: 'Заполнить из QR-кода',
    fillFromQrHint:
      'Получатель, счёт, шифра, назначение и poziv na broj берутся из IPS QR-кода на счёте.',
    basics: 'Основное',
    titleHint: 'Как счёт будет называться на диаграмме, например «Infostan».',
    payee: 'Получатель',
    payeeName: 'Название получателя',
    payeeAddress: 'Адрес получателя',
    account: 'Счёт получателя',
    payment: 'Платёж',
    paymentCodeHint:
      'Первая цифра: 1 — наличными, 2 — безналично. Частые шифры: 289, 253, 221.',
    purpose: 'Назначение платежа (svrha uplate)',
    model: 'Модель',
    noModel: 'без модели',
    referenceHint:
      'Можно шаблон: {JMBG}, {PIB}, {YYYY}, {YY}, {MM}, {Q} и свои поля, например {NAPLATNI:11}.',
    referenceHint97: ' Контрольное число для модели 97 добавляется само.',
    varValue: (name: string) => `Значение для {${name}}`,
    referencePreview: (period: string) => `Poziv na broj за период ${period}: `,
    amount: 'Сумма',
    amountKind: 'Вид суммы',
    fixed: 'Каждый раз одна и та же сумма',
    variable: 'Сумма вводится при получении счёта',
    schedule: 'Сроки',
    scheduleKind: 'Вид расписания',
    periodic: 'Периодически',
    dates: 'Конкретные даты',
    every: 'Период',
    start: 'Первый период',
    end: 'Последний период',
    monthPlaceholder: 'ГГГГ-ММ',
    dueKind: {
      day: 'определённое число месяца',
      last: 'последнее число месяца',
      daysFromStart: 'число дней от начала периода',
    },
    daysFromStart: 'Дней от первого дня периода',
    daysFromStartHint: 'Налог на имущество: 44 (45-й день квартала).',
    day: 'Число',
    month: 'Месяц',
    monthOffset: (n: number) =>
      n === 0
        ? 'того же месяца, когда начинается период'
        : n === 1
          ? 'следующего месяца'
          : `${String(n)}-го месяца после начала`,
    shiftToWorkday:
      'Если срок выпадает на выходной или праздник, перенести его на ближайший рабочий день',
    date: (n: number) => `Дата ${String(n)}`,
    removeDate: (n: number) => `Убрать дату ${String(n)}`,
    remove: 'Убрать',
    addDate: 'Добавить дату',
    graceDays: 'Дней отсрочки после срока',
    graceDaysHint:
      'Необязательно. Столько дней после срока счёт ещё не считается просроченным.',
    nextDues: 'Следующие сроки: ',
    lastDue: 'Последний срок: ',
    other: 'Прочее',
  },

  presets: {
    label: 'Шаблон',
    none: 'без шаблона',
    groups: {
      pausal: 'Паушал (ИП)',
      'property-tax': 'Налог на имущество',
      utilities: 'Коммунальные',
    },
    notes: {
      pausal:
        'Сумму и poziv na broj перепишите из решения налоговой в ePorezi; они меняются каждый год. Poziv na broj вводите без первых двух цифр, контрольное число добавится само.',
      'property-tax':
        'Название получателя, сумму взноса и poziv na broj перепишите из решения о налоге на имущество. Poziv na broj вводите без первых двух цифр, контрольное число добавится само.',
      utilities:
        'Наплатный номер есть на счёте за электричество. Счёт 200-75409-96 действует для Белграда начиная с октябрьского счёта 2026; в других городах заполните счёт из QR-кода.',
    },
    checked: (date: string) =>
      `Данные проверены ${date}. Перед оплатой сверьте их с решением или счётом.`,
  },

  occurrence: {
    fixErrors: 'Исправьте ошибки в форме, чтобы увидеть QR-код.',
    enterAmount: 'Введите сумму, чтобы получить QR-код.',
    qrLabel: 'IPS QR-код для оплаты',
    qrHint:
      'Отсканируйте код в приложении банка и проверьте данные перед подтверждением.',
    outOfSchedule:
      'Этого периода больше нет в расписании счёта. Данные сохранены, чтобы оплата не потерялась.',
    deleteRecord: 'Удалить запись',
    takeAccount: 'Записать новый счёт получателя в счёт',
    form: 'Период',
    amountVariableHint: 'Сумма со счёта за этот период.',
    amountFixedHint: 'Оставьте пустым, чтобы взять сумму из счёта.',
    referenceModel: (model: string) => `Poziv na broj (модель ${model})`,
    referenceHint: 'Если на счёте он другой, перепишите его.',
    qr: 'QR-код',
    qrSection: 'IPS QR-код',
    slip: 'Уплатница',
    payment: 'Оплата',
    paidAt: 'Дата оплаты',
    paidAmount: 'Оплачено (RSD)',
    paidAmountHint: 'Пусто — вся сумма.',
    unpay: 'Отменить оплату',
    pay: 'Оплачено',
  },

  sections: {
    title: 'Разделы',
    add: 'Новый раздел',
    editForm: 'Изменение раздела',
    color: 'Цвет',
    lead: 'Разделы группируют счета на диаграмме, например «Квартира», «Налоги» или «Паушал».',
    empty: 'Разделов пока нет.',
    confirmDelete: (name: string) => `Удалить раздел «${name}»?`,
    inUse: (name: string) =>
      `В разделе «${name}» есть счета. Перенесите или удалите их либо отправьте раздел в архив.`,
    up: (name: string) => `Переместить «${name}» выше`,
    down: (name: string) => `Переместить «${name}» ниже`,
  },

  profiles: {
    title: 'Плательщики',
    add: 'Новый плательщик',
    editForm: 'Изменение плательщика',
    name: 'Имя и фамилия',
    address: 'Адрес',
    jmbg: 'JMBG',
    pib: 'PIB',
    jmbgHint:
      'Необязательно. Используется в шаблонах poziva na broj как {JMBG}.',
    pibHint: 'Необязательно, для ИП. В шаблонах: {PIB}.',
    lead: 'Плательщик — тот, кто платит: вы, супруг или ваше ИП. Имя и адрес попадают в поле «platilac» уплатницы.',
    empty: 'Плательщиков пока нет.',
    confirmDelete: (name: string) => `Удалить плательщика «${name}»?`,
    inUse: (name: string) =>
      `Плательщик «${name}» используется в счетах. Сначала переведите их на другого плательщика или удалите.`,
  },

  data: {
    title: 'Данные',
    lead: 'Данные хранятся только в этом браузере. Резервная копия — это файл, который можно импортировать здесь или в браузере на другом устройстве.',
    backup: 'Резервная копия',
    noBackup: 'Резервная копия ещё не сделана.',
    lastBackup: (date: string, age: number) =>
      `Последняя резервная копия: ${date} (${age === 0 ? 'сегодня' : `${days(age)} назад`}).`,
    exportAll: 'Экспортировать всё (JSON)',
    sectionTemplate: 'Раздел как шаблон',
    sectionTemplateHint:
      'Счета раздела и их плательщики, без истории платежей и без JMBG и PIB, чтобы поделиться ими с кем-нибудь.',
    exportSection: 'Экспортировать раздел',
    import: 'Импорт',
    importFile: 'Резервная копия (JSON)',
    cannotImport: (name: string) => `Файл «${name}» нельзя импортировать:`,
    more: (n: number) => `и ещё ${String(n)}.`,
    contents: (
      name: string,
      date: string,
      c: { profiles: number; sections: number; bills: number; periods: number },
    ) =>
      `«${name}» от ${date}: ` +
      [
        `${String(c.profiles)} ${p(c.profiles, { one: 'плательщик', few: 'плательщика', many: 'плательщиков', other: 'плательщика' })}`,
        `${String(c.sections)} ${p(c.sections, { one: 'раздел', few: 'раздела', many: 'разделов', other: 'раздела' })}`,
        bills(c.bills),
        `${String(c.periods)} ${p(c.periods, { one: 'период', few: 'периода', many: 'периодов', other: 'периода' })}`,
      ].join(', ') +
      '.',
    mergeHint:
      'Объединение добавляет новые записи, а существующие меняет, только если в файле они изменены позже. Записи, удалённые на другом устройстве, удаляются и здесь, если здесь их не меняли позже.',
    partialHint:
      ' Файл содержит только часть данных, поэтому заменить им всё нельзя.',
    merge: 'Объединить',
    replace: 'Заменить всё',
    confirmReplace:
      'Заменить все данные содержимым файла? Перед заменой скачивается резервная копия текущих данных.',
    merged: (added: number, updated: number, kept: number, deleted: number) =>
      `Импортировано. Новых записей: ${String(added)}, изменённых: ${String(updated)}, оставлено, потому что здесь они такие же или новее: ${String(kept)}, удалённых: ${String(deleted)}.`,
    replaced: 'Данные заменены содержимым файла.',
    other: 'Для других программ',
    otherHint:
      'История платежей открывается в Excel. Сроки неоплаченных периодов на год вперёд импортируются в календарь телефона, который напомнит за день.',
    csv: 'История платежей (CSV)',
    ics: 'Сроки для календаря (ICS)',
    file: {
      beforeImport: 'uplatnica-pered-importom',
      payments: 'uplatnica-platezhi',
      dues: 'uplatnica-sroki',
    },
  },

  sync: {
    title: 'Синхронизация',
    lead: 'Устройства обмениваются данными через QR-код на экране, без интернета и сервера. Одно показывает код, другое считывает его камерой, а потом наоборот, чтобы и первое получило изменения.',
    dataHint:
      'Телефон и компьютер обмениваются изменениями через QR-код на экране. Данные не уходят ни на какой сервер.',
    open: 'Синхронизировать с другим устройством',
    deviceName: 'Название этого устройства',
    deviceNameHint: 'Под этим названием его видят другие устройства.',
    show: 'Показать код',
    scan: 'Считать код',
    stop: 'Выключить камеру',
    noCamera:
      'Камера недоступна, поэтому это устройство может только показывать код.',
    target: 'Для устройства',
    newDevice: 'Новое устройство (все данные)',
    peer: (name: string, date: string) => `${name}, последний раз ${date}`,
    qrLabel: 'Анимированный QR-код для синхронизации',
    frames: (n: number) =>
      n === 1
        ? 'На другом устройстве откройте «Синхронизацию», выберите «Считать код» и наведите камеру на этот код.'
        : `Код состоит из ${String(n)} частей, которые сменяются сами. На другом устройстве откройте «Синхронизацию», выберите «Считать код» и держите камеру на экране, пока код не загрузится. Пропущенные части восполняются.`,
    waiting: 'Наведите камеру на код на другом устройстве.',
    received: (got: number, total: number) =>
      `Получено частей: ${String(got)} из ${String(total)}.`,
    foreign: 'Это не код синхронизации.',
    own: 'Это код с этого же устройства.',
    newer:
      'Код создан более новой версией приложения. Обновите страницу на этом устройстве.',
    invalid: 'Данные в коде не прошли проверку.',
    done: (name: string, added: number, updated: number, deleted: number) =>
      `Синхронизировано с «${name}». Новых записей: ${String(added)}, изменённых: ${String(updated)}, удалённых: ${String(deleted)}.`,
    replyHint: (name: string) =>
      `Чтобы «${name}» получило изменения с этого устройства, покажите ему ответ.`,
    reply: 'Показать ответ',
  },
  scan: {
    lead: 'Отсканируйте IPS QR-код со счёта. Сумма и poziv na broj записываются в период счёта, а для нового получателя создаётся новый счёт.',
    again: 'Сканировать другой код',
    noMatch: 'Ни у одного счёта нет такого получателя.',
    otherAccount: 'Тот же получатель, но другой счёт получателя.',
    noPeriods: 'Нет неоплаченных периодов.',
    pickPeriod: 'Выберите период, за который этот счёт:',
    sameReference: ' (тот же poziv na broj)',
    newBill: 'Новый счёт из этого кода',
    notIps: 'Это не платёжный IPS QR-код.',
    invalid: 'QR-код неправильный.',
  },

  scanner: {
    cameraDenied:
      'Доступ к камере запрещён. Разрешите его в настройках браузера или загрузите фото счёта.',
    cameraMissing: 'Камера не найдена. Загрузите фото счёта.',
    cameraFailed: 'Камера не запустилась. Загрузите фото счёта.',
    video: 'Изображение с камеры',
    zoom: 'Увеличение',
    aim: 'Наведите камеру так, чтобы QR-код оказался в рамке.',
    noQrPdf:
      'В PDF не найден QR-код. Если код нарисован, а не вставлен картинкой, сделайте снимок экрана и загрузите его.',
    noQrImage:
      'На картинке не найден QR-код. Попробуйте более чёткое фото, на котором код занимает больше места.',
    unreadable: 'Файл не удалось прочитать.',
    camera: 'Камера',
    stopCamera: 'Остановить камеру',
    file: 'Фото или PDF счёта',
    text: 'Текст кода',
    textLabel: 'Текст IPS QR-кода',
    loadText: 'Загрузить текст',
    searching: 'Ищу QR-код…',
  },

  print: {
    one: 'Уплатница',
    many: 'Уплатницы',
    pdf: 'Скачать PDF',
    print: 'Печать',
    hint: 'Печатайте на A4 без подгонки по размеру страницы, в масштабе 100 %, чтобы уплатница была настоящего размера. На лист помещаются три.',
    pdfFailed: 'PDF не создан. Попробуйте ещё раз.',
    missing: (n: number) =>
      n === 1
        ? 'Один счёт или период больше не существует.'
        : `${String(n)} счетов или периодов больше не существуют.`,
    none: 'Не выбрано ни одной уплатницы.',
    noQr: 'Уплатница без QR-кода:',
    noAmount:
      'Сумма ещё не введена, поэтому на уплатнице нет ни суммы, ни QR-кода.',
    overflow:
      'Текст не помещается в три строки по 35 знаков и обрезан на уплатнице.',
  },

  qrFields: {
    payee: 'Получатель',
    account: 'Счёт',
    amount: 'Сумма',
    paymentCode: 'Šifra plaćanja',
    purpose: 'Назначение',
    reference: 'Poziv na broj',
    payeeReference: 'Референс получателя',
    payer: 'Плательщик',
  },

  issue: {
    required: 'Обязательное поле.',
    tooLong: (max: number) =>
      `Не больше ${String(max)} знаков — столько помещается в IPS QR-код.`,
    chars: 'Содержит знаки, которые IPS QR-код не допускает.',
    integer: (min: number, max: number) =>
      `Введите целое число от ${String(min)} до ${String(max)}.`,
    notFound: 'Выбранного элемента больше нет.',
    color: 'Цвет в виде #rrggbb.',
    accountFormat: 'Счёт пишется как 160-602-16 или 18 цифрами.',
    accountChecksum: 'Неверное контрольное число счёта. Проверьте цифры.',
    jmbgFormat: 'В JMBG 13 цифр.',
    jmbgChecksum: 'Контрольная цифра JMBG не сходится. Проверьте номер.',
    pibFormat: 'В PIB 9 цифр.',
    pibChecksum: 'Контрольная цифра PIB не сходится. Проверьте номер.',
    payerTooLong:
      'Имя и адрес вместе длиннее 70 знаков и не поместятся в IPS QR-код.',
    paymentCode: 'Неизвестная šifra plaćanja.',
    paymentCodeNotQr:
      'IPS QR-код принимает только шифры, начинающиеся с 1 или 2.',
    amount: 'Неправильная сумма.',
    month: 'Месяц в виде ГГГГ-ММ.',
    date: 'Неправильная дата.',
    endBeforeStart: 'Конец раньше начала.',
    noDates: 'Добавьте хотя бы одну дату.',
    templateSyntax: 'Шаблон неправильный: проверьте фигурные скобки.',
    templateTooLong: (width: number) =>
      `Значение длиннее ${String(width)} знаков.`,
    profileMissing: (field: 'JMBG' | 'PIB') =>
      `У плательщика не указан ${field === 'JMBG' ? 'JMBG' : 'PIB'}.`,
    model97HasControl:
      'Похоже, poziv na broj уже начинается с контрольного числа. Для модели 97 оно добавляется само: введите poziv na broj без первых двух цифр.',
    reference: {
      empty: 'Poziv na broj пустой.',
      chars: 'Poziv na broj содержит недопустимые знаки.',
      length: 'Poziv na broj длиннее 23 знаков.',
      structure:
        'Poziv na broj не соответствует структуре, которую требует модель.',
      checksum: 'Неверное контрольное число в pozivu na broj.',
    },
  },

  qrIssue: {
    tooLarge: 'Данные не помещаются в IPS QR-код.',
    general: 'Данные не подходят для IPS QR-кода.',
    fields: {
      R: 'Счёт получателя',
      N: 'Название получателя',
      I: 'Сумма',
      P: 'Плательщик',
      SF: 'Šifra plaćanja',
      S: 'Назначение платежа',
      RO: 'Poziv na broj',
    },
    codes: {
      missing: 'отсутствует',
      invalid: 'неправильно',
      checksum: 'неверное контрольное число',
      length: 'слишком длинно',
      lines: 'слишком много строк',
      chars: 'недопустимые знаки',
    },
    field: (field: string, problem: string) => `${field}: ${problem}.`,
  },

  importIssue: {
    file: 'Файл',
    notJson: 'Файл — не правильный JSON.',
    notBackup: 'Это не резервная копия Uplatnica.',
    version: 'В файле нет правильной версии схемы.',
    newer: (version: number) =>
      `Файл создан более новой версией приложения (схема ${String(version)}). Обновите страницу и попробуйте ещё раз.`,
    invalid: (path: string) => `${path}: неправильное значение.`,
    unknownKeys: (path: string, keys: string) =>
      `${path}: неизвестные поля ${keys}.`,
    duplicate: (path: string) => `${path}: запись повторяется.`,
    missingRef: (path: string) =>
      `${path}: ссылается на запись, которой нет в файле.`,
  },

  scanNote: {
    noModel: 'без модели',
    model: (m: string) => `модель ${m}`,
    account: (scanned: string, current: string) =>
      `Счёт получателя в коде — ${scanned}, а в счёте — ${current}.`,
    modelMismatch: (scanned: string, current: string) =>
      `Poziv na broj в коде — ${scanned}, а счёт использует ${current}, поэтому он не взят.`,
    unsupportedModel: (model: string) =>
      `Poziv na broj в коде по модели ${model}, которую приложение не поддерживает, поэтому он не взят.`,
    paymentCode: (scanned: string, current: string) =>
      `Šifra plaćanja в коде — ${scanned}, а в счёте — ${current}. Уплатница использует шифру из счёта.`,
    noAmount: 'В коде нет суммы, поэтому сумма не взята.',
    payeeReference: (value: string) =>
      `Вместо poziva na broj в коде референс получателя ${value}, он не взят.`,
  },

  csv: {
    header: [
      'Дата оплаты',
      'Раздел',
      'Название',
      'Период',
      'Срок',
      'Сумма',
      'Оплачено',
      'Получатель',
      'Счёт получателя',
      'Šifra plaćanja',
      'Модель',
      'Poziv na broj',
      'Плательщик',
      'Заметка',
    ],
  },

  ics: {
    period: 'Период',
    amount: 'Сумма',
    noAmount: 'ещё не введена',
    payee: 'Получатель',
    account: 'Счёт',
    paymentCode: 'Šifra plaćanja',
    reference: 'Poziv na broj',
  },
};
