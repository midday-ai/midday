-- Index for paymentStatus query: WHERE team_id = ? AND due_date IS NOT NULL ORDER BY due_date DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_team_due_date_idx
ON invoices (team_id, due_date DESC)
WHERE due_date IS NOT NULL;

-- Index for paymentStatus query: WHERE team_id = ? AND status IN (...) AND due_date < CURRENT_DATE
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_team_status_due_date_idx
ON invoices (team_id, status, due_date DESC);

-- Index for invoice.get customer filter: WHERE team_id = ? AND customer_id IN (?)
-- Also supports the LEFT JOIN on customer_id (PostgreSQL does not auto-create FK indexes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_team_customer_id_idx
ON invoices (team_id, customer_id)
WHERE customer_id IS NOT NULL;

-- Index for JOIN lookups on customer_id foreign key
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_customer_id_idx
ON invoices (customer_id)
WHERE customer_id IS NOT NULL;
