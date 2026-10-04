DROP TABLE IF EXISTS transaction_embeddings;
DROP TABLE IF EXISTS inbox_embeddings;
ALTER TABLE transaction_match_suggestions DROP COLUMN IF EXISTS embedding_score;
