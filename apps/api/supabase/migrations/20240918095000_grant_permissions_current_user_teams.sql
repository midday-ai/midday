-- Drop the view if it exists in public schema (in case it wasn't dropped before)
DROP VIEW IF EXISTS public.current_user_teams;

-- Create the view in the private schema
CREATE OR REPLACE VIEW private.current_user_teams AS
SELECT users_on_team.user_id, users_on_team.team_id
FROM public.users_on_team
WHERE users_on_team.user_id = auth.uid();

-- Grant SELECT permission on private.current_user_teams view to authenticator role
GRANT SELECT ON private.current_user_teams TO authenticator;

-- Grant USAGE on private schema to authenticator role
GRANT USAGE ON SCHEMA private TO authenticator;

-- Grant SELECT permission on public.users table to authenticator role
GRANT SELECT ON public.users TO authenticator;

-- Grant SELECT permission on public.teams table to authenticator role
GRANT SELECT ON public.teams TO authenticator;

-- Grant USAGE on public schema to authenticator role (if not already granted)
GRANT USAGE ON SCHEMA public TO authenticator;

-- Check if the view exists in the private schema
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_views
        WHERE schemaname = 'private' AND viewname = 'current_user_teams'
    ) THEN
        -- If it doesn't exist, create it
        CREATE OR REPLACE VIEW private.current_user_teams AS
        SELECT users_on_team.user_id, users_on_team.team_id
        FROM public.users_on_team
        WHERE users_on_team.user_id = auth.uid();
    END IF;
END $$;

-- Ensure permissions are correctly set
GRANT USAGE ON SCHEMA private TO authenticator, anon, authenticated;
GRANT SELECT ON private.current_user_teams TO authenticator, anon, authenticated;

-- Double-check permissions on the underlying table
GRANT SELECT ON public.users_on_team TO authenticator, anon, authenticated;

-- Add currency_rate and currency_source column to transactions table
ALTER TABLE "public"."transactions"
    ADD COLUMN IF NOT EXISTS "currency_rate" numeric,
    ADD COLUMN IF NOT EXISTS "currency_source" "text";
   