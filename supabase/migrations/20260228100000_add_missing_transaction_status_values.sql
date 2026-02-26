-- Migration: Add missing transaction status enum values
-- Purpose: The Drizzle schema includes 'failed', 'refund', and 'funding' statuses
--          for MCA transaction tracking, but these were never added to the PostgreSQL
--          enum type, causing runtime query failures.

-- Add new MCA-specific status values
ALTER TYPE "public"."transactionStatus" ADD VALUE IF NOT EXISTS 'failed';
ALTER TYPE "public"."transactionStatus" ADD VALUE IF NOT EXISTS 'refund';
ALTER TYPE "public"."transactionStatus" ADD VALUE IF NOT EXISTS 'funding';
