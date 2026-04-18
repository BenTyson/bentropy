-- Seed: Finch + SaltGoat pilot projects
-- Run via Supabase SQL editor (runs as postgres/service-role, bypasses RLS)
-- Idempotent: upserts projects, deletes+reinserts related records each run.

DO $$
DECLARE
  finch_id UUID;
  saltgoat_id UUID;
BEGIN

  -- ── Projects ────────────────────────────────────────────────────────────────

  INSERT INTO projects (
    slug, name, tagline, description,
    tech_stack, status, featured, display_order,
    primary_domain, repo_url
  ) VALUES (
    'finch',
    'Finch',
    'Book local music lessons in minutes',
    'Music teacher marketplace connecting students with independent teachers. Commission-based, mobile-first. Bootstrap model targeting national launch + 3-4 focal cities.',
    ARRAY['Next.js', 'TypeScript', 'Supabase', 'Stripe', 'Tailwind', 'Vercel'],
    'active', true, 10,
    'finch.app',
    'https://github.com/bentyson/finch'
  )
  ON CONFLICT (slug) DO UPDATE SET
    name         = EXCLUDED.name,
    tagline      = EXCLUDED.tagline,
    description  = EXCLUDED.description,
    tech_stack   = EXCLUDED.tech_stack,
    status       = EXCLUDED.status,
    primary_domain = EXCLUDED.primary_domain,
    repo_url     = EXCLUDED.repo_url,
    updated_at   = now()
  RETURNING id INTO finch_id;

  -- ON CONFLICT DO UPDATE still returns the row; guard for edge cases
  IF finch_id IS NULL THEN
    SELECT id INTO finch_id FROM projects WHERE slug = 'finch';
  END IF;

  INSERT INTO projects (
    slug, name, tagline, description,
    tech_stack, status, featured, display_order
  ) VALUES (
    'saltgoat',
    'SaltGoat',
    'Tame your dev environment',
    'Second Bentropy pilot. Scope TBD — fill in as the project takes shape.',
    ARRAY['Next.js', 'TypeScript', 'Tailwind'],
    'concept', false, 20
  )
  ON CONFLICT (slug) DO UPDATE SET
    name        = EXCLUDED.name,
    tagline     = EXCLUDED.tagline,
    description = EXCLUDED.description,
    updated_at  = now()
  RETURNING id INTO saltgoat_id;

  IF saltgoat_id IS NULL THEN
    SELECT id INTO saltgoat_id FROM projects WHERE slug = 'saltgoat';
  END IF;

  -- ── Clear existing linked data (makes this idempotent) ───────────────────────

  DELETE FROM credentials    WHERE project_id IN (finch_id, saltgoat_id);
  DELETE FROM repositories   WHERE project_id IN (finch_id, saltgoat_id);
  DELETE FROM local_services WHERE project_id IN (finch_id, saltgoat_id);
  DELETE FROM notes          WHERE project_id IN (finch_id, saltgoat_id);

  -- ── Finch credentials ────────────────────────────────────────────────────────
  -- key_encrypted stores plaintext until ENCRYPTION_KEY is wired in (M3).
  -- Replace PLACEHOLDER values with real keys before M3.

  INSERT INTO credentials (name, service, key_encrypted, project_id, notes) VALUES
    ('Supabase Anon Key',         'supabase', 'PLACEHOLDER_finch_supabase_anon',    finch_id, 'Public; safe for client bundles'),
    ('Supabase Service Role Key', 'supabase', 'PLACEHOLDER_finch_supabase_srk',     finch_id, 'Server-only. Never expose to browser.'),
    ('Stripe Publishable Key',    'stripe',   'PLACEHOLDER_finch_stripe_pk_test',   finch_id, 'Test mode. Swap to live before launch.'),
    ('Stripe Secret Key',         'stripe',   'PLACEHOLDER_finch_stripe_sk_test',   finch_id, 'Server-only. Test mode.'),
    ('Vercel PAT',                'vercel',   'PLACEHOLDER_finch_vercel_pat',       finch_id, 'Personal access token for Vercel API sync (M4)');

  -- ── SaltGoat credentials ─────────────────────────────────────────────────────

  INSERT INTO credentials (name, service, key_encrypted, project_id, notes) VALUES
    ('Supabase Anon Key', 'supabase', 'PLACEHOLDER_saltgoat_supabase_anon', saltgoat_id, null);

  -- ── Repositories ─────────────────────────────────────────────────────────────

  INSERT INTO repositories (name, url, project_id, category) VALUES
    ('finch',         'https://github.com/bentyson/finch',         finch_id,    'main'),
    ('finch-landing', 'https://github.com/bentyson/finch-landing', finch_id,    'marketing'),
    ('saltgoat',      'https://github.com/bentyson/saltgoat',      saltgoat_id, 'main');

  -- ── Local services ───────────────────────────────────────────────────────────

  INSERT INTO local_services (name, port, project_id, start_command, is_active) VALUES
    ('Finch Dev',    3000, finch_id,    'npm run dev', false),
    ('SaltGoat Dev', 3001, saltgoat_id, 'npm run dev', false);

  -- ── Notes ────────────────────────────────────────────────────────────────────

  INSERT INTO notes (title, content, project_id, tags, pinned) VALUES
    (
      'Project Setup',
      E'Music teacher marketplace. Bootstrap model.\n\nTarget: national launch + 3-4 focal cities.\nCommission: 12-15%.\nMVP timeline: 3-4 months.\n\nStripe Connect for teacher payouts — 48h hold post-lesson. Test mode active; switch to live before launch.',
      finch_id,
      ARRAY['setup', 'stripe', 'payments'],
      true
    ),
    (
      'Stripe Webhooks Needed',
      E'Events to handle:\n- payment_intent.succeeded\n- account.updated (Stripe Connect)\n- checkout.session.completed',
      finch_id,
      ARRAY['stripe', 'webhooks'],
      false
    ),
    (
      'Getting Started',
      'SaltGoat is the second Bentropy pilot. Add project details, credentials, and repos as the project takes shape.',
      saltgoat_id,
      ARRAY['setup'],
      true
    );

END $$;
