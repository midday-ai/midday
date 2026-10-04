-- Migration: Add line item tax support
-- Adds tax_rate to invoice_products for per-product default tax rates
-- Adds include_line_item_tax toggle and label to invoice_templates

ALTER TABLE invoice_products 
  ADD COLUMN tax_rate NUMERIC(10, 2);

ALTER TABLE invoice_templates 
  ADD COLUMN include_line_item_tax BOOLEAN DEFAULT false,
  ADD COLUMN line_item_tax_label TEXT;

-- Add comments for documentation
COMMENT ON COLUMN invoice_products.tax_rate IS 'Default tax rate percentage for this product (0-100)';
COMMENT ON COLUMN invoice_templates.include_line_item_tax IS 'When true, tax is calculated per line item instead of invoice level';
COMMENT ON COLUMN invoice_templates.line_item_tax_label IS 'Custom label for the line item tax column (default: Tax)';

