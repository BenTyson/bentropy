# Current Status

**Last update:** 2026-04-17 (M2 complete)

## What's done

### M2 — Per-project detail page + Finch/SaltGoat seed (complete)

- **Detail page** ([src/app/admin/projects/[slug]/page.tsx](../../src/app/admin/projects/%5Bslug%5D/page.tsx)) — server component, 6 stacked cards:
  1. Hero — name, tagline, status badge, links (primary_domain, demo_url, repo_url), tech stack, description, timestamps
  2. Integrations — placeholder, "Coming in M3"
  3. Credentials — masked keys (••••••••), expiry badge if set, service + notes
  4. Repositories — name, category, external GitHub link
  5. Local Dev — port, start_command, running/stopped badge
  6. Notes — title, content, pinned badge, tags

- **Projects list link** ([src/app/admin/projects/ProjectsClient.tsx](../../src/app/admin/projects/ProjectsClient.tsx)) — Eye icon button on each row links to `/admin/projects/[slug]`

- **Query** ([src/lib/db/queries.ts](../../src/lib/db/queries.ts)) — `getProjectBySlug(slug)` + `ProjectRollup` type; loads project + credentials, repos, local_services, notes in parallel

- **Seed** ([supabase/seed.sql](../../supabase/seed.sql)) — idempotent DO block; upserts Finch + SaltGoat projects then delete+reinserts their credentials, repos, local services, and notes. Run via Supabase SQL editor (runs as service-role, bypasses RLS).

- **Build verified**: `npm run build` clean. `/admin/projects/[slug]` correctly listed as dynamic (ƒ).

### M1 — DB + admin wired (complete)

- **Schema** — applied live to Bentropy Supabase project (`cbsydtnaxancoltzzhrz`) via `supabase db push`
  - Migration: [supabase/migrations/20260418023308_init_hub_schema.sql](../../supabase/migrations/20260418023308_init_hub_schema.sql)
  - Original 6 tables plus: `admin_users`, `integrations`, `integration_snapshots`, `sync_log`
  - `projects` extended with `primary_domain`, `vercel_project_id`, `archived_at`
  - `updated_at` triggers on every mutable table
  - RLS tightened: `is_admin()` allowlist gates everything; `projects` keeps public SELECT for marketing site
  - CLI initialized + linked: [supabase/config.toml](../../supabase/config.toml). New migrations go in [supabase/migrations/](../../supabase/migrations/). Apply with `supabase db push`.

- **Types** ([src/lib/db/types.ts](../../src/lib/db/types.ts)) — single source; old `src/lib/supabase/types.ts` re-exports for backward compat

- **Queries** ([src/lib/db/queries.ts](../../src/lib/db/queries.ts)) — `server-only` helpers used by RSC pages

- **Server actions** ([src/lib/db/actions.ts](../../src/lib/db/actions.ts)) — all admin mutations, `revalidatePath` after writes

- **Admin pages** — all 7 wired to Supabase (server component shell + client form + server actions):
  - Dashboard, Projects, Credentials, Services, Repos, Logins, Notes

- **Auth gate** — admin layout redirects to `/login` if unauthenticated or not in `admin_users`; GitHub OAuth flow complete

## Seed data applied

Seeded via Management API on 2026-04-17. Verified row counts:
- `finch` (active): 5 creds, 2 repos, 1 service, 2 notes
- `saltgoat` (concept): 1 cred, 1 repo, 1 service, 1 note

Visit `/admin/projects` → Eye icon on Finch/SaltGoat to see the detail page. Replace `PLACEHOLDER_*` credential values with real keys before M3 (when encryption is wired in).

### How the seed was run (for future reference)

Supabase CLI v2.72 has no `db seed`, and the Postgres password isn't cached. Used the Management API `/database/query` endpoint with the `sbp_` access token from the macOS keychain. Full recipe + gotchas in [CLAUDE.md](../../CLAUDE.md#supabase-cli--running-sql-on-the-remote-db); decision rationale in [docs/decisions/LOG.md](../decisions/LOG.md).

## What Ben needed to do to ship M1 (still applies for Vercel deploy)

These deploy steps haven't changed — see the previous session notes if needed.

## Known follow-ups (not in M1/M2 scope)

- `middleware.ts` shows a Next 16 deprecation warning ("use 'proxy' instead"). Cosmetic; not a blocker.
- `Github` icon from lucide-react shows deprecation warnings. Still renders; cosmetic.
- Public site `(public)/projects/[slug]` still uses hardcoded placeholder data — left alone per "don't touch the marketing site" rule.
- Credentials stored as plaintext until `ENCRYPTION_KEY` env var + AES-GCM encrypt/decrypt helper wired in (M3 work).

## What's next

**M3** — Integrations schema + manual Vercel rows. See [active plan](/Users/bentyson/.claude/plans/bentropy-is-the-master-lexical-snowglobe.md) M3 section. Use **Opus 4.7** (polymorphic schema design + discriminated union types). Start a fresh session.

Key M3 tasks:
- Migrate `integrations` + `integration_snapshots` + `sync_log` tables (already exist in schema, but the `IntegrationCard` component and the `/admin/projects/[slug]/integrations/new` flow need building)
- Build generic `IntegrationCard` component
- Manually enter Vercel project IDs + PATs for Finch + SaltGoat
- Wire `ENCRYPTION_KEY` env var + `src/lib/crypto.ts` AES-GCM helpers before inserting first real credential
