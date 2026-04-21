# Bentropy Admin — Redesign Handoff

A complete spec + token package for porting the new admin design into your Next.js app.

## What's in this bundle

| File                     | Purpose                                                           |
| ------------------------ | ----------------------------------------------------------------- |
| `tokens.css`             | All CSS custom properties + 7 tinted-dark palettes. Drop in as-is.|
| `SPEC.md`                | Principles, color semantics, type, layout, motion, content rules. |
| `components.md`          | Props + behavior for every admin component (Panel, Btn, Pill, etc).|
| `MIGRATION.md`           | Phase-by-phase porting checklist, 4–6 hours of work.              |
| `CLAUDE-CODE-PROMPT.md`  | Paste-ready prompt for Claude Code once this folder is in your repo.|

## How to use

1. **Copy this whole folder** into your Next.js repo (e.g. as `docs/admin-redesign/`).
2. **Open `CLAUDE-CODE-PROMPT.md`** — paste its contents into a fresh Claude Code session.
3. **Claude Code will read the spec**, plan the migration, and execute Phase 0 → 4 with your approval at each phase.
4. **The interactive reference** is the `Bentropy Admin Redesign.html` file in the design project — use it to eyeball any ambiguous detail.

## The design direction in one paragraph

A calm, dense, editorial admin. **One warm-bone accent** on tinted-dark surfaces; signal colors (amber/red/green) reserved strictly for status. **Numbers in JetBrains Mono with tabular numerals** everywhere — stats, IDs, timestamps, SHAs, domains. **Hairline borders, no shadows** except on floating popovers. **Flat panels, small radii** (8px max). No gradients, no emoji, no motion except 100–160ms hover/color transitions. Labels are lowercase and literal: "Overview" not "Command Center", `active` not `✨ Active Project`.

## Default palette

**Claret** — dim aubergine. Swappable at runtime via `data-palette="void|charcoal|slate|midnight|forest|claret|sand"` on the admin root.
