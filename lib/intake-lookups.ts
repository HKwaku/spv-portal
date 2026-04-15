/**
 * Fixed option lists for intake fields (n8n lookups / IF rules).
 * Adjust to match your Sheets or n8n dropdowns.
 */

export const JURISDICTION_OPTIONS = [
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Jersey', label: 'Jersey' },
  { value: 'Guernsey', label: 'Guernsey' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Cayman Islands', label: 'Cayman Islands' },
  { value: 'Delaware', label: 'Delaware (US)' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Hong Kong SAR', label: 'Hong Kong SAR' },
  { value: 'Other', label: 'Other (coordinate with ops)' },
] as const;

export const ENTITY_TYPE_OPTIONS = [
  { value: 'SARL', label: 'SARL' },
  { value: 'SCSp', label: 'SCSp' },
  { value: 'SCS', label: 'SCS' },
  { value: 'S.à r.l.', label: 'S.à r.l.' },
  { value: 'RAIF', label: 'RAIF' },
  { value: 'SICAR', label: 'SICAR' },
  { value: 'AIF', label: 'AIF' },
  { value: 'Limited partnership', label: 'Limited partnership' },
  { value: 'LP', label: 'LP' },
  { value: 'Other', label: 'Other (coordinate with legal)' },
] as const;

/** TPA administrator (lookup). */
export const TPA_OPTIONS = [
  { value: 'Apex', label: 'Apex' },
  { value: 'CSC', label: 'CSC' },
  { value: 'JPM', label: 'JPM' },
  { value: 'BNP', label: 'BNP' },
] as const;

/**
 * Deal strategy (slug stored in DB / sent to n8n as label).
 * `real_estate` drives RE-only checklist steps (same as legacy n8n 'Real Estate' path).
 */
export const STRATEGY_OPTIONS = [
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'european_corporate', label: 'European Corporate' },
  { value: 'lp_secondaries', label: 'LP Secondaries' },
  { value: 'strategic_equity', label: 'Strategic Equity' },
] as const;

export type JurisdictionValue = (typeof JURISDICTION_OPTIONS)[number]['value'];
export type EntityTypeValue = (typeof ENTITY_TYPE_OPTIONS)[number]['value'];
export type TpaValue = (typeof TPA_OPTIONS)[number]['value'];
const JURISDICTION_SET = new Set(JURISDICTION_OPTIONS.map((o) => o.value));
const ENTITY_TYPE_SET = new Set(ENTITY_TYPE_OPTIONS.map((o) => o.value));
const TPA_SET = new Set(TPA_OPTIONS.map((o) => o.value));

export function isJurisdiction(v: string): v is JurisdictionValue {
  return JURISDICTION_SET.has(v as JurisdictionValue);
}

export function isEntityType(v: string): v is EntityTypeValue {
  return ENTITY_TYPE_SET.has(v as EntityTypeValue);
}

export function isTpa(v: string): v is TpaValue {
  return TPA_SET.has(v as TpaValue);
}

/** Human label for UI + n8n body.strategy */
export function strategyToLabel(slug: string): string {
  const row = STRATEGY_OPTIONS.find((o) => o.value === slug);
  if (row) return row.label;
  if (slug === 'general') return 'General';
  return slug.replace(/_/g, ' ');
}

/** Display TPA / strategy on older intakes */
export function formatStrategyDisplay(intake: { strategy?: string } | null | undefined): string {
  const s = intake?.strategy;
  if (!s) return '-';
  return strategyToLabel(s);
}
