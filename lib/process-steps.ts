import type { IntakePayload } from './intake-schema';

export type ChecklistStatusValue = 'pending' | 'in_progress' | 'blocked' | 'done' | 'na';
export type TaskType = 'approval' | 'review' | 'upload' | 'confirm' | 'data_entry';

export type ProcessStepDef = {
  key: string;
  label: string;
  owner: string;
  assignedTeam: string;
  taskType: TaskType;
  sortOrder: number;
  isNa?: (intake: IntakePayload) => boolean;
};

const yes = (v: string) => v === 'yes';

function isRealEstate(strategy: string) {
  return strategy === 'real_estate';
}

export const PROCESS_STEPS: ProcessStepDef[] = [
  {
    key: '2-initiate',
    label: '2 - Initiate process',
    owner: 'Fund Transaction Ops',
    assignedTeam: 'fund_ops',
    taskType: 'confirm',
    sortOrder: 20,
  },
  {
    key: '3-tax-review',
    label: '3 - Tax review',
    owner: 'Tax Team',
    assignedTeam: 'tax_team',
    taskType: 'review',
    sortOrder: 30,
  },
  {
    key: '3b-tax-paper',
    label: '3b - Tax paper review',
    owner: 'Tax Team',
    assignedTeam: 'tax_team',
    taskType: 'review',
    sortOrder: 35,
    isNa: (i) => !yes(i.taxPaperRequired),
  },
  {
    key: '4-tax-approval',
    label: '4 - Tax approval',
    owner: 'Fund Transaction Ops',
    assignedTeam: 'fund_ops',
    taskType: 'approval',
    sortOrder: 40,
  },
  {
    key: '5-legal-instruct',
    label: '5 - Legal formation instruction',
    owner: 'Fund Transaction Ops',
    assignedTeam: 'fund_ops',
    taskType: 'confirm',
    sortOrder: 50,
  },
  {
    key: '6-legal-formation',
    label: '6 - Legal formation',
    owner: 'Fund Counsel / TPA',
    assignedTeam: 'fund_counsel',
    taskType: 'confirm',
    sortOrder: 60,
  },
  {
    key: '6b-notary',
    label: '6b - Arranging notary appointment',
    owner: 'Fund Counsel',
    assignedTeam: 'fund_counsel',
    taskType: 'confirm',
    sortOrder: 65,
    isNa: (i) => !yes(i.notaryRequired),
  },
  {
    key: '6c-blocking',
    label: '6c - Sourcing blocking certificate',
    owner: 'TPA',
    assignedTeam: 'tpa',
    taskType: 'upload',
    sortOrder: 70,
    isNa: (i) => !yes(i.blockingCertRequired),
  },
  {
    key: '7-post',
    label: '7 - Post-formation activities',
    owner: 'Fund Transaction Ops',
    assignedTeam: 'fund_ops',
    taskType: 'confirm',
    sortOrder: 80,
  },
  {
    key: '7b-board',
    label: '7b - Inaugural board meeting',
    owner: 'Fund Counsel',
    assignedTeam: 'fund_counsel',
    taskType: 'confirm',
    sortOrder: 85,
    isNa: (i) => i.entityType !== 'AIF' && i.entityType !== 'RAIF',
  },
  {
    key: '7c-capital',
    label: '7c - Initial share capital payments',
    owner: 'Fund Transaction Ops',
    assignedTeam: 'fund_ops',
    taskType: 'confirm',
    sortOrder: 90,
    isNa: (i) => i.entityType !== 'SARL',
  },
  {
    key: '7d-notary',
    label: '7d - Post-formation notary',
    owner: 'Fund Counsel',
    assignedTeam: 'fund_counsel',
    taskType: 'upload',
    sortOrder: 95,
    isNa: (i) => !yes(i.postFormationNotaryRequired),
  },
  {
    key: '7e-directors',
    label: '7e - Director appointments (Real Estate)',
    owner: 'Fund Transaction Ops',
    assignedTeam: 'fund_ops',
    taskType: 'confirm',
    sortOrder: 100,
    isNa: (i) => !isRealEstate(i.strategy),
  },
  {
    key: '8-gems',
    label: '8 - Update source systems (GEMS)',
    owner: 'GEMS team',
    assignedTeam: 'gems_team',
    taskType: 'confirm',
    sortOrder: 110,
  },
  {
    key: '9-onboarding',
    label: '9 - Onboarding',
    owner: 'Fund Transaction Ops',
    assignedTeam: 'fund_ops',
    taskType: 'confirm',
    sortOrder: 120,
  },
  {
    key: '9b-tpa-agg',
    label: '9b - Admit investing ICG Funds (TPA)',
    owner: 'TPA',
    assignedTeam: 'tpa',
    taskType: 'confirm',
    sortOrder: 125,
    isNa: (i) => !yes(i.isAggregatorFund),
  },
  {
    key: '9c-counsel-agg',
    label: '9c - Admit investing ICG Funds (Counsel)',
    owner: 'Fund Counsel',
    assignedTeam: 'fund_counsel',
    taskType: 'confirm',
    sortOrder: 130,
    isNa: (i) => !yes(i.isAggregatorFund),
  },
  {
    key: '10-reg',
    label: '10 - Regulatory',
    owner: 'Fund Transaction Ops',
    assignedTeam: 'fund_ops',
    taskType: 'confirm',
    sortOrder: 140,
  },
  {
    key: '10a-overseas',
    label: '10a - Overseas entity registration',
    owner: 'TPA',
    assignedTeam: 'tpa',
    taskType: 'confirm',
    sortOrder: 145,
    isNa: (i) => !isRealEstate(i.strategy),
  },
  {
    key: '10b-aifm',
    label: '10b - AIFM pre-approval',
    owner: 'Fund Transaction Ops',
    assignedTeam: 'fund_ops',
    taskType: 'approval',
    sortOrder: 150,
    isNa: (i) => i.entityType !== 'AIF' && i.entityType !== 'RAIF',
  },
  {
    key: '10c-lei',
    label: '10c - LEI registration and renewal',
    owner: 'External advisor',
    assignedTeam: 'external_advisor',
    taskType: 'confirm',
    sortOrder: 155,
    isNa: (i) => !yes(i.leiRequired),
  },
  {
    key: '11-jersey',
    label: '11 - Regulatory approval (Jersey)',
    owner: 'Jersey counsel',
    assignedTeam: 'jersey_counsel',
    taskType: 'approval',
    sortOrder: 160,
    isNa: (i) => !yes(i.jerseyApprovalRequired),
  },
  {
    key: '12-bank',
    label: '12 - Bank account setup',
    owner: 'TPA',
    assignedTeam: 'tpa',
    taskType: 'confirm',
    sortOrder: 170,
  },
  {
    key: '13-tax-reg',
    label: '13 - Tax registration',
    owner: 'Tax advisors / TPA',
    assignedTeam: 'tpa',
    taskType: 'confirm',
    sortOrder: 180,
  },
  {
    key: '13b-ott',
    label: '13b - OTT submission (Real Estate)',
    owner: 'ICG Tax Team',
    assignedTeam: 'tax_team',
    taskType: 'confirm',
    sortOrder: 185,
    isNa: (i) => !isRealEstate(i.strategy),
  },
  {
    key: '13c-crs',
    label: '13c - CRS / FATCA classification',
    owner: 'TPA',
    assignedTeam: 'tpa',
    taskType: 'confirm',
    sortOrder: 190,
  },
];

