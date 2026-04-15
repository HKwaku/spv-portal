# SPV portal

Next.js + Prisma app for legal-entity formation intake and checklist tracking.

## Local development

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to a **PostgreSQL** connection string (see below).
3. `npm install`
4. `npx prisma db push`
5. Optional: `npm run db:seed`
6. `npm run dev`

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

1. Create a Postgres database ([Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech), Supabase, etc.).
2. In the Vercel project → **Settings → Environment Variables**, set:
   - `DATABASE_URL` — full Postgres URL (often with `?sslmode=require` for hosted providers).
   - Copy other keys from `.env.example` (`N8N_SPV_WEBHOOK_URL`, `N8N_BASE_URL`, `PORTAL_BASE_URL` = your production site URL).
3. **Create tables** in that database (one-time). From your machine, with production `DATABASE_URL`:

   ```bash
   npx prisma db push
   ```

   Or run the same against the production URL using a temporary env var.

4. Redeploy (or push a commit) so the build picks up env vars.

Build command is `npm run build` (`postinstall` runs `prisma generate`).
