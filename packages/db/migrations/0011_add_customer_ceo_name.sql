-- Add CEO/founder name field to customers table
-- This field stores the name of the CEO, founder, or primary executive

ALTER TABLE customers ADD COLUMN IF NOT EXISTS ceo_name TEXT;

