-- Migration: Add support for multiple invoice templates per team
-- Adds name and is_default columns to invoice_templates
-- Removes unique constraint on team_id to allow multiple templates per team

-- Add new columns
ALTER TABLE invoice_templates 
  ADD COLUMN name TEXT NOT NULL DEFAULT 'Default',
  ADD COLUMN is_default BOOLEAN DEFAULT false;

-- Drop the unique constraint on team_id to allow multiple templates
ALTER TABLE invoice_templates DROP CONSTRAINT IF EXISTS invoice_templates_team_id_key; // inte kört än

-- Add index for efficient team lookups
CREATE INDEX IF NOT EXISTS idx_invoice_templates_team_id ON invoice_templates(team_id);
-- Set existing templates as default for their respective teams
UPDATE invoice_templates SET is_default = true;

