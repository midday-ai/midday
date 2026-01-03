-- Add google_drive to inbox_account_providers enum
ALTER TYPE "public"."inbox_account_providers" ADD VALUE IF NOT EXISTS 'google_drive';

-- Add metadata JSONB column to inbox_accounts table
ALTER TABLE "inbox_accounts" ADD COLUMN IF NOT EXISTS "metadata" jsonb;

