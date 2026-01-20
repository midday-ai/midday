-- Migration: Add users_on_team table and auth user sync trigger
-- Created: 2026-01-19
-- Purpose: Fix authentication flow by creating the missing users_on_team table
--          and adding a trigger to sync auth.users to public.users

-- ============================================================================
-- PART 1: Create users_on_team table for team memberships
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users_on_team (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid NOT NULL,
  role "teamRoles" NOT NULL DEFAULT 'owner'::"teamRoles",
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_on_team_pkey PRIMARY KEY (id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS users_on_team_team_id_idx ON public.users_on_team USING btree (team_id);
CREATE INDEX IF NOT EXISTS users_on_team_user_id_idx ON public.users_on_team USING btree (user_id);

-- Add foreign key constraints
ALTER TABLE public.users_on_team
  ADD CONSTRAINT users_on_team_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.users_on_team
  ADD CONSTRAINT users_on_team_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.users_on_team ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: RLS Policies for users_on_team
-- ============================================================================

-- Policy: Users can view their own team memberships
CREATE POLICY "Users can view their own team memberships"
  ON public.users_on_team FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert team memberships (for creating teams)
CREATE POLICY "Users can insert team memberships"
  ON public.users_on_team FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Team owners can manage all memberships in their team
CREATE POLICY "Team owners can manage memberships"
  ON public.users_on_team FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users_on_team uot
      WHERE uot.team_id = users_on_team.team_id
      AND uot.user_id = auth.uid()
      AND uot.role = 'owner'
    )
  );

-- ============================================================================
-- PART 3: Auth user sync trigger
-- ============================================================================

-- Function to handle new user creation from auth.users
-- This ensures public.users records are automatically created when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users INSERT
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 4: RLS Policies for teams table
-- ============================================================================
-- The teams table has RLS enabled but needs policies for users to access their teams

-- Policy: Users can view teams they belong to
CREATE POLICY "Users can view their teams"
  ON public.teams FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update teams they own
CREATE POLICY "Team owners can update their teams"
  ON public.teams FOR UPDATE
  USING (
    id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Policy: Authenticated users can create teams
CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
