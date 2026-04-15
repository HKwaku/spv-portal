import { z } from 'zod';
import { isEntityType, isJurisdiction, isTpa, strategyToLabel } from '@/lib/intake-lookups';

const STRATEGY_SLUGS = [
  'infrastructure',
  'real_estate',
  'european_corporate',
  'lp_secondaries',
  'strategic_equity',
] as const;

/** Matches n8n `Normalise form fields` ($json.body.*) — see docs/n8n/SPV_n8n_workflow_portal_primary.json (intake-only, no Gmail chain). */
export const intakeSchema = z.object({
  entityName: z.string().min(1),
  entityType: z.string().refine(isEntityType, 'Select an entity type'),
  strategy: z.enum(STRATEGY_SLUGS),
  jurisdiction: z.string().refine(isJurisdiction, 'Select a jurisdiction'),
  requestedBy: z.string().min(1),
  tpa: z.string().refine(isTpa, 'Select a TPA'),
  tpaEmail: z.string().email(),
  isAggregatorFund: z.enum(['yes', 'no']),
  taxPaperRequired: z.enum(['yes', 'no']),
  notaryRequired: z.enum(['yes', 'no']),
  blockingCertRequired: z.enum(['yes', 'no']),
  postFormationNotaryRequired: z.enum(['yes', 'no']),
  leiRequired: z.enum(['yes', 'no']),
  jerseyApprovalRequired: z.enum(['yes', 'no']),
});

export type IntakePayload = z.infer<typeof intakeSchema>;

/** Send human-readable strategy to n8n (emails / IF conditions you add later). */
export function toN8nBody(data: IntakePayload) {
  return {
    entityName: data.entityName,
    entityType: data.entityType,
    strategy: strategyToLabel(data.strategy),
    jurisdiction: data.jurisdiction,
    requestedBy: data.requestedBy,
    tpa: data.tpa,
    tpaEmail: data.tpaEmail,
    isAggregatorFund: data.isAggregatorFund,
    taxPaperRequired: data.taxPaperRequired,
    notaryRequired: data.notaryRequired,
    blockingCertRequired: data.blockingCertRequired,
    postFormationNotaryRequired: data.postFormationNotaryRequired,
    leiRequired: data.leiRequired,
    jerseyApprovalRequired: data.jerseyApprovalRequired,
  };
}
