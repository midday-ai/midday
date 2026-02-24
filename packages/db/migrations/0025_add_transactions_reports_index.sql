CREATE INDEX CONCURRENTLY idx_transactions_reports
ON transactions (team_id, date, category_slug)
WHERE internal = false AND status != 'excluded';
