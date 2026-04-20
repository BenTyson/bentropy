-- M5: unique constraint on credentials(project_id, name) for upsert dedup.
-- Partial index (where project_id is not null) so global/project-less credentials
-- can still share names. Existing data must not have duplicates before this runs.
create unique index if not exists idx_credentials_project_name
  on credentials(project_id, name)
  where project_id is not null;
