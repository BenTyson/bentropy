# Bentropy - Agent Onboarding

Welcome, agent. This document will get you up to speed on the Bentropy project.

## Quick Links

| Document | Purpose |
|----------|---------|
| [Project Overview](../README.md) | High-level project description and philosophy |
| [Architecture](../architecture/OVERVIEW.md) | Technical stack and structure |
| [Current Status](../progress/STATUS.md) | What's done, what's in progress |
| [Decisions Log](../decisions/LOG.md) | Key decisions and rationale |
| [Feature Specs](../features/INDEX.md) | Detailed feature documentation |

## What is Bentropy?

**Bentropy** = Ben + Entropy. A personal brand website and admin dashboard for an entrepreneur who builds prototype web apps.

**Core concept**: The constant fight against entropy (chaos) to bring order to ideas. This philosophy drives the entire design:
- Particles that crystallize from chaos into order
- Nebula backgrounds representing the cosmic void
- An "entropy meter" in the admin dashboard

## The Two Parts

### 1. Public Site (/)
- Landing page with particle animation hero
- Project showcase with filterable gallery
- Individual project pages (Problem → Solution → Outcome narrative)
- About page with the Bentropy philosophy

### 2. Admin Dashboard (/admin)
- Personal "command center" for managing chaos
- Projects CRUD, Credentials vault, Local services tracker
- Repository links, Login manager, Notes scratchpad
- Entropy meter showing current chaos level

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS v4 + Framer Motion
- **UI**: shadcn/ui components
- **Database**: Supabase (Postgres)
- **Auth**: Supabase Auth with GitHub OAuth
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
│   └── admin/             # Protected admin routes
├── components/
│   ├── particles/         # EntropyField, NebulaBackground, CrystallizeText
│   ├── public/            # Navigation, ProjectCard
│   └── admin/             # Sidebar, dashboard components
└── lib/
    └── supabase/          # Database client and types
```

## Current Session Context

See [STATUS.md](../progress/STATUS.md) for the latest progress and next steps.
