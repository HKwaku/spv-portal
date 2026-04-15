/**
 * Load `.env` before Prisma runs (e.g. `prisma db seed` subprocess may not inherit composed DATABASE_URL).
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { composeDatabaseUrl } from '../lib/database-url';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });
composeDatabaseUrl();
