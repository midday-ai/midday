-- Create institution_type enum
DO $$ BEGIN
    CREATE TYPE institution_type AS ENUM ('personal', 'business');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create institutions table for banking institution search (replaces Typesense)
CREATE TABLE IF NOT EXISTS "institutions" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "logo_url" text,
    "countries" text[] NOT NULL,
    "provider" "bank_providers" NOT NULL,
    "popularity" integer DEFAULT 0,
    "available_history" integer,
    "maximum_consent_validity" integer,
    "type" "institution_type",
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "idx_institutions_countries" ON "institutions" USING GIN ("countries");
CREATE INDEX IF NOT EXISTS "idx_institutions_provider" ON "institutions" ("provider");
CREATE INDEX IF NOT EXISTS "idx_institutions_enabled" ON "institutions" ("enabled");
CREATE INDEX IF NOT EXISTS "idx_institutions_name_trgm" ON "institutions" USING GIN ("name" gin_trgm_ops);
