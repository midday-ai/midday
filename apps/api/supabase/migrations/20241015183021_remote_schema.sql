ALTER TABLE public.bank_connections
ADD COLUMN IF NOT EXISTS error_details TEXT,
ADD COLUMN IF NOT EXISTS error_retries INTEGER;
