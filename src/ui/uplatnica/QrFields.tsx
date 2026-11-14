import { formatAmount } from '../../core/money';
import { formatAccount } from '../../core/serbia/account';
import type { ParsedIpsQr } from '../../core/serbia/ipsQr';

/** What an IPS QR code says, field by field. */
export function QrFields({ qr }: { qr: ParsedIpsQr }) {
  const rows: [string, string | undefined][] = [
    ['Primalac', qr.payeeName],
    ['Račun', formatAccount(qr.account)],
    ['Iznos', `${formatAmount(qr.amount)} RSD`],
    ['Šifra plaćanja', qr.paymentCode],
    ['Svrha', qr.purpose],
    [
      'Poziv na broj',
      qr.reference && (qr.model ? `${qr.model} ${qr.reference}` : qr.reference),
    ],
    ['Referenca primaoca', qr.payeeReference],
    ['Platilac', qr.payer],
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
