-- Migration: Fix stuck pending documents
-- This migration fixes documents that are stuck in "pending" status due to previous pipeline issues

-- 1. Fix documents that have been processed (have title or content) but status was never updated
-- These are documents where classification succeeded but status wasn't set to completed
UPDATE documents 
SET 
  processing_status = 'completed',
  updated_at = NOW()
WHERE 
  processing_status = 'pending' 
  AND (title IS NOT NULL OR content IS NOT NULL);

-- 2. Mark truly stale documents as failed
-- Documents that have been pending for more than 1 hour with no content are likely stuck
-- These can be retried by users using the new reprocess functionality
UPDATE documents 
SET 
  processing_status = 'failed',
  updated_at = NOW()
WHERE 
  processing_status = 'pending' 
  AND created_at < NOW() - INTERVAL '1 hour'
  AND title IS NULL 
  AND content IS NULL;
