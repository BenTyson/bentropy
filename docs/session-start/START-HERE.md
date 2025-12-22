# Bentropy - Agent Onboarding

Welcome, agent. This document will get you up to speed on the Bentropy project.

## Quick Links

| Document | Purpose |
|----------|---------|
| [Current Status](../progress/STATUS.md) | **Read this first** - What's done, what's next |
| [Architecture](../architecture/OVERVIEW.md) | Technical stack and structure |
| [Database Schema](../architecture/DATABASE.md) | Table definitions and relationships |
| [Decisions Log](../decisions/LOG.md) | Key decisions and rationale |
| [Quick Tasks](./QUICK-TASKS.md) | Common development tasks |

## What is Bentropy?

**Bentropy** = Ben + Entropy. A personal brand website and admin dashboard for an entrepreneur who builds prototype web apps.

**Core concept**: The constant fight against entropy (chaos) to bring order to ideas. This philosophy drives the entire design:
- Particles that crystallize from chaos into order
- Nebula backgrounds representing the cosmic void
- An "entropy meter" in the admin dashboard

## Current State (December 2024)

**Both public site and admin dashboard are complete with placeholder data.**

- All 13 pages compile and render correctly
- Admin has full CRUD UI for all 6 modules
- Data is currently local React state (not persisted)
- Database schema exists but not yet deployed to Supabase

## The Two Parts

### 1. Public Site (/)
- Landing page with CrystallizeText hero animation
- Project showcase with filterable gallery
- Individual project pages (Problem → Solution → Outcome narrative)
- About page with the Bentropy philosophy

### 2. Admin Dashboard (/admin)
- **Dashboard** - Stats overview and entropy meter
- **Projects** - CRUD with status, tags, featured flag
- **Credentials** - API key vault with expiration tracking
- **Services** - Local dev server port tracking
- **Repos** - GitHub repository links
- **Logins** - Password manager by category
- **Notes** - Markdown scratchpad with tags and pinning

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 + Framer Motion
- **UI**: shadcn/ui components
- **Database**: Supabase (Postgres) - schema ready, not deployed
- **Auth**: Supabase Auth with GitHub OAuth (not implemented yet)
- **Animations**: tsParticles + Framer Motion

## Running Locally

```bash
npm install
npm run dev -- -p 3344
```

Site runs on **http://localhost:3344**

## Key Files to Know

```
src/
├── app/
│   ├── (public)/          # Public routes (/, /projects, /about)
│   │   └── page.tsx       # Landing page with hero animation
│   └── admin/             # Admin dashboard
│       ├── page.tsx       # Dashboard home
│       ├── projects/      # Projects CRUD
│       ├── credentials/   # API keys vault
│       ├── services/      # Port tracker
│       ├── repos/         # GitHub links
│       ├── logins/        # Password manager
│       └── notes/         # Scratchpad
├── components/
│   ├── particles/         # EntropyField, NebulaBackground, CrystallizeText
│   ├── public/            # Navigation, ProjectCard
│   ├── admin/             # Sidebar, EntropyMeter
│   └── ui/                # shadcn components
├── lib/
│   └── supabase/          # Database client and types
└── supabase/
    └── schema.sql         # Database schema (not yet deployed)
```

## Next Steps

1. **Deploy database**: Run `/supabase/schema.sql` in Supabase SQL Editor
2. **Connect to real data**: Replace placeholder state with Supabase queries
3. **Implement auth**: GitHub OAuth login page
4. **Deploy**: Push to Vercel

## Experimental Components (Not In Use)

- `src/components/particles/ParticleLetter.tsx` - Particle animation forming letters
- `src/components/particles/useLetterParticles.ts` - Canvas-based position extraction

These were attempted but not polished. Can revisit later.
