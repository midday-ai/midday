-- Migration: Add Deal Fees table
-- Created: 2026-02-18
-- Purpose: Track individual fee line items (origination, processing, etc.) per MCA deal
--          Used by the disclosure calculation engine to compute finance charges and APR

-- ============================================================================
-- PART 1: Create deal_fees table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.deal_fees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Relationships
  deal_id uuid NOT NULL REFERENCES public.mca_deals(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Fee details
  fee_type text NOT NULL CHECK (fee_type IN ('origination', 'processing', 'underwriting', 'broker', 'other')),
  fee_name text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  percentage numeric(5, 4)  -- Optional: fee as percentage of funding amount
);

-- Indexes
CREATE INDEX IF NOT EXISTS deal_fees_deal_id_idx ON public.deal_fees(deal_id);
CREATE INDEX IF NOT EXISTS deal_fees_team_id_idx ON public.deal_fees(team_id);

-- Enable RLS
ALTER TABLE public.deal_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view deal fees"
  ON public.deal_fees FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert deal fees"
  ON public.deal_fees FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update deal fees"
  ON public.deal_fees FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete deal fees"
  ON public.deal_fees FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_deal_fees_updated_at
  BEFORE UPDATE ON public.deal_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
