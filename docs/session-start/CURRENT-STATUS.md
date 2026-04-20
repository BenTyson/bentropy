# Current Status

**Last update:** 2026-04-19 (M6 Session B complete — Vercel + Railway credential autopull endpoints wired)

## What's done

### M6 Session B — Vercel + Railway credential autopull (complete)

**Client extensions**:

- [src/lib/integrations/vercel.ts](../../src/lib/integrations/vercel.ts) — `fetchVercelProjectsForAccount(pat, externalAccountId)` (GET `/v9/projects` with pagination via `until` cursor, capped at 20 pages) and `fetchVercelProjectEnv(pat, projectId, externalAccountId)` (GET `/v9/projects/{id}/env?decrypt=true`). `teamId` only sent when `externalAccountId` starts with `team_` — personal PATs reject the param. Filters env to `type === "encrypted" | "plain"` with non-empty `value`; drops `system`, `secret`, `sensitive`.
- [src/lib/integrations/railway.ts](../../src/lib/integrations/railway.ts) — `fetchRailwayProjectsForWorkspace(pat, workspaceId)` via `projects(teamId: $teamId)` query and `fetchRailwayVariables(pat, projectId, environmentId, serviceId)` via `variables` query. Shared `railwayGraphql()` helper tries `Authorization: Bearer` first, falls back to `Project-Access-Token` on auth failure (same dual-token pattern as the deployment client).

**Cron routes**:

- [src/app/api/cron/pull-credentials/vercel/route.ts](../../src/app/api/cron/pull-credentials/vercel/route.ts) — iterates `provider_accounts` where `provider='vercel'` and `master_credential_id is not null`, decrypts each master PAT, lists Vercel projects for the account, matches against Bentropy via `projects.vercel_project_id`, fetches env vars per matched project, and inserts new rows into `credentials` with `project_id` set. Same Bearer-token cron auth pattern as `sync-vercel`.
- [src/app/api/cron/pull-credentials/railway/route.ts](../../src/app/api/cron/pull-credentials/railway/route.ts) — parallel shape. Railway projects lack a dedicated column on `projects`, so matching is via the existing `integrations` row where `type='railway'` and `config->>project_id = railway_api_id`; that integration also pins the `(service_id, environment_id)` used for the variables query.

**Write policy (conservative, pre-`source` column)**: for every `(project_id, name)` pair, select first; if a row exists, skip and increment `skipped_existing`; only insert when absent. No updates to existing rows — Session C will add the `source` column and flip to "overwrite only where `source='autopull'`". All values `encrypt()`'d before the DB write.

**Response shape** (both routes):
```json
{ "type": "vercel", "accounts": N, "matched_projects": N, "inserted": N,
  "skipped_existing": N, "skipped_unmatched": N, "errors": N, "results": [...] }
```
Per-account error captured on `results[].error` (no throw propagates past the account loop).

**railway.toml** — two new `[[cron]]` entries for `pull-credentials-vercel` and `pull-credentials-railway` on `0 */6 * * *` (6-hour cadence; autopull is heavier than the 15-min status syncs).

**Build verified**: `npm run build` clean; both new routes appear in the route table.

### M6 Session A — provider_accounts schema + UI (complete)

**Migration** ([supabase/migrations/20260419100000_provider_accounts.sql](../../supabase/migrations/20260419100000_provider_accounts.sql)):

- New `provider_accounts` table: `id`, `provider`, `display_name`, `external_account_id`, `master_credential_id → credentials.id on delete set null`, `created_at`, `updated_at`. Unique on `(provider, external_account_id)`.
- `alter table integrations add column if not exists provider_account_id uuid references provider_accounts(id) on delete set null`. Existing rows default to `null` and fall through to the project-credential path — no backfill.
- Index on `provider_accounts(provider)` and on `integrations(provider_account_id)`.
- Updated_at trigger on `provider_accounts` (reuses existing `update_updated_at()` function).
- RLS enabled + admin-only policy block following the same `do $$ ... for t in select unnest(array[...])` pattern as M1.
- Applied to live DB via Management API (HTTP 201).

**Types** ([src/lib/db/types.ts](../../src/lib/db/types.ts)):

- New `ProviderAccount` interface.
- `BaseIntegration` extended with `provider_account_id: string | null`.
- `Database.public.Tables.provider_accounts` mapping added.

**Credential resolution** ([src/lib/integrations/sync.ts](../../src/lib/integrations/sync.ts)) — `resolveSecret()` now tries three paths:

