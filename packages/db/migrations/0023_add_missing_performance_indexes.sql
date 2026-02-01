-- Migration: Add missing indexes for common query patterns
-- These indexes are based on analysis of actual query patterns in the codebase

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================

-- Index for default list ordering: WHERE team_id = ? ORDER BY date DESC, id DESC
-- Used by: getTransactions() - the main transaction list query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_team_date_desc_id_desc
ON transactions (team_id, date DESC, id DESC);

-- Index for status filtering: WHERE team_id = ? AND status = ? ORDER BY date DESC
-- Used by: getTransactions() when filtering by completed/uncompleted/exported/excluded
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_team_status_date_desc
ON transactions (team_id, status, date DESC);

-- Index for currency-filtered reports: WHERE team_id = ? AND base_currency = ? AND date BETWEEN
-- Used by: getReports(), getProfitMargin(), getCashFlow()
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_team_base_currency_date
ON transactions (team_id, base_currency, date);

-- Partial index for non-excluded transactions (most common filter)
-- Excludes archived/excluded from the index for smaller size
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_team_date_active
ON transactions (team_id, date DESC)
WHERE status NOT IN ('excluded', 'archived');

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================

-- Index for overdue invoice queries: WHERE team_id = ? AND status IN (...) AND due_date < ?
-- Used by: getOverdueInvoicesAlert(), getOutstandingInvoices()
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_team_status_due_date
ON invoices (team_id, status, due_date);

-- Index for default list ordering: WHERE team_id = ? ORDER BY created_at DESC
-- Used by: getInvoices() - the main invoice list query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_team_created_at_desc
ON invoices (team_id, created_at DESC);

-- Partial index for unpaid invoices (common dashboard query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_team_unpaid
ON invoices (team_id, due_date, amount)
WHERE status IN ('unpaid', 'overdue');

-- ============================================================================
-- TRANSACTION ATTACHMENTS TABLE
-- ============================================================================

-- Composite index for EXISTS subquery optimization
-- The transaction list query does: EXISTS (SELECT 1 FROM transaction_attachments WHERE transaction_id = ? AND team_id = ?)
-- This is called for EVERY row in the transaction list to check fulfillment status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_attachments_txn_team
ON transaction_attachments (transaction_id, team_id);

-- ============================================================================
-- TRANSACTION CATEGORIES TABLE
-- ============================================================================

-- Index for category lookups by slug within a team
-- Used by: category filtering in getTransactions(), category JOINs in reports
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_categories_team_slug
ON transaction_categories (team_id, slug);

-- Index for finding child categories: WHERE team_id = ? AND parent_id = ?
-- Used by: expanding parent categories to include children in filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_categories_team_parent
ON transaction_categories (team_id, parent_id)
WHERE parent_id IS NOT NULL;

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================

-- Index for customer list ordering: WHERE team_id = ? ORDER BY created_at DESC
-- Used by: getCustomers() default ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_team_created_at_desc
ON customers (team_id, created_at DESC);

-- ============================================================================
-- ACCOUNTING SYNC RECORDS TABLE
-- ============================================================================

-- Index for checking sync status in transaction queries
-- Used by: getTransactions() when filtering for "exported" status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounting_sync_records_txn_team_status
ON accounting_sync_records (transaction_id, team_id, status);

-- ============================================================================
-- BANK ACCOUNTS TABLE
-- ============================================================================

-- Composite index for team + enabled status
-- Used by: getCashBalance(), reports that filter by enabled accounts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bank_accounts_team_enabled
ON bank_accounts (team_id, enabled)
WHERE enabled = true;
