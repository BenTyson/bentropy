# Architecture Overview

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 15+ | App Router, Server Components, Turbopack |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS v4 | CSS-first config |
| UI Components | shadcn/ui | Copied into project, fully customizable |
| Animations | Framer Motion | Page transitions, micro-interactions |
| Particles | tsParticles | Entropy visualization |
| Database | Supabase (Postgres) | Cloud-hosted, real-time capable |
| Auth | Supabase Auth | GitHub OAuth for admin |
| Deployment | Vercel | Recommended target |

## Project Structure

```
bentropy/
├── docs/                    # Documentation (you are here)
│   ├── session-start/       # Agent onboarding
│   ├── architecture/        # Technical docs
│   ├── features/            # Feature specifications
│   ├── decisions/           # Decision log
│   └── progress/            # Status tracking
├── public/
│   └── images/              # Static assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (public)/        # Public route group
│   │   │   ├── page.tsx     # Landing page
│   │   │   ├── projects/    # Project gallery + detail pages
│   │   │   └── about/       # About page
│   │   ├── admin/           # Admin dashboard (protected)
│   │   │   ├── layout.tsx   # Admin shell with sidebar
│   │   │   ├── page.tsx     # Dashboard home
│   │   │   └── [module]/    # CRUD pages (to be built)
│   │   ├── login/           # Auth pages (to be built)
│   │   └── layout.tsx       # Root layout
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── particles/       # Entropy animations
│   │   │   ├── EntropyField.tsx
│   │   │   ├── NebulaBackground.tsx
│   │   │   └── CrystallizeText.tsx
│   │   ├── public/          # Public site components
│   │   │   ├── Navigation.tsx
│   │   │   └── ProjectCard.tsx
│   │   └── admin/           # Admin components
│   │       └── Sidebar.tsx
│   └── lib/
│       ├── utils.ts         # Utility functions (cn, etc.)
│       └── supabase/        # Database layer
│           ├── client.ts    # Browser client
│           ├── server.ts    # Server client
│           ├── middleware.ts # Auth middleware
│           └── types.ts     # Database types
├── .env.local               # Environment variables (not committed)
├── .env.local.example       # Template for env vars
└── middleware.ts            # Next.js middleware (auth)
```

## Route Structure

### Public Routes (/)
| Route | File | Description |
|-------|------|-------------|
| `/` | `(public)/page.tsx` | Landing with particle hero |
| `/projects` | `(public)/projects/page.tsx` | Filterable project grid |
| `/projects/[slug]` | `(public)/projects/[slug]/page.tsx` | Project detail |
| `/about` | `(public)/about/page.tsx` | About page |

### Admin Routes (/admin)
| Route | File | Description |
|-------|------|-------------|
| `/admin` | `admin/page.tsx` | Dashboard home |
| `/admin/projects` | `admin/projects/page.tsx` | Projects CRUD (TBD) |
| `/admin/credentials` | `admin/credentials/page.tsx` | API keys vault (TBD) |
| `/admin/services` | `admin/services/page.tsx` | Local ports (TBD) |
| `/admin/repos` | `admin/repos/page.tsx` | GitHub links (TBD) |
| `/admin/logins` | `admin/logins/page.tsx` | Password manager (TBD) |
| `/admin/notes` | `admin/notes/page.tsx` | Scratchpad (TBD) |

## Database Schema

See [DATABASE.md](./DATABASE.md) for full schema.

Core tables:
- `projects` - Public showcase projects
- `credentials` - Encrypted API keys
- `local_services` - Dev server tracking
- `repositories` - GitHub repo links
- `logins` - Encrypted login credentials
- `notes` - Markdown scratchpad

## Key Design Patterns

### 1. Route Groups
Using Next.js route groups `(public)` to share layouts without affecting URLs.

### 2. Client vs Server Components
- Default to Server Components
- Use `"use client"` only for interactivity (animations, forms, state)

### 3. Supabase Integration
- Browser client for client components
- Server client for server components and API routes
- Middleware for session management

### 4. Animation Architecture
- `EntropyField` - tsParticles for background particles
- `NebulaBackground` - Parallax cosmic background
- `CrystallizeText` - Text animation from chaos to order
- Framer Motion for UI transitions

## Environment Variables

```bash
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
