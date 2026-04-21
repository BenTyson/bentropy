# Current Status

**Last update:** 2026-04-20 (Admin redesign Phase 3c — Credentials page ported)

## What's done

### M10 — Local dev integration UI (complete)

**Per-project detail page** ([src/app/admin/projects/[slug]/page.tsx](../../src/app/admin/projects/%5Bslug%5D/page.tsx)):
- `integrations` is now split: `local` type goes to Card 5 (Local Dev), everything else to Card 2 (Integrations grid). No more misleading "pending"/"Never synced" noise for local services in Card 2.
- Card 5 merges both sources into a unified `LocalDevEntry` list sorted by port: legacy `local_services` rows (existing Finch/SaltGoat data) + new `local` type integrations from the `integrations` table.
- Port renders as a clickable `localhost:PORT` link. `is_active` badge shown only for legacy rows (not applicable to integration-based entries). Start command in monospace, notes when present.
- Card 5 header now has an "Add service" button (links to the integrations/new form with `type=local` as the natural entry path going forward).
- No migration needed — legacy `local_services` data continues to render untouched; new services added via "Add integration" flow flow into Card 5 automatically.

**Build verified**: `npm run build` clean.

### M9 — Analytics credential autopull (complete)

### M9 — Analytics credential autopull (complete)

**Analytics integration client** ([src/lib/integrations/analytics.ts](../../src/lib/integrations/analytics.ts)):
- `fetchUmamiWebsites(baseUrl, username, password)` — POST `/api/auth/login` to get a bearer token, then GET `/api/websites?pageSize=999`. Handles both array and `{data: [...]}` response shapes (Umami version variance).

**Analytics autopull route** ([src/app/api/cron/pull-credentials/analytics/route.ts](../../src/app/api/cron/pull-credentials/analytics/route.ts)):
- Same shape as all prior autopull routes. Iterates `provider_accounts` where `provider='analytics'`.
- `external_account_id` = Umami instance base URL (e.g., `https://umami-production-3685.up.railway.app`).
- master credential = JSON string `{"username":"...","password":"..."}` (AES-GCM encrypted). Route decrypts and JSON.parses before authenticating.
- Lists all websites under the authenticated user. For each website, matches via `integrations` where `type='analytics'` and `config->>property_id = <website.id>`.
- Upserts `UMAMI_WEBSITE_ID` (the website UUID) with `service='analytics'`, `source='autopull'` on every matched project.

**Provider account registration convention (Umami)**:
- `provider` = `analytics`
- `display_name` = e.g. "Ben (Umami)"
- `external_account_id` = Umami base URL (e.g., `https://umami-production-3685.up.railway.app`)
- `master_credential_id` → a credential whose encrypted value is: `{"username":"<umami-username>","password":"<umami-password>"}`

**Integration config convention**:
- `type` = `analytics`
- `config.provider` = `umami`
- `config.property_id` = Umami website UUID (the `id` field from `/api/websites`)

**railway.toml** — sixth `[[cron]]` entry for `pull-credentials-analytics` on `0 */6 * * *`.

**Build verified**: `npm run build` clean. `/api/cron/pull-credentials/analytics` in route table.

### M8 — DNS credential autopull (complete)

**DNS integration client** ([src/lib/integrations/dns.ts](../../src/lib/integrations/dns.ts)):
- `fetchCloudflareZones(apiToken)` — paginated GET `https://api.cloudflare.com/client/v4/zones?per_page=50`. Loops until `page >= total_pages`. Returns `{id, name}[]`.

**DNS autopull route** ([src/app/api/cron/pull-credentials/dns/route.ts](../../src/app/api/cron/pull-credentials/dns/route.ts)):
- Same shape as all prior autopull routes. Iterates `provider_accounts` where `provider='dns'`.
- `external_account_id` = Cloudflare account id (registration-time only; not used for zone matching).
- Lists all zones under the account's API token. For each zone, matches via `integrations` where `type='dns'` and `config->>zone_id = <zone.id>`.
- Upserts `CLOUDFLARE_API_TOKEN` with `service='dns'`, `source='autopull'` on every matched project. Same token goes to all matched projects (token is account-scoped, not zone-scoped).
- `zones_found` + `skipped_unmatched` in result let you see how many zones had no corresponding Bentropy integration.

**railway.toml** — fifth `[[cron]]` entry for `pull-credentials-dns` on `0 */6 * * *`.

