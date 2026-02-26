-- Migration: Add Late Fee Settings and ACH Providers tables
-- Created: 2026-02-26
-- Purpose: Team-level late fee configuration and ACH origination provider management

-- ============================================================================
-- PART 1: Create late_fee_settings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.late_fee_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Team relationship (multi-tenant isolation)
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- NSF fee charged per returned payment
  fee_per_nsf numeric(10, 2) NOT NULL DEFAULT 35.00,

  -- Daily late fee as a flat dollar amount
  daily_late_fee numeric(10, 2) NOT NULL DEFAULT 0.00,

  -- Grace period before late fees begin (business days)
  grace_period_days integer NOT NULL DEFAULT 3,

  -- Whether late fees compound
  compound_fees boolean NOT NULL DEFAULT false,

  -- Maximum cumulative late fee cap (NULL = no cap)
  max_late_fee numeric(10, 2),

  -- One config row per team
  CONSTRAINT late_fee_settings_team_unique UNIQUE (team_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS late_fee_settings_team_id_idx ON public.late_fee_settings(team_id);

-- Enable RLS
ALTER TABLE public.late_fee_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view late fee settings"
  ON public.late_fee_settings FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert late fee settings"
  ON public.late_fee_settings FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update late fee settings"
  ON public.late_fee_settings FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete late fee settings"
  ON public.late_fee_settings FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_late_fee_settings_updated_at
  BEFORE UPDATE ON public.late_fee_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- PART 2: Create ach_providers table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ach_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Team relationship (multi-tenant isolation)
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Provider identity
  provider_name text NOT NULL,
  provider_type text NOT NULL DEFAULT 'direct'
    CHECK (provider_type IN ('direct', 'third_party', 'bank')),

  -- Bank routing info for origination
  originator_name text NOT NULL,
  routing_number text NOT NULL,
  account_number_masked text NOT NULL,  -- last 4 only (****1234)

  -- API credentials reference (env var name or vault ref, never actual secrets)
  api_key_ref text,

  -- Status
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'sandbox')),

  -- Whether this is the default provider for this team
  is_primary boolean NOT NULL DEFAULT false,

  -- Notes
  note text,

  -- One provider name per team
  CONSTRAINT ach_providers_team_name_unique UNIQUE (team_id, provider_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS ach_providers_team_id_idx ON public.ach_providers(team_id);
CREATE INDEX IF NOT EXISTS ach_providers_status_idx ON public.ach_providers(status);

-- Enable RLS
ALTER TABLE public.ach_providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view ACH providers"
  ON public.ach_providers FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert ACH providers"
  ON public.ach_providers FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update ACH providers"
  ON public.ach_providers FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete ACH providers"
  ON public.ach_providers FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_ach_providers_updated_at
  BEFORE UPDATE ON public.ach_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
