CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_name_trgm
  ON transactions USING GIN (name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_merchant_name_trgm
  ON transactions USING GIN (merchant_name gin_trgm_ops);
