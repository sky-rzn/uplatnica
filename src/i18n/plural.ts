export interface PluralForms {
  one: string;
  few?: string;
  many?: string;
  other: string;
}

/** Picks the noun form for a count by the CLDR plural rules of the locale. */
export function pluralizer(locale: string) {
  const rules = new Intl.PluralRules(locale);
  return (n: number, forms: PluralForms): string => {
    const category = rules.select(n);
    return (
      (category === 'one' || category === 'few' || category === 'many'
        ? forms[category]
        : undefined) ?? forms.other
    );
  };
}
