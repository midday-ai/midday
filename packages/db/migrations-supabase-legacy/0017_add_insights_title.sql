-- ============================================================================
-- ADD TITLE COLUMN TO INSIGHTS TABLE
-- ============================================================================
-- AI-generated summary title for card headers and email subjects
-- ============================================================================

ALTER TABLE insights
ADD COLUMN title TEXT;

COMMENT ON COLUMN insights.title IS 'AI-generated summary combining revenue, expenses, net, and key metrics (max 15 words). Used for card titles and email subjects.';
