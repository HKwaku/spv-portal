import Link from 'next/link';
import IntakeForm from '@/components/IntakeForm';

export default function NewIntakePage() {
  return (
    <div>
      <header className="page-header">
        <nav className="breadcrumb no-print">
          <Link href="/">Dashboard</Link>
          <span className="breadcrumb-sep">/</span>
          <span>New entity formation</span>
        </nav>
        <div className="page-header-row">
          <div>
            <h1>New entity formation</h1>
            <p className="page-lead">
              Submitting creates a request and seeds the <strong>checklist</strong>—that is where teams complete the
              process. The same payload shape as your n8n &quot;Normalise form fields&quot; node is sent to{' '}
              <code>.../webhook/spv-new-entity</code> for optional background automation (audit, mirrors, legacy email
              flows)—it does not replace acting on tasks in this portal.
            </p>
          </div>
          <div className="page-actions no-print">
            <Link href="/" className="btn">
              Cancel
            </Link>
          </div>
        </div>
      </header>

      <IntakeForm />
    </div>
  );
}
