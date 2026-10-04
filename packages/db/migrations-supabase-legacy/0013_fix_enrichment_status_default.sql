-- Fix enrichment_status for customers without websites
-- These customers should not have a "pending" status since enrichment requires a website

-- Remove the default from enrichment_status column
ALTER TABLE customers ALTER COLUMN enrichment_status DROP DEFAULT;

-- Reset enrichment_status to null for customers without websites
-- These were incorrectly set to "pending" by the old default
UPDATE customers 
SET enrichment_status = NULL 
WHERE website IS NULL 
  AND enrichment_status = 'pending';

-- Also reset customers that have been "pending" for more than 24 hours
-- These likely had a failed job trigger and are stuck
UPDATE customers 
SET enrichment_status = NULL 
WHERE enrichment_status = 'pending' 
  AND enriched_at IS NULL
  AND created_at < NOW() - INTERVAL '24 hours';

