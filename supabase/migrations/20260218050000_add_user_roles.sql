-- Migration: Expand team roles for RBAC and add entity linking
-- Created: 2026-02-18
-- Purpose: Add admin, broker, syndicate, merchant roles to teamRoles enum
--          and link external users to their entity records via users_on_team

-- ============================================================================
-- PART 1: Expand teamRoles enum
-- ============================================================================

ALTER TYPE "teamRoles" ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE "teamRoles" ADD VALUE IF NOT EXISTS 'broker';
ALTER TYPE "teamRoles" ADD VALUE IF NOT EXISTS 'syndicate';
ALTER TYPE "teamRoles" ADD VALUE IF NOT EXISTS 'merchant';

-- ============================================================================
-- PART 2: Add entity linking columns to users_on_team
-- ============================================================================

ALTER TABLE public.users_on_team
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS entity_type text;

-- Constrain entity_type to valid values
ALTER TABLE public.users_on_team
  ADD CONSTRAINT users_on_team_entity_type_check
  CHECK (entity_type IS NULL OR entity_type IN ('broker', 'syndicator', 'merchant'));

-- Index for looking up users by entity
CREATE INDEX IF NOT EXISTS idx_users_on_team_entity
  ON public.users_on_team (entity_type, entity_id)
  WHERE entity_id IS NOT NULL;

-- ============================================================================
-- PART 3: Update RLS policies for new roles
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
