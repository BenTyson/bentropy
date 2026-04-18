# Current Status

**Last update:** 2026-04-18 (M4 Session A complete; Session B pending)

## What's done

### M4 Session A — Vercel + Railway live sync (complete)

- **Service-role Supabase client** ([src/lib/supabase/service.ts](../../src/lib/supabase/service.ts)) — `"server-only"`, throws if `SUPABASE_SERVICE_ROLE_KEY` or the URL env is missing. Used by cron handlers and the Refresh server action. Never import from client code.

- **Encryption wired into credential + login writes** ([src/lib/db/actions.ts](../../src/lib/db/actions.ts)) — `createCredential` / `updateCredential` now run the raw key through `encrypt()` before insert. `createLogin` / `updateLogin` encrypt both username + password. Before this change, real PATs would have hit the DB as plaintext; that path is now safe.

- **Vercel client** ([src/lib/integrations/vercel.ts](../../src/lib/integrations/vercel.ts)) — REST. `fetchVercelDeploymentSnapshot(config, pat)` hits `GET /v6/deployments?projectId=...&limit=1` (adds `teamId` if config has one), returns a typed `VercelDeploymentSnapshot` with `state`, `url`, `created_at`, `commit_sha`, `branch`, `target`, plus a `raw` field for the original deployment payload.

- **Railway client** ([src/lib/integrations/railway.ts](../../src/lib/integrations/railway.ts)) — GraphQL. Posts `deployments(first: 1, input: {projectId, serviceId, environmentId})` to `https://backboard.railway.com/graphql/v2`. Returns `{deployment_id, status, url, created_at, static_url, meta, raw}`. Throws early if config is missing any of the three IDs.

- **Shared sync helper** ([src/lib/integrations/sync.ts](../../src/lib/integrations/sync.ts)) — one function per entry point: `syncIntegration`, `syncIntegrationById`, `syncAllOfType`. Each run:
  1. Resolves the PAT via `resolveSecret()` — prefers `integration.secret_ref`, falls back to a project-scoped credential whose `service` matches the integration type (`type='vercel'` → `credentials.service='vercel'`). Errors loudly if neither path yields a credential.
  2. Dispatches to the matching API client.
  3. Inserts the payload into `integration_snapshots`.
  4. Updates the integration row's `last_synced_at`, `sync_status`, `sync_error`.
  5. Writes a `sync_log` row per run (ok or error).
  Errors are caught, truncated to 500/1000 chars, persisted to `integrations.sync_error` + `sync_log.error`.

- **Cron routes** ([src/app/api/cron/sync-vercel/route.ts](../../src/app/api/cron/sync-vercel/route.ts), [src/app/api/cron/sync-railway/route.ts](../../src/app/api/cron/sync-railway/route.ts)) — GET + POST. Gated by `Authorization: Bearer $CRON_SECRET`. 401 if the env var is missing or the header doesn't match (intentionally conservative — no secret means the endpoint is locked). Each calls `syncAllOfType` on the service-role client and returns `{ok, failed, results}`.

- **Refresh button wired** ([src/components/admin/IntegrationCard.tsx](../../src/components/admin/IntegrationCard.tsx) + [src/components/admin/RefreshButton.tsx](../../src/components/admin/RefreshButton.tsx)) — card is still a server component; the button is a tiny `"use client"` form that submits a server action bound with `.bind(null, integration.id, projectSlug)`. The action (`refreshIntegration` in `src/lib/db/actions.ts`) calls `syncIntegrationById` and revalidates the detail page + integrations listing + dashboard. `useFormStatus` gives a pending/spinning state. Button is disabled for integration types that don't have a sync client yet (anything besides `vercel` / `railway`).

- **Types** ([src/lib/db/types.ts](../../src/lib/db/types.ts)) — `SyncLog` type added; `sync_log` table registered in the `Database` surface.

