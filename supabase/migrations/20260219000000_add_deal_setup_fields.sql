-- Add contract date and legal term columns to mca_deals
ALTER TABLE mca_deals ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE mca_deals ADD COLUMN IF NOT EXISTS maturity_date date;
ALTER TABLE mca_deals ADD COLUMN IF NOT EXISTS first_payment_date date;
ALTER TABLE mca_deals ADD COLUMN IF NOT EXISTS holdback_percentage numeric(5,2);
ALTER TABLE mca_deals ADD COLUMN IF NOT EXISTS ucc_filing_status text;
ALTER TABLE mca_deals ADD COLUMN IF NOT EXISTS personal_guarantee boolean DEFAULT false;
ALTER TABLE mca_deals ADD COLUMN IF NOT EXISTS default_terms text;
ALTER TABLE mca_deals ADD COLUMN IF NOT EXISTS cure_period_days integer;

-- Create deal_bank_accounts table for merchant bank details per deal
CREATE TABLE IF NOT EXISTS deal_bank_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  deal_id uuid NOT NULL REFERENCES mca_deals(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  routing_number text NOT NULL,
  account_number text NOT NULL,
  account_type text DEFAULT 'checking',
  linked_bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  is_primary boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS deal_bank_accounts_deal_id_idx ON deal_bank_accounts(deal_id);
CREATE INDEX IF NOT EXISTS deal_bank_accounts_team_id_idx ON deal_bank_accounts(team_id);

-- RLS (conditional — private schema only exists on cloud)
ALTER TABLE deal_bank_accounts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can manage deal bank accounts" ON deal_bank_accounts
      FOR ALL TO public
      USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy — private schema not found (local dev)';
  END IF;
END $$;
