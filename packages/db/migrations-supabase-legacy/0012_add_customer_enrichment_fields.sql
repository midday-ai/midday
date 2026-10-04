-- Add new customer enrichment fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS finance_contact TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS finance_contact_email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS primary_language TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS fiscal_year_end TEXT;

