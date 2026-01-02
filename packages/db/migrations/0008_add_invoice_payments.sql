-- Migration: Add native invoice payment support with Stripe Connect
-- Enables teams to accept invoice payments via Stripe

-- Add Stripe Connect fields to teams table
ALTER TABLE teams 
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_status TEXT;

-- Add payment enabled toggle to invoice templates
ALTER TABLE invoice_templates 
  ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN DEFAULT false;

-- Add payment intent tracking to invoices
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Add index for efficient payment intent lookups
CREATE INDEX IF NOT EXISTS invoices_payment_intent_id_idx ON invoices(payment_intent_id);

-- Add index for efficient team lookups by Stripe account ID (used by webhooks)
CREATE INDEX IF NOT EXISTS teams_stripe_account_id_idx ON teams(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

