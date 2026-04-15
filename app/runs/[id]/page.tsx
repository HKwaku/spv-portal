import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ChecklistEditor from '@/components/ChecklistEditor';
import PrintButton from '@/components/PrintButton';
import { prisma } from '@/lib/prisma';
import type { IntakePayload } from '@/lib/intake-schema';
import { strategyToLabel } from '@/lib/intake-lookups';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const run = await prisma.processRun.findUnique({
    where: { id },
    select: { intake: true },
  });
  const name = run ? (run.intake as { entityName?: string })?.entityName : null;
  return {
    title: name ? `${name}` : 'Request',
  };
}

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await prisma.processRun.findUnique({
    where: { id },
    include: { checklist: true },
  });
  if (!run) notFound();

  const intake = run.intake as IntakePayload;
  const entityName = intake.entityName ?? '-';

  const pending = run.checklist.filter((c) => c.status === 'pending' || c.status === 'in_progress').length;
  const done = run.checklist.filter((c) => c.status === 'done').length;
  const na = run.checklist.filter((c) => c.status === 'na').length;
  const applicable = run.checklist.filter((c) => c.status !== 'na').length;
  const progressPct = applicable > 0 ? Math.round((done / applicable) * 100) : 0;

  const statusSlug =
    run.status
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'request';

  const flags: { key: string; label: string; v: string }[] = [
    { key: 'agg', label: 'Aggregator', v: intake.isAggregatorFund },
    { key: 'tax', label: 'Tax paper', v: intake.taxPaperRequired },
    { key: 'notary', label: 'Notary', v: intake.notaryRequired },
    { key: 'block', label: 'Blocking cert', v: intake.blockingCertRequired },
    { key: 'postN', label: 'Post notary', v: intake.postFormationNotaryRequired },
    { key: 'lei', label: 'LEI', v: intake.leiRequired },
    { key: 'jersey', label: 'Jersey', v: intake.jerseyApprovalRequired },
  ];

  return (
    <div>
      <header className="page-header">
        <nav className="breadcrumb no-print">
          <Link href="/">Dashboard</Link>
          <span className="breadcrumb-sep">/</span>
          <span>{entityName}</span>
        </nav>
        <div className="run-header-grid">
          <aside className="run-status-rail" aria-label="Run status">
            <div className="status-cell">
              <span className={`status-pill status-pill--${statusSlug}`}>{run.status.replace(/_/g, ' ')}</span>
              <div className="status-sub">
                {run.n8nOk === true ? (
                  <span className="status-connector status-connector--ok">Automation · Synced</span>
                ) : null}
                {run.n8nOk === false ? (
                  <span className="status-connector status-connector--err" title={run.n8nError ?? ''}>
                    Automation · Issue
                  </span>
                ) : null}
                {run.n8nOk == null ? <span className="status-connector status-connector--muted">Automation · -</span> : null}
              </div>
            </div>
            <div className="run-id-block">
              <span className="run-id-label">Request ID</span>
              <code className="run-id-value" title={run.id}>
                {run.id}
              </code>
            </div>
          </aside>
          <div className="run-header-main">
            <h1 style={{ wordBreak: 'break-word', marginBottom: '0.75rem' }}>{entityName}</h1>
            <div className="progress-summary no-print">
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="muted" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                Checklist {progressPct}% · {done}/{applicable} done · {pending} open · {na} N/A
              </span>
            </div>
          </div>
          <div className="page-actions no-print run-header-actions">
            <a className="btn btn-primary btn-sm" href={`/api/processes/${run.id}/export`}>
              Export CSV
            </a>
            <PrintButton />
          </div>
        </div>
      </header>

      <div className="card run-next-steps no-print" role="region" aria-label="What to do next">
        <h2 className="card-title">What to do next</h2>
        <ul className="run-next-steps-list muted">
          <li>
            <strong className="run-next-steps-strong">Work in the portal</strong> — the portal is the system of record.
            Open the assigned task in the checklist and complete it there. The <strong>Owner</strong> column shows the
            responsible team, and locked steps cannot be actioned yet.
          </li>
          <li>
            <strong className="run-next-steps-strong">All entities</strong> — see every open task on the{' '}
            <Link href="/#open-tasks">dashboard</Link> (above the charts) and via the <strong>bell</strong> next to{' '}
            <strong>Open tasks</strong>.
          </li>
          <li>
            <strong className="run-next-steps-strong">Background automation</strong> — n8n may still receive the intake and
            send legacy Gmail notifications from older workflow definitions; those are supplementary. If automation fails,
            see &quot;Automation · Issue&quot; above.
          </li>
        </ul>
      </div>

      <div className="card" id="report">
        <div className="card-header">
          <h2 className="card-title">Submitted intake</h2>
        </div>
        <dl className="dl-grid">
          <dt>Entity type</dt>
          <dd>{intake.entityType}</dd>
          <dt>Strategy</dt>
          <dd>{intake.strategy ? strategyToLabel(intake.strategy) : '-'}</dd>
          <dt>Jurisdiction</dt>
          <dd>{intake.jurisdiction}</dd>
          <dt>Requested by</dt>
          <dd>{intake.requestedBy}</dd>
          <dt>TPA</dt>
          <dd>
            {intake.tpa} · {intake.tpaEmail}
          </dd>
          <dt>Flags</dt>
          <dd>
            <div className="flag-chips">
              {flags.map((f) => (
                <span key={f.key} className={`flag-chip ${f.v === 'yes' ? 'yes' : ''}`}>
                  {f.label}: {f.v}
                </span>
              ))}
            </div>
          </dd>
        </dl>
      </div>

      <div className="card no-print">
        <div className="card-header">
          <h2 className="card-title">Reporting</h2>
        </div>
        <p className="muted" style={{ marginBottom: '1rem', maxWidth: '56ch' }}>
          Download structured data for spreadsheets, or print this page (intake + checklist) to PDF from the browser.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <a className="btn btn-primary" href={`/api/processes/${run.id}/export`}>
            Download CSV
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="mobile-checklist-panel">
        <ChecklistEditor runId={run.id} items={run.checklist} />
      </div>
    </div>
  );
}
