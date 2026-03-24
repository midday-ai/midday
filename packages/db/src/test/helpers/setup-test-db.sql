-- Prerequisites for drizzle-kit push on a bare Postgres instance.
-- Only creates extensions, schemas, and stub functions that Supabase
-- provides in production but don't exist in a vanilla PG container.
-- All tables/enums/indexes are handled by drizzle-kit push.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql AS $$ SELECT '00000000-0000-0000-0000-000000000000'::uuid $$;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
  LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;

CREATE OR REPLACE FUNCTION private.get_teams_for_authenticated_user()
  RETURNS SETOF uuid LANGUAGE sql
  AS $$ SELECT '00000000-0000-0000-0000-000000000000'::uuid LIMIT 0 $$;

CREATE OR REPLACE FUNCTION extract_product_names(data json)
  RETURNS text LANGUAGE sql AS $$ SELECT '' $$;

CREATE OR REPLACE FUNCTION generate_inbox_fts(name text, products text)
  RETURNS tsvector LANGUAGE sql
  AS $$ SELECT to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(products, '')) $$;
