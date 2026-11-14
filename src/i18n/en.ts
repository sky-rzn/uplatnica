import type { ComponentChildren } from 'preact';
import { pluralizer } from './plural';
import type { Messages } from './sr-Latn';

const p = pluralizer('en');

const days = (n: number) =>
  `${String(n)} ${p(n, { one: 'day', other: 'days' })}`;
const bills = (n: number) =>
  `${String(n)} ${p(n, { one: 'bill', other: 'bills' })}`;
const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${String(n)}th`;
  const suffix = ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${String(n)}${suffix}`;
};

export const en: Messages = {
  date: (d: string, m: string, y: string) => `${d}.${m}.${y}`,
  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthsShort: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
  monthYear: (month: string, year: number) => `${month} ${String(year)}`,
  quarter: (q: string, year: string) => `Q${q} ${year}`,
  year: (year: string) => `year ${year}`,

  status: {
    paid: 'paid',
    partial: 'partly paid',
    overdue: 'overdue',
    'awaiting-amount': 'awaiting amount',
    due: 'due',
    upcoming: 'upcoming',
  },
  dueIn: {
    today: 'today',
    tomorrow: 'tomorrow',
    yesterday: 'yesterday',
    later: (n: number) => `in ${days(n)}`,
    earlier: (n: number) => `${days(n)} ago`,
  },

  schedule: {
    every: {
      1: 'monthly',
      2: 'every 2 months',
      3: 'quarterly',
      4: 'every 4 months',
      6: 'every 6 months',
      12: 'yearly',
    },
    daysFromStart: (day: number) => `${ordinal(day)} day of the period`,
    lastDay: 'the last day',
    day: (day: number) => `the ${ordinal(day)}`,
    sameMonth: (day: string) => `${day} of the month`,
    nextMonth: (day: string) => `${day} of the next month`,
    laterMonth: (day: string, months: number) =>
      `${day}, ${String(months)} months later`,
    once: 'once',
    dates: (n: number) =>
      `${String(n)} ${p(n, { one: 'date', other: 'dates' })}`,
    periodic: (every: string, due: string) => `${every}, due ${due}`,
  },

  common: {
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    close: 'Close',
    all: 'all',
    archived: 'Archived',
    archivedHidden: 'Archived (hidden from the timeline)',
    optional: 'Optional.',
    section: 'Section',
    payer: 'Payer',
    name: 'Name',
    note: 'Note',
    amountRsd: 'Amount (RSD)',
    reference: 'Poziv na broj (reference)',
    paymentCode: 'Šifra plaćanja (payment code)',
    dueDate: 'Due date',
    scanBill: 'Scan a bill',
    scanning: 'Scanning a bill',
    newBill: 'New bill',
    due: (date: string) => `due ${date}`,
  },

  app: {
    brand: 'Uplatnica',
    mainMenu: 'Main menu',
    nav: {
      timeline: 'Overview',
      bills: 'Bills',
      sections: 'Sections',
      profiles: 'Payers',
      data: 'Data',
      settings: 'Settings',
    },
    privacy: 'All data stays in this browser.',
    backupNever: 'Make a backup.',
    backupAge: (n: number) => `The last backup was ${days(n)} ago.`,
  },

  settings: {
    title: 'Settings',
    language: 'Language',
  },

  setup: {
    lead: 'Before the first bill you need:',
    payer: (link: (text: string) => ComponentChildren) => [
      'a ',
      link('payer'),
      ', the one who pays;',
    ],
    section: (link: (text: string) => ComponentChildren) => [
      'a ',
      link('section'),
      ', a group of bills such as “Flat”.',
    ],
  },

  overview: {
    title: 'Overview',
    view: 'View',
    timeline: 'Timeline',
    list: 'List',
    nothing: 'Nothing to pay right now.',
    dueNow: 'Due now: ',
    overdue: 'Overdue: ',
    noBills: (link: (text: string) => ComponentChildren) => [
      'No bills yet. Add them on the ',
      link('Bills'),
      ' page.',
    ],
    total: (count: number, sum: string) => `${bills(count)}, ${sum}`,
    totalUnknown: (count: number) => `${bills(count)} without an amount`,
    totalPartly: (count: number, sum: string, unknown: number) =>
      `${bills(count)}, ${sum} + ${String(unknown)} without an amount`,
  },

  timeline: {
    zoom: { '6m': '6 months', '1y': '1 year', '3y': '3 years' },
    scale: 'Scale',
    shift: 'Move',
    earlier: 'Earlier',
    today: 'Today',
    later: 'Later',
    unpaidOnly: 'Unpaid only',
    rowTotal: 'Total due within the shown period',
    noMatch: 'No bill matches the filter.',
    legend: 'Legend',
  },

  list: {
    groups: { overdue: 'Overdue', now: 'Due', soon: 'Soon' },
    pick: (title: string) => `Select for printing: ${title}`,
    nothingAhead: (n: number) =>
      `No unpaid bills due in the next ${String(n)} days.`,
    pickAll: 'Select all',
    print: 'Print slips',
  },

  bills: {
    title: 'Bills',
    empty: 'No bills yet.',
    nextDue: (date: string) => `next due ${date}`,
    variable: 'amount per bill',
  },

  billEditor: {
    notFound: 'Bill not found',
    backToBills: 'Back to bills',
    editForm: 'Edit bill',
    confirmDelete: (title: string) =>
      `Delete the bill “${title}” together with all entered amounts and payments?`,
    fillFromQr: 'Fill in from a QR code',
    fillFromQrHint:
      'The payee, account, payment code, purpose and reference are taken from the IPS QR code on the bill.',
    basics: 'Basics',
    titleHint:
      'What the bill is called on the timeline, for example “Infostan”.',
    payee: 'Payee',
    payeeName: 'Payee name',
    payeeAddress: 'Payee address',
    account: 'Payee account',
    payment: 'Payment',
    paymentCodeHint:
      'First digit: 1 cash, 2 non-cash payment. Common codes: 289, 253, 221.',
    purpose: 'Svrha uplate (purpose)',
    model: 'Model',
    noModel: 'no model',
    referenceHint:
      'Can be a template: {JMBG}, {PIB}, {YYYY}, {YY}, {MM}, {Q} and your own fields, e.g. {NAPLATNI:11}.',
    referenceHint97: ' The model 97 check digits are added automatically.',
    varValue: (name: string) => `Value for {${name}}`,
    referencePreview: (period: string) => `Reference for period ${period}: `,
    amount: 'Amount',
    amountKind: 'Kind of amount',
    fixed: 'The same amount every time',
    variable: 'The amount is entered when the bill arrives',
    schedule: 'Due dates',
    scheduleKind: 'Kind of schedule',
    periodic: 'Periodic',
    dates: 'Specific dates',
    every: 'Period',
    start: 'First period',
    end: 'Last period',
    monthPlaceholder: 'YYYY-MM',
    dueKind: {
      day: 'a given day of the month',
      last: 'the last day of the month',
      daysFromStart: 'days from the start of the period',
    },
    daysFromStart: 'Days from the first day of the period',
    daysFromStartHint: 'Property tax: 44 (the 45th day of the quarter).',
    day: 'Day',
    month: 'Month',
    monthOffset: (n: number) =>
      n === 0
        ? 'in the month the period starts'
        : n === 1
          ? 'of the next month'
          : `${String(n)} months after the start`,
    shiftToWorkday:
      'If the due date falls on a weekend or holiday, move it to the next working day',
    date: (n: number) => `Date ${String(n)}`,
    removeDate: (n: number) => `Remove date ${String(n)}`,
    remove: 'Remove',
    addDate: 'Add a date',
    graceDays: 'Grace days after the due date',
    graceDaysHint:
      'Optional. For this many days after the due date the bill is not yet overdue.',
    nextDues: 'Next due dates: ',
    lastDue: 'Last due date: ',
    other: 'Other',
  },

  occurrence: {
    fixErrors: 'Fix the errors in the form to see the QR code.',
    enterAmount: 'Enter the amount to make a QR code.',
    qrLabel: 'IPS QR code for the payment',
    qrHint:
      'Scan the code in your bank app and check the details before you confirm.',
    outOfSchedule:
      'This period is no longer in the bill’s schedule. Its data is kept so that the payment is not lost.',
    deleteRecord: 'Delete the record',
    takeAccount: 'Write the new payee account into the bill',
    form: 'Period',
    amountVariableHint: 'The amount on the bill for this period.',
    amountFixedHint: 'Leave empty to use the bill’s amount.',
    referenceModel: (model: string) => `Poziv na broj (model ${model})`,
    referenceHint: 'If the bill shows a different one, copy it here.',
    qr: 'QR code',
    qrSection: 'IPS QR code',
    slip: 'Payment slip',
    payment: 'Payment',
    paidAt: 'Payment date',
    paidAmount: 'Paid (RSD)',
    paidAmountHint: 'Empty: the full amount.',
    unpay: 'Undo payment',
    pay: 'Paid',
  },

  sections: {
    title: 'Sections',
    add: 'New section',
    editForm: 'Edit section',
    color: 'Colour',
    lead: 'Sections group bills on the timeline, for example “Flat”, “Taxes” or “Paušal”.',
    empty: 'No sections yet.',
    confirmDelete: (name: string) => `Delete the section “${name}”?`,
    inUse: (name: string) =>
      `The section “${name}” has bills. Move or delete them, or archive the section.`,
    up: (name: string) => `Move “${name}” up`,
    down: (name: string) => `Move “${name}” down`,
  },

  profiles: {
    title: 'Payers',
    add: 'New payer',
    editForm: 'Edit payer',
    name: 'Full name',
    address: 'Address',
    jmbg: 'JMBG',
    pib: 'PIB',
    jmbgHint:
      'Optional. The personal ID number, used in reference templates as {JMBG}.',
    pibHint: 'Optional, for entrepreneurs. The tax ID, in templates: {PIB}.',
    lead: 'A payer is whoever pays: you, your spouse or your business. The name and address go into the “platilac” field of the slip.',
    empty: 'No payers yet.',
    confirmDelete: (name: string) => `Delete the payer “${name}”?`,
    inUse: (name: string) =>
      `The payer “${name}” is used in bills. Move them to another payer or delete them first.`,
  },

  data: {
    title: 'Data',
    lead: 'Data is kept only in this browser. A backup is a file you can import here or in a browser on another device.',
    backup: 'Backup',
    noBackup: 'No backup has been made yet.',
    lastBackup: (date: string, age: number) =>
      `Last backup: ${date} (${age === 0 ? 'today' : `${days(age)} ago`}).`,
    exportAll: 'Export everything (JSON)',
    sectionTemplate: 'Section as a template',
    sectionTemplateHint:
      'The section’s bills and their payers, without payment history and without JMBG and PIB, to share with someone.',
    exportSection: 'Export section',
    import: 'Import',
    importFile: 'Backup (JSON)',
    cannotImport: (name: string) => `The file “${name}” cannot be imported:`,
    more: (n: number) => `and ${String(n)} more.`,
    contents: (
      name: string,
      date: string,
      c: { profiles: number; sections: number; bills: number; periods: number },
    ) =>
      `“${name}” of ${date}: ` +
      [
        `${String(c.profiles)} ${p(c.profiles, { one: 'payer', other: 'payers' })}`,
        `${String(c.sections)} ${p(c.sections, { one: 'section', other: 'sections' })}`,
        bills(c.bills),
        `${String(c.periods)} ${p(c.periods, { one: 'period', other: 'periods' })}`,
      ].join(', ') +
      '.',
    mergeHint:
      'Merging adds new records and changes existing ones only if the file has a later version. Nothing is deleted.',
    partialHint:
      ' The file holds only part of the data, so it cannot replace everything.',
    merge: 'Merge',
    replace: 'Replace everything',
    confirmReplace:
      'Replace all data with the contents of the file? A backup of the current data is downloaded first.',
    merged: (added: number, updated: number, kept: number) =>
      `Imported. New records: ${String(added)}, changed: ${String(updated)}, kept because they are the same or newer here: ${String(kept)}.`,
    replaced: 'The data has been replaced with the contents of the file.',
    other: 'For other programs',
    otherHint:
      'The payment history opens in Excel. Due dates of unpaid periods for the coming year import into your phone’s calendar, which reminds you a day before.',
    csv: 'Payment history (CSV)',
    ics: 'Due dates for a calendar (ICS)',
    file: {
      beforeImport: 'uplatnica-before-import',
      payments: 'uplatnica-payments',
      dues: 'uplatnica-due-dates',
    },
  },

  scan: {
    lead: 'Scan the IPS QR code on a bill. The amount and reference go into the bill’s period, and a new payee gets a new bill.',
    again: 'Scan another code',
    noMatch: 'No bill has this payee.',
    otherAccount: 'The same payee, but a different payee account.',
    noPeriods: 'No unpaid periods.',
    pickPeriod: 'Choose the period this bill is for:',
    sameReference: ' (same reference)',
    newBill: 'New bill from this code',
    notIps: 'This is not an IPS QR payment code.',
    invalid: 'The QR code is not valid.',
  },

  scanner: {
    cameraDenied:
      'Camera access is not allowed. Allow it in the browser settings or load a picture of the bill.',
    cameraMissing: 'No camera found. Load a picture of the bill.',
    cameraFailed: 'The camera could not start. Load a picture of the bill.',
    video: 'Camera picture',
    aim: 'Point the camera so the QR code is inside the frame.',
    noQrPdf:
      'No QR code found in the PDF. If the code is drawn rather than embedded as a picture, take a screenshot and load that.',
    noQrImage:
      'No QR code found in the picture. Try a sharper picture where the code takes more space.',
    unreadable: 'The file could not be read.',
    camera: 'Camera',
    stopCamera: 'Stop the camera',
    file: 'Picture or PDF of the bill',
    text: 'Code text',
    textLabel: 'IPS QR code text',
    loadText: 'Load text',
    searching: 'Looking for a QR code…',
  },

  print: {
    one: 'Payment slip',
    many: 'Payment slips',
    pdf: 'Download PDF',
    print: 'Print',
    hint: 'Print on A4 without fitting to page, at 100 % scale, so the slip has its real size. Three fit on a sheet.',
    pdfFailed: 'The PDF was not made. Try again.',
    missing: (n: number) =>
      n === 1
        ? 'One bill or period no longer exists.'
        : `${String(n)} bills or periods no longer exist.`,
    none: 'No slip is selected.',
    noQr: 'The slip has no QR code:',
    noAmount:
      'The amount has not been entered, so the slip has no amount and no QR code.',
    overflow:
      'The text does not fit into three lines of 35 characters and is cut on the slip.',
  },

  qrFields: {
    payee: 'Payee',
    account: 'Account',
    amount: 'Amount',
    paymentCode: 'Payment code',
    purpose: 'Purpose',
    reference: 'Reference',
    payeeReference: 'Payee reference',
    payer: 'Payer',
  },

  issue: {
    required: 'Required field.',
    tooLong: (max: number) =>
      `At most ${String(max)} characters, as many as fit into an IPS QR code.`,
    chars: 'Contains characters an IPS QR code does not allow.',
    integer: (min: number, max: number) =>
      `Enter a whole number from ${String(min)} to ${String(max)}.`,
    notFound: 'The selected item no longer exists.',
    color: 'A colour as #rrggbb.',
    accountFormat: 'An account is written as 160-602-16 or as 18 digits.',
    accountChecksum: 'The account check digits are wrong. Check the digits.',
    jmbgFormat: 'A JMBG has 13 digits.',
    jmbgChecksum: 'The JMBG check digit does not match. Check the number.',
    pibFormat: 'A PIB has 9 digits.',
    pibChecksum: 'The PIB check digit does not match. Check the number.',
    payerTooLong:
      'The name and address together are longer than 70 characters and will not fit into an IPS QR code.',
    paymentCode: 'Unknown payment code.',
    paymentCodeNotQr: 'An IPS QR code accepts only codes starting with 1 or 2.',
    amount: 'Invalid amount.',
    month: 'A month as YYYY-MM.',
    date: 'Invalid date.',
    endBeforeStart: 'The end is before the start.',
    noDates: 'Add at least one date.',
    templateSyntax: 'The template is not valid: check the curly braces.',
    templateTooLong: (width: number) =>
      `The value is longer than ${String(width)} characters.`,
    profileMissing: (field: 'JMBG' | 'PIB') =>
      `The payer has no ${field === 'JMBG' ? 'JMBG' : 'PIB'}.`,
    model97HasControl:
      'The reference seems to start with check digits already. For model 97 they are added automatically: enter the reference without the first two digits.',
    reference: {
      empty: 'The reference is empty.',
      chars: 'The reference contains characters that are not allowed.',
      length: 'The reference is longer than 23 characters.',
      structure:
        'The reference does not have the structure the model requires.',
      checksum: 'The reference check digits are wrong.',
    },
  },

  qrIssue: {
    tooLarge: 'The data does not fit into an IPS QR code.',
    general: 'The data is not valid for an IPS QR code.',
    fields: {
      R: 'Payee account',
      N: 'Payee name',
      I: 'Amount',
      P: 'Payer',
      SF: 'Payment code',
      S: 'Purpose',
      RO: 'Reference',
    },
    codes: {
      missing: 'missing',
      invalid: 'not valid',
      checksum: 'wrong check digits',
      length: 'too long',
      lines: 'too many lines',
      chars: 'characters not allowed',
    },
    field: (field: string, problem: string) => `${field}: ${problem}.`,
  },

  importIssue: {
    file: 'File',
    notJson: 'The file is not valid JSON.',
    notBackup: 'This is not an Uplatnica backup.',
    version: 'The file has no valid schema version.',
    newer: (version: number) =>
      `The file was made by a newer version of the app (schema ${String(version)}). Reload the page and try again.`,
    invalid: (path: string) => `${path}: invalid value.`,
    unknownKeys: (path: string, keys: string) =>
      `${path}: unknown fields ${keys}.`,
    duplicate: (path: string) => `${path}: duplicate record.`,
    missingRef: (path: string) =>
      `${path}: refers to a record that is not in the file.`,
  },

  scanNote: {
    noModel: 'no model',
    model: (m: string) => `model ${m}`,
    account: (scanned: string, current: string) =>
      `The payee account in the code is ${scanned}, and in the bill it is ${current}.`,
    modelMismatch: (scanned: string, current: string) =>
      `The reference in the code uses ${scanned} and the bill uses ${current}, so it was not taken.`,
    unsupportedModel: (model: string) =>
      `The reference in the code follows model ${model}, which the app does not support, so it was not taken.`,
    paymentCode: (scanned: string, current: string) =>
      `The payment code in the code is ${scanned} and in the bill ${current}. The slip uses the bill’s code.`,
    noAmount: 'The code has no amount, so no amount was taken.',
    payeeReference: (value: string) =>
      `Instead of a reference the code has the payee reference ${value}, which was not taken.`,
  },

  csv: {
    header: [
      'Payment date',
      'Section',
      'Name',
      'Period',
      'Due date',
      'Amount',
      'Paid',
      'Payee',
      'Payee account',
      'Payment code',
      'Model',
      'Reference',
      'Payer',
      'Note',
    ],
  },

  ics: {
    period: 'Period',
    amount: 'Amount',
    noAmount: 'not entered yet',
    payee: 'Payee',
    account: 'Account',
    paymentCode: 'Payment code',
    reference: 'Reference',
  },
};
