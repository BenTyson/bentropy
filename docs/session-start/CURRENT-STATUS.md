# Current Status

**Last update:** 2026-04-20 (M7 complete — Stripe credential autopull)

## What's done

### M7 — Stripe credential autopull (complete)

**Stripe integration client** ([src/lib/integrations/stripe.ts](../../src/lib/integrations/stripe.ts)):
- `fetchStripeAccount(secretKey)` — GET `https://api.stripe.com/v1/account` with Bearer auth.
- Returns `{id: string, display_name: string | null}`. Used to validate the key is live and to get `acct_...` for project matching.

**Stripe autopull route** ([src/app/api/cron/pull-credentials/stripe/route.ts](../../src/app/api/cron/pull-credentials/stripe/route.ts)):
- Same shape as Vercel/Railway/Supabase routes. Iterates `provider_accounts` where `provider='stripe'`.
- `external_account_id` on the provider account = Stripe `acct_...` id (set at registration time).
- Decrypts master credential (the Stripe secret key itself: `sk_live_*`, `sk_test_*`, or `rk_live_*`).
- Validates key via `GET /v1/account`; matches Bentropy project via `integrations` where `type='stripe'` and `config->>account_id = <acct_...>`.
- Upserts one credential per matched project: `STRIPE_SECRET_KEY` with `source='autopull'`, `service='stripe'`.
- Note: Stripe has no "list child keys" endpoint — the master secret key IS the project credential. The route validates + re-upserts it on each run (no-op if unchanged).

**railway.toml** — fourth `[[cron]]` entry for `pull-credentials-stripe` on `0 */6 * * *`.

**Build verified**: `npm run build` clean. `/api/cron/pull-credentials/stripe` in route table.

### M6 Session C — source column + Supabase autopull + rotation warnings (complete)

**Migration** ([supabase/migrations/20260420000000_credentials_source.sql](../../supabase/migrations/20260420000000_credentials_source.sql)):
- `alter table credentials add column if not exists source text not null default 'manual' check (source in ('manual', 'autopull'))`. Applied to live DB (Management API, HTTP 201 / empty array response).
- Existing rows defaulted to `'manual'` — correct.

**Types** ([src/lib/db/types.ts](../../src/lib/db/types.ts)):
- `Credential` interface now has `source: "manual" | "autopull"`.
- `Database.public.Tables.credentials.Insert` makes `source` optional (DB default handles omitted writes).

**Source-aware write policy** — both Vercel and Railway autopull routes updated:
- Select existing row by `(project_id, name)` including `source` and `key_encrypted`.
- `source === 'manual'` → `skipped_manual`, untouched.
- `source === 'autopull'` + decrypt-compare same → `skipped_unchanged` (no `updated_at` churn).
- `source === 'autopull'` + value differs → update `key_encrypted` only → `updated`.
- No existing row → insert with `source: 'autopull'`.
- Response shape updated: `inserted`, `updated`, `skipped_manual`, `skipped_unchanged`, `skipped_unmatched` (dropped the old `skipped_existing` single bucket).

**SQL to verify no manual rows touched after a pull run**:
```sql
select id, name, source, updated_at
from credentials
where project_id = (select id from projects where slug = 'finch')
  and updated_at > '<timestamp before run>'
  and source = 'manual';
-- should return zero rows
```

**Rotation warnings** ([src/lib/integrations/rotation.ts](../../src/lib/integrations/rotation.ts)):
- `warnOnStaleMasterCredentials(supabase, provider)` — two queries: all provider_accounts for provider → credentials by id. Logs `console.warn` for any master credential with `created_at` older than 180 days (includes provider, account display_name, credential name, age in days).
- Called non-blocking at the top of all three autopull routes before the main account loop.
- Verification: backdate a master credential's `created_at` by 200 days via SQL, re-run any autopull cron, confirm warning appears in Railway logs.

**Supabase integration client** ([src/lib/integrations/supabase.ts](../../src/lib/integrations/supabase.ts)):
- `fetchSupabaseProjectsForOrg(pat, orgSlug)` — GET `https://api.supabase.com/v1/organizations/{slug}/projects`. Returns typed `SupabaseProjectSummary[]`.
- `fetchSupabaseProjectApiKeys(pat, projectRef)` — GET `https://api.supabase.com/v1/projects/{ref}/api-keys`. Returns `SupabaseApiKey[]` with `name` + `api_key`.

**Supabase autopull route** ([src/app/api/cron/pull-credentials/supabase/route.ts](../../src/app/api/cron/pull-credentials/supabase/route.ts)):
- Same shape as Vercel/Railway routes. Iterates `provider_accounts` where `provider='supabase'`. `external_account_id` = org slug.
- Matches Supabase projects to Bentropy via `integrations` where `type='supabase'` and `config->>project_ref = <supabase_project_ref>` (same pattern as Railway).
- Upserts two credentials per matched project: `SUPABASE_ANON_KEY` (from `name='anon'`) and `SUPABASE_SERVICE_ROLE_KEY` (from `name='service_role'`), both with `source='autopull'`, `service='supabase'`.

**railway.toml** — third `[[cron]]` entry for `pull-credentials-supabase` on `0 */6 * * *`.

**Build verified**: `npm run build` clean. All three pull-credentials routes appear in route table:
- `/api/cron/pull-credentials/vercel`
- `/api/cron/pull-credentials/railway`
- `/api/cron/pull-credentials/supabase`

