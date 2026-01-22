-- Migration: Add invoice attachments support
-- Creates invoice_attachments table for storing PDF attachments on invoices
-- Max 5 attachments per invoice, PDF only

CREATE TABLE IF NOT EXISTS invoice_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  invoice_id UUID NOT NULL,
  team_id UUID NOT NULL,
  name TEXT NOT NULL,
  path TEXT[] NOT NULL,
  size BIGINT,
  CONSTRAINT invoice_attachments_invoice_id_fkey 
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT invoice_attachments_team_id_fkey 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS invoice_attachments_invoice_id_idx 
  ON invoice_attachments(invoice_id);
CREATE INDEX IF NOT EXISTS invoice_attachments_team_id_idx 
  ON invoice_attachments(team_id);

-- RLS Policies
ALTER TABLE invoice_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoice attachments can be created by a member of the team"
  ON invoice_attachments
  FOR INSERT
  TO public
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Invoice attachments can be deleted by a member of the team"
  ON invoice_attachments
  FOR DELETE
  TO public
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Invoice attachments can be selected by a member of the team"
  ON invoice_attachments
  FOR SELECT
  TO public
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