1. `integration.secret_ref` (explicit override, unchanged)
2. `integration.provider_account_id → provider_accounts.master_credential_id` (new middle path — if the account exists but `master_credential_id` is null, falls through silently)
3. Project-scoped `credentials` where `service = integration.type` (current behavior)

Throws only if all three fail.

**Admin UI** — new route [src/app/admin/provider-accounts/page.tsx](../../src/app/admin/provider-accounts/page.tsx) + [ProviderAccountsClient.tsx](../../src/app/admin/provider-accounts/ProviderAccountsClient.tsx):

- Server component fetches `getProviderAccounts()` + `getCredentialMinis()` in parallel and hands them to the client.
- Add dialog: provider select (`vercel | supabase | railway | github | stripe | dns | analytics`), display_name, external_account_id, master_credential_id select filtered client-side by `service === provider`.
- Delete button on each card (with confirm).
- No edit UI in Session A — delete + recreate per the plan.
- Sidebar item added under "Integrations" as "Providers" (Building2 icon) — [src/components/admin/Sidebar.tsx](../../src/components/admin/Sidebar.tsx).
- Actions [src/lib/db/actions.ts](../../src/lib/db/actions.ts): `createProviderAccount`, `deleteProviderAccount`.
- Queries [src/lib/db/queries.ts](../../src/lib/db/queries.ts): `getProviderAccounts`, `getCredentialMinis`.

**Build verified**: `npm run build` clean; `/admin/provider-accounts` registered in the route table.

## What Ben needs to do before M6 Session A verification works end-to-end

1. Open `/admin/provider-accounts`, click Add, register Ben's Vercel personal account (provider=`vercel`, display_name e.g. "Ben Personal (Vercel)", external_account_id = the Vercel team/personal id, master_credential_id = the existing Vercel PAT credential on Finch).
2. Point the Finch Vercel integration at it: for now, update the `integrations` row directly (Supabase dashboard or SQL) — there's no edit-integration UI yet:
   ```sql
   update integrations
   set provider_account_id = '<new provider_accounts.id>'
   where project_id = (select id from projects where slug = 'finch')
     and type = 'vercel';
   ```
3. Trigger `/api/cron/sync-vercel` (Bearer header or the Refresh button on the Vercel card). It should succeed via path 2 even if `secret_ref` is null and the project-scoped Vercel credential is removed.

### M5 — MCP writes + GitHub integration (complete)

**MCP write tools** (new files in [mcp/src/tools/](../../mcp/src/tools/)):

- **`add_note`** — args `{project, title, body, tags?}`. Resolves project by slug, inserts into `notes` with `content = body`. Returns `{id, title, tags, created_at}`.
- **`update_project_status`** — args `{slug, status}`. Validates against `"active" | "shipped" | "concept"` enum. Updates `projects.status`; `updated_at` bumped by the existing DB trigger (not set manually). Returns updated project row slice.
- **`upsert_credential`** — args `{project, name, value, service, expires_at?}`. Encrypts `value` via `encrypt()` before any DB write. Dedup: select-then-update-or-insert on `(project_id, name)` — no plaintext in any error path. Returns `{id, name, service, updated: bool}`.

All three registered in [mcp/src/index.ts](../../mcp/src/index.ts) — tools list + dispatch switch. Same error-handling pattern as read tools (try/catch → `isError: true`).

**GitHub integration**:

- **REST client** ([src/lib/integrations/github.ts](../../src/lib/integrations/github.ts)) — `fetchGithubSnapshot(config, pat)` hits three endpoints in parallel: `GET /repos/{owner}/{repo}` (default_branch, pushed_at, stars, open_issues_count), `GET /repos/{owner}/{repo}/pulls?state=open&per_page=20` (open PR count + pulls array), `GET /repos/{owner}/{repo}/commits?per_page=1` (latest commit SHA). Returns typed `GithubSnapshot`. Warns on stderr if `X-RateLimit-Remaining < 100`. 404 surfaces a clear message about PAT scope vs private repo.
- **Sync case** ([src/lib/integrations/sync.ts](../../src/lib/integrations/sync.ts)) — `case "github":` added to `runIntegrationFetch`.
- **Cron route** ([src/app/api/cron/sync-github/route.ts](../../src/app/api/cron/sync-github/route.ts)) — identical pattern to sync-vercel; calls `syncAllOfType(supabase, "github")`.
- **Railway cron** ([railway.toml](../../railway.toml)) — third `[[cron]]` entry on `*/15 * * * *` hitting `/api/cron/sync-github`.

