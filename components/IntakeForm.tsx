'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ENTITY_TYPE_OPTIONS, JURISDICTION_OPTIONS, STRATEGY_OPTIONS, TPA_OPTIONS } from '@/lib/intake-lookups';

const yn = [
  { v: 'yes', l: 'Yes' },
  { v: 'no', l: 'No' },
];

export default function IntakeForm() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries()) as Record<string, string>;

    const res = await fetch('/api/processes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErr(data.error ?? JSON.stringify(data.issues ?? data));
      return;
    }
    /** Land on dashboard with this request selected so the sidebar checklist is visible next to the pipeline. */
    router.push(`/?run=${encodeURIComponent(data.run.id)}&from=intake`);
  }

  return (
    <form onSubmit={onSubmit} className="card">
      <div className="intake-stepper no-print" aria-hidden>
        <div className="intake-step">
          <span className="intake-step-num">1</span>
          <span>Entity &amp; strategy</span>
        </div>
        <span className="intake-step-line" />
        <div className="intake-step">
          <span className="intake-step-num">2</span>
          <span>People</span>
        </div>
        <span className="intake-step-line" />
        <div className="intake-step">
          <span className="intake-step-num">3</span>
          <span>Conditional paths</span>
        </div>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Entity &amp; strategy</h2>
        <div className="grid2">
          <label className="field">
            Entity name *
            <input name="entityName" required placeholder="Legal name" autoComplete="organization" />
          </label>
          <label className="field">
            Entity type * (matches n8n IF rules on type)
            <select name="entityType" required defaultValue="">
              <option value="" disabled>
                Select...
              </option>
              {ENTITY_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Strategy * (Real Estate unlocks RE-only checklist paths)
            <select name="strategy" required defaultValue="">
              <option value="" disabled>
                Select...
              </option>
              {STRATEGY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Jurisdiction *
            <select name="jurisdiction" required defaultValue="">
              <option value="" disabled>
                Select...
              </option>
              {JURISDICTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">People</h2>
        <div className="grid2">
          <label className="field">
            Requested by *
            <input name="requestedBy" required placeholder="Name or email" autoComplete="name" />
          </label>
          <label className="field">
            TPA *
            <select name="tpa" required defaultValue="">
              <option value="" disabled>
                Select...
              </option>
              {TPA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            TPA email *
            <input name="tpaEmail" type="email" required autoComplete="email" />
          </label>
        </div>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Conditional paths</h2>
        <p className="muted" style={{ marginBottom: '1rem', maxWidth: '60ch' }}>
          Values must match your n8n IF nodes (typically <code>contains &quot;yes&quot;</code>).
        </p>
        <div className="grid2">
          {[
            ['isAggregatorFund', 'Aggregator fund'],
            ['taxPaperRequired', 'Tax paper required'],
            ['notaryRequired', 'Notary (formation)'],
            ['blockingCertRequired', 'Blocking certificate'],
            ['postFormationNotaryRequired', 'Post-formation notary'],
            ['leiRequired', 'LEI registration / renewal'],
            ['jerseyApprovalRequired', 'Jersey regulator pre-approval'],
          ].map(([name, label]) => (
            <label key={name} className="field">
              {label}
              <select name={name} required defaultValue="no">
                {yn.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      {err ? (
        <p className="alert-error" style={{ marginTop: '1rem' }} role="alert">
          {err}
        </p>
      ) : null}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit & create request'}
        </button>
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          Creates the checklist in this app; optional webhook/automation runs if configured.
        </span>
      </div>
    </form>
  );
}
