-- Drop unused HNSW vector index on document_tag_embeddings (86 MB, 0 scans)
-- Queries look up by slug, not by vector similarity
DROP INDEX CONCURRENTLY IF EXISTS document_tag_embeddings_idx;

-- Drop unused HNSW vector index on transaction_category_embeddings (5 MB, 0 scans)
DROP INDEX CONCURRENTLY IF EXISTS transaction_category_embeddings_vector_idx;
