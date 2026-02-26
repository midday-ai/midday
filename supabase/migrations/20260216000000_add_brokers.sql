-- Migration: Add Brokers and Broker Commissions tables
-- Created: 2026-02-16
-- Purpose: Create tables for broker (ISO) management, commission tracking, and broker portal access

-- ============================================================================
-- PART 1: Create brokers table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brokers (
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

  -- Default commission rate for this broker
  commission_percentage numeric(5, 2),

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
CREATE INDEX IF NOT EXISTS brokers_team_id_idx ON public.brokers(team_id);
CREATE INDEX IF NOT EXISTS brokers_portal_id_idx ON public.brokers(portal_id) WHERE portal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS brokers_status_idx ON public.brokers(status);

-- Enable RLS
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view brokers"
  ON public.brokers FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert brokers"
  ON public.brokers FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update brokers"
  ON public.brokers FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete brokers"
  ON public.brokers FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Updated_at trigger (use a simple function instead of extensions.moddatetime
-- which may not be available in all environments)
CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_brokers_updated_at
  BEFORE UPDATE ON public.brokers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- PART 2: Add broker_id to mca_deals
-- ============================================================================

ALTER TABLE public.mca_deals
  ADD COLUMN IF NOT EXISTS broker_id uuid REFERENCES public.brokers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS mca_deals_broker_id_idx ON public.mca_deals(broker_id);

-- ============================================================================
-- PART 3: Create broker_commissions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.broker_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Relationships
  deal_id uuid NOT NULL REFERENCES public.mca_deals(id) ON DELETE CASCADE,
  broker_id uuid NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Commission details
  commission_percentage numeric(5, 2) NOT NULL,
  commission_amount numeric(12, 2) NOT NULL,

  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at timestamp with time zone,

  -- Notes
  note text,

  -- One commission per broker per deal
  CONSTRAINT broker_commissions_deal_broker_unique UNIQUE (deal_id, broker_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS broker_commissions_deal_id_idx ON public.broker_commissions(deal_id);
CREATE INDEX IF NOT EXISTS broker_commissions_broker_id_idx ON public.broker_commissions(broker_id);
CREATE INDEX IF NOT EXISTS broker_commissions_team_id_idx ON public.broker_commissions(team_id);
CREATE INDEX IF NOT EXISTS broker_commissions_status_idx ON public.broker_commissions(status);

-- Enable RLS
ALTER TABLE public.broker_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view broker commissions"
  ON public.broker_commissions FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert broker commissions"
  ON public.broker_commissions FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update broker commissions"
  ON public.broker_commissions FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete broker commissions"
  ON public.broker_commissions FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
