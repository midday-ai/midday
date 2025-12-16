-- Add accounting provider enum
CREATE TYPE accounting_provider AS ENUM (
  'xero',
  'quickbooks',
  'fortnox',
  'visma'
);

-- Add accounting sync status enum
CREATE TYPE accounting_sync_status AS ENUM (
  'synced',
  'failed',
  'pending'
);

-- Add accounting sync type enum
CREATE TYPE accounting_sync_type AS ENUM (
  'auto',
  'manual'
);

-- Provider-agnostic sync tracking (supports Xero, QuickBooks, Fortnox, etc.)
CREATE TABLE accounting_sync_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  provider accounting_provider NOT NULL,
  provider_tenant_id TEXT NOT NULL,  -- Xero tenant ID, QuickBooks realm ID, etc.
  provider_transaction_id TEXT,       -- External transaction ID
  synced_attachment_ids TEXT[] DEFAULT '{}'::TEXT[] NOT NULL, -- Tracks Midday attachment IDs that have been synced
  synced_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  sync_type accounting_sync_type,
  status accounting_sync_status DEFAULT 'synced' NOT NULL,
  error_message TEXT,
  UNIQUE(transaction_id, provider)    -- One sync record per transaction per provider
);

-- Indexes for efficient querying
CREATE INDEX idx_accounting_sync_transaction ON accounting_sync_records(transaction_id);
CREATE INDEX idx_accounting_sync_team_provider ON accounting_sync_records(team_id, provider);
CREATE INDEX idx_accounting_sync_status ON accounting_sync_records(team_id, status);

-- Enable RLS
ALTER TABLE accounting_sync_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view their sync records" ON accounting_sync_records
  FOR SELECT TO public
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can insert sync records" ON accounting_sync_records
  FOR INSERT TO public
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can update sync records" ON accounting_sync_records
  FOR UPDATE TO public
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

