-- M6 Session A: provider_accounts table + integrations.provider_account_id.
-- Master PAT per (provider, external parent account) so Bentropy can autopull
-- project-level credentials from providers with multi-account footprints.

create table if not exists provider_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  display_name text not null,
  external_account_id text not null,
  master_credential_id uuid references credentials(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (provider, external_account_id)
);

alter table integrations
  add column if not exists provider_account_id uuid references provider_accounts(id) on delete set null;

create index if not exists idx_provider_accounts_provider on provider_accounts(provider);
create index if not exists idx_integrations_provider_account on integrations(provider_account_id);

drop trigger if exists provider_accounts_updated_at on provider_accounts;
create trigger provider_accounts_updated_at before update on provider_accounts
  for each row execute function update_updated_at();

alter table provider_accounts enable row level security;

do $$ declare
  t text;
begin
  for t in select unnest(array['provider_accounts']) loop
    execute format('drop policy if exists %I_admin_all on %I', t, t);
    execute format(
      'create policy %I_admin_all on %I for all using (is_admin()) with check (is_admin())',
      t, t
    );
  end loop;
end $$;
