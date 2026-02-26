-- Reconciliation & Bookkeeper Surface
-- Adds auto-matching columns to transactions, reconciliation sessions,
-- ACH batch tables, export templates, and the bookkeeper role.

-- ============================================
-- 1. New Enums
-- ============================================

CREATE TYPE match_status AS ENUM (
  'unmatched',
  'auto_matched',
  'suggested',
  'manual_matched',
  'flagged',
  'excluded'
);

CREATE TYPE ach_batch_status AS ENUM (
  'draft',
  'validated',
  'submitted',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE discrepancy_type AS ENUM (
  'nsf',
  'partial_payment',
  'overpayment',
  'unrecognized',
  'bank_fee',
  'duplicate',
  'split_payment'
);

-- ============================================
-- 2. Extend transactions table with match columns
-- ============================================

ALTER TABLE transactions
  ADD COLUMN match_status match_status DEFAULT 'unmatched',
  ADD COLUMN match_confidence numeric(5,2),
  ADD COLUMN matched_payment_id uuid REFERENCES mca_payments(id) ON DELETE SET NULL,
  ADD COLUMN matched_deal_id uuid REFERENCES mca_deals(id) ON DELETE SET NULL,
  ADD COLUMN matched_at timestamptz,
  ADD COLUMN matched_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN match_rule text,
  ADD COLUMN match_suggestions jsonb,
  ADD COLUMN reconciliation_note text,
  ADD COLUMN discrepancy_type discrepancy_type;

CREATE INDEX idx_transactions_match_status ON transactions(match_status);
CREATE INDEX idx_transactions_matched_payment ON transactions(matched_payment_id);
CREATE INDEX idx_transactions_matched_deal ON transactions(matched_deal_id);
CREATE INDEX idx_transactions_match_status_team
  ON transactions(team_id, match_status)
  WHERE match_status IS NOT NULL;

-- ============================================
-- 3. Reconciliation Sessions
-- ============================================

CREATE TABLE reconciliation_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  date_from date NOT NULL,
  date_to date NOT NULL,
  total_transactions int DEFAULT 0,
  auto_matched int DEFAULT 0,
  manually_matched int DEFAULT 0,
  flagged int DEFAULT 0,
  unmatched int DEFAULT 0,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE INDEX idx_recon_sessions_team ON reconciliation_sessions(team_id);
CREATE INDEX idx_recon_sessions_user ON reconciliation_sessions(user_id);

ALTER TABLE reconciliation_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can manage reconciliation sessions" ON reconciliation_sessions FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy for reconciliation_sessions — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================
-- 4. ACH Batches
-- ============================================

CREATE TABLE ach_batches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  batch_number text NOT NULL,
  effective_date date NOT NULL,
  description text,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  item_count int NOT NULL DEFAULT 0,
  originator_bank_account_id uuid REFERENCES bank_accounts(id),
  originator_name text,
  originator_routing text,
  originator_account text,
  status ach_batch_status DEFAULT 'draft',
  submitted_at timestamptz,
  completed_at timestamptz,
  nacha_file_path text,
  validation_errors jsonb DEFAULT '[]',
  UNIQUE(team_id, batch_number)
);

CREATE INDEX idx_ach_batches_team ON ach_batches(team_id);
CREATE INDEX idx_ach_batches_status ON ach_batches(team_id, status);

ALTER TABLE ach_batches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can manage ACH batches" ON ach_batches FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy for ach_batches — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================
-- 5. ACH Batch Items
-- ============================================

CREATE TABLE ach_batch_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES ach_batches(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES mca_deals(id),
  mca_payment_id uuid REFERENCES mca_payments(id),
  receiver_name text NOT NULL,
  receiver_routing text NOT NULL,
  receiver_account text NOT NULL,
  amount numeric(10,2) NOT NULL,
  transaction_code text NOT NULL DEFAULT '27',
  individual_id text,
  addenda text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'returned', 'rejected'))
);

CREATE INDEX idx_ach_batch_items_batch ON ach_batch_items(batch_id);
CREATE INDEX idx_ach_batch_items_deal ON ach_batch_items(deal_id);

ALTER TABLE ach_batch_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can manage ACH batch items" ON ach_batch_items FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy for ach_batch_items — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================
-- 6. Export Templates
-- ============================================

CREATE TABLE export_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  format text NOT NULL CHECK (format IN ('csv', 'xlsx', 'pdf', 'quickbooks_iif', 'xero_csv')),
  columns jsonb NOT NULL DEFAULT '[]',
  filters jsonb DEFAULT '{}',
  date_range text,
  schedule_enabled boolean DEFAULT false,
  schedule_cron text,
  schedule_email text,
  last_exported_at timestamptz
);

CREATE INDEX idx_export_templates_team ON export_templates(team_id);

ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can manage export templates" ON export_templates FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy for export_templates — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================
-- 7. Add bookkeeper role
-- ============================================

ALTER TYPE "teamRoles" ADD VALUE IF NOT EXISTS 'bookkeeper';

-- ============================================
-- 8. Match audit log for compliance tracking
-- ============================================

CREATE TABLE match_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('auto_match', 'suggest', 'confirm', 'reject', 'manual_match', 'flag', 'resolve', 'override')),
  deal_id uuid REFERENCES mca_deals(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES mca_payments(id) ON DELETE SET NULL,
  confidence numeric(5,2),
  rule text,
  previous_status match_status,
  new_status match_status,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX idx_match_audit_team ON match_audit_log(team_id);
CREATE INDEX idx_match_audit_transaction ON match_audit_log(transaction_id);

ALTER TABLE match_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can view match audit log" ON match_audit_log FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy for match_audit_log — private schema not found (local dev)';
  END IF;
END $$;
