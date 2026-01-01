-- Migration: Add support for multiple invoice templates per team (Phase 1)
-- Adds name and is_default columns to invoice_templates
-- 
-- This migration is BACKWARDS COMPATIBLE with old code.
-- Safe to run before deploying new code.

-- Add new columns (old code ignores these)
ALTER TABLE invoice_templates 
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Default',
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Set existing templates as default for their respective teams
UPDATE invoice_templates SET is_default = true WHERE is_default IS NULL OR is_default = false;

-- Add index for efficient team lookups
CREATE INDEX IF NOT EXISTS idx_invoice_templates_team_id ON invoice_templates(team_id);
