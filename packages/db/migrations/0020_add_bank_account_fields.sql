-- Add additional bank account fields for reconnect matching and user display
ALTER TABLE "bank_accounts" ADD COLUMN "iban" text;
ALTER TABLE "bank_accounts" ADD COLUMN "subtype" text;
ALTER TABLE "bank_accounts" ADD COLUMN "bic" text;

-- Add index on iban for faster lookups during reconnect
CREATE INDEX IF NOT EXISTS "bank_accounts_iban_idx" ON "bank_accounts" ("iban") WHERE "iban" IS NOT NULL;
