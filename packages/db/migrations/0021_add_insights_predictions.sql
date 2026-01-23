-- Add predictions column to insights table for forward-looking data
-- Used to create the "addiction loop" - tracking what we predicted vs what happened
ALTER TABLE insights ADD COLUMN predictions jsonb;

COMMENT ON COLUMN insights.predictions IS 'Forward-looking predictions for follow-through tracking (invoices due, streaks at risk, etc.)';
