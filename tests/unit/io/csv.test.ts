import { describe, expect, it } from 'vitest';
import { paymentsCsv } from '../../../src/io/csv';
import { dataset } from './fixtures';

describe('paymentsCsv', () => {
  it('lists paid periods for Excel', () => {
    const csv = paymentsCsv(dataset());
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv.slice(1).split('\r\n')).toMatchInlineSnapshot(`
      [
        "Datum plaćanja;Odeljak;Naziv;Period;Rok;Iznos;Plaćeno;Primalac;Račun primaoca;Šifra plaćanja;Model;Poziv na broj;Platilac;Napomena",
        "2026-09-14;Stan;Infostan;2026-09;2026-09-15;1000,00;1000,00;Primalac;845-404849-87;289;97;73202609;Petar Petrović;",
        "2026-10-20;Stan;Infostan;2026-10;2026-10-15;1234,56;1000,00;Primalac;845-404849-87;289;97;70202610;Petar Petrović;"deo; ostatak ""kasnije"""",
        "",
      ]
    `);
  });
});