function buildTaskPayload(step: ProcessStepDef) {
  switch (step.taskType) {
    case 'approval':
      return {
        fields: [
          { key: 'decision', type: 'select', required: true, options: ['approve', 'reject'] },
          { key: 'comment', type: 'textarea', required: false },
        ],
      };
    case 'upload':
      return {
        fields: [
          { key: 'documentName', type: 'text', required: true },
          { key: 'documentUrl', type: 'text', required: true },
          { key: 'comment', type: 'textarea', required: false },
        ],
      };
    default:
      return {
        fields: [{ key: 'comment', type: 'textarea', required: false }],
      };
  }
}

export function buildChecklistRows(intake: IntakePayload) {
  const rows = PROCESS_STEPS.map((s) => {
    const na = s.isNa?.(intake) ?? false;
    return {
      stepKey: s.key,
      stepLabel: s.label,
      owner: s.owner,
      assignedTeam: s.assignedTeam,
      taskType: s.taskType,
      taskPayload: buildTaskPayload(s),
      sortOrder: s.sortOrder,
      status: na ? ('na' as ChecklistStatusValue) : ('pending' as ChecklistStatusValue),
      isUnlocked: false, // set below
    };
  });

  // Unlock the first non-NA step — this is always where the workflow starts
  const firstActionable = rows.find((r) => r.status !== 'na');
  if (firstActionable) firstActionable.isUnlocked = true;

  return rows;
}
