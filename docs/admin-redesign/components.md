# Component Inventory

Each component is described as it should exist in `src/components/admin/*`. Props shown as TS signatures. Prefer composition over variants; resist the urge to add booleans.

## Panel

```ts
interface PanelProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  pad?: boolean;          // default true; set false for table-style content
  children: React.ReactNode;
}
```

- Background `--panel`, border `1px solid var(--border)`, radius `--r-2xl`.
- Header (if `title` or `actions`) is 12px vertical × 16px horizontal, bottom border `--border`.
- Body padding: 16 when `pad`, 0 otherwise.
- No shadow. No hover state on the panel itself.

## Btn

```ts
interface BtnProps {
  variant?: "primary" | "secondary" | "ghost";  // default "primary"
  size?: "sm" | "md";                            // default "md"
  icon?: React.ReactNode;                        // leading Lucide icon
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}
```

- **primary:** bg `--accent`, text `--bg`, border `--accent`. Hover: 90% mix toward white.
- **secondary:** bg `--panel`, text `--text`, border `--border-strong`. Hover: bg `--panel-hi`.
- **ghost:** transparent, text `--text`, no border. Hover: bg `--panel-hi`.
- Padding: `sm` = 5×10, `md` = 7×14. Font 12/13px, weight 500.
- Radius `--r-lg` (5).

## IconBtn

```ts
interface IconBtnProps {
  icon: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;       // hover text turns --red
  title?: string;         // a11y
}
```

- 28×28, transparent, hover bg `--panel-hi`. At rest: color `--muted`, on hover: `--text` (or `--red` with danger).
- Use for row action clusters (edit/delete/more), NOT for primary actions.

## Pill

```ts
interface PillProps {
  tone: "active" | "shipped" | "concept" | "warn" | "bad" | "default";
  children: React.ReactNode;
}
```

- 11px, weight 500, lowercase, padding 2×8, radius `--r-md`.
- Tone backgrounds use `color-mix(in oklab, var(--green) 12%, var(--panel))` etc. to keep tint cohesive across palettes.
- **Prefer `StatusDot`** where possible. Reserve pills for the "Status" column and project headers.

## Tag

```ts
interface TagProps { children: React.ReactNode; }
```

- Mono 11px, padding 2×7, 1px `--border`, radius `--r-sm`, color `--muted`.
- Use for tech stack, scope, categorization. Never for status.

## StatusDot

```ts
interface StatusDotProps {
  tone: "green" | "amber" | "red" | "muted";
  size?: number;  // default 6
}
```

- Inline-block circle. Use this, not a colored pill or icon, for health/ok/warn/error signal.

## ServiceDot

```ts
interface ServiceDotProps { service: "Vercel" | "Stripe" | "GitHub" | "Supabase" | "Cloudflare" | "OpenAI" | "Resend" | "Linear" | "Railway" | string; }
```

- 18×18 rounded square, `--bg` fill, `--border` hairline, first-letter mono 10px in `--muted`.
- Identity without color. Do not add brand fills.

## KeyHint

```ts
interface KeyHintProps { children: React.ReactNode; }
```

- Monospace ⌘-style keycap. Min-width 18, height 18, 1px `--border`, mono 10px.
- Use for `⌘K` in search, keyboard shortcuts in menus.

## SegControl

```ts
interface SegControlProps<T extends string> {
  options: T[];
  active: T;
  onChange?: (value: T) => void;
}
```

- Inline-flex, 2px padding on panel, radius `--r-xl`.
- Active segment: `--panel-hi` fill, `--text` color.
- Use for table filters (`All / Active / Shipped / Concept`), tab-lite toggles.

## Shell / Sidebar / TopBar / PageHeader

These are layout primitives, not reusable atoms. Implement once in `src/components/admin/Shell.tsx` and compose every admin page around them.

```ts
<Shell active="projects" breadcrumb={['Bentropy', 'Projects']} title="Projects" subtitle="…" actions={<>…</>}>
  <PageContent />
</Shell>
```

- `active` highlights the corresponding sidebar item.
- `actions` slot in the `PageHeader` takes button(s); primary action is the rightmost.

## Stat

```ts
interface StatProps {
  label: string;             // uppercase, 11px muted
  value: string | number;    // 30px mono tabular-nums
  delta?: string;            // "+3", "3 expiring", "—"
  deltaTone?: "muted" | "amber" | "red" | "green";
  sub?: string;              // 12px faint caption
  divider?: boolean;         // left border for grid layouts
}
```

- Assemble 3–4 Stats inside a single bordered container with `grid-template-columns: repeat(N, 1fr)` and `divider` on all but the first.
- Never put more than 4 in a row. If you have more signals, split into a second row or promote them to their own panel.

## Deprecated shadcn usages

Remove or wrap these in the admin surface only:

- `Badge` with `className="bg-accent-blue text-white"` style literal color classes → use `Pill` with a tone.
- `Card` / `CardHeader` / `CardTitle` wrapping colored icons → use `Panel` with neutral icons.
- `motion.div` with entry stagger → delete; use static rows.
- `ArrowRightIcon` next to every row → use `Icons.chevR` in the last column, at `--faint` → `--muted` on hover.

The public marketing site can keep using shadcn as-is. Scope the admin overrides to a `[data-surface="admin"]` attribute on the admin layout root so nothing leaks out.
