-- Migration: Add quarterly, semi_annual, and annual frequency options for recurring invoices
-- These new options allow businesses to set up invoices that repeat quarterly, semi-annually, or annually

-- Add new enum values to invoice_recurring_frequency
-- Note: PostgreSQL allows adding values to enums, but not removing them
ALTER TYPE invoice_recurring_frequency ADD VALUE IF NOT EXISTS 'quarterly';
ALTER TYPE invoice_recurring_frequency ADD VALUE IF NOT EXISTS 'semi_annual';
ALTER TYPE invoice_recurring_frequency ADD VALUE IF NOT EXISTS 'annual';

-- Add recurring_invoice_upcoming to activity_type enum for 24-hour advance notifications
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'recurring_invoice_upcoming';

