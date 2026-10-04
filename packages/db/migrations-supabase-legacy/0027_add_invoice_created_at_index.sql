-- Index for getInvoicePaymentAnalysis: WHERE team_id = ? AND created_at BETWEEN ? AND ?
-- Also benefits any query filtering invoices by team + date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_team_created_at_idx
ON invoices (team_id, created_at DESC);
