# Bentropy Admin — Design Spec

> Single source of truth for the admin redesign. Every rule here exists to solve the original problem: **"random colors everywhere, unprofessional."** Deviations must be justified.

## 1. Design principles

### Calm, literal, dense

The admin is a **tool**, not a marketing surface. Remove theatrics: no "Command Center", "war room", "entropy meter", gradient logos, glow effects, animated orbs. Label things what they are.

### One accent, signal colors only

- **One neutral accent** — warm bone (`--accent: #E8DDD8` on Claret). Used for: primary button background, active nav rail, logo mark, focus rings, one-off highlights.
- **Three signal colors** — `--amber`, `--red`, `--green`. Used **only for status**: expiring credentials, failed deploys, healthy integrations. Never for decoration, category tagging, or visual interest.
- **No other accents.** Delete `--accent-blue`, `--accent-violet`, `--accent-cyan`, `--entropy-chaos`, `--entropy-drifting`, `--entropy-ordered` from the Tailwind config.

### Numbers are the hero

Every numeric value (stat, ID, timestamp, domain, commit SHA, expiry countdown, port, version) renders in JetBrains Mono with `font-variant-numeric: tabular-nums`. Scan-ability over prettiness.

### Hairlines, not shadows

Panels are flat: `1px solid var(--border)` on a `var(--panel)` fill. The only shadow in the UI is on floating popovers (`--shadow-popover`). No card elevation, no hover shadows, no drop shadows on buttons.

### Density

Tables: 12px row padding. Panels: 16px padding. Page gutter: 28–36px. Sidebar width: 232px. Top bar: 44px. A comfortable information density — closer to Linear/Height than Shadcn marketing defaults.

## 2. Color semantics

| Token             | Role                                                      | Don't use for                           |
| ----------------- | --------------------------------------------------------- | --------------------------------------- |
| `--bg`            | Page background, nested table headers                     | -                                       |
| `--panel`         | Cards, panels, sidebar, top-of-page chrome                | Hover states                            |
| `--panel-hi`      | Active nav item, hover states, kbd backgrounds            | Primary fills                           |
| `--border`        | Default hairlines — panel borders, row dividers           | Text                                    |
| `--border-strong` | Borders on secondary buttons, emphasized containers       | Row dividers                            |
| `--text`          | Primary copy, headings, active nav label                  | Muted labels                            |
| `--muted`         | Secondary copy, column headers (uppercase), table metadata| Primary content                         |
| `--faint`         | Timestamps, separators, empty placeholders, "—" dashes    | Readable body copy                      |
| `--accent`        | Primary button bg, featured star, active indicator rail   | Hover states, backgrounds, text on body |
| `--amber`         | Expiring (≤14 days), warn status                          | Info, neutral highlighting              |
| `--red`           | Expired, failed, error                                    | Delete icons (use `--muted`, red on hover) |
| `--green`         | Healthy, ok, connected                                    | Success toasts (use neutral)            |

### Status presentation

- **Preferred:** 6px `StatusDot` + neutral text. Saves saturation budget for real signal.
- **Acceptable:** `Pill` with `color-mix` tinted bg for status columns (`active`, `shipped`, `concept`, `warn`, `bad`).
- **Never:** full-color row backgrounds, colored borders on whole cards, colored icons used for decoration.

## 3. Typography

| Use                          | Family     | Size | Weight | Notes                         |
| ---------------------------- | ---------- | ---- | ------ | ----------------------------- |
| Page title (H1)              | Inter      | 22   | 500    | `letter-spacing: -0.3`        |
| Panel section title          | Inter      | 13   | 500    | -                             |
| Body                         | Inter      | 13   | 400    | `line-height: 1.5`            |
| Secondary body / subtitles   | Inter      | 12   | 400    | `color: var(--muted)`         |
| Uppercase section labels     | Inter      | 11   | 500    | `letter-spacing: 0.4; text-transform: uppercase; color: var(--muted)` |
| Stat value                   | JB Mono    | 30   | 400    | `tabular-nums; letter-spacing: -0.5` |
| Timestamps, IDs, paths       | JB Mono    | 11   | 400    | `color: var(--faint)` or `--muted` |
| Tag text                     | JB Mono    | 11   | 400    | -                             |
| Buttons                      | Inter      | 12–13| 500    | -                             |
| Code / key hints             | JB Mono    | 10–11| 400    | `color: var(--muted)`         |

