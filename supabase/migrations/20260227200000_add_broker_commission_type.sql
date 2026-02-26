-- Migration: Add commission_type to brokers and broker_commissions
-- Created: 2026-02-27
-- Purpose: Support both percentage-based and flat-fee broker commissions

-- ============================================================================
-- PART 1: Add commission_type enum
-- ============================================================================

CREATE TYPE broker_commission_type AS ENUM ('percentage', 'flat');

-- ============================================================================
-- PART 2: Add commission_type to brokers (default commission model)
-- ============================================================================

ALTER TABLE public.brokers
  ADD COLUMN commission_type broker_commission_type DEFAULT 'percentage';

-- Also add a flat_fee column for brokers who charge flat fees
ALTER TABLE public.brokers
  ADD COLUMN flat_fee numeric(12, 2);

-- ============================================================================
-- PART 3: Add commission_type to broker_commissions (per-deal override)
-- ============================================================================

ALTER TABLE public.broker_commissions
  ADD COLUMN commission_type broker_commission_type DEFAULT 'percentage';

-- Make commission_percentage nullable (not needed for flat fees)
ALTER TABLE public.broker_commissions
  ALTER COLUMN commission_percentage DROP NOT NULL;
