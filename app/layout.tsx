import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';

const display = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Legal entity formation workflow',
    template: '%s · Legal entity formation workflow',
  },
  description:
    'Manage legal entity formation in one place: intake, assigned checklist steps, and reporting. Teams advance work in this app; background automation is supplementary.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
