-- Migration: Add upcoming notification tracking for recurring invoices
-- Tracks when the 24-hour upcoming notification was sent to avoid duplicates

-- Add column to track when upcoming notification was sent
ALTER TABLE invoice_recurring 
  ADD COLUMN IF NOT EXISTS upcoming_notification_sent_at TIMESTAMPTZ;

-- Index for efficient querying of upcoming invoices that need notification
-- Used by the scheduler to find series due within 24 hours that haven't been notified
CREATE INDEX IF NOT EXISTS invoice_recurring_upcoming_notification_idx 
  ON invoice_recurring(next_scheduled_at, upcoming_notification_sent_at) 
  WHERE status = 'active';

