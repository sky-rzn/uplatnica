import type { JSX } from 'preact';
import {
  SLIP_HEIGHT,
  SLIP_WIDTH,
  STROKE,
  type Shape,
} from '../../core/uplatnica/layout';

function ShapeSvg({ shape: s }: { shape: Shape }): JSX.Element {
  switch (s.kind) {
    case 'rect':
      return (
        <rect
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          fill="none"
          stroke="#000"
          stroke-width={STROKE}
          {...(s.dashed ? { 'stroke-dasharray': '1.5 1.5' } : {})}
        />
      );
    case 'line':
      return (
        <line
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="#000"
          stroke-width={STROKE}
        />
      );
    case 'text':
      return (
        <text
          x={s.x}
          y={s.y}
          font-size={s.size}
          text-anchor={s.anchor}
          {...(s.bold ? { 'font-weight': 700 } : {})}
        >
          {s.text}
        </text>
      );
    case 'path':
      return <path d={s.d} fill="#000" />;
  }
}

/** A slip drawn in millimetres, so that it prints at its real size. */
export function SlipSvg(props: { shapes: readonly Shape[]; label: string }) {
  return (
    <svg
      class="slip"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${String(SLIP_WIDTH)} ${String(SLIP_HEIGHT)}`}
      width={`${String(SLIP_WIDTH)}mm`}
      height={`${String(SLIP_HEIGHT)}mm`}
      role="img"
      aria-label={props.label}
    >
      <rect width={SLIP_WIDTH} height={SLIP_HEIGHT} fill="#fff" />
      {props.shapes.map((s, i) => (
        <ShapeSvg key={i} shape={s} />
      ))}
    </svg>
  );
}
