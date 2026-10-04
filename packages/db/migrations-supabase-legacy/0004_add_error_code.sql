-- Migration: Add error_code column to accounting_sync_records
-- This allows structured error handling with standardized codes for frontend display

ALTER TABLE accounting_sync_records 
  ADD COLUMN error_code TEXT;

-- Add comment for documentation
COMMENT ON COLUMN accounting_sync_records.error_code IS 'Standardized error code for frontend handling (e.g., ATTACHMENT_UNSUPPORTED_TYPE, AUTH_EXPIRED)';

