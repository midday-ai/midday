-- Enable the pg_trgm extension for trigram-based fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Replace the B-tree index on name with a GIN trigram index.
-- This supports efficient ILIKE and similarity() / word_similarity() queries.
DROP INDEX IF EXISTS "institutions_name_idx";
CREATE INDEX "institutions_name_trgm_idx" ON "institutions" USING gin ("name" gin_trgm_ops);
