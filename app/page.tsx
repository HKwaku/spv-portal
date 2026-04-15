import Link from 'next/link';
import { Suspense } from 'react';
import ChecklistEditor from '@/components/ChecklistEditor';
import DatabaseSetupMessage from '@/components/DatabaseSetupMessage';
import WorkflowDashboard from '@/components/dashboard/WorkflowDashboard';
import { buildDashboardHref } from '@/lib/dashboard-href';
import { applyDashboardFilters } from '@/lib/run-metrics';
import { prisma } from '@/lib/prisma';
import { getActionableTodos } from '@/lib/todos-query';

export const dynamic = 'force-dynamic';

function isLikelyDatabaseError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: string }).code;
    if (typeof code === 'string' && code.startsWith('P1')) return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /database|postgres|prisma|connect|Authentication failed|ENOTFOUND|ECONNREFUSED|SSL|timeout/i.test(msg);
}

function loadHomePageData(runId: string | undefined) {
  return Promise.all([
    prisma.processRun.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        n8nOk: true,
        n8nError: true,
        intake: true,
        checklist: { select: { status: true, sortOrder: true, owner: true } },
      },
    }),
    prisma.processRun.count(),
    prisma.processRun.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    runId
      ? prisma.processRun.findUnique({
          where: { id: runId },
          include: {
            checklist: { orderBy: { sortOrder: 'asc' } },
          },
        })
      : Promise.resolve(null),
    getActionableTodos(),
  ]);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    run?: string;
    q?: string;
    strategy?: string;
    tpa?: string;
    from?: string;
    tab?: string;
  }>;
}) {
  const { run: runId, q, strategy, tpa, from, tab: tabParam } = await searchParams;

  let allRuns: Awaited<ReturnType<typeof loadHomePageData>>[0];
  let totalRuns: Awaited<ReturnType<typeof loadHomePageData>>[1];
  let lastRun: Awaited<ReturnType<typeof loadHomePageData>>[2];
  let selectedRun: Awaited<ReturnType<typeof loadHomePageData>>[3];
  let actionableTodos: Awaited<ReturnType<typeof loadHomePageData>>[4];

  try {
    const result = await loadHomePageData(runId);
    [allRuns, totalRuns, lastRun, selectedRun, actionableTodos] = result;
  } catch (e) {
    const digest =
      e && typeof e === 'object' && 'digest' in e ? String((e as { digest?: unknown }).digest ?? '') : '';
    if (isLikelyDatabaseError(e)) {
      return <DatabaseSetupMessage digest={digest || undefined} />;
    }
    throw e;
  }

  const filterParams = { strategy, tpa };
  const filteredRuns = applyDashboardFilters(allRuns, filterParams);
  const runsForClient = filteredRuns.map((r) => {
    const createdAt = r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt);
    const updatedAt = r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt);
    return {
      ...r,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  });

  const dashParams = {
    run: runId,
    q,
    strategy,
    tpa,
  };

  return (
    <div>
      {allRuns.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden>
              <span style={{ opacity: 0.85 }}>◇</span>
            </div>
            <p style={{ fontWeight: 600, marginBottom: '0.35rem' }}>No formation requests yet</p>
            <p className="muted" style={{ maxWidth: '40ch', margin: '0 auto' }}>
            Create an intake to seed the workflow tasks. Teams complete assigned tasks in this app; optional automation can
            run in the background.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <Link href="/new" className="btn btn-primary">
                New entity formation
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {from === 'intake' && runId && selectedRun ? (
            <div className="intake-success-banner card no-print" role="status">
              <div className="intake-success-banner-inner">
                <p className="intake-success-banner-title">Intake saved</p>
                <p className="intake-success-banner-text muted">
                  Use <strong>Open tasks</strong> (above the charts), the <strong>bell</strong> next to that heading, and
                  the <strong>checklist</strong> on the left: open the assigned task and complete it there—that is how
                  workflow progress is tracked. Background automation may still run for sync or legacy email (see{' '}
                  <strong>Automation</strong> on the request if something fails).
                </p>
                <div className="intake-success-banner-actions">
                  <Link href={buildDashboardHref({ run: runId, q, strategy, tpa })} className="btn btn-ghost btn-sm">
                    Dismiss
                  </Link>
                  <Link href={`/runs/${runId}`} className="btn btn-primary btn-sm">
                    Full request page
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
          <Suspense
            fallback={
              <div className="card" style={{ minHeight: '12rem' }}>
                <p className="muted" style={{ margin: 0 }}>
                  Loading dashboard…
                </p>
              </div>
            }
          >
            <WorkflowDashboard
              runs={runsForClient}
              params={dashParams}
              databaseTotal={totalRuns}
              lastSubmissionAt={lastRun?.createdAt ? lastRun.createdAt.toISOString() : null}
              selectedRunId={runId ?? null}
              todos={actionableTodos}
              initialTab={tabParam ?? null}
            />
          </Suspense>

          {runId && !selectedRun ? (
            <div className="card" style={{ marginTop: '1rem' }}>
              <p style={{ fontWeight: 600 }}>Request not found</p>
              <p className="muted" style={{ marginTop: '0.35rem' }}>
                That id may be invalid or was removed.
              </p>
              <Link href="/" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
                Clear selection
              </Link>
            </div>
          ) : null}

          {selectedRun ? (
            <div className="mobile-checklist-panel">
              <ChecklistEditor key={selectedRun.id} runId={selectedRun.id} items={selectedRun.checklist} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
