import { qrMatrix, qrPath } from '../../core/uplatnica/qr';

const QUIET = 4;

export function QrCode(props: {
  text: string;
  ecc: 'M' | 'L';
  label: string;
  maxVersion?: number;
}) {
  const m = qrMatrix(props.text, props.ecc, props.maxVersion);
  const side = m.size + 2 * QUIET;
  return (
    <svg
      class="qr"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${String(side)} ${String(side)}`}
      shape-rendering="crispEdges"
      role="img"
      aria-label={props.label}
    >
      <rect width={side} height={side} fill="#fff" />
      <path d={qrPath(m, QUIET, QUIET, 1)} fill="#000" />
    </svg>
  );
}