- **Railway cron** ([railway.toml](../../railway.toml)) — two `[[cron]]` entries on `*/15 * * * *` (UTC) that `curl` the public app URL with the `CRON_SECRET` header. Comment spells out Railway's cron syntax vs Vercel's since Ben has both in his head.

- **Build verified**: `npm run build` clean. New routes `/api/cron/sync-vercel` and `/api/cron/sync-railway` registered.

### M3 — Integrations schema + manual Vercel rows (complete)
### M2 — Per-project detail page + Finch/SaltGoat seed (complete)
### M1 — DB + admin wired (complete)

## What Ben needs to do before Session A verification works end-to-end

1. **Set `CRON_SECRET` in Railway project variables**. Pick a random string; the cron jobs use it as the bearer token against the app's own public URL. Local curl example:
   ```bash
   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
     "http://localhost:3344/api/cron/sync-vercel"
   ```
   (Set `CRON_SECRET` in `.env.local` for local testing too.)

2. **Set `SUPABASE_SERVICE_ROLE_KEY`** in Railway + `.env.local`. The service-role client throws without it. Copy from Supabase dashboard → Settings → API → `service_role` key.

3. **Create real PAT credentials + link them**:
   - **Vercel PAT** — create at vercel.com/account/tokens, scope to the team/project that owns Finch. Go to `/admin/credentials`, click new, paste (encryption now wires through correctly). Then link: currently there's no edit-integration UI, so either (a) open the Finch Vercel integration row in Supabase and set `secret_ref` to the new credential's id, OR (b) create the credential with `project_id = Finch.id` and `service = 'vercel'` — the sync helper's fallback lookup will find it automatically.
   - **Railway PAT** — create at railway.com/account/tokens. Same pattern for SaltGoat's Railway integration row (`service = 'railway'` on the credential).

4. **Replace `prj_placeholder_finch`** with Finch's real `prj_...` Vercel project ID. No edit-integration UI yet — delete + recreate via `/admin/projects/finch` → Integrations → Add, or update in place via SQL. Until this is real, `/api/cron/sync-vercel` will return 404 from Vercel.

5. **Fill SaltGoat's Railway `service_id` + `environment_id`** in the integration `config`. Grab from Railway dashboard → service settings. Until filled, the Railway client throws early with a helpful message and `sync_status` becomes `error`.

### Assumption flagged to Ben

The credential resolution is `secret_ref` first, then fall back to `credentials` where `project_id = integration.project_id` AND `service = integration.type`. That means Ben can just add a Vercel PAT credential to Finch and it works without touching the integration row. If that's the wrong tradeoff (e.g. multiple Vercel credentials per project), the fix is to make `secret_ref` required and add an edit UI.

## Known follow-ups (not in Session A scope)

- **PLACEHOLDER_* credentials from M2** still throw on sync — `isEncryptedPayload()` correctly detects them and the sync helper surfaces a clear error. Ben needs to overwrite via `/admin/credentials` so the new `encrypt()` wiring kicks in.
- **Integration edit UI** — still delete + recreate for `config` changes. Blocks the M4 verification step where Ben needs to replace placeholder Vercel/Railway IDs.
- **Deprecated `Github` icon** from `lucide-react` and the `middleware.ts → proxy.ts` Next 16 warning — cosmetic, unchanged.

## What's next

**M4 Session B** — MCP server skeleton (new `mcp/` package) + 4 read tools (`list_projects`, `get_project`, `list_integrations`, `get_credential`) + Railway deploy as a second service in the Bentropy Railway project + Claude Code `~/.claude.json` `mcpServers` entry. Use **Opus 4.7** per the plan.

Verification for M4 completion (both sessions):
- `POST /api/cron/sync-vercel` with the secret → Finch card flips to `sync_status=ok` + `last_synced_at` populated + a new `integration_snapshots` row.
- Same for Railway + SaltGoat.
- Refresh button on a card in the browser → card updates in place (no full reload), `sync_log` gains a row.
- From a Claude Code session inside any repo, `list_projects` returns Finch + SaltGoat (Session B).
