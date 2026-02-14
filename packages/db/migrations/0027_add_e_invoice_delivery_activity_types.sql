-- Add e-invoice delivery activity types to the activity_type enum
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'e_invoice_sent';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'e_invoice_error';
