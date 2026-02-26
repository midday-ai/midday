-- Migration: Rename camelCase columns to snake_case
-- Purpose: Drizzle ORM is configured with casing: "snake_case", which expects
--          all column names in snake_case. These 6 columns were created with
--          camelCase names, causing "Failed query" errors at runtime.

-- bank_accounts table
ALTER TABLE public.bank_accounts RENAME COLUMN "baseBalance" TO base_balance;
ALTER TABLE public.bank_accounts RENAME COLUMN "availableBalance" TO available_balance;
ALTER TABLE public.bank_accounts RENAME COLUMN "creditLimit" TO credit_limit;

-- customers table
ALTER TABLE public.customers RENAME COLUMN "billingEmail" TO billing_email;

-- invoice_products table
ALTER TABLE public.invoice_products RENAME COLUMN "isActive" TO is_active;

-- transactions table
ALTER TABLE public.transactions RENAME COLUMN "baseAmount" TO base_amount;
