import type { Section } from '../model';
import type { FormResult, Issues } from './issues';

export interface SectionDraft {
  name: string;
  color: string;
  archived: boolean;
}

export const DEFAULT_SECTION_COLOR = '#4a7bd0';

export function sectionToDraft(s?: Section): SectionDraft {
  return {
    name: s?.name ?? '',
    color: s?.color ?? DEFAULT_SECTION_COLOR,
    archived: s?.archived ?? false,
  };
}

export function validateSection(
  id: string,
  order: number,
  d: SectionDraft,
): FormResult<Section> {
  const errors: Issues = {};
  const name = d.name.trim();
  const color = d.color.trim().toLowerCase();
  if (name === '') errors.name = { code: 'required' };
  if (!/^#[0-9a-f]{6}$/.test(color)) errors.color = { code: 'color' };
  if (Object.keys(errors).length > 0)
    return { value: null, errors, warnings: {} };
  return {
    value: { id, name, color, order, archived: d.archived },
    errors,
    warnings: {},
  };
}
