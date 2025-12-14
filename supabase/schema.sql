-- Bentropy Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cbsydtnaxancoltzzhrz/sql

-- ============================================
-- PROJECTS TABLE
-- Public showcase projects
-- ============================================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text not null,
  description text,
  problem text,          -- "The entropy state"
  solution text,         -- "Bentropy applied"
  outcome text,          -- "Order achieved"
  tech_stack text[] default '{}',
  status text default 'concept' check (status in ('active', 'shipped', 'concept')),
  featured boolean default false,
  display_order int default 0,
  demo_url text,
  repo_url text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- CREDENTIALS TABLE
-- Encrypted API keys and secrets
-- ============================================
create table if not exists credentials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service text not null,
  key_encrypted text not null,
  project_id uuid references projects(id) on delete set null,
  expires_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- ============================================
-- LOCAL SERVICES TABLE
-- Track dev servers and ports
-- ============================================
create table if not exists local_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  port int not null,
  project_id uuid references projects(id) on delete set null,
  start_command text,
  notes text,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- REPOSITORIES TABLE
-- GitHub repo links
-- ============================================
create table if not exists repositories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  project_id uuid references projects(id) on delete set null,
  category text,
  notes text,
  created_at timestamptz default now()
);

-- ============================================
-- LOGINS TABLE
-- Encrypted login credentials
-- ============================================
create table if not exists logins (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  username_encrypted text not null,
  password_encrypted text not null,
  url text,
  category text,
  notes text,
  last_used timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- NOTES TABLE
-- Markdown scratchpad
-- ============================================
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  tags text[] default '{}',
  pinned boolean default false,
  project_id uuid references projects(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- Protect sensitive tables
-- ============================================

-- Enable RLS on sensitive tables
alter table credentials enable row level security;
alter table logins enable row level security;

-- Allow public read on projects (for public site)
alter table projects enable row level security;
create policy "Projects are viewable by everyone" on projects
  for select using (true);

-- For now, allow all operations from authenticated users
-- TODO: Restrict to specific admin user ID
create policy "Allow all for authenticated" on credentials
  for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated" on logins
  for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated" on projects
  for all using (auth.role() = 'authenticated');

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_projects_slug on projects(slug);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_projects_featured on projects(featured);
create index if not exists idx_credentials_service on credentials(service);
create index if not exists idx_credentials_project on credentials(project_id);
create index if not exists idx_local_services_port on local_services(port);
create index if not exists idx_repositories_project on repositories(project_id);
create index if not exists idx_logins_service on logins(service);
create index if not exists idx_notes_pinned on notes(pinned);
create index if not exists idx_notes_project on notes(project_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- Auto-update timestamp on changes
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();

-- ============================================
-- SEED DATA
-- Initial projects
-- ============================================
insert into projects (slug, name, tagline, description, problem, solution, outcome, tech_stack, status, featured, display_order) values
  ('qr-forge', 'QR Forge', 'Craft beautiful, functional QR codes',
   'A powerful QR code generator that lets you create customized, branded QR codes.',
   'QR codes are ubiquitous but most generators produce generic, ugly results. Businesses need QR codes that represent their brand.',
   'QR Forge provides a visual editor for crafting QR codes with custom colors, logos, shapes, and styles. Real-time preview ensures codes remain scannable.',
   'Beautiful QR codes that maintain brand consistency and actually get scanned.',
   '{"Next.js", "Canvas API", "Tailwind CSS", "TypeScript"}', 'active', true, 1),

  ('scribe', 'Scribe', 'Transform thoughts into polished documentation',
   'An AI-powered writing assistant specifically designed for developers.',
   'Documentation is tedious to write, easy to neglect, and often becomes outdated.',
   'Scribe analyzes your codebase and generates documentation drafts that understand your architecture.',
   'Comprehensive documentation in minutes instead of hours.',
   '{"React", "OpenAI API", "MDX", "Prisma", "PostgreSQL"}', 'active', true, 2),

  ('clarify', 'Clarify', 'Make complex ideas crystal clear',
   'An AI-powered tool that helps experts explain complex topics to any audience.',
   'The curse of knowledge: experts struggle to explain their domain to non-experts.',
   'Clarify uses language models to transform complex explanations into clear, audience-appropriate content.',
   'Technical knowledge becomes accessible to everyone.',
   '{"TypeScript", "Claude API", "Next.js", "Framer Motion"}', 'concept', true, 3),

  ('seed-and-star', 'Seed & Star', 'Grow ideas from seeds to stars',
   'Track and nurture your project ideas from inception to launch.',
   'Good ideas get lost in the chaos of daily work.',
   'A system to capture, grow, and prioritize ideas systematically.',
   'No more lost ideas - everything tracked from seed to star.',
   '{"Next.js", "Supabase", "Tailwind CSS"}', 'concept', false, 4),

  ('cinematekka', 'Cinematekka', 'Your personal film archive',
   'Track, rate, and discover films with a beautiful interface.',
   'Film tracking apps are cluttered and lack personality.',
   'A minimalist, beautiful way to curate your film journey.',
   'A personal cinematheque you actually want to use.',
   '{"React", "TMDB API", "Supabase", "Tailwind CSS"}', 'active', false, 5),

  ('evercraft', 'Evercraft', 'Build anything, one craft at a time',
   'A modular creation platform for digital makers.',
   'Creative tools are fragmented and expensive.',
   'An all-in-one toolkit that grows with you.',
   'One platform for all your creative projects.',
   '{"Next.js", "Canvas", "WebGL", "TypeScript"}', 'concept', false, 6),

  ('tourpad', 'Tourpad', 'Plan tours that tell a story',
   'Interactive tour planning for travelers and guides.',
   'Tour planning is scattered across maps, docs, and spreadsheets.',
   'One beautiful interface for planning narrative-driven tours.',
   'Tours that flow like stories, not checklists.',
   '{"Next.js", "Mapbox", "Supabase", "Framer Motion"}', 'active', false, 7)
on conflict (slug) do nothing;
