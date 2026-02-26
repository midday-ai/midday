-- Migration: Add Disclosures table
-- Created: 2026-02-18
-- Purpose: Store generated state-mandated commercial financing disclosure documents
--          Each record represents an immutable disclosure with audit trail, figures snapshot,
--          and PDF document linked to an MCA deal

-- ============================================================================
-- PART 1: Create disclosures table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.disclosures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Relationships
  deal_id uuid NOT NULL REFERENCES public.mca_deals(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- State & Template versioning
  state_code text NOT NULL,                                          -- e.g. 'NY', 'CA', 'VA'
  disclosure_type text NOT NULL DEFAULT 'mca',                       -- 'mca', 'closed_end', 'open_end', 'factoring'
  template_version text NOT NULL,                                    -- e.g. 'NY-2023-08-v1'

  -- Status lifecycle
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'superseded')),

  -- Calculated figures (immutable snapshot at generation time)
  figures jsonb NOT NULL DEFAULT '{}',

  -- Document artifact
  document_hash text,                                                -- SHA-256 of the final PDF
  file_path text[],                                                  -- Supabase vault path
  file_size integer,

  -- Audit trail
  generated_by uuid,                                                 -- user_id who triggered
  generated_at timestamp with time zone,

  -- Deal terms snapshot (frozen at generation time for reproducibility)
  deal_snapshot jsonb NOT NULL DEFAULT '{}',

  -- Merchant acknowledgment / signature
  acknowledged_at timestamp with time zone,
  acknowledged_by text,
  signature_data jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS disclosures_deal_id_idx ON public.disclosures(deal_id);
CREATE INDEX IF NOT EXISTS disclosures_team_id_idx ON public.disclosures(team_id);
CREATE INDEX IF NOT EXISTS disclosures_state_code_idx ON public.disclosures(state_code);
CREATE INDEX IF NOT EXISTS disclosures_status_idx ON public.disclosures(status);

-- Unique partial index: no two completed disclosures should have the same hash
CREATE UNIQUE INDEX IF NOT EXISTS disclosures_document_hash_unique
  ON public.disclosures(document_hash) WHERE document_hash IS NOT NULL;

-- Enable RLS
ALTER TABLE public.disclosures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view disclosures"
  ON public.disclosures FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert disclosures"
  ON public.disclosures FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update disclosures"
  ON public.disclosures FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete disclosures"
  ON public.disclosures FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_disclosures_updated_at
  BEFORE UPDATE ON public.disclosures
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
