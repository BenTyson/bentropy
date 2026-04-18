# Current Status

**Last update:** 2026-04-18 (M3 complete)

## What's done

### M3 — Integrations schema + manual Vercel rows (complete)

- **Crypto** ([src/lib/crypto.ts](../../src/lib/crypto.ts)) — AES-256-GCM `encrypt`/`decrypt`. Payload format: base64 of `iv(12) || ciphertext || tag(16)`. Key loaded from `ENCRYPTION_KEY` env var (base64-encoded 32-byte key). `"server-only"` guard. `isEncryptedPayload()` helper skips placeholder strings.

- **Types** ([src/lib/db/types.ts](../../src/lib/db/types.ts)) — `Integration` is now a discriminated union keyed on `type`, with `config` typed per-type: `vercel`, `github`, `supabase`, `stripe`, `railway`, `dns`, `analytics`, `local`. `IntegrationConfigFor<T>` maps type → config shape.

- **IntegrationCard** ([src/components/admin/IntegrationCard.tsx](../../src/components/admin/IntegrationCard.tsx)) — server component; switches on `integration.type` to pick icon + config summary. Shows display_name, sync_status badge (falls back to `pending` when null), relative `last_synced_at`, disabled "Refresh" placeholder, and sync_error line if set.

- **Detail page grid** ([src/app/admin/projects/[slug]/page.tsx](../../src/app/admin/projects/%5Bslug%5D/page.tsx)) — Card 2 is now a live integrations grid (1/2/3 cols responsive) with an "Add integration" button linking to the new page. Placeholder copy gone.

- **New integration flow** ([src/app/admin/projects/[slug]/integrations/new/page.tsx](../../src/app/admin/projects/%5Bslug%5D/integrations/new/page.tsx) + [NewIntegrationForm.tsx](../../src/app/admin/projects/%5Bslug%5D/integrations/new/NewIntegrationForm.tsx)) — server shell loads project; client form has type selector + conditional config fields that match the discriminated union. Submits via `createIntegration` server action, redirects to detail page on success.

- **Server action** ([src/lib/db/actions.ts](../../src/lib/db/actions.ts)) — `createIntegration(input)` validates project exists, inserts row, revalidates detail + listing. Also `deleteIntegration(id, projectSlug?)`.

- **Queries** ([src/lib/db/queries.ts](../../src/lib/db/queries.ts)) — `getProjectBySlug` now returns `integrations` in the rollup. New `getAllIntegrations()` joins project name/slug for the listing page.

- **Nav** ([src/components/admin/Sidebar.tsx](../../src/components/admin/Sidebar.tsx)) — added "Integrations" item (Plug icon) between Projects and Credentials.

- **Listing page** ([src/app/admin/integrations/page.tsx](../../src/app/admin/integrations/page.tsx)) — groups all integrations by project. Was needed for the sidebar link to land somewhere sane.

- **Manual integration rows seeded**. Pilot hosts differ — verified against `/Users/bentyson/finch` (has `vercel.json`, hosted on Vercel) and `/Users/bentyson/saltgoat` (has `railway.toml`, Railway project `00b2ac99-...`):
  - **Finch → Vercel** integration (`vercel_project_id = prj_placeholder_finch`, display_name "Production")
  - **SaltGoat → Railway** integration (`project_id = 00b2ac99-4a09-4959-992f-169c7f981b96`, `service_id` + `environment_id` empty, display_name "Production")
  - `sync_status = null` on both → cards render "pending" + "Never synced". Unique index `(project_id, type, display_name)` enforced; seed uses `on conflict ... do update`.
- **RailwayConfig** now includes `project_id` (Railway's project UUID) alongside `service_id` + `environment_id` — needed for any Railway API call.

- **Docs** ([docs/encryption.md](../encryption.md)) — full writeup of key format, where to set it (Railway, not Vercel), payload format, rotation procedure, and the `PLACEHOLDER_*` seed problem.

- **Build verified**: `npm run build` clean. New routes `/admin/integrations` and `/admin/projects/[slug]/integrations/new` registered.

### M2 — Per-project detail page + Finch/SaltGoat seed (complete)
### M1 — DB + admin wired (complete)

(see git history; unchanged by M3)

## What Ben needs to do before M3 is fully live

1. **Generate and set `ENCRYPTION_KEY`**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   - Add to local `.env.local` (uncomment the existing line).
   - Add to **Railway** env vars — both the web app and MCP services in the bentropy Railway project. **Not Vercel.** Bentropy runs on Railway; the "Vercel" integration type is about pilot projects.

2. **Replace the `PLACEHOLDER_*` credential strings** from M2. Finch has 5, SaltGoat has 1. Go to `/admin/credentials`, edit each, paste real keys. The update flow still writes raw strings today — we need to wire `encrypt()` into [src/lib/db/actions.ts](../../src/lib/db/actions.ts) `createCredential`/`updateCredential` before those real keys land. **Flagged for a follow-up task**; M3 scope ended at the integration flow.

3. **Replace the `prj_placeholder_*` Vercel integration configs** with real Vercel project IDs via `/admin/projects/finch` → Integrations → edit (no edit UI yet — for now re-enter via "Add integration" after deleting the placeholder, or SQL it). M4 live sync needs real IDs to work.

## Known follow-ups (not in M3 scope)

- **Credential encrypt/decrypt wiring**: `createCredential`/`updateCredential`/`createLogin`/`updateLogin` still write plaintext. Wire `encrypt()` before any real secret is entered. See [docs/encryption.md](../encryption.md).
- **Integration edit flow**: Only create + delete are wired. Editing means delete + recreate today.
- **Deprecated `Github` icon + `middleware.ts` warnings** from lucide / Next 16: cosmetic, unchanged from M2.
- **Integration card "Refresh" button** is disabled — placeholder until M4 cron.

## What's next

**M4** — Live sync (both Vercel + Railway) + MCP server skeleton. See [active plan](/Users/bentyson/.claude/plans/bentropy-is-the-master-lexical-snowglobe.md) M4 section. Use **Opus 4.7**. **Split into 2 sessions** (non-negotiable per plan):

- **Session A**: HTTP handlers + API clients for both integration types we have live pilot rows for today — Vercel (Finch) and Railway (SaltGoat). `/api/cron/sync-vercel` + `src/lib/integrations/vercel.ts`, and `/api/cron/sync-railway` + `src/lib/integrations/railway.ts`. Both upsert `integration_snapshots`, update `sync_status`/`last_synced_at`, feed the "Refresh" button.
- **Session B**: `mcp/` package skeleton + 4 read tools (`list_projects`, `get_project`, `list_integrations`, `get_credential`) + Railway deploy + Claude Code mcpServers entry.

**Important for M4**: the sync cron itself must use **Railway cron** (`railway.toml` `[cron]`), not Vercel Cron. Bentropy runs on Railway regardless of what it's syncing. See [docs/decisions/LOG.md](../decisions/LOG.md) 2026-04-18.

Before starting M4, do the Ben-action items above (`ENCRYPTION_KEY` set in Railway, real pilot deploy IDs entered).
