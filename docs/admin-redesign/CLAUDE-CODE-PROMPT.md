# Prompt for Claude Code

Paste this into Claude Code once you've copied the `handoff/` folder into your repo (e.g. as `docs/admin-redesign/`).

---

I'm redesigning the `/admin` area of this Next.js app. The design direction and token system are defined in `docs/admin-redesign/`. Read these files in full before making changes:

1. `docs/admin-redesign/SPEC.md` — principles, color semantics, typography, motion, content voice
2. `docs/admin-redesign/tokens.css` — the full token set including 7 tinted-dark palettes
3. `docs/admin-redesign/components.md` — component inventory with prop signatures
4. `docs/admin-redesign/MIGRATION.md` — step-by-step porting plan

## Current state

The admin currently lives in `src/app/admin/` and has these pages:

- `page.tsx` (Overview / Command Center)
- `projects/` (list + detail)
- `credentials/`
- `integrations/`, `providers/`, `services/`, `repos/`, `logins/`, `notes/`

Existing problems (which the redesign solves):

- Random colored accents: `accent-blue`, `accent-violet`, `accent-cyan`, `entropy-chaos`, `entropy-drifting`, `entropy-ordered`
- Gradient logo, "Command Center" branding, entropy meter theatrics
- Colored status badges, motion.div stagger entries on every list item
- Credentials shown as a 3-column card grid (should be a dense table)
- Colored form field labels (`text-entropy-chaos`, `text-accent-blue`)

## What I want you to do

Execute `docs/admin-redesign/MIGRATION.md` in order: Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4.

**Scope the changes to the admin surface only.** The public marketing site stays untouched. Use a `[data-surface="admin"]` attribute on the admin layout root so the tokens don't leak.

**Preserve all existing functionality**: server actions (`createProject`, `deleteProject`, `updateCredential`, etc.), data fetching, auth, routing, form validation, error handling. This is a visual/structural rewrite of the presentational layer only.

**Use existing shadcn primitives where they still fit** (`Dialog`, `Select`, `Input`, `Textarea`) — restyle via className, don't replace. Build the new admin-specific components (`Panel`, `Btn`, `Pill`, `Tag`, `StatusDot`, `ServiceDot`, `KeyHint`, `SegControl`, `Stat`, `Shell`) in `src/components/admin/`.

**After each phase, stop and show me the diff** so I can review before moving on. I'd rather catch drift early than rewrite later.

## Constraints

- No hardcoded hex colors in components — everything through CSS vars.
- No `motion.div` entry animations in admin pages.
- No emoji in admin UI.
- All numbers (IDs, timestamps, counts, domains, versions, SHAs) in `var(--font-mono)` with `tabular-nums`.
- Keep bundle size sane — don't add new UI dependencies unless `SPEC.md` calls for them.

## Definition of done

Per `MIGRATION.md` Acceptance Criteria:

1. No hardcoded hex colors in components
2. No references to `accent-blue`, `accent-violet`, `accent-cyan`, or `entropy-*` tokens
3. Every number uses mono + tabular-nums
4. Every status uses `StatusDot` or `Pill`
5. No entry animations in admin
6. Swapping `data-palette` on admin root changes all colors coherently

## Reference

The full interactive redesign lives in the design project. Relevant file: `Bentropy Admin Redesign.html` — 4 screens (Overview, Projects list, Project detail, Credentials) with a working palette switcher.

Start by reading all four docs, then post a summary of your plan before writing any code. I want to see you understood the direction before Phase 0.
