-- Migration: Add customer portal support
-- Adds portal_enabled and portal_id columns to customers table
-- portal_id is a short nanoid(8) used for public portal URLs

ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_id TEXT;

-- Index for efficient portal lookups by portal_id
CREATE UNIQUE INDEX IF NOT EXISTS customers_portal_id_idx 
  ON customers(portal_id) 
  WHERE portal_id IS NOT NULL;

