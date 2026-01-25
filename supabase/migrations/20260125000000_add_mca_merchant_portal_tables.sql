-- Migration: Add MCA and Merchant Portal tables
-- Created: 2026-01-25
-- Purpose: Create tables for MCA deals, payments, merchant portal sessions, access control, and branding

-- ============================================================================
-- PART 1: Create mca_deals table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mca_deals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Relationships
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Deal Terms
  deal_code text NOT NULL,
  funding_amount numeric(12, 2) NOT NULL,
  factor_rate numeric(5, 4) NOT NULL,
  payback_amount numeric(12, 2) NOT NULL,
  daily_payment numeric(10, 2),
  payment_frequency text DEFAULT 'daily',

  -- Deal Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'defaulted', 'paused', 'late', 'in_collections')),
  funded_at timestamp with time zone,
  expected_payoff_date date,

  -- Balance Tracking
  current_balance numeric(12, 2) NOT NULL,
  total_paid numeric(12, 2) DEFAULT 0,
  nsf_count integer DEFAULT 0,

  -- External References (for spreadsheet sync)
  external_id text,

  -- Unique constraint per team
  CONSTRAINT mca_deals_team_deal_code_unique UNIQUE (team_id, deal_code),
  CONSTRAINT mca_deals_positive_amounts CHECK (
    funding_amount > 0 AND
    factor_rate >= 1 AND
    payback_amount > 0 AND
    current_balance >= 0
  )
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS mca_deals_customer_id_idx ON public.mca_deals(customer_id);
CREATE INDEX IF NOT EXISTS mca_deals_team_id_idx ON public.mca_deals(team_id);
CREATE INDEX IF NOT EXISTS mca_deals_status_idx ON public.mca_deals(status);
CREATE INDEX IF NOT EXISTS mca_deals_deal_code_idx ON public.mca_deals(deal_code);

-- Enable RLS
ALTER TABLE public.mca_deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mca_deals
CREATE POLICY "Team members can view MCA deals"
  ON public.mca_deals FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert MCA deals"
  ON public.mca_deals FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update MCA deals"
  ON public.mca_deals FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete MCA deals"
  ON public.mca_deals FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- PART 2: Create mca_payments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mca_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Relationships
  deal_id uuid NOT NULL REFERENCES public.mca_deals(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Payment Details
  amount numeric(10, 2) NOT NULL,
  payment_date date NOT NULL,
  payment_type text DEFAULT 'ach' CHECK (payment_type IN ('ach', 'wire', 'check', 'manual', 'other')),
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'returned', 'pending', 'failed')),
  description text,

  -- NSF Tracking
  nsf_at timestamp with time zone,
  nsf_fee numeric(10, 2),

  -- Balance Snapshot (for audit trail)
  balance_before numeric(12, 2),
  balance_after numeric(12, 2),

  -- External References
  external_id text
);

-- Indexes
CREATE INDEX IF NOT EXISTS mca_payments_deal_id_idx ON public.mca_payments(deal_id);
CREATE INDEX IF NOT EXISTS mca_payments_team_id_idx ON public.mca_payments(team_id);
CREATE INDEX IF NOT EXISTS mca_payments_payment_date_idx ON public.mca_payments(payment_date);
CREATE INDEX IF NOT EXISTS mca_payments_status_idx ON public.mca_payments(status);

-- Enable RLS
ALTER TABLE public.mca_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mca_payments
CREATE POLICY "Team members can view MCA payments"
  ON public.mca_payments FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert MCA payments"
  ON public.mca_payments FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update MCA payments"
  ON public.mca_payments FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete MCA payments"
  ON public.mca_payments FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- PART 3: Create merchant_portal_sessions table (magic link auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.merchant_portal_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Link to customer (merchants access via customer portal)
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  portal_id text NOT NULL,

  -- Email verification
  email text NOT NULL,
  verification_token text NOT NULL UNIQUE,
  verified_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL,

  -- Session tracking
  last_active_at timestamp with time zone,
  ip_address text,
  user_agent text
);

-- Indexes
CREATE INDEX IF NOT EXISTS merchant_sessions_customer_idx ON public.merchant_portal_sessions(customer_id);
CREATE INDEX IF NOT EXISTS merchant_sessions_token_idx ON public.merchant_portal_sessions(verification_token);
CREATE INDEX IF NOT EXISTS merchant_sessions_portal_idx ON public.merchant_portal_sessions(portal_id);
CREATE INDEX IF NOT EXISTS merchant_sessions_email_idx ON public.merchant_portal_sessions(email);

