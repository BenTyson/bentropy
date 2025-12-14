# Database Schema

## Overview

Database is Supabase (Postgres). Tables are designed for both the public showcase and admin command center.

## Tables

### projects
Public showcase projects displayed on the site.

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text not null,
  description text,
  problem text,          -- "The entropy state"
  solution text,         -- "Bentropy applied"
  outcome text,          -- "Order achieved"
  tech_stack text[],
  status text default 'concept',  -- active, shipped, concept
  featured boolean default false,
  display_order int default 0,
  demo_url text,
  repo_url text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### credentials
Encrypted API keys and secrets vault.

```sql
create table credentials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service text not null,
  key_encrypted text not null,  -- stored via Supabase Vault
  project_id uuid references projects(id),
  expires_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

alter table credentials enable row level security;
```

### local_services
Track local development servers and ports.

```sql
create table local_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  port int not null,
  project_id uuid references projects(id),
  start_command text,
  notes text,
  is_active boolean default false
);
```

### repositories
GitHub repository links.

```sql
create table repositories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  project_id uuid references projects(id),
  category text,
  notes text
);
```

### logins
Encrypted login credentials for various services.

```sql
create table logins (
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

alter table logins enable row level security;
```

### notes
Markdown scratchpad / notes.

```sql
create table notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  tags text[],
  pinned boolean default false,
  project_id uuid references projects(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Row Level Security

Sensitive tables (`credentials`, `logins`) have RLS enabled. Policies should restrict access to the authenticated admin user only.

Example policy:
```sql
create policy "Admin only" on credentials
  for all using (auth.uid() = 'YOUR_USER_ID');
```

## TypeScript Types

Types are defined in `src/lib/supabase/types.ts` and mirror the database schema.

## Migration Status

| Table | Created | RLS | Seeded |
|-------|---------|-----|--------|
| projects | No | No | No |
| credentials | No | No | No |
| local_services | No | No | No |
| repositories | No | No | No |
| logins | No | No | No |
| notes | No | No | No |

**Next step**: Run the SQL in Supabase SQL Editor to create tables.
