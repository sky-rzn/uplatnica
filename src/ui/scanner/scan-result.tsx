import type { ScanNote } from '../../core/forms/scan';
import { parseIpsQr, type ParsedIpsQr } from '../../core/serbia/ipsQr';
import { qrIssueText, scanNoteText } from '../messages';

export type ScanRead =
  { ok: true; qr: ParsedIpsQr } | { ok: false; messages: string[] };

export function readScan(text: string): ScanRead {
  const r = parseIpsQr(text);
  if (r.ok) return { ok: true, qr: r.value };
  if (!/(^|\|)\s*K\s*:/i.test(text))
    return { ok: false, messages: ['Ovo nije IPS QR kod za plaćanje.'] };
  return {
    ok: false,
    messages: ['QR kod nije ispravan.', ...r.issues.map(qrIssueText)],
  };
}

export function ScanFailure({ messages }: { messages: readonly string[] }) {
  return (
    <ul class="error" role="alert">
      {messages.map((m, i) => (
        <li key={i}>{m}</li>
      ))}
    </ul>
  );
}

export function ScanNotes(props: { notes: readonly ScanNote[] }) {
  if (props.notes.length === 0) return null;
  return (
    <ul class="warning scan-notes" role="status">
      {props.notes.map((n, i) => (
        <li key={i}>{scanNoteText(n)}</li>
      ))}
    </ul>
  );
}
