# Current Status

**Last update:** 2026-04-17 (M1 code complete, deploy pending)

## What's done

### M1 — DB + admin wired (code complete, deploy pending)

- **Schema** — applied live to Bentropy Supabase project (`cbsydtnaxancoltzzhrz`) via `supabase db push` on 2026-04-18.
  - Migration file: [supabase/migrations/20260418023308_init_hub_schema.sql](../../supabase/migrations/20260418023308_init_hub_schema.sql)
  - Original 6 tables plus new: `admin_users`, `integrations`, `integration_snapshots`, `sync_log`
  - `projects` extended with `primary_domain`, `vercel_project_id`, `archived_at`
  - `updated_at` triggers on every mutable table
  - RLS tightened: `is_admin()` allowlist gates everything; `projects` keeps public SELECT for the marketing site
  - Idempotent — safe to re-apply
  - CLI is initialized + linked: [supabase/config.toml](../../supabase/config.toml). Future schema changes ship as new migration files in [supabase/migrations/](../../supabase/migrations/). Run `supabase db push` to apply.

- **Types** ([src/lib/db/types.ts](../../src/lib/db/types.ts)) — single source; old `src/lib/supabase/types.ts` re-exports for backward compat with the public site

- **Queries** ([src/lib/db/queries.ts](../../src/lib/db/queries.ts)) — `server-only` helpers used by RSC pages

- **Server actions** ([src/lib/db/actions.ts](../../src/lib/db/actions.ts)) — every admin mutation goes through here, all `revalidatePath` after writes

- **Admin pages** — all 7 converted from client placeholder state to server component shell + client form + server actions:
  - [src/app/admin/page.tsx](../../src/app/admin/page.tsx) (dashboard)
  - [src/app/admin/projects/](../../src/app/admin/projects/)
  - [src/app/admin/credentials/](../../src/app/admin/credentials/)
  - [src/app/admin/services/](../../src/app/admin/services/)
  - [src/app/admin/repos/](../../src/app/admin/repos/)
  - [src/app/admin/logins/](../../src/app/admin/logins/)
  - [src/app/admin/notes/](../../src/app/admin/notes/)

- **Auth gate**
  - [src/app/admin/layout.tsx](../../src/app/admin/layout.tsx) — server-side check: redirect to `/login` if no user, `/login?error=unauthorized` if user is not in `admin_users`
  - [src/app/login/page.tsx](../../src/app/login/page.tsx) + `LoginClient.tsx` — GitHub OAuth button
  - [src/app/auth/callback/route.ts](../../src/app/auth/callback/route.ts) — exchanges OAuth code for session
  - [src/middleware.ts](../../src/middleware.ts) keeps refreshing sessions (already in place)

- **CLAUDE.md** at repo root documents stack, conventions, security invariants

- **Build verified**: `npm run build` clean. Admin routes correctly marked dynamic.

## What Ben needs to do to ship M1

These are the deploy steps Claude can't do for you. None of them require touching code.

### 1. Schema — DONE

Already pushed via Supabase CLI on 2026-04-18. No action needed.

### 2. Configure GitHub OAuth in Supabase

1. Supabase dashboard → Authentication → Providers → GitHub → enable
2. In a new tab, GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   - **Homepage URL**: `https://<your-vercel-domain>` (or `http://localhost:3344` for local first)
   - **Authorization callback URL**: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Copy Client ID + Client Secret back into Supabase's GitHub provider config

### 3. Local env vars

Create `.env.local` in repo root:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase API settings>
```

### 4. First login + admin allowlist

1. `npm run dev`
2. Visit http://localhost:3344/admin → redirected to `/login`
3. Click "Continue with GitHub" → complete OAuth → you'll redirect back and hit `/login?error=unauthorized` because `admin_users` is empty
4. In Supabase SQL editor, run:
   ```sql
   insert into admin_users (user_id) values (auth.uid_for_email('ben@hgraphene.com'));
   -- OR look up the id directly in auth.users:
   insert into admin_users (user_id)
     select id from auth.users where email = 'ben@hgraphene.com';
   ```
5. Refresh `/admin` — you're in.

### 5. Deploy to Vercel

1. Push branch + open PR (when ready)
2. Vercel → New Project → import this repo
3. Add the same two env vars in Vercel project settings
4. Deploy
5. Update GitHub OAuth Homepage URL to the production domain
6. Add the production domain's `/auth/callback` to Supabase Auth → URL Configuration → Redirect URLs

### 6. Verify (per the plan's M1 verification)

- Visit deployed `/admin`, auth through GitHub
- Create a project via UI, refresh, confirm it persists
- Check Supabase dashboard → Tables → `projects` — row is there

## Known follow-ups (not in M1 scope)

- `middleware.ts` shows a Next 16 deprecation warning ("use 'proxy' instead"). Cosmetic; not a blocker. Worth a one-file rename in a future session.
- Two existing seed projects use `image_url` and the public site has hardcoded placeholder Project objects — left alone per "don't touch the marketing site" rule. M2 will replace public showcase with real Supabase reads if desired.
- `Github` icon from lucide-react is deprecated; warnings only, still renders.

## What's next

**M2** — Per-project detail page (`/admin/projects/[slug]`) and seed Finch + SaltGoat. See [active plan](/Users/bentyson/.claude/plans/bentropy-is-the-master-lexical-snowglobe.md) M2 section. Use Sonnet 4.6 for the build, Haiku 4.5 for the seed pass. Start a fresh session.