**Rule of thumb:** if it's a **number, identifier, timestamp, or path**, it's mono. Everything else is Inter.

## 4. Iconography

- **Lucide.** Stroke width **1.5**, size **16** in most contexts, **14** in dense rows, **18** in sidebar nav only if you want breathing room.
- Icon color: `var(--muted)` by default, `var(--text)` on hover or when paired with active state.
- **No emoji** in the admin surface.
- **No custom SVG drawings** for decoration. If it's not a Lucide icon, it's probably unnecessary.

## 5. Layout rules

### Sidebar (232px wide, sticky)

- Logo + workspace identity at top, 26×26 mark in accent color.
- Search with ⌘K hint below logo.
- Two nav sections: `Workspace` (primary: Overview/Projects/Integrations/Providers) and `Resources` (Credentials/Services/Repos/Logins/Notes).
- Active item: 2px accent rail on the left, `--panel-hi` background, `--text` color.
- Footer: 24-bar system health sparkline with uptime %.
- Counts on the right of nav items in mono `--faint`. Warnings use amber chip.

### Top bar (44px)

- Breadcrumb left.
- Right: MCP status dot + label, version number, user avatar (26px circle).

### Page header

- H1 (22px, 500) + optional 13px muted subtitle.
- Primary action as solid accent button on the right. Secondary actions as outlined `--border-strong` buttons before it.

### Panels

- Always `--panel` fill, `--border` 1px hairline, `--r-2xl` radius (8px).
- Optional header: 12×16 padding, title + subtitle on left, actions on right.
- Body padding: 16. For table-like content, pass `pad={false}` and let rows manage their own padding.

### Tables (inside panels)

- Column header: `--bg` background (slightly darker than panel), 10×16 padding, 11px uppercase labels in `--muted`.
- Rows: 12×16 padding, 1px `--border` between. Hover: `rgba(255,255,255,.015)` overlay.
- Row actions on the right, `opacity: 0.3` at rest, `1` on hover.

## 6. Component vocabulary

See `components.md` for props. The full set is deliberately small — resist adding new ones.

**Allowed:** `Panel`, `Btn` (primary/secondary/ghost), `IconBtn`, `Pill`, `Tag`, `StatusDot`, `ServiceDot`, `KeyHint`, `SegControl`, `Sidebar`, `TopBar`, `PageHeader`, `Shell`.

**Banned (from existing admin):** `Card` with colored titles, `Badge` with bespoke color classes (`bg-accent-blue`, `bg-accent-violet`), motion entry animations on every list item (use a single page-level fade-in or nothing at all), gradient backgrounds, emoji badges.

## 7. Motion

- Hover and color transitions: 100–160ms, `cubic-bezier(0.2, 0, 0, 1)` or linear.
- No entry animations per-row. If you want a page-level fade-in, do it once on the shell.
- No scroll-triggered reveals in the admin.

## 8. Content voice

- **Labels:** lowercase for pills (`active`, `shipped`, `concept`, `expiring`). Title case for section titles and button labels (`New project`, `Add credential`).
- **Empty states:** literal, one-line. "No projects yet" + primary action. No motivational copy.
- **Errors:** literal and actionable. "Vercel deploy token expired 3 days ago — Rotate." Not "Something needs your attention!"
- **No exclamation points.** No "Let's get started!" No "You're all set 🎉"

## 9. What changed from the original admin

| Before                                              | After                                                         |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `bg-accent-blue`, `bg-accent-violet`, `bg-accent-cyan`, `bg-entropy-chaos/drifting/ordered` | Single `--accent` + three signal tokens |
| Gradient "Bentropy" wordmark logo                   | 26×26 accent square with lowercase `b`                         |
| "Command Center" / "Entropy Meter" headings         | "Overview" — literal label                                     |
| Colored icon per nav item                           | Neutral icons, active state via 2px rail + panel-hi fill       |
| Colored badges (`statusColors` map with 3 saturated fills) | Pills with color-mix tinted bg, status dots preferred for density |
| Motion.div on every list item with stagger          | Static rows, hover-only transitions                            |
| Credentials as 3-column card grid                   | Dense table with expiry, scope, service dot                    |
| Mixed date formats                                  | All timestamps mono, relative (`2h`, `1d`, `12d`), `—` when null |
| `text-entropy-chaos`, `text-accent-blue` on form labels | Plain `--muted` labels, optional tone only for status   |
