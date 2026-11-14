import type { Issue } from '../core/forms/issues';
import type { ScanNote } from '../core/forms/scan';
import { formatAccount } from '../core/serbia/account';
import type { IpsQrIssue } from '../core/serbia/ipsQr';
import type { SlipWarning } from '../core/uplatnica/slip';
import { t } from '../i18n';
import type { ImportIssue } from '../io/import';

export function issueText(issue: Issue): string {
  const m = t.issue;
  switch (issue.code) {
    case 'required':
      return m.required;
    case 'too-long':
      return m.tooLong(issue.max);
    case 'chars':
      return m.chars;
    case 'integer':
      return m.integer(issue.min, issue.max);
    case 'not-found':
      return m.notFound;
    case 'color':
      return m.color;
    case 'account-format':
      return m.accountFormat;
    case 'account-checksum':
      return m.accountChecksum;
    case 'jmbg-format':
      return m.jmbgFormat;
    case 'jmbg-checksum':
      return m.jmbgChecksum;
    case 'pib-format':
      return m.pibFormat;
    case 'pib-checksum':
      return m.pibChecksum;
    case 'payer-too-long':
      return m.payerTooLong;
    case 'payment-code':
      return m.paymentCode;
    case 'payment-code-not-qr':
      return m.paymentCodeNotQr;
    case 'amount':
      return m.amount;
    case 'month':
      return m.month;
    case 'date':
      return m.date;
    case 'end-before-start':
      return m.endBeforeStart;
    case 'no-dates':
      return m.noDates;
    case 'reference':
      return m.reference[issue.reason];
    case 'template-syntax':
      return m.templateSyntax;
    case 'template-too-long':
      return m.templateTooLong(issue.width);
    case 'profile-missing':
      return m.profileMissing(issue.field);
    case 'model97-has-control':
      return m.model97HasControl;
  }
}

export function qrIssueText(issue: IpsQrIssue): string {
  const m = t.qrIssue;
  if (issue.code === 'too-large') return m.tooLarge;
  if (issue.tag === null) return m.general;
  return m.field(
    m.fields[issue.tag] ?? issue.tag,
    m.codes[issue.code] ?? m.codes.invalid ?? '',
  );
}

export function slipWarningText(w: SlipWarning): string {
  return w === 'no-amount' ? t.print.noAmount : t.print.overflow;
}

export function importIssueText(issue: ImportIssue): string {
  const m = t.importIssue;
  switch (issue.code) {
    case 'not-json':
      return m.notJson;
    case 'not-backup':
      return m.notBackup;
    case 'version':
      return m.version;
    case 'newer':
      return m.newer(issue.version);
    case 'invalid':
      return m.invalid(issue.path || m.file);
    case 'unknown-keys':
      return m.unknownKeys(issue.path || m.file, issue.keys.join(', '));
    case 'duplicate':
      return m.duplicate(issue.path);
    case 'missing-ref':
      return m.missingRef(issue.path);
  }
}

const modelName = (m: string) =>
  m === '' ? t.scanNote.noModel : t.scanNote.model(m);

export function scanNoteText(note: ScanNote): string {
  const m = t.scanNote;
  switch (note.code) {
    case 'account':
      return m.account(
        formatAccount(note.scanned),
        formatAccount(note.current),
      );
    case 'model':
      return m.modelMismatch(modelName(note.scanned), modelName(note.current));
    case 'unsupported-model':
      return m.unsupportedModel(note.model);
    case 'payment-code':
      return m.paymentCode(note.scanned, note.current);
    case 'no-amount':
      return m.noAmount;
    case 'payee-reference':
      return m.payeeReference(note.value);
  }
}
