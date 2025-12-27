-- Migration: Add 'stripe' to bank_providers enum
-- This enables Stripe as a transaction source for syncing payment data

ALTER TYPE bank_providers ADD VALUE IF NOT EXISTS 'stripe';

