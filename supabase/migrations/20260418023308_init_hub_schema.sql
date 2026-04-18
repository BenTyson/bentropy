-- Initial Bentropy hub schema.
-- Apply via `supabase db push`. Idempotent: safe to re-apply.

-- ============================================
-- ADMIN ALLOWLIST
-- Single source of truth for who can write to the hub.
-- Insert Ben's auth.users.id here after first GitHub OAuth login.
-- ============================================
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz default now()
);

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- ============================================
-- PROJECTS
-- Public showcase + private hub metadata in one table.
-- Public read of safe columns; writes admin-only.
-- ============================================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text not null,
  description text,
  problem text,
  solution text,
  outcome text,
  tech_stack text[] default '{}',
  status text default 'concept' check (status in ('active', 'shipped', 'concept')),
  featured boolean default false,
  display_order int default 0,
  demo_url text,
  repo_url text,
  image_url text,
  -- Hub extensions
  primary_domain text,
  vercel_project_id text,
  archived_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Backfill columns if running against an older schema version
alter table projects add column if not exists primary_domain text;
alter table projects add column if not exists vercel_project_id text;
alter table projects add column if not exists archived_at timestamptz;

-- ============================================
-- CREDENTIALS
-- App-encrypted API keys; key_encrypted holds AES-GCM ciphertext (M3+).
-- ============================================
create table if not exists credentials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service text not null,
  key_encrypted text not null,
  project_id uuid references projects(id) on delete set null,
  expires_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table credentials add column if not exists updated_at timestamptz default now();

-- ============================================
-- LOCAL SERVICES
-- Dev servers and ports.
-- ============================================
create table if not exists local_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  port int not null,
  project_id uuid references projects(id) on delete set null,
  start_command text,
  notes text,
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table local_services add column if not exists created_at timestamptz default now();
alter table local_services add column if not exists updated_at timestamptz default now();

-- ============================================
-- REPOSITORIES
-- ============================================
create table if not exists repositories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  project_id uuid references projects(id) on delete set null,
  category text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table repositories add column if not exists created_at timestamptz default now();
alter table repositories add column if not exists updated_at timestamptz default now();

-- ============================================
-- LOGINS
-- App-encrypted username + password.
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table logins add column if not exists updated_at timestamptz default now();

-- ============================================
-- NOTES
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
-- INTEGRATIONS (M3+)
-- Polymorphic: one row per (project, service type). config jsonb shape varies by type.
-- ============================================
create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type text not null check (type in ('vercel','github','supabase','stripe','railway','dns','analytics','local')),
  display_name text,
  config jsonb default '{}'::jsonb,
  secret_ref uuid references credentials(id) on delete set null,
  last_synced_at timestamptz,
  sync_status text check (sync_status in ('ok','stale','error')),
  sync_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_integrations_project_type on integrations(project_id, type, display_name);

-- Time-series cache of live API payloads
create table if not exists integration_snapshots (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references integrations(id) on delete cascade,
  snapshot jsonb not null,
  fetched_at timestamptz default now()
);

create index if not exists idx_snapshots_integration_fetched on integration_snapshots(integration_id, fetched_at desc);

-- Sync run observability
create table if not exists sync_log (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references integrations(id) on delete cascade,
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text check (status in ('ok','error')),
  error text
);

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
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at before update on projects
  for each row execute function update_updated_at();

drop trigger if exists notes_updated_at on notes;
create trigger notes_updated_at before update on notes
  for each row execute function update_updated_at();

drop trigger if exists credentials_updated_at on credentials;
create trigger credentials_updated_at before update on credentials
  for each row execute function update_updated_at();

drop trigger if exists local_services_updated_at on local_services;
create trigger local_services_updated_at before update on local_services
  for each row execute function update_updated_at();

drop trigger if exists repositories_updated_at on repositories;
create trigger repositories_updated_at before update on repositories
  for each row execute function update_updated_at();

drop trigger if exists logins_updated_at on logins;
create trigger logins_updated_at before update on logins
  for each row execute function update_updated_at();

drop trigger if exists integrations_updated_at on integrations;
create trigger integrations_updated_at before update on integrations
  for each row execute function update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- Public projects readable by anyone (marketing site).
-- All writes + every other table gated by admin_users allowlist.
-- ============================================
alter table admin_users enable row level security;
alter table projects enable row level security;
alter table credentials enable row level security;
alter table local_services enable row level security;
alter table repositories enable row level security;
alter table logins enable row level security;
alter table notes enable row level security;
alter table integrations enable row level security;
alter table integration_snapshots enable row level security;
alter table sync_log enable row level security;

-- Drop the old permissive policies if they exist
drop policy if exists "Allow all for authenticated" on credentials;
drop policy if exists "Allow all for authenticated" on logins;
drop policy if exists "Allow all for authenticated" on projects;
drop policy if exists "Projects are viewable by everyone" on projects;

-- admin_users: only admins can see/manage the allowlist
drop policy if exists admin_users_admin_all on admin_users;
create policy admin_users_admin_all on admin_users
  for all using (is_admin()) with check (is_admin());

-- projects: public read, admin write
drop policy if exists projects_public_read on projects;
create policy projects_public_read on projects
  for select using (true);

drop policy if exists projects_admin_write on projects;
create policy projects_admin_write on projects
  for all using (is_admin()) with check (is_admin());

-- All other tables: admin-only
do $$ declare
  t text;
begin
  for t in select unnest(array[
    'credentials','local_services','repositories','logins','notes',
    'integrations','integration_snapshots','sync_log'
  ]) loop
    execute format('drop policy if exists %I_admin_all on %I', t, t);
    execute format(
      'create policy %I_admin_all on %I for all using (is_admin()) with check (is_admin())',
      t, t
    );
  end loop;
end $$;

-- ============================================
-- SEED DATA (existing showcase projects only)
-- Hub-specific Finch / SaltGoat seeding happens in M2.
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
