-- Add MCA-specific columns to transactions table
-- deal_code: Human-readable deal identifier linking to an MCA deal
-- transaction_type: Whether this is a credit (money in) or debit (money out)

-- Create enum for transaction type
CREATE TYPE public.transaction_type AS ENUM ('credit', 'debit');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('completed', 'failed', 'pending', 'refunded');

-- Add deal_code column (matches mca_deals.deal_code)
ALTER TABLE public.transactions
  ADD COLUMN deal_code text;

-- Add transaction_type column
ALTER TABLE public.transactions
  ADD COLUMN transaction_type public.transaction_type;

-- Add payment_status column
ALTER TABLE public.transactions
  ADD COLUMN payment_status public.payment_status;

-- Index on deal_code for fast lookups by deal
CREATE INDEX idx_transactions_deal_code ON public.transactions(deal_code) WHERE deal_code IS NOT NULL;

-- Index on transaction_type for filtering credits vs debits
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type) WHERE transaction_type IS NOT NULL;

-- Index on payment_status for filtering failed/NSF payments
CREATE INDEX idx_transactions_payment_status ON public.transactions(payment_status) WHERE payment_status IS NOT NULL;

-- ========================================================================
-- Backfill existing demo transactions with new columns
-- ========================================================================

-- Daily/weekly ACH payments (successful collections)
UPDATE public.transactions
SET transaction_type = 'debit',
    payment_status = 'completed',
    deal_code = CASE
      WHEN internal_id LIKE 'demo_mca_sunrise_%'    THEN 'MCA-2025-001'
      WHEN internal_id LIKE 'demo_mca_bella_%'       THEN 'MCA-2025-003'
      WHEN internal_id LIKE 'demo_mca_tonys_%'       THEN 'MCA-2025-004'
      WHEN internal_id LIKE 'demo_mca_quickprint_%'  THEN 'MCA-2025-005'
      WHEN internal_id LIKE 'demo_mca_westside_%'    THEN 'MCA-2025-006'
      WHEN internal_id LIKE 'demo_mca_greenthumb_%'  THEN 'MCA-2026-001'
      WHEN internal_id LIKE 'demo_mca_fitness_%'     THEN 'MCA-2026-002'
      WHEN internal_id LIKE 'demo_mca_martinez_%'    THEN 'MCA-2024-001'
      WHEN internal_id LIKE 'demo_mca_luckydragon_%' THEN 'MCA-2024-002'
      WHEN internal_id LIKE 'demo_mca_smith_%'       THEN 'MCA-2024-003'
    END
WHERE category_slug = 'mca-payments';

-- NSF returns (failed payments)
UPDATE public.transactions
SET transaction_type = 'debit',
    payment_status = 'failed',
    deal_code = CASE
      WHEN internal_id LIKE 'demo_nsf_tonys_%'      THEN 'MCA-2025-004'
      WHEN internal_id LIKE 'demo_nsf_quickprint_%'  THEN 'MCA-2025-005'
      WHEN internal_id LIKE 'demo_nsf_westside_%'    THEN 'MCA-2025-006'
    END
WHERE category_slug = 'nsf-returns';

-- Funding disbursements (initial credit to merchant)
UPDATE public.transactions
SET transaction_type = 'credit',
    payment_status = 'completed',
    deal_code = CASE
      WHEN internal_id = 'demo_fund_sunrise'     THEN 'MCA-2025-001'
      WHEN internal_id = 'demo_fund_bella'        THEN 'MCA-2025-003'
      WHEN internal_id = 'demo_fund_tonys'        THEN 'MCA-2025-004'
      WHEN internal_id = 'demo_fund_quickprint'   THEN 'MCA-2025-005'
      WHEN internal_id = 'demo_fund_westside'     THEN 'MCA-2025-006'
      WHEN internal_id = 'demo_fund_greenthumb'   THEN 'MCA-2026-001'
      WHEN internal_id = 'demo_fund_fitness'      THEN 'MCA-2026-002'
      WHEN internal_id = 'demo_fund_martinez'     THEN 'MCA-2024-001'
      WHEN internal_id = 'demo_fund_luckydragon'  THEN 'MCA-2024-002'
      WHEN internal_id = 'demo_fund_smith'        THEN 'MCA-2024-003'
    END
WHERE category_slug = 'funding-disbursements';
