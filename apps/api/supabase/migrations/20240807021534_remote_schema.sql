-- Alter the transactions table to ensure that we account for new columns specifically originating in the providers
ALTER TABLE "public"."transactions"
    ADD COLUMN IF NOT EXISTS "account_id" "text";

UPDATE "public"."transactions"
SET "account_id" = ''
WHERE "account_id" IS NULL;

ALTER TABLE "public"."transactions"
ALTER COLUMN "account_id" SET NOT NULL;

ALTER TABLE "public"."transactions"
    ADD COLUMN IF NOT EXISTS "account_owner" "text",
    ADD COLUMN IF NOT EXISTS "iso_currency_code" "text",
    ADD COLUMN IF NOT EXISTS "unofficial_currency_code" "text",
    ADD COLUMN IF NOT EXISTS "category_id" "text",
    ADD COLUMN IF NOT EXISTS "check_number" "text",
    ADD COLUMN IF NOT EXISTS "datetime" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "authorized_date" "date",
    ADD COLUMN IF NOT EXISTS "authorized_datetime" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "location_address" "text",
    ADD COLUMN IF NOT EXISTS "location_city" "text",
    ADD COLUMN IF NOT EXISTS "location_region" "text",
    ADD COLUMN IF NOT EXISTS "location_postal_code" "text",
    ADD COLUMN IF NOT EXISTS "location_country" "text",
    ADD COLUMN IF NOT EXISTS "location_lat" numeric,
    ADD COLUMN IF NOT EXISTS "location_lon" numeric,
    ADD COLUMN IF NOT EXISTS "location_store_number" "text",
    ADD COLUMN IF NOT EXISTS "merchant_name" "text",
    ADD COLUMN IF NOT EXISTS "merchant_entity_id" "text",
    ADD COLUMN IF NOT EXISTS "logo_url" "text",
    ADD COLUMN IF NOT EXISTS "website" "text",
    ADD COLUMN IF NOT EXISTS "payment_meta_by_order_of" "text",
    ADD COLUMN IF NOT EXISTS "payment_meta_payee" "text",
    ADD COLUMN IF NOT EXISTS "payment_meta_payer" "text",
    ADD COLUMN IF NOT EXISTS "payment_meta_payment_method" "text",
    ADD COLUMN IF NOT EXISTS "payment_meta_payment_processor" "text",
    ADD COLUMN IF NOT EXISTS "payment_meta_ppd_id" "text",
    ADD COLUMN IF NOT EXISTS "payment_meta_reason" "text",
    ADD COLUMN IF NOT EXISTS "payment_meta_reference_number" "text",
    ADD COLUMN IF NOT EXISTS "payment_channel" "text",
    ADD COLUMN IF NOT EXISTS "pending" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "pending_transaction_id" "text",
    ADD COLUMN IF NOT EXISTS "personal_finance_category_primary" "text",
    ADD COLUMN IF NOT EXISTS "personal_finance_category_detailed" "text",
    ADD COLUMN IF NOT EXISTS "personal_finance_category_confidence_level" "text",
    ADD COLUMN IF NOT EXISTS "personal_finance_category_icon_url" "text",
    ADD COLUMN IF NOT EXISTS "transaction_id" "text",
    ADD COLUMN IF NOT EXISTS "transaction_code" "text",
    ADD COLUMN IF NOT EXISTS "transaction_type" "text";

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS inserted_at TIMESTAMPTZ DEFAULT now();

-- Use Postgres to create a bucket.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'vault') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('vault', 'vault', true);
    END IF;
END $$;