**Build verified**: `npm run build` clean. `/api/cron/pull-credentials/dns` in route table.

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

## What's shipped (this session)

### Admin redesign Phase 3c — Credentials page

**CredentialsClient.tsx** ([src/app/admin/credentials/CredentialsClient.tsx](../../src/app/admin/credentials/CredentialsClient.tsx)):
- Full rewrite. Dropped: `framer-motion`, `motion.div` entry animations, 3-column card grid, shadcn `Card`/`Badge`/`Button`, `entropy-*` color tokens, `Key` icon decoration.
- Now uses: `Panel`, `Btn`, `IconBtn`, `Pill`, `Tag`, `ServiceDot`, `SegControl` from the new design system.
- Alert banner: renders only when `expiredCount > 0` OR `expiringSoonCount > 0`. One line per condition (red for expired, amber for expiring). Suppressed entirely when all healthy.
- Filter bar: search input (left) + `SegControl All/Manual/Autopull` (right), client-side filtering by name/project.
- 6-column CSS grid: Name (+ masked key, mono) / Service (ServiceDot + name) / Project / Source (Tag) / Expires countdown / Actions.
- Expiry countdown: `≤14d` → amber `Pill`, expired → bad `Pill "Expired Xd ago"`, never/far → plain mono text.
- Show/hide: calls `revealCredential(id)` server action to AES-decrypt on demand; stores plaintext in `revealedKeys` state. Hide clears the entry.
- Copy: decrypts on demand if not already revealed, copies plaintext, shows `Check` icon for 2s.
- Row hover: `rgba(255,255,255,0.015)`, 100ms. Row actions: `opacity-30` rest, `group-hover:opacity-100`.
- Edit dialog: key field starts blank with "Leave blank to keep current" placeholder.
- Empty state: "No credentials yet." + New credential Btn (zero data) vs "No matching credentials." (filtered).

**actions.ts** ([src/lib/db/actions.ts](../../src/lib/db/actions.ts)):
- Added `revealCredential(id)` server action: queries `key_encrypted`, calls `decrypt()`, returns plaintext. Auth-gated via `createClient()`.
- `updateCredential`: now skips `key_encrypted` update when `input.key` is blank (fixes prior double-encrypt bug when editing).

**Build verified**: `npm run build` clean.

### Admin redesign Phase 3b — Projects list page

**ProjectsClient.tsx** ([src/app/admin/projects/ProjectsClient.tsx](../../src/app/admin/projects/ProjectsClient.tsx)):
- Full rewrite. Dropped: `framer-motion`, `statusColors` badge map, shadcn `Button`/`Badge`/`Table/*`, `Eye` action, `ExternalLink`/`Github` icon columns, `tone` prop on `Field` (removed `text-entropy-chaos` etc.).
- Now uses: `Panel`, `Btn`, `IconBtn`, `Pill`, `StatusDot`, `SegControl` from the new design system.
- Filter bar: search input (left) + `SegControl All/Active/Shipped/Concept` (right), client-side filtering.
- 7-column CSS grid: star / name+tagline / domain / status / health / updated / actions.
- Column header row with `var(--bg)` fill, 11px uppercase labels.
- `rgba(255,255,255,0.015)` row hover, 100ms transition. Row actions at `opacity-30 group-hover:opacity-100`.
- Star: `var(--accent)` when featured, `var(--faint)` otherwise.
- `StatusDot tone="green"` hardcoded for Health column (no live health data yet).
- Two-state empty: "No projects yet." + New project Btn (zero data) vs "No matching projects." (filtered).
- Dialog kept; field labels stripped of tone-color variants → plain `text-ink-muted`.
- Dialog buttons switched to `Btn` primary/secondary.

**Build verified**: `npm run build` clean.

### Admin redesign Phase 3a — Overview page

**DashboardClient.tsx** ([src/app/admin/DashboardClient.tsx](../../src/app/admin/DashboardClient.tsx)):
- Full rewrite. Dropped: `"use client"`, `framer-motion`, entropy meter, gradient hero, "Command Center" heading, colored StatCards.
- Now a server component. Renders: `<h1>Overview</h1>` header, 4-cell `StatRow` (Active projects / Integrations / Credentials / Services), 2-col panel grid.
- Left col: Recent projects panel (last 5 by `updated_at`, `StatusDot` health, `Pill` status, mono relative time) + Activity panel (empty state + `// TODO: wire activity feed`).
- Right col: Attention panel (expiring credentials list with `Pill tone="warn"`, project name, days-until; empty state "All credentials healthy.") + Shortcuts panel (4 `KeyHint` rows: ⌘K, ⌘N, G P, G C).
- Credentials stat shows amber delta `"N expiring"` when `expiringCredentials > 0`.

