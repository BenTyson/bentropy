# Current Status

**Last update:** 2026-04-19 (M5 complete — MCP write tools + GitHub integration shipped)

## What's done

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

## What's next

**M6** — Provider accounts + credential autopull. See the plan for the data model and phased approach. Use **Opus 4.7** — multi-account data model design is non-trivial. Split into 2–3 sessions.

After M6, remaining integrations are each ~1 day of Sonnet work: Supabase, Stripe, DNS, Analytics, Local dev.
