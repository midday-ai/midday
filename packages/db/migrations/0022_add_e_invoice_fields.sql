-- Add DDD connection key to teams for multi-tenant e-invoicing
ALTER TABLE teams ADD COLUMN ddd_connection_key text;

-- Add failed step tracking to invoices for better error reporting
ALTER TABLE invoices ADD COLUMN e_invoice_failed_step smallint;
