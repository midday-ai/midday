-- Migration: Change synced_attachment_ids array to synced_attachment_mapping JSONB
-- This allows tracking both Midday attachment IDs and their corresponding provider attachment IDs

-- Add new column
ALTER TABLE accounting_sync_records 
  ADD COLUMN synced_attachment_mapping JSONB DEFAULT '{}'::JSONB NOT NULL;

-- Migrate existing data: convert array to JSON object with null values
-- (we don't have provider IDs for historical syncs, so they get null)
UPDATE accounting_sync_records 
SET synced_attachment_mapping = (
  SELECT COALESCE(
    jsonb_object_agg(elem, NULL),
    '{}'::JSONB
  )
  FROM unnest(synced_attachment_ids) AS elem
)
WHERE synced_attachment_ids IS NOT NULL 
  AND array_length(synced_attachment_ids, 1) > 0;

-- Drop old column
ALTER TABLE accounting_sync_records DROP COLUMN synced_attachment_ids;

