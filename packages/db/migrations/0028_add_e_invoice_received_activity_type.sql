-- Add e_invoice_received activity type for incoming Peppol documents
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'e_invoice_received';

-- Add index on peppol_id for fast team lookup when routing incoming documents
CREATE INDEX IF NOT EXISTS "e_invoice_registrations_peppol_id_idx"
  ON "e_invoice_registrations" ("peppol_id")
  WHERE "peppol_id" IS NOT NULL;
