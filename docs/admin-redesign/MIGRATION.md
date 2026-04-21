# Migration Checklist

Step-by-step plan for porting your existing `/admin` area to the new design system. Work top-down — each phase is independently shippable.

## Phase 0 — Install tokens (15 min)

- [ ] Copy `handoff/tokens.css` → `src/styles/admin-tokens.css`
- [ ] In `src/app/admin/layout.tsx`, import it and set the surface attribute:
  ```tsx
  import "@/styles/admin-tokens.css";

  export default function AdminLayout({ children }) {
    return (
      <div data-surface="admin" data-palette="claret" className="min-h-screen">
        {children}
      </div>
    );
  }
  ```
- [ ] In `tailwind.config.ts`, extend the theme with token-backed colors (ADDITIVE — don't replace existing colors yet):
  ```ts
  theme: {
    extend: {
      colors: {
        surface: {
          bg: "var(--bg)",
          panel: "var(--panel)",
          "panel-hi": "var(--panel-hi)",
        },
        line: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        ink: {
          DEFAULT: "var(--text)",
          muted: "var(--muted)",
          faint: "var(--faint)",
        },
        accent: "var(--accent)",
        signal: {
          amber: "var(--amber)",
          red: "var(--red)",
          green: "var(--green)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  }
  ```
- [ ] Load Inter + JetBrains Mono (via `next/font` in `src/app/layout.tsx`):
  ```tsx
  import { Inter, JetBrains_Mono } from "next/font/google";

  const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
  const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
  ```

## Phase 1 — Build primitives (1–2h)

Create `src/components/admin/` with the components from `components.md`:

- [ ] `Panel.tsx`
- [ ] `Btn.tsx` (+ `IconBtn.tsx`)
- [ ] `Pill.tsx`
- [ ] `Tag.tsx`
- [ ] `StatusDot.tsx`
- [ ] `ServiceDot.tsx`
- [ ] `KeyHint.tsx`
- [ ] `SegControl.tsx`
- [ ] `Stat.tsx`
- [ ] `Shell.tsx` (composes Sidebar, TopBar, PageHeader)

Reference: `Bentropy Admin Redesign.html` in the design project has the exact JSX for each. Copy the structure, replace inline styles with Tailwind classes using the new tokens.

**Example — Panel.tsx:**

```tsx
export function Panel({ title, subtitle, actions, pad = true, children }: PanelProps) {
  return (
    <section className="bg-surface-panel border border-line rounded-lg overflow-hidden">
      {(title || actions) && (
        <header className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div>
            {title && <div className="text-sm font-medium">{title}</div>}
            {subtitle && <div className="text-xs text-ink-muted mt-0.5">{subtitle}</div>}
          </div>
          {actions}
        </header>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </section>
  );
}
```

## Phase 2 — Shell (30 min)

- [ ] Create `src/components/admin/Shell.tsx` with the 232px sidebar, 44px top bar, and content area.
- [ ] Replace `src/app/admin/layout.tsx`'s current nav/chrome with `<Shell>`.
- [ ] Port the sidebar nav items, search input, and system-health footer from the redesign.
- [ ] Wire ⌘K to your existing command palette (or stub with a `console.log`).

## Phase 3 — Page migrations (2–3h each)

### Overview

- [ ] Replace "Command Center" heading with "Overview"
- [ ] Delete the entropy meter, the hero gradient card, and any animated orbs
- [ ] Build 4-cell `Stat` row: Active projects / Integrations / Credentials / Services
- [ ] Build Recent Projects panel (`Panel` + rows from `ProjectRow` in the HTML)
- [ ] Build Attention panel (expiring credentials, failed webhooks)
- [ ] Build Shortcuts panel (4 keyboard shortcuts)
- [ ] Build Activity stream panel (MCP / deploy / secrets events)

### Projects list

- [ ] Replace current `ProjectsClient.tsx` table:
  - Remove colored status badges with bespoke `statusColors` map → use `<Pill tone={project.status}>`
  - Remove motion.div stagger entries → static rows
  - Add hover background `rgba(255,255,255,.015)`
  - Add domain column in mono, relative-time "updated" column
  - Add `StatusDot` health column (currently no data — wire up or hardcode `green`)
  - Star button: color `--accent` when featured, `--faint` otherwise
- [ ] Move filter bar above table with search + `SegControl` (`All / Active / Shipped / Concept`)
- [ ] Keep the existing `Dialog` for create/edit — restyle `Field` labels to remove tone-colored variants (`text-entropy-chaos` etc.) → plain `text-ink-muted`

### Project detail

- [ ] Tab strip (Overview / Integrations / Credentials / Services / Notes) replacing any existing tab UI
- [ ] Narrative panel with 3 rows (Problem / Solution / Outcome) — all `--text` body, no tone colors
- [ ] Integrations panel listing connected services with `ServiceDot` and health `StatusDot`
- [ ] Metadata panel (right column) with key/value rows, monospace values
- [ ] Deploy history panel (right column) with commit sha in mono, relative time

### Credentials

- [ ] Replace 3-column card grid with a dense table (see `CredentialsScreen` in the HTML)
- [ ] Top alert banner: 1 expired + 2 expiring warning (only render if counts > 0)
- [ ] Columns: Name (+ masked key below) / Service (+ ServiceDot) / Project / Scope tags / Expires countdown / Actions
- [ ] Expiry countdown in mono: `9d` / `Expired 3d ago` / `Never`
- [ ] Show/hide key via eye toggle, copy to clipboard

## Phase 4 — Cleanup (30 min)

- [ ] Delete unused color tokens from `tailwind.config.ts`:
  - `accent-blue`, `accent-violet`, `accent-cyan`
  - `entropy-chaos`, `entropy-drifting`, `entropy-ordered`
- [ ] Grep for any remaining usage and replace:
  ```
  rg "accent-blue|accent-violet|accent-cyan|entropy-chaos|entropy-drifting|entropy-ordered" src/app/admin
  ```
- [ ] Delete any `motion.div` entry animations in admin pages
- [ ] Verify public-site pages still compile and look identical (the admin tokens are scoped via `[data-surface="admin"]`)

## Phase 5 — Polish (optional)

- [ ] Wire the palette switcher to `data-palette` on the admin root (persist to localStorage or user prefs)
- [ ] Add `⌘K` command palette if not already present
- [ ] Add keyboard nav for the project table (`j/k` to move, `Enter` to open)
- [ ] Add sparkline component for system health if you have real uptime data

## Acceptance criteria

The admin passes review when:

1. No component uses a hardcoded hex color (all go through CSS vars)
2. No component imports `accent-blue`, `accent-violet`, `accent-cyan`, or any `entropy-*` token
3. Every number renders in `var(--font-mono)` with `tabular-nums`
4. Every status uses `StatusDot` or `Pill` (not a bare colored background)
5. No `motion.div` entry animations inside admin pages
6. Swapping `data-palette` on the admin root changes all colors coherently, no stragglers
