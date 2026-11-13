import type { IsoDate } from '../core/date';

/** "13.11.2026." */
export function formatDate(date: IsoDate): string {
  const [y, m, d] = date.split('-');
  return `${d ?? ''}.${m ?? ''}.${y ?? ''}.`;
}
