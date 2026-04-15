/**
 * Loads `.env`, composes `DATABASE_URL` from split vars if needed, then runs `prisma` with the same env.
 * Usage: npx tsx scripts/with-database-url.ts db push
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { composeDatabaseUrl } from '../lib/database-url';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

composeDatabaseUrl();

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npx tsx scripts/with-database-url.ts <prisma subcommand> [...]');
  process.exit(1);
}

const result = spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
