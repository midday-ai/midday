-- Add deal assignment actions and date range conditions to transaction_rules
ALTER TABLE public.transaction_rules
  ADD COLUMN IF NOT EXISTS set_deal_code TEXT,
  ADD COLUMN IF NOT EXISTS auto_resolve_deal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_start DATE,
  ADD COLUMN IF NOT EXISTS date_end DATE;

COMMENT ON COLUMN public.transaction_rules.set_deal_code IS 'Explicit deal code to assign when rule fires';
COMMENT ON COLUMN public.transaction_rules.auto_resolve_deal IS 'When true, auto-resolve deal from merchant name lookup';
COMMENT ON COLUMN public.transaction_rules.date_start IS 'Rule only applies to transactions on or after this date';
COMMENT ON COLUMN public.transaction_rules.date_end IS 'Rule only applies to transactions on or before this date';