**queries.ts** ([src/lib/db/queries.ts](../../src/lib/db/queries.ts)):
- `DashboardStats` extended with `totalIntegrations`, `recentProjects[]`, `expiringList[]`.
- `getDashboardStats()` now runs 8 parallel queries (was 5): adds integrations count, last-5 projects, top-8 expiring credentials joined with project name.

**Build verified**: `npm run build` clean.

### Inline edit — all entities

**Server actions** ([src/lib/db/actions.ts](../../src/lib/db/actions.ts)):
- `updateProviderAccount(id, input)` — edits `display_name`, `external_account_id`, `master_credential_id`
- `updateIntegration(id, input, projectSlug?)` — edits `display_name`, `config`, `secret_ref`
- `IntegrationUpdateInput` and `ProviderAccountUpdateInput` types exported

**Provider accounts** ([src/app/admin/provider-accounts/ProviderAccountsClient.tsx](../../src/app/admin/provider-accounts/ProviderAccountsClient.tsx)):
- Pencil button on each card opens pre-populated edit dialog
- Provider is shown as read-only Badge (can't change post-creation)
- Dialog title and Save button label reflect create vs edit mode

**Integrations** ([src/components/admin/IntegrationEditButton.tsx](../../src/components/admin/IntegrationEditButton.tsx)):
- New `"use client"` component rendered inside each `IntegrationCard`
- Pencil opens pre-populated dialog with type-specific config fields (same layout as create form)
- Trash2 button deletes the integration (with confirm prompt)
- Both call `router.refresh()` on success

**Already had edit** (confirmed, no changes needed):
- Projects, Credentials, Repos, Services, Notes — all had full edit dialogs from prior work

**Build verified**: `npm run build` clean.

## What's next

**All planned milestones are done. Remaining follow-ups:**
- Migrate `local_services` rows into `integrations` (type=local) when convenient — both sources render in Card 5 so no urgency.
- `github` type missing from RefreshButton enabled list.

## What Ben needs to do to verify M9

**Analytics (Umami) autopull**:
1. Create a credential in `/admin/credentials` with the Umami JSON blob as its value: `{"username":"<your-umami-username>","password":"<your-umami-password>"}`. Give it a name like `UMAMI_MASTER_CREDENTIALS`, `service=analytics`.
2. Register an analytics provider account on `/admin/provider-accounts`: `provider=analytics`, `display_name` e.g. "Ben (Umami)", `external_account_id` = `https://umami-production-3685.up.railway.app`, `master_credential_id` = the credential from step 1.
3. Add an `analytics` integration row on a project's detail page with `config: {"provider": "umami", "property_id": "<website-uuid>"}` (website UUID from Umami → Settings → website → Tracking code, the `data-website-id` value).
4. `POST /api/cron/pull-credentials/analytics` with `Authorization: Bearer $CRON_SECRET`.
5. Confirm `UMAMI_WEBSITE_ID` appears in credentials for the project with `source='autopull'` and `service='analytics'`.
6. Re-run — expect `skipped_unchanged: 1`.

## What Ben needs to do to verify M8

**DNS (Cloudflare) autopull**:
1. Register a Cloudflare provider account on `/admin/provider-accounts`: `provider=dns`, `display_name` e.g. "Ben (Cloudflare)", `external_account_id` = Cloudflare account id (find it at `https://dash.cloudflare.com` → account home → ID in URL, or `GET /client/v4/accounts` with the token), `master_credential_id` = a credential holding the Cloudflare API token.
2. Add a `dns` integration row on Finch's detail page with `config: {"provider": "cloudflare", "zone_id": "<zone-id>"}` (zone id from Cloudflare dashboard → domain → Overview → Zone ID).
3. `POST /api/cron/pull-credentials/dns` with `Authorization: Bearer $CRON_SECRET`.
4. Confirm `CLOUDFLARE_API_TOKEN` appears in credentials for Finch with `source='autopull'` and `service='dns'`.
5. Re-run — expect `skipped_unchanged: 1`, `zones_found > 0`.

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
