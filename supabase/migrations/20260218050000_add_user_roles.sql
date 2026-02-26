-- Migration: Expand team roles for RBAC and add entity linking (Part 1)
-- Created: 2026-02-18
-- Purpose: Add admin, broker, syndicate, merchant roles to teamRoles enum
--          and link external users to their entity records via users_on_team
-- NOTE: enum ADD VALUE and its usage in policies must be in separate migrations
--       because Postgres cannot use new enum values in the same transaction.

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_on_team_entity_type_check'
  ) THEN
    ALTER TABLE public.users_on_team
      ADD CONSTRAINT users_on_team_entity_type_check
      CHECK (entity_type IS NULL OR entity_type IN ('broker', 'syndicator', 'merchant'));
  END IF;
END $$;

-- Index for looking up users by entity
CREATE INDEX IF NOT EXISTS idx_users_on_team_entity
  ON public.users_on_team (entity_type, entity_id)
  WHERE entity_id IS NOT NULL;
