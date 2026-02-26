-- Migration: Add Syndicator Transactions table
-- Created: 2026-02-27
-- Purpose: Per-syndicator capital flow ledger for contributions, withdrawals,
--          profit distributions, refunds, fees, chargebacks, transfers, and deal allocations

-- ============================================================================
-- PART 1: Create enums
-- ============================================================================

-- Transaction type: WHAT happened
CREATE TYPE syndicator_transaction_type AS ENUM (
  'contribution',
  'withdrawal',
  'profit_distribution',
  'refund',
  'fee',
  'chargeback',
  'transfer',
  'deal_allocation'
);

-- Payment method: HOW the capital was moved
CREATE TYPE syndicator_payment_method AS ENUM (
  'ach',
  'wire',
  'check',
  'zelle',
  'other'
);

-- ============================================================================
-- PART 2: Create syndicator_transactions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.syndicator_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  date date NOT NULL,

  -- Team relationship (multi-tenant isolation)
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Syndicator whose ledger this entry belongs to
  syndicator_id uuid NOT NULL REFERENCES public.syndicators(id) ON DELETE CASCADE,

  -- Transaction classification
  transaction_type syndicator_transaction_type NOT NULL,
  method syndicator_payment_method,

  -- Amount (always positive; transaction_type determines direction)
  amount numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',

  -- Description & notes
  description text,
  note text,

  -- Optional deal link (null = unallocated capital)
  deal_id uuid REFERENCES public.mca_deals(id) ON DELETE SET NULL,
  participation_id uuid REFERENCES public.syndication_participants(id) ON DELETE SET NULL,

  -- For transfers between syndicators (buyout scenarios)
  counterparty_syndicator_id uuid REFERENCES public.syndicators(id) ON DELETE SET NULL,

  -- Status tracking
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),

  -- Balance snapshot (audit trail, same pattern as mca_payments)
  balance_before numeric(12, 2),
  balance_after numeric(12, 2),

  -- Bridge to bank transaction (when a bank event corresponds to this ledger entry)
  linked_transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,

  -- External reference number
  reference text,

  -- Who created this entry
  created_by uuid REFERENCES auth.users(id),

  -- Flexible metadata
  metadata jsonb DEFAULT '{}'
);

-- ============================================================================
-- PART 3: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS syndicator_transactions_team_id_idx
  ON public.syndicator_transactions(team_id);

CREATE INDEX IF NOT EXISTS syndicator_transactions_syndicator_id_idx
  ON public.syndicator_transactions(syndicator_id);

CREATE INDEX IF NOT EXISTS syndicator_transactions_deal_id_idx
  ON public.syndicator_transactions(deal_id) WHERE deal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS syndicator_transactions_date_idx
  ON public.syndicator_transactions(date);

CREATE INDEX IF NOT EXISTS syndicator_transactions_type_idx
  ON public.syndicator_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS syndicator_transactions_status_idx
  ON public.syndicator_transactions(status);

-- ============================================================================
-- PART 4: Row Level Security
-- ============================================================================

ALTER TABLE public.syndicator_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view syndicator transactions"
  ON public.syndicator_transactions FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert syndicator transactions"
  ON public.syndicator_transactions FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update syndicator transactions"
  ON public.syndicator_transactions FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete syndicator transactions"
  ON public.syndicator_transactions FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
