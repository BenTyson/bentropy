# Quick Task Reference

Common tasks future agents might need to do.

## Running the Project

```bash
cd /Users/bentyson/bentropy
npm run dev -- -p 3344
```

Site: http://localhost:3344
Admin: http://localhost:3344/admin

## Adding a New shadcn Component

```bash
npx shadcn@latest add [component-name]
```

Components go to `src/components/ui/`

## Creating a New Admin Page

1. Create file at `src/app/admin/[module]/page.tsx`
2. Add route to sidebar in `src/components/admin/Sidebar.tsx`
3. Follow existing patterns (see `src/app/admin/page.tsx`)

## Creating a New Public Page

1. Create file at `src/app/(public)/[page]/page.tsx`
2. Uses public layout automatically (has Navigation)

## Updating Project Data

Currently hardcoded in:
- `src/app/(public)/page.tsx` - Featured projects
- `src/app/(public)/projects/page.tsx` - All projects
- `src/app/(public)/projects/[slug]/page.tsx` - Project details

After database setup, these will pull from Supabase.

## Environment Variables

Located in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://cbsydtnaxancoltzzhrz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Key Files by Purpose

| Purpose | File |
|---------|------|
| Design system | `src/app/globals.css` |
| Root layout | `src/app/layout.tsx` |
| Public layout | `src/app/(public)/layout.tsx` |
| Admin layout | `src/app/admin/layout.tsx` |
| Navigation | `src/components/public/Navigation.tsx` |
| Admin sidebar | `src/components/admin/Sidebar.tsx` |
| Particle system | `src/components/particles/EntropyField.tsx` |
| Nebula bg | `src/components/particles/NebulaBackground.tsx` |
| DB types | `src/lib/supabase/types.ts` |
| DB client | `src/lib/supabase/client.ts` |

## Build & Deploy

```bash
# Type check and build
npm run build

# Check for issues
npm run lint
```

## Common Issues

**Middleware deprecation warning**: Ignore for now. Next.js 16 changed conventions.

**Supabase errors on startup**: If env vars aren't set, middleware gracefully skips auth. Site works but admin isn't protected.

**Particles not showing**: Make sure `"use client"` is at top of component using EntropyField.
