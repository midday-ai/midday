-- Migration: Add biweekly and monthly_last_day frequency options for recurring invoices
-- 
-- biweekly: Every 2 weeks on the same weekday as the issue date
-- monthly_last_day: Last day of each month (handles 28/30/31 day months automatically)

-- Add new enum values to invoice_recurring_frequency
ALTER TYPE invoice_recurring_frequency ADD VALUE IF NOT EXISTS 'biweekly';
ALTER TYPE invoice_recurring_frequency ADD VALUE IF NOT EXISTS 'monthly_last_day';

