-- Remove tax/VAT columns from deal tables
-- These fields are inherited from Midday's freelancer invoicing and are not relevant for MCA deals.

-- deals table
ALTER TABLE deals DROP COLUMN IF EXISTS vat;
ALTER TABLE deals DROP COLUMN IF EXISTS tax;

-- deal_recurring table
ALTER TABLE deal_recurring DROP COLUMN IF EXISTS vat;
ALTER TABLE deal_recurring DROP COLUMN IF EXISTS tax;

-- deal_templates table
ALTER TABLE deal_templates DROP COLUMN IF EXISTS vat_label;
ALTER TABLE deal_templates DROP COLUMN IF EXISTS tax_label;
ALTER TABLE deal_templates DROP COLUMN IF EXISTS include_vat;
ALTER TABLE deal_templates DROP COLUMN IF EXISTS include_tax;
ALTER TABLE deal_templates DROP COLUMN IF EXISTS tax_rate;
ALTER TABLE deal_templates DROP COLUMN IF EXISTS vat_rate;
ALTER TABLE deal_templates DROP COLUMN IF EXISTS include_line_item_tax;
ALTER TABLE deal_templates DROP COLUMN IF EXISTS line_item_tax_label;

-- deal_products table
ALTER TABLE deal_products DROP COLUMN IF EXISTS tax_rate;
