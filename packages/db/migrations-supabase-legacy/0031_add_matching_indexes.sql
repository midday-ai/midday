-- Composite index for fetchTeamPairHistory and getTeamCalibration queries
-- which filter by (team_id, status IN (...), created_at > interval)
-- and ORDER BY created_at DESC.
CREATE INDEX CONCURRENTLY IF NOT EXISTS transaction_match_suggestions_team_status_created_idx
  ON transaction_match_suggestions (team_id, status, created_at DESC);

-- Trigram index on inbox.display_name for word_similarity in findInboxMatches
-- (reverse matching: transaction → inbox candidates).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inbox_display_name_trgm
  ON inbox USING GIN (display_name gin_trgm_ops);
