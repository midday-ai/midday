-- Migration: Add refunded status to invoice_status enum
-- Allows invoices to have a distinct "refunded" status when payment is refunded

ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'refunded';

-- Add refunded_at timestamp to track when refund occurred
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

