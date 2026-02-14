-- Add e-invoice registration activity types to the activity_type enum
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'e_invoice_registration_processing';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'e_invoice_registration_complete';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'e_invoice_registration_error';
