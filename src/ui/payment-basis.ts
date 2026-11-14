import { latinToCyrillic } from '../core/serbia/translit';
import type { PaymentBasis } from '../core/serbia/paymentCodes';
import { locale } from '../i18n';

export function paymentBasisName(b: PaymentBasis): string {
  switch (locale()) {
    case 'sr-Latn':
      return b.sr;
    case 'sr-Cyrl':
      return latinToCyrillic(b.sr);
    case 'en':
      return b.en;
    case 'ru':
      return b.ru;
  }
}