**Migration** ([supabase/migrations/20260419000000_credentials_project_name_unique.sql](../../supabase/migrations/20260419000000_credentials_project_name_unique.sql)) — partial unique index on `credentials(project_id, name) where project_id is not null`. Applied to live DB (HTTP 201).

**Builds verified**: `cd mcp && npm run build` clean. `npm run build` (Next root) clean — `/api/cron/sync-github` registered.

### M4 Session B — MCP server skeleton + 4 read tools (complete)
### M4 Session A — Vercel + Railway live sync (complete)
### M3 — Integrations schema + manual Vercel rows (complete)
### M2 — Per-project detail page + Finch/SaltGoat seed (complete)
### M1 — DB + admin wired (complete)

## What Ben needs to do before M5 verification works end-to-end

1. **Rebuild MCP locally** (new tools won't appear until rebuilt):
   ```bash
   cd mcp && npm run build
   ```
   Then restart Claude Code so it re-reads the tool list.

2. **GitHub integration verification**:
   - Create a GitHub PAT (classic or fine-grained with `Contents: read` + `Pull requests: read` scope).
   - Add it as a credential on Finch: `/admin/credentials` → name `"GitHub PAT"`, service `"github"`.
   - Add a GitHub integration row for Finch via `/admin/projects/finch` → Integrations → Add, with `config: {"owner": "BenTyson", "repo": "finch"}`.
   - Trigger sync: `POST /api/cron/sync-github` with the Bearer header, or click Refresh on the GitHub card.

3. **MCP write tool verification** (from any Claude Code session in any repo):
   - `add_note` with `{project: "saltgoat", title: "testing MCP writes", body: "M5 verification"}` → open `/admin/projects/saltgoat`, note appears.
   - `update_project_status` with `{slug: "saltgoat", status: "active"}` → project row reflects it.
   - `upsert_credential` twice with same `{project, name}` → second call returns `updated: true`, no duplicate row in DB.

## Known follow-ups (not in M5 scope)

- **Integration edit UI** — still delete + recreate for `config` changes.
- **Refresh button disabled** for `github` type until the next session wires it (the button checks `['vercel', 'railway']` currently). Fix: add `"github"` to the enabled list in [src/components/admin/RefreshButton.tsx](../../src/components/admin/RefreshButton.tsx).
- **Deprecated `Github` icon** from `lucide-react` and the `middleware.ts → proxy.ts` Next 16 warning — cosmetic, carry-over from earlier sessions.
- **PLACEHOLDER_* credentials from M2** still throw on sync — still need overwriting via `/admin/credentials`.

## What Ben needs to do before M6 Session B verification works end-to-end

1. **Vercel path** (Finch):
   - On `/admin/provider-accounts`, the Vercel provider account from Session A must have its `external_account_id` set to the actual Vercel team id (starts with `team_`) for team PATs, or any non-`team_` string (e.g. the username) for a personal PAT — the client only sends `teamId` when it starts with `team_`.
   - Finch's `projects.vercel_project_id` must match the Vercel API's project id (already set if Session A deploy sync works).
   - `POST /api/cron/pull-credentials/vercel` with `Authorization: Bearer $CRON_SECRET`. Expect `matched_projects >= 1`, `inserted > 0` on first run, `skipped_existing` equal to insert count on subsequent runs, `inserted: 0`.
   - Verify in Supabase: `select name, service from credentials where project_id = (select id from projects where slug='finch') and service='vercel' order by created_at desc;`

2. **Railway path** (SaltGoat):
   - A Railway provider account must exist on `/admin/provider-accounts` with `external_account_id` = Railway workspace id (or left blank-ish / the placeholder for personal workspace — Railway's `projects(teamId: null)` returns the caller's personal projects).
   - SaltGoat's existing Railway integration row (`integrations.type='railway'`, `config.project_id = <Railway API id>`) is the match key — no column needed on `projects`.
   - `POST /api/cron/pull-credentials/railway`. Same expected shape.

## What's next

**M6 Session C** — Supabase autopull + rotation warnings + `source` column on `credentials` (`'manual' | 'autopull'`) so pulls can safely overwrite stale autopull rows without clobbering manual entries. Add a rotation warning log if any master PAT is > 180 days old.

After M6, remaining integrations are each ~1 day of Sonnet work: Stripe, DNS, Analytics, Local dev.