-- Enable RLS
ALTER TABLE public.merchant_portal_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Sessions are managed via service role (no direct user access)
-- Team members can view sessions for their customers
CREATE POLICY "Team members can view merchant sessions"
  ON public.merchant_portal_sessions FOR SELECT
  USING (
    customer_id IN (
      SELECT c.id FROM public.customers c
      WHERE c.team_id IN (
        SELECT team_id FROM public.users_on_team
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- PART 4: Create merchant_portal_invites table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.merchant_portal_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),

  -- Who is being invited
  email text NOT NULL,

  -- What they're being invited to access
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Invite details
  code text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES public.users(id),

  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  accepted_at timestamp with time zone,

  -- Unique constraint: one pending invite per email per customer
  CONSTRAINT merchant_invites_email_customer_unique UNIQUE (email, customer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS merchant_invites_code_idx ON public.merchant_portal_invites(code);
CREATE INDEX IF NOT EXISTS merchant_invites_email_idx ON public.merchant_portal_invites(email);
CREATE INDEX IF NOT EXISTS merchant_invites_customer_idx ON public.merchant_portal_invites(customer_id);
CREATE INDEX IF NOT EXISTS merchant_invites_team_idx ON public.merchant_portal_invites(team_id);
CREATE INDEX IF NOT EXISTS merchant_invites_status_idx ON public.merchant_portal_invites(status) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.merchant_portal_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Invitees can view their own invites"
  ON public.merchant_portal_invites FOR SELECT
  USING (
    LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Team members can view invites for their team"
  ON public.merchant_portal_invites FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage invites"
  ON public.merchant_portal_invites FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- PART 5: Create merchant_portal_access table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.merchant_portal_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Who has access
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- What they can access
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),

  -- Revocation tracking
  revoked_at timestamp with time zone,
  revoked_by uuid REFERENCES public.users(id),
  revoked_reason text,

  -- Unique constraint: one access record per user per customer
  CONSTRAINT merchant_access_user_customer_unique UNIQUE (user_id, customer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS merchant_access_user_idx ON public.merchant_portal_access(user_id);
CREATE INDEX IF NOT EXISTS merchant_access_customer_idx ON public.merchant_portal_access(customer_id);
CREATE INDEX IF NOT EXISTS merchant_access_team_idx ON public.merchant_portal_access(team_id);
CREATE INDEX IF NOT EXISTS merchant_access_status_idx ON public.merchant_portal_access(status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.merchant_portal_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own access records"
  ON public.merchant_portal_access FOR SELECT
  USING (user_id = auth.uid() AND status = 'active');

CREATE POLICY "Team owners can manage access"
  ON public.merchant_portal_access FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Team members can view access for their team"
  ON public.merchant_portal_access FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 6: Create payoff_letter_requests table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payoff_letter_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Relationships
  deal_id uuid NOT NULL REFERENCES public.mca_deals(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Request details
  requested_payoff_date date NOT NULL,
  requested_by_email text NOT NULL,

  -- Calculated amounts
  balance_at_request numeric(12, 2) NOT NULL,
  payoff_amount numeric(12, 2) NOT NULL,

  -- Status workflow
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'expired', 'rejected')),
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES public.users(id),
  sent_at timestamp with time zone,

  -- Generated document
  document_path text,
  expires_at date
);

-- Indexes
CREATE INDEX IF NOT EXISTS payoff_requests_deal_idx ON public.payoff_letter_requests(deal_id);
CREATE INDEX IF NOT EXISTS payoff_requests_customer_idx ON public.payoff_letter_requests(customer_id);
CREATE INDEX IF NOT EXISTS payoff_requests_team_idx ON public.payoff_letter_requests(team_id);
CREATE INDEX IF NOT EXISTS payoff_requests_status_idx ON public.payoff_letter_requests(status);

-- Enable RLS
ALTER TABLE public.payoff_letter_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view payoff requests"
  ON public.payoff_letter_requests FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create payoff requests"
  ON public.payoff_letter_requests FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage payoff requests"
  ON public.payoff_letter_requests FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM public.users_on_team
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- PART 7: Add branding column to teams table
-- ============================================================================

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS branding jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.teams.branding IS 'Team branding configuration: {
  displayName: string,
  primaryColor: string (hex),
  secondaryColor: string (hex),
  emailFromName: string,
  pdfFooterText: string
}';

-- ============================================================================
-- PART 8: Update timestamp trigger for mca_deals
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_mca_deal_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER mca_deals_updated_at
  BEFORE UPDATE ON public.mca_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_mca_deal_updated_at();

-- ============================================================================
-- PART 9: Function to recalculate deal balance from payments
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_deal_balance(p_deal_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_payback_amount numeric(12, 2);
  v_total_paid numeric(12, 2);
  v_nsf_fees numeric(12, 2);
  v_nsf_count integer;
BEGIN
  -- Get deal payback amount
  SELECT payback_amount INTO v_payback_amount
  FROM public.mca_deals
  WHERE id = p_deal_id;

  -- Sum completed payments
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.mca_payments
  WHERE deal_id = p_deal_id AND status = 'completed';

  -- Sum NSF fees and count
  SELECT COALESCE(SUM(nsf_fee), 0), COUNT(*)
  INTO v_nsf_fees, v_nsf_count
  FROM public.mca_payments
  WHERE deal_id = p_deal_id AND status = 'returned';

  -- Update deal
  UPDATE public.mca_deals
  SET
    total_paid = v_total_paid,
    current_balance = v_payback_amount - v_total_paid + v_nsf_fees,
    nsf_count = v_nsf_count,
    updated_at = now()
  WHERE id = p_deal_id;
END;
$$;
