'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RunWithChecklistLite } from '@/lib/run-metrics';
import {
  averageProgressPct,
  buildEntityCountByWorkflowStage,
  buildPhaseStackedByTpa,
  buildStrategyStackedByTpa,
  TPA_STACK_COLORS,
  TPA_STACK_KEYS,
} from '@/lib/dashboard-chart-data';

const CHART_H = 280;

function TpaLegend() {
  return (
    <ul className="wf-tpa-legend" aria-label="TPA colours">
      {TPA_STACK_KEYS.map((key) => (
        <li key={key} className="wf-tpa-legend-item">
          <span className="wf-tpa-legend-swatch" style={{ background: TPA_STACK_COLORS[key] }} />
          {key}
        </li>
      ))}
    </ul>
  );
}

const tooltipStyle = {
  backgroundColor: 'rgba(18, 20, 30, 0.96)',
  border: '1px solid rgba(126, 176, 255, 0.2)',
  borderRadius: '8px',
  fontSize: '12px',
};

export default function DashboardCharts({
  runs,
  rail,
}: {
  runs: RunWithChecklistLite[];
  /** Right column: tighter chart heights for the sticky rail */
  rail?: boolean;
}) {
  const phaseData = useMemo(() => buildPhaseStackedByTpa(runs), [runs]);
  const strategyData = useMemo(() => buildStrategyStackedByTpa(runs), [runs]);
  const entityStageData = useMemo(() => buildEntityCountByWorkflowStage(runs), [runs]);
  const avgPct = useMemo(() => averageProgressPct(runs), [runs]);
  const h = CHART_H;

  if (runs.length === 0) {
    return (
      <section className={`wf-charts card${rail ? ' wf-charts--rail' : ''}`} aria-label="Charts">
        <p className="wf-charts-empty muted">No requests in this view — adjust filters or search.</p>
      </section>
    );
  }

  return (
    <section className={`wf-charts card${rail ? ' wf-charts--rail' : ''}`} aria-label="Charts">
      <p className="wf-charts-sub muted wf-charts-avg">
        Avg. checklist completion <strong>{avgPct}%</strong>
      </p>
      <TpaLegend />
      <div className="wf-charts-grid">
        <div className="wf-chart-panel">
          <h3 className="wf-chart-label">Requests by pipeline phase</h3>
          <div className="wf-chart-box">
            <ResponsiveContainer width="100%" height={h}>
              <BarChart data={phaseData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--muted2)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--muted2)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text)' }} cursor={{ fill: 'rgba(126,176,255,0.06)' }} />
                {TPA_STACK_KEYS.map((key) => (
                  <Bar key={`phase-${key}`} dataKey={key} name={key} stackId="phase" fill={TPA_STACK_COLORS[key]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="wf-chart-panel">
          <h3 className="wf-chart-label">Requests by strategy</h3>
          <div className="wf-chart-box">
            <ResponsiveContainer width="100%" height={h}>
              <BarChart
                layout="vertical"
                data={strategyData}
                margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--muted2)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={rail ? 100 : 120}
                  tick={{ fill: 'var(--muted2)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(126,176,255,0.06)' }} />
                {TPA_STACK_KEYS.map((key) => (
                  <Bar
                    key={`strat-${key}`}
                    dataKey={key}
                    name={key}
                    stackId="strategy"
                    fill={TPA_STACK_COLORS[key]}
                    maxBarSize={28}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="wf-chart-panel">
          <h3 className="wf-chart-label">Entities by workflow stage</h3>
          <p className="wf-chart-hint muted">
            Each entity is counted once: stage = first incomplete step by order (N/A skipped), or <strong>Complete</strong> when
            all applicable steps are done.
          </p>
          <div className="wf-chart-box">
            <ResponsiveContainer width="100%" height={h}>
              <BarChart data={entityStageData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--muted2)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--muted2)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: 'var(--text)' }}
                  cursor={{ fill: 'rgba(126,176,255,0.06)' }}
                  formatter={(value) => [`${value} entities`, 'Count']}
                  labelFormatter={(_label, payload) => {
                    const row = payload?.[0]?.payload as { fullName?: string } | undefined;
                    return row?.fullName ?? '';
                  }}
                />
                <Bar dataKey="count" name="Entities" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {entityStageData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
