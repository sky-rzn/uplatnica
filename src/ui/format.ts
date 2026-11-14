import type { IsoDate } from '../core/date';
import { t } from '../i18n';

/** "13.11.2026." in Serbian, "13.11.2026" in Russian. */
export function formatDate(date: IsoDate): string {
  const [y, m, d] = date.split('-');
  return t.date(d ?? '', m ?? '', y ?? '');
}
