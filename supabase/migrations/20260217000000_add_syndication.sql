-- Migration: Add Syndicators and Syndication Participants tables
-- Created: 2026-02-17
-- Purpose: Create tables for syndication (co-funding) management, participation tracking, and syndicator portal access

-- ============================================================================
-- PART 1: Create syndicators table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.syndicators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Team relationship (multi-tenant isolation)
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Basic info
  name text NOT NULL,
  email text,
  phone text,
  company_name text,
  website text,

  -- Address
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  zip text,
  country text,

  -- Portal access
  portal_enabled boolean DEFAULT false,
  portal_id text UNIQUE,

  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  -- Notes & external sync
  note text,
  external_id text
);

-- Indexes
CREATE INDEX IF NOT EXISTS syndicators_team_id_idx ON public.syndicators(team_id);
CREATE INDEX IF NOT EXISTS syndicators_portal_id_idx ON public.syndicators(portal_id) WHERE portal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS syndicators_status_idx ON public.syndicators(status);

-- Enable RLS
ALTER TABLE public.syndicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view syndicators"
  ON public.syndicators FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert syndicators"
  ON public.syndicators FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update syndicators"
  ON public.syndicators FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete syndicators"
  ON public.syndicators FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Updated_at trigger (reuse existing function)
CREATE TRIGGER set_syndicators_updated_at
  BEFORE UPDATE ON public.syndicators
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- PART 2: Create syndication_participants junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.syndication_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Relationships
  deal_id uuid NOT NULL REFERENCES public.mca_deals(id) ON DELETE CASCADE,
  syndicator_id uuid NOT NULL REFERENCES public.syndicators(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Syndication details
  funding_share numeric(12, 2) NOT NULL,
  ownership_percentage numeric(5, 4) NOT NULL,

  -- Status tracking
  status text DEFAULT 'active' CHECK (status IN ('active', 'bought_out', 'defaulted')),

  -- Notes
  note text,

  -- One participation per syndicator per deal
  CONSTRAINT syndication_participants_deal_syndicator_unique UNIQUE (deal_id, syndicator_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS syndication_participants_deal_id_idx ON public.syndication_participants(deal_id);
CREATE INDEX IF NOT EXISTS syndication_participants_syndicator_id_idx ON public.syndication_participants(syndicator_id);
CREATE INDEX IF NOT EXISTS syndication_participants_team_id_idx ON public.syndication_participants(team_id);
CREATE INDEX IF NOT EXISTS syndication_participants_status_idx ON public.syndication_participants(status);

-- Enable RLS
ALTER TABLE public.syndication_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view syndication participants"
  ON public.syndication_participants FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert syndication participants"
  ON public.syndication_participants FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update syndication participants"
  ON public.syndication_participants FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete syndication participants"
  ON public.syndication_participants FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
