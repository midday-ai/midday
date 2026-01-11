-- Migration: Add payment_terms_days to invoice_templates
-- Allows users to customize the default due date offset (in days) for invoices
-- Default is 30 days, matching the current behavior

ALTER TABLE invoice_templates 
  ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 30;

