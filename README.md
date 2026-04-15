# SPV portal

Next.js + Prisma app for legal-entity formation intake and checklist tracking.

## How this connects to Supabase (same project as your other apps)

Projects like **sojourn-cabins** use the Supabase **JS client** with `NEXT_PUBLIC_SUPABASE_URL` + API keys. **This app uses Prisma**, which talks to Postgres over a **`DATABASE_URL`** — one connection string from the same Supabase project.

1. Open **Supabase → Project Settings → Database**.
2. Under **Connect** / connection string, copy the **Postgres** URI (URI tab).
3. Put it in **`.env`** as `DATABASE_URL` locally and in **Vercel → Environment Variables** for Production.
4. If deploys on Vercel fail with DB errors, try the **Transaction pooler** URI (port **6543**) instead of direct **5432** — Supabase shows both in the same place.

Then from the repo root:

```bash
npm install
npx prisma db push
npm run dev
```

Optional: `npm run db:seed` for demo data. If checklist steps all show **Locked** and you cannot use **Action**, run `npm run db:repair-unlocks` once (fixes `isUnlocked` flags for existing rows).

## Deploy on Vercel

1. Set **`DATABASE_URL`** (and `N8N_*`, `PORTAL_BASE_URL` as needed) for **Production**.
2. Redeploy after changing env vars.

Build: `npm run build` (`postinstall` runs `prisma generate`).
