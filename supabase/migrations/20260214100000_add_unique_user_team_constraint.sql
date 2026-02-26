-- Migration: Add unique constraint on users_on_team (user_id, team_id)
-- Purpose: Prevent duplicate team memberships that cause duplicate-key React errors
--          in TeamDropdown component

-- Step 1: Remove duplicate rows, keeping the earliest one per (user_id, team_id)
DELETE FROM public.users_on_team
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, team_id) id
  FROM public.users_on_team
  ORDER BY user_id, team_id, created_at ASC
);

-- Step 2: Add unique constraint
ALTER TABLE public.users_on_team
  ADD CONSTRAINT users_on_team_user_id_team_id_key UNIQUE (user_id, team_id);
