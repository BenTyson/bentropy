# Current Status

**Last update:** 2026-04-19 (M4 complete — Sessions A + B both shipped; M5 pending)

## What's done

### M4 Session B — MCP server skeleton + 4 read tools (complete)

- **New `mcp/` package** ([mcp/package.json](../../mcp/package.json)) — standalone ESM Node package (`"type": "module"`, Node >=20). Deps: `@modelcontextprotocol/sdk` + `@supabase/supabase-js`. No Next dependency. Scripts: `build` (tsc), `start` (node dist/mcp/src/index.js), `dev` (tsx watch).

- **Shared code via tsconfig `rootDir: ".."`** ([mcp/tsconfig.json](../../mcp/tsconfig.json)) — includes `../src/lib/db/types.ts` + `../src/lib/crypto.ts` alongside `mcp/src`. Output nests as `dist/mcp/src/...` + `dist/src/lib/...`. `module: "ESNext"` + `moduleResolution: "Bundler"` so TS emits ESM regardless of the root package's CJS default (nearest-package.json detection with NodeNext would have compiled crypto.ts as CommonJS while mcp runs as ESM — explicit ESNext sidesteps the mismatch).

- **`import "server-only"` dropped from [src/lib/crypto.ts](../../src/lib/crypto.ts)** — the node:crypto import already blocks client bundling (Turbopack errors at build time on browser targets), so the safety is preserved. Comment at the top explains the shared-with-MCP invariant. Next build re-verified clean.

- **Service-role Supabase client** ([mcp/src/supabase.ts](../../mcp/src/supabase.ts)) — standalone from the web app's `src/lib/supabase/service.ts` because that file uses Next's `"server-only"` and reads `NEXT_PUBLIC_*`. The MCP version accepts `SUPABASE_URL` first, falls back to `NEXT_PUBLIC_SUPABASE_URL`.

- **Four read-only tools** (one file each in [mcp/src/tools/](../../mcp/src/tools)):
  - `list_projects` — no args; returns `[{slug, name, status, primary_domain, tagline}]` ordered by `display_order`.
  - `get_project` — `{slug}`; full rollup (project + credentials (masked, never plaintext) + repositories + local_services + notes + integrations each with their latest `integration_snapshots` row).
  - `list_integrations` — `{project}` (slug); returns integrations + `sync_status`/`last_synced_at`/`sync_error` + latest snapshot per integration.
  - `get_credential` — `{project, name}`; the ONE decrypt path. Runs `isEncryptedPayload()` guard first so a lingering `PLACEHOLDER_*` fails with a clear message instead of throwing mid-decrypt. Plaintext is only in the return value — the decrypt `catch` deliberately strips the underlying error so plaintext can't leak into error strings.

- **Server entry** ([mcp/src/index.ts](../../mcp/src/index.ts)) — env check fails fast via stderr + exit(1) if any of `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `ENCRYPTION_KEY` is missing. Uses the low-level `Server` + `setRequestHandler(ListToolsRequestSchema | CallToolRequestSchema, ...)` API (the class is marked deprecated in v1.x in favor of `McpServer` but still stable; the 4 explicit request-schema handlers keep the behaviour obvious). Every tool handler is wrapped in try/catch → returns `{isError: true, content: [{type: "text", text: message}]}` so thrown errors never crash the stdio transport.

- **Railway service** ([mcp/railway.toml](../../mcp/railway.toml)) — second service in the Bentropy Railway project. Build `npm ci && npm run build`, start `npm run start`, no cron (MCP is event-driven). Comment notes this deploy is currently warm-standby for a future HTTP-MCP migration; Claude Code itself talks stdio to a local `node ...` command, not the Railway URL.

- **Setup doc** ([docs/mcp-setup.md](../mcp-setup.md)) — spells out the stdio-vs-HTTP distinction, the exact `mcpServers` JSON to paste into `~/.claude.json`, how to verify with `/mcp` + sample tool calls, and a failure-mode table. We deliberately don't auto-write `~/.claude.json` — Ben edits it manually so nothing unexpected lands in global config.

- **Build + smoke test**: `cd mcp && npm run build` clean. `node dist/mcp/src/index.js` with no env exits 1 with the missing-var list. With env set, the server logs `stdio server ready` on stderr and responds correctly to the MCP initialize + `tools/list` handshake (all 4 tools registered with their schemas).

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

## What Ben needs to do before Session B verification works end-to-end

1. **Build the MCP package locally** (once, and whenever `mcp/` or `src/lib/{crypto,db/types}.ts` change):
   ```bash
   cd mcp && npm install && npm run build
   ```

2. **Add the `bentropy` entry to `~/.claude.json`** per [docs/mcp-setup.md](../mcp-setup.md). Paste the same `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `ENCRYPTION_KEY` values from `.env.local` into the `env` block of the server definition. Restart Claude Code so it re-reads the config.

3. **Deploy the MCP as the second Railway service** (optional for now — only matters once HTTP-MCP is real). Point Railway at the `mcp/` subdirectory; it'll pick up `mcp/railway.toml` and `mcp/package.json`. Share the three env vars with the web service via the project-level variables panel. Without this step the web app stays on Railway and MCP runs locally — that's fine for M4/M5.

## What's next

**M5** — MCP write tools (`add_note`, `update_project_status`, `upsert_credential`) + GitHub integration following the Vercel/Railway pattern. Use **Sonnet 4.6** per the plan — the pattern is now established.

End-to-end verification for M4 (both sessions combined):
- `POST /api/cron/sync-vercel` with the secret → Finch card flips to `sync_status=ok` + `last_synced_at` populated + a new `integration_snapshots` row.
- Same for Railway + SaltGoat.
- Refresh button on a card in the browser → card updates in place (no full reload), `sync_log` gains a row.
- From a Claude Code session inside any repo, `list_projects` returns Finch + SaltGoat + the 7 showcase projects; `get_project` with `{"slug": "finch"}` returns the Vercel snapshot from Session A; `get_credential` with `{"project": "finch", "name": "Vercel PAT"}` returns the raw token string.
