import { formatAmount } from '../../core/money';
import { formatAccount } from '../../core/serbia/account';
import type { ParsedIpsQr } from '../../core/serbia/ipsQr';
import { t } from '../../i18n';

/** What an IPS QR code says, field by field. */
export function QrFields({ qr }: { qr: ParsedIpsQr }) {
  const f = t.qrFields;
  const rows: [string, string | undefined][] = [
    [f.payee, qr.payeeName],
    [f.account, formatAccount(qr.account)],
    [f.amount, `${formatAmount(qr.amount)} RSD`],
    [f.paymentCode, qr.paymentCode],
    [f.purpose, qr.purpose],
    [
      f.reference,
      qr.reference && (qr.model ? `${qr.model} ${qr.reference}` : qr.reference),
    ],
    [f.payeeReference, qr.payeeReference],
    [f.payer, qr.payer],
  ];
  return (
    <dl class="qr-fields">
      {rows.map(([k, val]) =>
        val ? (
          <div key={k}>
            <dt>{k}</dt>
            <dd class="pre">{val}</dd>
          </div>
        ) : null,
      )}
    </dl>
  );
}
