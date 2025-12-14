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
