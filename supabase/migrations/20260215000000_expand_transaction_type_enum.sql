-- Expand the transaction_type enum with additional MCA-relevant values
-- Existing values: 'credit', 'debit' (from 20260214300000_add_transaction_mca_columns.sql)
-- NSF excluded — that's a deal-level concept, not a transaction type

ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'refund';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'fee';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'adjustment';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'transfer';
