# Decision Log

Record of key architectural and design decisions.

---

## 2024-12-XX: Initial Architecture

### Decision: Next.js 15+ with App Router
**Context**: Needed a React framework for hybrid static/dynamic rendering.
**Options**: Next.js, Remix, Astro
**Decision**: Next.js with App Router
**Rationale**: Best support for hybrid rendering, excellent Vercel deployment, familiar ecosystem.

---

### Decision: Supabase over SQLite
**Context**: Ben chose cloud database over local-first.
**Options**: SQLite (local), Supabase (cloud)
**Decision**: Supabase
**Rationale**: Access admin dashboard from anywhere, real-time capabilities, built-in auth.

---

### Decision: GitHub OAuth for Admin Auth
**Context**: Need to protect admin routes.
**Options**: Simple password, GitHub OAuth, Magic links
**Decision**: GitHub OAuth via Supabase Auth
**Rationale**: More secure, no password to remember, integrates with existing GitHub workflow.

---

## 2026-04-17: Running ad-hoc SQL against the remote DB

**Context**: Seeding Finch + SaltGoat during M2 required running `supabase/seed.sql` against the live Bentropy project. Supabase CLI v2.72 has no `db seed` command; the Postgres password isn't stored in `.env.local`.

**Options**:
1. Wrap seed as a timestamped migration in `supabase/migrations/` and `supabase db push` — pollutes migration history for non-schema data
2. `psql` with the Postgres URL — requires DB password we don't have cached
3. Supabase Management API `/v1/projects/{ref}/database/query` — auth via the sbp_ token in macOS keychain

**Decision**: Management API for seeds and one-off queries; keep `supabase db push` reserved for schema migrations.

**Rationale**: Keeps migration history clean (only schema changes get recorded), bypasses RLS (runs as postgres superuser), and works from any worktree once linked. The CLI's keychain token is already present — no extra secret to manage.

**Gotcha worth remembering**: Supabase CLI credentials are stored in the macOS keychain (service `"Supabase CLI"`, account `"supabase"`, base64-encoded with `go-keyring-base64:` prefix), NOT in `~/.supabase/access-token`. The file-not-found check is misleading. Use `supabase projects list` to actually verify auth. See CLAUDE.md for the full recipe.

---

### Decision: Tailwind CSS v4
**Context**: Styling system choice.
**Options**: Tailwind v3, Tailwind v4, CSS Modules, styled-components
**Decision**: Tailwind CSS v4
**Rationale**: Latest version with CSS-first config, faster builds, works great with shadcn/ui.

---

### Decision: shadcn/ui for Components
**Context**: Need consistent UI components.
**Options**: Radix UI directly, shadcn/ui, Material UI, Chakra
**Decision**: shadcn/ui
**Rationale**: Components are copied into project (not a dependency), fully customizable, Tailwind-native.

---

### Decision: tsParticles for Particle System
**Context**: Need particle animation for entropy visualization.
**Options**: Custom canvas, particles.js, tsParticles
**Decision**: tsParticles with @tsparticles/react
**Rationale**: TypeScript support, React integration, performant, well-maintained.

---

### Decision: Port 3344 for Development
**Context**: Ben requested specific port.
**Options**: 3000 (default), custom
**Decision**: Port 3344
**Rationale**: User preference, avoids conflicts with other projects.

---

### Decision: Placeholder Data Before Database
**Context**: Needed functional site before Supabase tables exist.
**Options**: Block on database, use placeholder data
**Decision**: Hardcoded placeholder data in components
**Rationale**: Allows visual development and review before database setup.

---

### Decision: Nebula Background Image
**Context**: Wanted cosmic background for entropy theme.
**Options**: CSS gradients only, stock image, custom image
**Decision**: User-provided image (imgur URL)
**Rationale**: User had specific aesthetic in mind, external URL works for dev.

---

## Pending Decisions

- **Encryption approach**: How to encrypt credentials/logins in Supabase
- **Image storage**: Supabase Storage vs external CDN for project images
- **Mobile navigation**: Hamburger menu vs bottom nav
