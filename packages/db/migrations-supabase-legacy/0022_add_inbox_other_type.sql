-- Add "other" value to inbox_status enum
-- This allows documents that are not invoices/receipts (contracts, newsletters, etc.) to be classified
ALTER TYPE inbox_status ADD VALUE IF NOT EXISTS 'other';

-- Add "other" value to inbox_type enum
-- This allows classifying documents as: invoice, expense (receipt), or other
ALTER TYPE inbox_type ADD VALUE IF NOT EXISTS 'other';
