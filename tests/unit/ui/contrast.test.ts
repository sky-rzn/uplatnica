import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  new URL('../../../src/styles.css', import.meta.url),
  'utf8',
);

const tokens = new Map(
  Array.from(
    css.matchAll(
      /--([\w-]+): light-dark\((#[0-9a-f]{3,6}), (#[0-9a-f]{3,6})\)/g,
    ),
    (m) => [m[1] ?? '', [m[2] ?? '', m[3] ?? '']] as const,
  ),
);

function luminance(hex: string): number {
  const h = hex.length === 4 ? hex.replace(/\w/g, '$&$&') : hex;
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const TEXT: [string, string][] = [
  ['fg', 'bg'],
  ['fg', 'card'],
  ['muted', 'bg'],
  ['muted', 'card'],
  ['accent', 'bg'],
  ['accent', 'card'],
  ['accent-fg', 'accent'],
  ['error', 'bg'],
  ['warning', 'bg'],
  ['danger', 'card'],
  ['st-paid', 'bg'],
  ['st-overdue', 'bg'],
  ['st-fg', 'st-paid'],
  ['st-fg', 'st-overdue'],
  ['st-due-fg', 'st-due'],
];

const GRAPHICS: [string, string][] = [
  ['control-border', 'bg'],
  ['st-due', 'bg'],
  ['st-upcoming', 'bg'],
];

describe('colour tokens', () => {
  it.each(
    ['light', 'dark'].flatMap((theme, i) => [
      ...TEXT.map(([fg, bg]) => [theme, fg, bg, 4.5, i] as const),
      ...GRAPHICS.map(([fg, bg]) => [theme, fg, bg, 3, i] as const),
    ]),
  )('%s: %s on %s reaches %d:1', (_theme, fg, bg, min, i) => {
    const a = tokens.get(fg)?.[i];
    const b = tokens.get(bg)?.[i];
    expect(a && b).toBeTruthy();
    expect(contrast(a ?? '', b ?? '')).toBeGreaterThanOrEqual(min);
  });
});
