'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import SidebarChecklist from '@/components/SidebarChecklist';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onNew = pathname === '/new' || pathname.startsWith('/new/');
  const onDashboard = pathname === '/';
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app-root">
      <aside className="sidebar no-print" aria-label="Main navigation">
        <Link href="/" className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden />
          <span>
            <span className="sidebar-title">Legal entity formation workflow</span>
            <span className="sidebar-tagline">Formation &amp; checklist</span>
          </span>
        </Link>
        <nav className="sidebar-nav">
          <Link
            href="/new"
            className={`btn btn-primary sidebar-nav-primary${onNew ? ' sidebar-nav-primary--active' : ''}`}
            aria-current={onNew ? 'page' : undefined}
          >
            New entity formation
          </Link>
          <Link href="/" className={`sidebar-link${onDashboard ? ' active' : ''}`} aria-current={onDashboard ? 'page' : undefined}>
            Dashboard
          </Link>
        </nav>
        <div className="sidebar-checklist-host">
          <Suspense
            fallback={
              <div className="sidebar-checklist-empty">
                <p className="sidebar-checklist-title">Workflow steps</p>
                <p className="sidebar-checklist-hint muted">Loading...</p>
              </div>
            }
          >
            <SidebarChecklist />
          </Suspense>
        </div>
        <div className="sidebar-footer">
          <span className="sidebar-hint">Advance steps here · webhook sync optional</span>
        </div>
      </aside>

      <div className="app-main-col">
        <header className="topbar no-print">
          <button type="button" className="menu-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav">
            <span className="sr-only">Menu</span>
            <span className="menu-icon" />
          </button>
          <div className="topbar-fill" />
        </header>

        {open ? (
          <>
            <div className="mobile-backdrop no-print" onClick={() => setOpen(false)} aria-hidden />
            <div id="mobile-nav" className="mobile-drawer no-print" role="dialog" aria-modal="true">
              <div className="mobile-drawer-inner">
                <div className="mobile-drawer-head">
                  <span className="sidebar-title">Legal entity formation workflow</span>
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Close menu">
                    ×
                  </button>
                </div>
                <nav className="mobile-nav-list">
                  <Link
                    href="/new"
                    className={`btn btn-primary mobile-nav-primary${onNew ? ' sidebar-nav-primary--active' : ''}`}
                    onClick={() => setOpen(false)}
                    aria-current={onNew ? 'page' : undefined}
                  >
                    New entity formation
                  </Link>
                  <Link
                    href="/"
                    className={`mobile-nav-link${onDashboard ? ' active' : ''}`}
                    onClick={() => setOpen(false)}
                    aria-current={onDashboard ? 'page' : undefined}
                  >
                    Dashboard
                  </Link>
                </nav>
              </div>
            </div>
          </>
        ) : null}

        <div className="app-content">{children}</div>

        <footer className="app-footer no-print">
          <span>Legal entity formation workflow</span>
          <span className="footer-dot" aria-hidden />
          <span className="muted">Checklist tracking · Intake · Reporting</span>
        </footer>
      </div>
    </div>
  );
}
