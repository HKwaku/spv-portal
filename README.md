# SPV portal

Next.js + Prisma app for legal-entity formation intake and checklist tracking.

## Local development

1. Copy `.env.example` to `.env`.
2. Configure the database (see [`.env.example`](.env.example)). **Recommended (Supabase):** set `SUPABASE_PROJECT_REF` and `SUPABASE_DB_PASSWORD` only—`DATABASE_URL` is composed at runtime. **Alternatively:** set `DATABASE_URL` to a full PostgreSQL URL (any host).
3. `npm install`
4. `npm run db:push`
5. Optional: `npm run db:seed`
6. `npm run dev`

### Supabase

1. Create a project at [Supabase](https://supabase.com).
2. **Do not use the long “Project ID” UUID** as the database host. Use either:
   - **Reference ID** — **Project Settings → General** → copy **Reference ID** (short string) into `SUPABASE_PROJECT_REF`, or  
   - **Host only** — **Project Settings → Database** → copy the host that looks like `db.xxxxx.supabase.co` into `SUPABASE_DB_HOST` (leave `SUPABASE_PROJECT_REF` empty if you prefer).
3. Set **Database password** from **Project Settings → Database** in `SUPABASE_DB_PASSWORD` (quote the value if it contains `#`, `?`, or spaces).
4. The app composes `DATABASE_URL` automatically; see `lib/database-url.ts` for optional overrides.

### PostgreSQL locally

Use Docker, [Neon](https://neon.tech) (free), or another host. Example Docker:

```bash
docker run --name spv-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=spv -p 5432:5432 -d postgres:16
```

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spv"
```

## Deploy on Vercel

This app **does not** use SQLite in production. Vercel’s serverless runtime cannot rely on a bundled `*.db` file.

1. Create a Postgres database. Common choices: [Supabase](https://supabase.com), [Neon](https://neon.tech), [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres).
2. In the Vercel project → **Settings → Environment Variables**, set either:
   - **Supabase (split):** `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` (same values as local). The app builds `DATABASE_URL` at runtime—no single pasted URI.
   - **Or** set **`DATABASE_URL`** to a full PostgreSQL URL (any host).
   - `N8N_SPV_WEBHOOK_URL`, `N8N_BASE_URL` — your real n8n URLs.
   - `PORTAL_BASE_URL` — your live site, e.g. `https://<your-project>.vercel.app` (used when n8n or other tools must call back to the portal).
3. **Create tables** in that database (one-time). From your machine, with the same env as production (e.g. copy `SUPABASE_*` into `.env` or export them), run:

   ```bash
   npm run db:push
   ```

4. Redeploy (or push a commit) so the build picks up env vars.

Build command is `npm run build` (`postinstall` runs `prisma generate`).
