-- Remove duplicate e_invoice_registrations rows (keep the most recently updated
-- row per team_id + provider pair) and add a unique constraint to prevent the
-- race condition where concurrent requests could insert multiple rows.

-- Step 2: Drop the old non-unique composite index (replaced by the unique constraint)
DROP INDEX IF EXISTS "e_invoice_registrations_team_provider_idx";

-- Step 3: Add the unique constraint
ALTER TABLE "e_invoice_registrations"
  ADD CONSTRAINT "e_invoice_registrations_team_provider_unique"
  UNIQUE ("team_id", "provider");
