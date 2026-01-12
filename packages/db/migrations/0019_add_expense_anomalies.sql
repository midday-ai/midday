-- Add expense_anomalies column to insights table
-- Stores detected expense category anomalies (spikes, new categories, decreases)
ALTER TABLE "insights" ADD COLUMN "expense_anomalies" JSONB;