### M6 Session B — Vercel + Railway credential autopull (complete)

**Client extensions**:

- [src/lib/integrations/vercel.ts](../../src/lib/integrations/vercel.ts) — `fetchVercelProjectsForAccount(pat, externalAccountId)` (GET `/v9/projects` with pagination via `until` cursor, capped at 20 pages) and `fetchVercelProjectEnv(pat, projectId, externalAccountId)` (GET `/v9/projects/{id}/env?decrypt=true`). `teamId` only sent when `externalAccountId` starts with `team_` — personal PATs reject the param. Filters env to `type === "encrypted" | "plain"` with non-empty `value`; drops `system`, `secret`, `sensitive`.
- [src/lib/integrations/railway.ts](../../src/lib/integrations/railway.ts) — `fetchRailwayProjectsForWorkspace(pat, workspaceId)` via `projects(teamId: $teamId)` query and `fetchRailwayVariables(pat, projectId, environmentId, serviceId)` via `variables` query. Shared `railwayGraphql()` helper tries `Authorization: Bearer` first, falls back to `Project-Access-Token` on auth failure (same dual-token pattern as the deployment client).

**railway.toml** — two `[[cron]]` entries for `pull-credentials-vercel` and `pull-credentials-railway` on `0 */6 * * *` (6-hour cadence).

### M6 Session A — provider_accounts schema + UI (complete)

**Migration** ([supabase/migrations/20260419100000_provider_accounts.sql](../../supabase/migrations/20260419100000_provider_accounts.sql)):
- New `provider_accounts` table: `id`, `provider`, `display_name`, `external_account_id`, `master_credential_id → credentials.id on delete set null`, `created_at`, `updated_at`. Unique on `(provider, external_account_id)`.
- `alter table integrations add column if not exists provider_account_id uuid references provider_accounts(id) on delete set null`.

**Admin UI** — `/admin/provider-accounts` with add dialog + delete buttons. Sidebar "Providers" nav item.

### M5 — MCP writes + GitHub integration (complete)
### M4 Session B — MCP server skeleton + 4 read tools (complete)
### M4 Session A — Vercel + Railway live sync (complete)
### M3 — Integrations schema + manual Vercel rows (complete)
### M2 — Per-project detail page + Finch/SaltGoat seed (complete)
### M1 — DB + admin wired (complete)

## What's next

**M7 is complete.** Remaining integrations each follow the established pattern (~1 Sonnet session each):
- **DNS** — provider-specific (Cloudflare, etc.).
- **Analytics** — provider-specific (Plausible, PostHog, etc.).
- **Local dev** — manual-only, no autopull.

## What Ben needs to do to verify M7

**Stripe autopull**:
1. Register a Stripe provider account on `/admin/provider-accounts`: `provider=stripe`, `display_name` e.g. "Ben (Stripe)", `external_account_id` = Stripe account id (`acct_...`), `master_credential_id` = a credential holding the Stripe secret key (`sk_live_*` or `rk_live_*`).
2. Add a Stripe integration row on Finch's detail page with `config: {"account_id": "acct_..."}` (same `acct_...` as above).
3. `POST /api/cron/pull-credentials/stripe` with `Authorization: Bearer $CRON_SECRET`.
4. Confirm `STRIPE_SECRET_KEY` appears in credentials for Finch with `source='autopull'` and `service='stripe'`.
5. Re-run — expect `skipped_unchanged: 1`, no second insert.

## What Ben needs to do to verify M6 Session C

**source column + write policy**:
1. Re-run `POST /api/cron/pull-credentials/vercel` — existing autopulled rows should show `skipped_unchanged > 0`, `inserted: 0`, `skipped_manual: 0`.
2. Manually change a credential's value in the UI (which sets `source='manual'`), re-run the pull — that credential shows in `skipped_manual`, `updated_at` unchanged.
3. Run the SQL verification query above for Finch.

**Supabase autopull**:
1. Register a Supabase provider account on `/admin/provider-accounts`: `provider=supabase`, `display_name` e.g. "Ben (Supabase)", `external_account_id` = Supabase org slug (find it at `https://app.supabase.com/org/<slug>/settings/general` or via `GET https://api.supabase.com/v1/organizations`), `master_credential_id` = a Supabase PAT credential.
2. Add a Supabase integration row on Finch's detail page with `config: {"project_ref": "cbsydtnaxancoltzzhrz"}`.
3. `POST /api/cron/pull-credentials/supabase` with Bearer header.
4. Confirm `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` appear in credentials for Finch with `source='autopull'`.

**Rotation warnings**:
1. Backdate a master credential: `update credentials set created_at = now() - interval '200 days' where id = '<master-cred-id>';`
2. Re-run any autopull cron.
3. Confirm `[rotation] Stale master credential: ...` warning appears in Railway logs.
4. Restore: `update credentials set created_at = now() where id = '<master-cred-id>';`

## Known follow-ups (carry-forward)

- **Integration edit UI** — still delete + recreate for `config` changes.
- **Refresh button** — `github` type not in the enabled list in [src/components/admin/RefreshButton.tsx](../../src/components/admin/RefreshButton.tsx).
- **Deprecated `Github` icon** from `lucide-react` and the `middleware.ts → proxy.ts` Next 16 warning — cosmetic.
- **PLACEHOLDER_* credentials from M2** still throw on sync — need overwriting via `/admin/credentials`.
