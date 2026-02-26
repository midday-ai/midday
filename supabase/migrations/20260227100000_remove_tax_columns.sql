-- Remove tax-related columns from transactions, transaction_categories, and inbox.
-- These are Midday freelancer-platform leftovers that have no meaning in MCA.
-- Invoice tax fields (invoice_templates.tax_rate, invoice_products.tax_rate) are preserved.

ALTER TABLE transactions DROP COLUMN IF EXISTS tax_amount;
ALTER TABLE transactions DROP COLUMN IF EXISTS tax_rate;
ALTER TABLE transactions DROP COLUMN IF EXISTS tax_type;

ALTER TABLE transaction_categories DROP COLUMN IF EXISTS tax_rate;
ALTER TABLE transaction_categories DROP COLUMN IF EXISTS tax_type;
ALTER TABLE transaction_categories DROP COLUMN IF EXISTS tax_reporting_code;

ALTER TABLE inbox DROP COLUMN IF EXISTS tax_amount;
ALTER TABLE inbox DROP COLUMN IF EXISTS tax_rate;
ALTER TABLE inbox DROP COLUMN IF EXISTS tax_type;
