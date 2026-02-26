-- Migration: RLS policies for expanded team roles (Part 2)
-- Created: 2026-02-18
-- Purpose: Use the 'admin' enum value added in the previous migration
-- NOTE: This must be a separate migration because Postgres cannot use
--       new enum values in the same transaction where they were added.

-- ============================================================================
-- Update RLS policies for new roles
-- ============================================================================

-- Update: Allow admins (in addition to owners) to manage team memberships
DROP POLICY IF EXISTS "Team owners can manage memberships" ON public.users_on_team;

CREATE POLICY "Owners and admins can manage memberships"
  ON public.users_on_team FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users_on_team uot
      WHERE uot.team_id = users_on_team.team_id
      AND uot.user_id = auth.uid()
      AND uot.role IN ('owner', 'admin')
    )
  );

-- Update: Allow admins (in addition to owners) to update team settings
DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;

CREATE POLICY "Owners and admins can update their teams"
  ON public.teams FOR UPDATE
  USING (
    id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
