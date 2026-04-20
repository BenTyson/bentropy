alter table credentials
  add column if not exists source text not null default 'manual'
  check (source in ('manual', 'autopull'));
