-- Add indexes to optimize insights activity data queries
-- These composite indexes improve performance for date range queries on team data

-- Invoices: optimize sent/paid date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "invoices_team_sent_at_idx" 
  ON "invoices" ("team_id", "sent_at");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "invoices_team_status_paid_at_idx" 
  ON "invoices" ("team_id", "status", "paid_at");

-- Tracker entries: optimize date range queries for time tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS "tracker_entries_team_date_idx" 
  ON "tracker_entries" ("team_id", "date");

-- Customers: add missing team_id index and composite for created_at range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "customers_team_id_idx" 
  ON "customers" ("team_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "customers_team_created_at_idx" 
  ON "customers" ("team_id", "created_at");

-- Inbox: optimize status + date range queries for receipt matching stats
CREATE INDEX CONCURRENTLY IF NOT EXISTS "inbox_team_status_created_at_idx" 
  ON "inbox" ("team_id", "status", "created_at");
