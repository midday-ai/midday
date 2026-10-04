-- Add additional bank account fields for reconnect matching and user display
-- EU/UK account fields
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "iban" text;
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "subtype" text;
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "bic" text;

-- US bank account details (Teller, Plaid)
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "routing_number" text;
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "wire_routing_number" text;
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "account_number" text;
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "sort_code" text;

-- Credit account balances
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "available_balance" numeric(10, 2);
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "credit_limit" numeric(10, 2);

-- Add index on iban for faster lookups during reconnect
CREATE INDEX IF NOT EXISTS "bank_accounts_iban_idx" ON "bank_accounts" ("iban") WHERE "iban" IS NOT NULL;
