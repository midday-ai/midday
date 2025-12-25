-- Migration: Add e-invoicing (Peppol) support fields
-- Enables sending and tracking of Peppol e-invoices

-- Create enum for e-invoice status
CREATE TYPE einvoice_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- Add Peppol fields to teams table
ALTER TABLE teams
  ADD COLUMN peppol_id TEXT,
  ADD COLUMN einvoicing_enabled BOOLEAN DEFAULT false,
  ADD COLUMN einvoicing_settings JSONB;

COMMENT ON COLUMN teams.peppol_id IS 'Company Peppol participant ID (e.g., 0007:5567890123 for Swedish org number)';
COMMENT ON COLUMN teams.einvoicing_enabled IS 'Whether e-invoicing is enabled for this team';
COMMENT ON COLUMN teams.einvoicing_settings IS 'E-invoicing provider configuration (API keys, legal entity ID, etc.)';

-- Add Peppol ID to customers table
ALTER TABLE customers
  ADD COLUMN peppol_id TEXT;

COMMENT ON COLUMN customers.peppol_id IS 'Customer Peppol participant ID for receiving e-invoices';

-- Add e-invoice tracking fields to invoices table
ALTER TABLE invoices
  ADD COLUMN einvoice_status einvoice_status,
  ADD COLUMN einvoice_document_id TEXT,
  ADD COLUMN einvoice_sent_at TIMESTAMPTZ,
  ADD COLUMN einvoice_delivered_at TIMESTAMPTZ,
  ADD COLUMN einvoice_error TEXT;

COMMENT ON COLUMN invoices.einvoice_status IS 'E-invoice delivery status (pending, sent, delivered, failed)';
COMMENT ON COLUMN invoices.einvoice_document_id IS 'Provider document ID for tracking (e.g., Storecove GUID)';
COMMENT ON COLUMN invoices.einvoice_sent_at IS 'When the e-invoice was sent to the provider';
COMMENT ON COLUMN invoices.einvoice_delivered_at IS 'When the e-invoice was confirmed delivered';
COMMENT ON COLUMN invoices.einvoice_error IS 'Error message if e-invoice delivery failed';

-- Index for querying e-invoices by status (useful for retry logic)
CREATE INDEX invoices_einvoice_status_idx ON invoices (einvoice_status) WHERE einvoice_status IS NOT NULL;

