-- Migration: Add templateId to invoices for template traceability
-- Adds template_id column to invoices table with foreign key to invoice_templates

-- Add new column
ALTER TABLE invoices 
  ADD COLUMN template_id UUID;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS invoices_template_id_idx ON invoices(template_id);

-- Add foreign key constraint (set null on delete to preserve invoice history)
ALTER TABLE invoices 
  ADD CONSTRAINT invoices_template_id_fkey 
  FOREIGN KEY (template_id) 
  REFERENCES invoice_templates(id) 
  ON DELETE SET NULL;

