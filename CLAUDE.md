# Bentropy — Claude Code Instructions

## Project identity

Bentropy is Ben's master control hub for 10+ personal side projects. It centralizes every service connection (Vercel, Supabase, Stripe, GitHub, Railway, DNS, analytics, local dev ports) for each project and exposes that data to Claude Code via an MCP server — so sessions inside any project repo can query or mutate hub state without leaving the terminal.

**Pilot projects** (onboarded first): Finch, SaltGoat.

**Active plan**: `/Users/bentyson/.claude/plans/bentropy-is-the-master-lexical-snowglobe.md`. Read it at the start of every session.

## Stack

- Next.js 16 App Router (Turbopack) + React 19 + TypeScript 5
- Tailwind v4 + shadcn/ui (locally copied) + Framer Motion + Lucide icons
- Supabase (Postgres) + Supabase Auth (GitHub OAuth)
- Deploy: Vercel (web) + Railway (MCP server, long-running process)

## Conventions

- **Default to server components.** Use `"use client"` only where interactivity requires it. The per-project detail page should be server-rendered.
- **Route groups**: `(public)` for marketing, `/admin` for the hub (auth-gated). Don't mix.
- **Database access**: always through `src/lib/supabase/*` helpers. Never instantiate Supabase clients inline in a route or component.
- **Types mirror schema** in `src/lib/db/types.ts`. Keep in sync after migrations.
- **Integrations are polymorphic**: one `integrations` table with `type` + `config` jsonb. Do not create per-integration tables (no `vercel_connections`, `stripe_connections`, etc.). TS discriminated union on `config` gives type safety.
- **Match existing component patterns**. The Sidebar, Cards, Dialogs, and Framer Motion layout animations are already polished — reuse don't rebuild.

## Directory map

- `src/app/admin/` — hub UI, do work here
- `src/app/(public)/` — marketing site, leave alone unless asked
- `src/components/admin/` — hub-specific components (Sidebar, IntegrationCard)
- `src/components/ui/` — shadcn primitives, shared
- `src/lib/supabase/` — browser / server / service-role clients
- `src/lib/integrations/` — per-integration API clients (vercel.ts, github.ts, ...)
- `src/lib/crypto.ts` — AES-GCM encrypt/decrypt for credentials
- `mcp/` — MCP server package, own deploy target (Railway)
- `supabase/` — schema + migrations
- `docs/session-start/` — prefer `CURRENT-STATUS.md` and `DECISIONS.md` over historical docs

## Session workflow

Read at the start of every session:
1. This file
2. Active plan at `/Users/bentyson/.claude/plans/bentropy-is-the-master-lexical-snowglobe.md`
3. `docs/session-start/CURRENT-STATUS.md`

**One milestone per session.** Don't span M1 → M2 in one sitting. The plan has a model + effort table per milestone — follow it to protect context budget.

**Stop signals**: if you've been running > 2 hours or read > 20 files, hand off to a fresh session. Update `docs/session-start/CURRENT-STATUS.md` with what shipped before ending.

After shipping a milestone, update `CURRENT-STATUS.md` with the new state so the next session picks up cleanly.

## Security invariants (non-negotiable)

- Service-role Supabase key is server-only. Never ships to the browser, never in a client component.
- `ENCRYPTION_KEY` (32-byte AES-GCM key) must be set in env before first credential write. Document rotation in `docs/`.
- Credentials decrypt **only** in server code. Never return plaintext to client components; return masked or on-demand reveal via server action.
- RLS `admin_users` allowlist gates every hub table. Don't bypass with service-role except in server-only paths (cron, MCP server).
- MCP writes go through service-role but must still respect logical invariants (project_id exists, etc.).

## Don't

- Don't add features to the public marketing site as part of hub work.
- Don't create integration-specific tables — use polymorphic `integrations` + `config` jsonb.
- Don't commit unless Ben asks.
- Don't push unless Ben asks.
- Don't run the dev server to "test" features — Ben handles local verification. Type checks and tests are fine.
- Don't add console.logs that persist, error handling for impossible states, or comments that restate code.
- Don't refactor adjacent code not in scope.

## Build must pass

Run `npm run build` before considering work complete. Fix what you break.
