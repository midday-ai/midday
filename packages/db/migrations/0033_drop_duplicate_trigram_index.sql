-- Drop duplicate GIN trigram index on transactions.name
-- idx_transactions_name_trigram is identical to idx_transactions_name_trgm (both GIN gin_trgm_ops)
-- Production stats: 0 scans, 219 MB wasted space
DROP INDEX CONCURRENTLY IF EXISTS idx_transactions_name_trigram;
