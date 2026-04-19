# Bentropy MCP — local Claude Code setup

The MCP server at [mcp/](../mcp/) exposes hub state (projects, integrations, credentials) to any Claude Code session on this machine. Add the entry below to Claude Code's global config; from then on, every session in every repo can query Bentropy with `list_projects`, `get_project`, `list_integrations`, and `get_credential`.

## Why stdio + local (not the Railway deploy)

MCP defines two transports: **stdio** (command-per-session, local) and **HTTP/SSE** (network). Claude Code only speaks stdio to local processes — it doesn't call out to a remote MCP URL.

The Railway service in [mcp/railway.toml](../mcp/railway.toml) therefore keeps the MCP code **compiled and warm** for a future HTTP-MCP migration, but the local stdio path is what Claude Code actually uses today. If you move the MCP to HTTP later, the `mcpServers` entry changes to point at the Railway URL.

## One-time setup

1. **Install and build:**
   ```bash
   cd mcp
   npm install
   npm run build
   ```
   Artifacts land at `mcp/dist/mcp/src/index.js` (the `dist/mcp/src` nesting is a side-effect of compiling `src/lib/crypto.ts` + `src/lib/db/types.ts` alongside `mcp/src` with a shared `rootDir`).

2. **Copy the three env vars from `.env.local` — they must match what the web app uses.** The MCP server reads:
   - `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL` — it falls back)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ENCRYPTION_KEY`

   Missing any one of these → the server exits 1 with a clear message before touching stdin.

3. **Edit `~/.claude.json`.** Do NOT let any tool autogenerate this — write it yourself so you know exactly what's there. Add the `bentropy` entry under the top-level `mcpServers` key (create it if it doesn't exist):

   ```json
   {
     "mcpServers": {
       "bentropy": {
         "command": "node",
         "args": [
           "/Users/bentyson/bentropy/mcp/dist/mcp/src/index.js"
         ],
         "env": {
           "SUPABASE_URL": "https://cbsydtnaxancoltzzhrz.supabase.co",
           "SUPABASE_SERVICE_ROLE_KEY": "<paste service_role key>",
           "ENCRYPTION_KEY": "<paste base64 encryption key>"
         }
       }
     }
   }
   ```

   The absolute path is intentional — Claude Code's MCP spawner has no concept of `cwd`. Adjust if your repo lives elsewhere.

4. **Restart Claude Code.** It reconnects to MCP servers only at startup. In a new session, run:
   ```
   /mcp
   ```
   `bentropy` should show up with 4 tools.

## Verifying

From a session in any repo (e.g. `/Users/bentyson/finch`), ask Claude to:

- Call `list_projects` → expect Finch, SaltGoat, and the 7 showcase projects.
- Call `get_project` with `{"slug": "finch"}` → full rollup, including the Vercel snapshot M4 Session A put in `integration_snapshots` (if the cron has run at least once).
- Call `get_credential` with `{"project": "finch", "name": "Vercel PAT"}` → plaintext string. **Only use this when you actually need the raw token** (e.g. running `vercel ls` in a terminal). Never echo the result to chat.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Server exits before accepting stdin; stderr mentions missing env var | One of the three env vars is unset in the `mcpServers[].env` block | Paste the value from `.env.local` |
| `get_credential` returns "not a valid encrypted payload" | Credential row still holds a `PLACEHOLDER_*` string from M2 seeding | Overwrite via `/admin/credentials` in the web UI |
| `get_credential` returns "decrypt failed" | `ENCRYPTION_KEY` in the MCP env differs from the key that encrypted the row | Use the same key in both places, or rotate per `docs/encryption.md` |
| All tools return "permission denied" errors | Service-role key lacks permission somehow — extremely unlikely | Regenerate in Supabase dashboard |

## Security notes

- The MCP server uses the Supabase **service-role** key and bypasses RLS. That's correct — it runs without a user session. Don't hand that key to anything untrusted; the `mcpServers[].env` block in `~/.claude.json` lives on the local filesystem only.
- `get_credential` is the single decrypt path. Every other tool returns masked values. If you add a new tool that needs plaintext, route it through the same decrypt wrapper and never embed the result in error strings or logs.
