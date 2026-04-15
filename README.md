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

## Workflow: portal vs n8n

- **Checklist state** lives in Postgres (what you see on the dashboard). **n8n** can automate email, CRM, Slack, etc., and **calls** `POST /api/tasks/sync` when a workflow node lines up with a checklist step (`stepKey`, `runId`, optional `externalWaitKey` for WAIT resume).
- **Completing a task** in the app (`/api/tasks/.../complete`) updates the DB and, if `externalWaitKey` is set, **resumes** the paused n8n execution — so human completion and automation stay linked.
- To avoid “only clicking status in the UI” driving everything:
  1. Set **`N8N_TASK_COMPLETION_WEBHOOK_URL`** to an n8n webhook that ends with **Respond to Webhook** returning `{ "allow": true }` only after your real checks (integrations, approvals, etc.). If the workflow returns an error or `{ "allow": false }`, the portal **does not** save completion.
  2. Set **`PORTAL_UNLOCK_NEXT_AFTER_COMPLETE=false`** if the **next** step should unlock only when n8n reaches it and calls **`/api/tasks/sync`**, not immediately after the user completes the current step.

Example workflow JSON lives under `docs/n8n/`.
