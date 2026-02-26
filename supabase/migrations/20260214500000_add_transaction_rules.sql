-- Transaction rules table for auto-categorization, merchant renaming, tag assignment, etc.
CREATE TABLE IF NOT EXISTS public.transaction_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,

  -- Criteria (all optional, AND logic when multiple are set)
  merchant_match TEXT,
  merchant_match_type TEXT NOT NULL DEFAULT 'contains' CHECK (merchant_match_type IN ('contains', 'exact', 'starts_with')),
  amount_operator TEXT CHECK (amount_operator IN ('eq', 'gt', 'lt', 'between')),
  amount_value NUMERIC(10, 2),
  amount_value_max NUMERIC(10, 2),
  account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,

  -- Actions (all optional, at least one should be set)
  set_category_slug TEXT,
  set_merchant_name TEXT,
  add_tag_ids UUID[] DEFAULT '{}',
  set_excluded BOOLEAN,
  set_assigned_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient rule lookups per team
CREATE INDEX idx_transaction_rules_team_id ON public.transaction_rules(team_id);
CREATE INDEX idx_transaction_rules_enabled ON public.transaction_rules(team_id, enabled) WHERE enabled = true;

-- RLS policies
ALTER TABLE public.transaction_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transaction rules can be selected by team members"
  ON public.transaction_rules FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Transaction rules can be inserted by team members"
  ON public.transaction_rules FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Transaction rules can be updated by team members"
  ON public.transaction_rules FOR UPDATE
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Transaction rules can be deleted by team members"
  ON public.transaction_rules FOR DELETE
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));
