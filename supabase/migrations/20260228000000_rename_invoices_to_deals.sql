-- Migration: Rename "invoice" to "deal" across all tables
-- This aligns terminology with MCA (Merchant Cash Advance) industry conventions.
-- Pattern follows: 20260215100000_rename_customer_to_merchant.sql

BEGIN;

-- ============================================================
-- 1. Rename enum types
-- ============================================================
ALTER TYPE "public"."invoice_delivery_type" RENAME TO "deal_delivery_type";
ALTER TYPE "public"."invoice_size" RENAME TO "deal_size";
ALTER TYPE "public"."invoice_status" RENAME TO "deal_status";
ALTER TYPE "public"."invoice_recurring_frequency" RENAME TO "deal_recurring_frequency";
ALTER TYPE "public"."invoice_recurring_end_type" RENAME TO "deal_recurring_end_type";
ALTER TYPE "public"."invoice_recurring_status" RENAME TO "deal_recurring_status";

-- ============================================================
-- 2. Rename enum values (inbox_type: 'invoice' → 'deal')
-- ============================================================
ALTER TYPE "public"."inbox_type" RENAME VALUE 'invoice' TO 'deal';

-- ============================================================
-- 3. Rename activity_type enum values
-- ============================================================
ALTER TYPE "public"."activity_type" RENAME VALUE 'invoice_paid' TO 'deal_paid';
ALTER TYPE "public"."activity_type" RENAME VALUE 'invoice_overdue' TO 'deal_overdue';
ALTER TYPE "public"."activity_type" RENAME VALUE 'invoice_sent' TO 'deal_sent';
ALTER TYPE "public"."activity_type" RENAME VALUE 'invoice_refunded' TO 'deal_refunded';
ALTER TYPE "public"."activity_type" RENAME VALUE 'recurring_invoice_upcoming' TO 'recurring_deal_upcoming';
ALTER TYPE "public"."activity_type" RENAME VALUE 'invoice_duplicated' TO 'deal_duplicated';
ALTER TYPE "public"."activity_type" RENAME VALUE 'invoice_scheduled' TO 'deal_scheduled';
ALTER TYPE "public"."activity_type" RENAME VALUE 'invoice_reminder_sent' TO 'deal_reminder_sent';
ALTER TYPE "public"."activity_type" RENAME VALUE 'invoice_cancelled' TO 'deal_cancelled';
ALTER TYPE "public"."activity_type" RENAME VALUE 'invoice_created' TO 'deal_created';
ALTER TYPE "public"."activity_type" RENAME VALUE 'draft_invoice_created' TO 'draft_deal_created';

-- ============================================================
-- 4. Rename tables
-- ============================================================
ALTER TABLE "public"."invoices" RENAME TO "deals";
ALTER TABLE "public"."invoice_recurring" RENAME TO "deal_recurring";
ALTER TABLE "public"."invoice_comments" RENAME TO "deal_comments";
ALTER TABLE "public"."invoice_templates" RENAME TO "deal_templates";
ALTER TABLE "public"."invoice_products" RENAME TO "deal_products";

-- ============================================================
-- 5. Rename columns
-- ============================================================

-- deals (formerly invoices)
ALTER TABLE "public"."deals" RENAME COLUMN "invoice_number" TO "deal_number";
ALTER TABLE "public"."deals" RENAME COLUMN "invoice_recurring_id" TO "deal_recurring_id";

-- deal_recurring (formerly invoice_recurring)
ALTER TABLE "public"."deal_recurring" RENAME COLUMN "invoices_generated" TO "deals_generated";

-- deal_templates (formerly invoice_templates)
ALTER TABLE "public"."deal_templates" RENAME COLUMN "invoice_no_label" TO "deal_no_label";

-- inbox
ALTER TABLE "public"."inbox" RENAME COLUMN "invoice_number" TO "deal_number";

-- ============================================================
-- 6. Recreate the FTS generated column on deals
--    (references the renamed column deal_number)
-- ============================================================
ALTER TABLE "public"."deals" DROP COLUMN "fts";
ALTER TABLE "public"."deals" ADD COLUMN "fts" tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english'::regconfig,
      (COALESCE((amount)::text, ''::text) || ' '::text) || COALESCE(deal_number, ''::text)
    )
  ) STORED NOT NULL;

-- ============================================================
-- 7. Rename primary key and unique constraints
-- ============================================================
ALTER INDEX "public"."invoices_pkey" RENAME TO "deals_pkey";
ALTER INDEX "public"."invoice_recurring_pkey" RENAME TO "deal_recurring_pkey";
ALTER INDEX "public"."invoice_comments_pkey" RENAME TO "deal_comments_pkey";
ALTER INDEX "public"."invoice_templates_pkey" RENAME TO "deal_templates_pkey";
ALTER INDEX "public"."invoice_products_pkey" RENAME TO "deal_products_pkey";

-- Unique constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoices_scheduled_job_id_key') THEN
    ALTER INDEX "public"."invoices_scheduled_job_id_key" RENAME TO "deals_scheduled_job_id_key";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoices_recurring_sequence_unique_idx') THEN
    ALTER INDEX "public"."invoices_recurring_sequence_unique_idx" RENAME TO "deals_recurring_sequence_unique_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_products_team_name_currency_price_unique') THEN
    ALTER INDEX "public"."invoice_products_team_name_currency_price_unique" RENAME TO "deal_products_team_name_currency_price_unique";
  END IF;
END $$;

-- ============================================================
-- 8. Rename indexes (conditional — some only exist on cloud)
-- ============================================================
DO $$
BEGIN
  -- deals table (formerly invoices)
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoices_created_at_idx') THEN
    ALTER INDEX "public"."invoices_created_at_idx" RENAME TO "deals_created_at_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoices_fts') THEN
    ALTER INDEX "public"."invoices_fts" RENAME TO "deals_fts";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoices_team_id_idx') THEN
    ALTER INDEX "public"."invoices_team_id_idx" RENAME TO "deals_team_id_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoices_template_id_idx') THEN
    ALTER INDEX "public"."invoices_template_id_idx" RENAME TO "deals_template_id_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoices_invoice_recurring_id_idx') THEN
    ALTER INDEX "public"."invoices_invoice_recurring_id_idx" RENAME TO "deals_deal_recurring_id_idx";
  END IF;

  -- deal_recurring table (formerly invoice_recurring)
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_recurring_team_id_idx') THEN
    ALTER INDEX "public"."invoice_recurring_team_id_idx" RENAME TO "deal_recurring_team_id_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_recurring_next_scheduled_at_idx') THEN
    ALTER INDEX "public"."invoice_recurring_next_scheduled_at_idx" RENAME TO "deal_recurring_next_scheduled_at_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_recurring_status_idx') THEN
    ALTER INDEX "public"."invoice_recurring_status_idx" RENAME TO "deal_recurring_status_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_recurring_active_scheduled_idx') THEN
    ALTER INDEX "public"."invoice_recurring_active_scheduled_idx" RENAME TO "deal_recurring_active_scheduled_idx";
  END IF;

  -- deal_templates table (formerly invoice_templates)
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoice_templates_team_id') THEN
    ALTER INDEX "public"."idx_invoice_templates_team_id" RENAME TO "idx_deal_templates_team_id";
  END IF;

  -- deal_products table (formerly invoice_products)
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_products_team_id_idx') THEN
    ALTER INDEX "public"."invoice_products_team_id_idx" RENAME TO "deal_products_team_id_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_products_created_by_idx') THEN
    ALTER INDEX "public"."invoice_products_created_by_idx" RENAME TO "deal_products_created_by_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_products_fts_idx') THEN
    ALTER INDEX "public"."invoice_products_fts_idx" RENAME TO "deal_products_fts_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_products_name_idx') THEN
    ALTER INDEX "public"."invoice_products_name_idx" RENAME TO "deal_products_name_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_products_usage_count_idx') THEN
    ALTER INDEX "public"."invoice_products_usage_count_idx" RENAME TO "deal_products_usage_count_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_products_last_used_at_idx') THEN
    ALTER INDEX "public"."invoice_products_last_used_at_idx" RENAME TO "deal_products_last_used_at_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'invoice_products_team_active_idx') THEN
    ALTER INDEX "public"."invoice_products_team_active_idx" RENAME TO "deal_products_team_active_idx";
  END IF;

  -- inbox table
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'inbox_invoice_number_idx') THEN
    ALTER INDEX "public"."inbox_invoice_number_idx" RENAME TO "inbox_deal_number_idx";
  END IF;
END $$;

-- ============================================================
-- 9. Rename foreign key constraints (conditional)
-- ============================================================
DO $$
BEGIN
  -- deals table (formerly invoices)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoices_created_by_fkey') THEN
    ALTER TABLE "public"."deals" RENAME CONSTRAINT "invoices_created_by_fkey" TO "deals_created_by_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoices_merchant_id_fkey') THEN
    ALTER TABLE "public"."deals" RENAME CONSTRAINT "invoices_merchant_id_fkey" TO "deals_merchant_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoices_team_id_fkey') THEN
    ALTER TABLE "public"."deals" RENAME CONSTRAINT "invoices_team_id_fkey" TO "deals_team_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoices_template_id_fkey') THEN
    ALTER TABLE "public"."deals" RENAME CONSTRAINT "invoices_template_id_fkey" TO "deals_template_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoices_invoice_recurring_id_fkey') THEN
    ALTER TABLE "public"."deals" RENAME CONSTRAINT "invoices_invoice_recurring_id_fkey" TO "deals_deal_recurring_id_fkey";
  END IF;

  -- deal_recurring table (formerly invoice_recurring)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoice_recurring_team_id_fkey') THEN
    ALTER TABLE "public"."deal_recurring" RENAME CONSTRAINT "invoice_recurring_team_id_fkey" TO "deal_recurring_team_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoice_recurring_user_id_fkey') THEN
    ALTER TABLE "public"."deal_recurring" RENAME CONSTRAINT "invoice_recurring_user_id_fkey" TO "deal_recurring_user_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoice_recurring_merchant_id_fkey') THEN
    ALTER TABLE "public"."deal_recurring" RENAME CONSTRAINT "invoice_recurring_merchant_id_fkey" TO "deal_recurring_merchant_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoice_recurring_template_id_fkey') THEN
    ALTER TABLE "public"."deal_recurring" RENAME CONSTRAINT "invoice_recurring_template_id_fkey" TO "deal_recurring_template_id_fkey";
  END IF;

  -- deal_templates table (formerly invoice_templates)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoice_settings_team_id_fkey') THEN
    ALTER TABLE "public"."deal_templates" RENAME CONSTRAINT "invoice_settings_team_id_fkey" TO "deal_templates_team_id_fkey";
  END IF;

  -- deal_products table (formerly invoice_products)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoice_products_team_id_fkey') THEN
    ALTER TABLE "public"."deal_products" RENAME CONSTRAINT "invoice_products_team_id_fkey" TO "deal_products_team_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoice_products_created_by_fkey') THEN
    ALTER TABLE "public"."deal_products" RENAME CONSTRAINT "invoice_products_created_by_fkey" TO "deal_products_created_by_fkey";
  END IF;
END $$;

-- ============================================================
-- 10. Update RLS policies (conditional — private schema only on cloud)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'private') THEN
    -- deals table (formerly invoices)
    DROP POLICY IF EXISTS "Invoices can be handled by a member of the team" ON "public"."deals";
    EXECUTE 'CREATE POLICY "Deals can be handled by a member of the team"
      ON "public"."deals"
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';

    -- deal_recurring table
    DROP POLICY IF EXISTS "Invoice recurring can be handled by a member of the team" ON "public"."deal_recurring";
    EXECUTE 'CREATE POLICY "Deal recurring can be handled by a member of the team"
      ON "public"."deal_recurring"
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';

    -- deal_templates table
    DROP POLICY IF EXISTS "Invoice templates can be handled by a member of the team" ON "public"."deal_templates";
    EXECUTE 'CREATE POLICY "Deal templates can be handled by a member of the team"
      ON "public"."deal_templates"
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy update — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================================
-- 11. Update global search functions to use new table/column names
-- ============================================================

-- Drop the old overloads
DROP FUNCTION IF EXISTS public.global_search(text, uuid, text, integer, integer, numeric);
DROP FUNCTION IF EXISTS public.global_semantic_search(uuid, text, text, text, text[], numeric, numeric, numeric, text, text, text, text, text, integer, integer);

-- Recreate global_search with updated references
CREATE OR REPLACE FUNCTION public.global_search(
  p_search_term         text    DEFAULT NULL,
  p_team_id             uuid    DEFAULT NULL,
  p_language            text    DEFAULT 'english',
  p_limit               integer DEFAULT 30,
  p_items_per_table     integer DEFAULT 5,
  p_relevance_threshold numeric DEFAULT 0.01
)
RETURNS TABLE (
  id         text,
  type       text,
  title      text,
  relevance  float,
  created_at text,
  data       jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tsquery tsquery;
  v_has_search boolean;
BEGIN
  v_has_search := (p_search_term IS NOT NULL AND trim(p_search_term) <> '');

  IF v_has_search THEN
    v_tsquery := to_tsquery(
      p_language::regconfig,
      string_agg(lexeme || ':*', ' & ')
    ) FROM unnest(
      string_to_array(trim(regexp_replace(p_search_term, '\s+', ' ', 'g')), ' ')
    ) AS lexeme
    WHERE lexeme <> '';
  END IF;

  RETURN QUERY

  -- === Transactions ===
  SELECT * FROM (
    SELECT
      t.id::text,
      'transaction'::text AS type,
      t.name              AS title,
      CASE WHEN v_has_search THEN ts_rank(t.fts_vector, v_tsquery)::float ELSE 1.0 END AS relevance,
      t.created_at::text,
      jsonb_build_object(
        'name',     t.name,
        'amount',   t.amount,
        'currency', t.currency,
        'date',     t.date,
        'status',   t.status,
        'url',      '/?transactionId=' || t.id::text
      ) AS data
    FROM transactions t
    WHERE t.team_id = p_team_id
      AND (NOT v_has_search OR t.fts_vector @@ v_tsquery)
      AND (NOT v_has_search OR ts_rank(t.fts_vector, v_tsquery) >= p_relevance_threshold)
    ORDER BY
      CASE WHEN v_has_search THEN ts_rank(t.fts_vector, v_tsquery) ELSE 0 END DESC,
      t.created_at DESC
    LIMIT p_items_per_table
  ) AS txn_results

  UNION ALL

  -- === Deals (formerly Invoices) ===
  SELECT * FROM (
    SELECT
      i.id::text,
      'deal'::text         AS type,
      COALESCE(i.deal_number, 'Deal') AS title,
      CASE WHEN v_has_search THEN ts_rank(i.fts, v_tsquery)::float ELSE 1.0 END AS relevance,
      i.created_at::text,
      jsonb_build_object(
        'deal_number',  i.deal_number,
        'status',       i.status,
        'amount',       i.amount,
        'currency',     i.currency,
        'template',     jsonb_build_object('size', i.template->>'size')
      ) AS data
    FROM deals i
    WHERE i.team_id = p_team_id
      AND (NOT v_has_search OR i.fts @@ v_tsquery
           OR i.deal_number ILIKE '%' || p_search_term || '%'
           OR i.merchant_name ILIKE '%' || p_search_term || '%')
      AND (NOT v_has_search OR ts_rank(i.fts, v_tsquery) >= p_relevance_threshold
           OR i.deal_number ILIKE '%' || p_search_term || '%'
           OR i.merchant_name ILIKE '%' || p_search_term || '%')
    ORDER BY
      CASE WHEN v_has_search THEN ts_rank(i.fts, v_tsquery) ELSE 0 END DESC,
      i.created_at DESC
    LIMIT p_items_per_table
  ) AS deal_results

  UNION ALL

  -- === Merchants ===
  SELECT * FROM (
    SELECT
      c.id::text,
      'merchant'::text AS type,
      c.name           AS title,
      CASE WHEN v_has_search THEN 0.5::float ELSE 1.0 END AS relevance,
      c.created_at::text,
      jsonb_build_object(
        'name',  c.name,
        'email', c.email
      ) AS data
    FROM merchants c
    WHERE c.team_id = p_team_id
      AND (c.is_archived IS NOT TRUE)
      AND (NOT v_has_search
           OR c.name  ILIKE '%' || p_search_term || '%'
           OR c.email ILIKE '%' || p_search_term || '%')
    ORDER BY c.created_at DESC
    LIMIT p_items_per_table
  ) AS cust_results

  UNION ALL

  -- === Inbox ===
  SELECT * FROM (
    SELECT
      ib.id::text,
      'inbox'::text AS type,
      COALESCE(ib.display_name, ib.file_name, 'Inbox item') AS title,
      CASE WHEN v_has_search THEN ts_rank(ib.fts, v_tsquery)::float ELSE 1.0 END AS relevance,
      ib.created_at::text,
      jsonb_build_object(
        'display_name', ib.display_name,
        'file_name',    ib.file_name,
        'file_path',    to_jsonb(ib.file_path),
        'amount',       ib.amount,
        'currency',     ib.currency,
        'date',         ib.date
      ) AS data
    FROM inbox ib
    WHERE ib.team_id = p_team_id
      AND ib.status != 'deleted'
      AND (NOT v_has_search OR ib.fts @@ v_tsquery
           OR ib.display_name ILIKE '%' || p_search_term || '%'
           OR ib.file_name    ILIKE '%' || p_search_term || '%')
    ORDER BY
      CASE WHEN v_has_search THEN ts_rank(ib.fts, v_tsquery) ELSE 0 END DESC,
      ib.created_at DESC
    LIMIT p_items_per_table
  ) AS inbox_results

  UNION ALL

  -- === Vault (documents) ===
  SELECT * FROM (
    SELECT
      d.id::text,
      'vault'::text AS type,
      COALESCE(d.title, d.name, '') AS title,
      CASE WHEN v_has_search THEN COALESCE(ts_rank(d.fts, v_tsquery), 0)::float ELSE 1.0 END AS relevance,
      d.created_at::text,
      jsonb_build_object(
        'name',        d.name,
        'title',       d.title,
        'path_tokens', to_jsonb(d.path_tokens),
        'metadata',    d.metadata
      ) AS data
    FROM documents d
    WHERE d.team_id = p_team_id
      AND (NOT v_has_search OR d.fts @@ v_tsquery
           OR d.title ILIKE '%' || p_search_term || '%'
           OR d.name  ILIKE '%' || p_search_term || '%')
    ORDER BY
      CASE WHEN v_has_search THEN COALESCE(ts_rank(d.fts, v_tsquery), 0) ELSE 0 END DESC,
      d.created_at DESC
    LIMIT p_items_per_table
  ) AS vault_results

  -- Final overall limit
  LIMIT p_limit;
END;
$$;

-- Recreate global_semantic_search with updated references
CREATE OR REPLACE FUNCTION public.global_semantic_search(
  team_id              uuid     DEFAULT NULL,
  search_term          text     DEFAULT NULL,
  start_date           text     DEFAULT NULL,
  end_date             text     DEFAULT NULL,
  types                text[]   DEFAULT NULL,
  amount               numeric  DEFAULT NULL,
  amount_min           numeric  DEFAULT NULL,
  amount_max           numeric  DEFAULT NULL,
  status               text     DEFAULT NULL,
  currency             text     DEFAULT NULL,
  language             text     DEFAULT 'english',
  due_date_start       text     DEFAULT NULL,
  due_date_end         text     DEFAULT NULL,
  max_results          integer  DEFAULT 20,
  items_per_table_limit integer DEFAULT 5
)
RETURNS TABLE (
  id         text,
  type       text,
  title      text,
  relevance  float,
  created_at text,
  data       jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tsquery tsquery;
  v_has_search boolean;
  v_all_types boolean;
BEGIN
  v_has_search := (search_term IS NOT NULL AND trim(search_term) <> '');
  v_all_types  := (types IS NULL OR array_length(types, 1) IS NULL);

  IF v_has_search THEN
    v_tsquery := to_tsquery(
      COALESCE(language, 'english')::regconfig,
      string_agg(lexeme || ':*', ' & ')
    ) FROM unnest(
      string_to_array(trim(regexp_replace(search_term, '\s+', ' ', 'g')), ' ')
    ) AS lexeme
    WHERE lexeme <> '';
  END IF;

  RETURN QUERY

  -- === Transactions ===
  SELECT * FROM (
    SELECT
      t.id::text,
      'transaction'::text AS type,
      t.name              AS title,
      CASE WHEN v_has_search THEN ts_rank(t.fts_vector, v_tsquery)::float ELSE 1.0 END AS relevance,
      t.created_at::text,
      jsonb_build_object(
        'name',     t.name,
        'amount',   t.amount,
        'currency', t.currency,
        'date',     t.date,
        'status',   t.status,
        'url',      '/?transactionId=' || t.id::text
      ) AS data
    FROM transactions t
    WHERE t.team_id = global_semantic_search.team_id
      AND (v_all_types OR 'transaction' = ANY(types))
      AND (NOT v_has_search OR t.fts_vector @@ v_tsquery OR t.name ILIKE '%' || search_term || '%')
      AND (start_date IS NULL OR t.date >= start_date::date)
      AND (end_date   IS NULL OR t.date <= end_date::date)
      AND (amount     IS NULL OR t.amount = global_semantic_search.amount)
      AND (amount_min IS NULL OR t.amount >= amount_min)
      AND (amount_max IS NULL OR t.amount <= amount_max)
      AND (global_semantic_search.status   IS NULL OR t.status::text = global_semantic_search.status)
      AND (global_semantic_search.currency IS NULL OR t.currency = global_semantic_search.currency)
    ORDER BY
      CASE WHEN v_has_search THEN ts_rank(t.fts_vector, v_tsquery) ELSE 0 END DESC,
      t.created_at DESC
    LIMIT items_per_table_limit
  ) AS txn_results

  UNION ALL

  -- === Deals (formerly Invoices) ===
  SELECT * FROM (
    SELECT
      i.id::text,
      'deal'::text         AS type,
      COALESCE(i.deal_number, 'Deal') AS title,
      CASE WHEN v_has_search THEN ts_rank(i.fts, v_tsquery)::float ELSE 1.0 END AS relevance,
      i.created_at::text,
      jsonb_build_object(
        'deal_number',  i.deal_number,
        'status',       i.status,
        'amount',       i.amount,
        'currency',     i.currency,
        'template',     jsonb_build_object('size', i.template->>'size')
      ) AS data
    FROM deals i
    WHERE i.team_id = global_semantic_search.team_id
      AND (v_all_types OR 'deal' = ANY(types))
      AND (NOT v_has_search OR i.fts @@ v_tsquery OR i.deal_number ILIKE '%' || search_term || '%')
      AND (start_date     IS NULL OR i.created_at >= start_date::timestamptz)
      AND (end_date       IS NULL OR i.created_at <= end_date::timestamptz)
      AND (amount         IS NULL OR i.amount = global_semantic_search.amount)
      AND (amount_min     IS NULL OR i.amount >= amount_min)
      AND (amount_max     IS NULL OR i.amount <= amount_max)
      AND (global_semantic_search.status   IS NULL OR i.status::text = global_semantic_search.status)
      AND (global_semantic_search.currency IS NULL OR i.currency = global_semantic_search.currency)
      AND (due_date_start IS NULL OR i.due_date >= due_date_start::timestamptz)
      AND (due_date_end   IS NULL OR i.due_date <= due_date_end::timestamptz)
    ORDER BY
      CASE WHEN v_has_search THEN ts_rank(i.fts, v_tsquery) ELSE 0 END DESC,
      i.created_at DESC
    LIMIT items_per_table_limit
  ) AS deal_results

  UNION ALL

  -- === Merchants ===
  SELECT * FROM (
    SELECT
      c.id::text,
      'merchant'::text AS type,
      c.name           AS title,
      CASE WHEN v_has_search THEN 0.5::float ELSE 1.0 END AS relevance,
      c.created_at::text,
      jsonb_build_object(
        'name',  c.name,
        'email', c.email
      ) AS data
    FROM merchants c
    WHERE c.team_id = global_semantic_search.team_id
      AND (v_all_types OR 'merchant' = ANY(types))
      AND (c.is_archived IS NOT TRUE)
      AND (NOT v_has_search
           OR c.name  ILIKE '%' || search_term || '%'
           OR c.email ILIKE '%' || search_term || '%')
      AND (start_date IS NULL OR c.created_at >= start_date::timestamptz)
      AND (end_date   IS NULL OR c.created_at <= end_date::timestamptz)
    ORDER BY c.created_at DESC
    LIMIT items_per_table_limit
  ) AS cust_results

  UNION ALL

  -- === Inbox ===
  SELECT * FROM (
    SELECT
      ib.id::text,
      'inbox'::text AS type,
      COALESCE(ib.display_name, ib.file_name, 'Inbox item') AS title,
      CASE WHEN v_has_search THEN ts_rank(ib.fts, v_tsquery)::float ELSE 1.0 END AS relevance,
      ib.created_at::text,
      jsonb_build_object(
        'display_name', ib.display_name,
        'file_name',    ib.file_name,
        'file_path',    to_jsonb(ib.file_path),
        'amount',       ib.amount,
        'currency',     ib.currency,
        'date',         ib.date
      ) AS data
    FROM inbox ib
    WHERE ib.team_id = global_semantic_search.team_id
      AND ib.status != 'deleted'
      AND (v_all_types OR 'inbox' = ANY(types))
      AND (NOT v_has_search OR ib.fts @@ v_tsquery OR ib.display_name ILIKE '%' || search_term || '%')
      AND (start_date IS NULL OR ib.created_at >= start_date::timestamptz)
      AND (end_date   IS NULL OR ib.created_at <= end_date::timestamptz)
      AND (amount     IS NULL OR ib.amount = global_semantic_search.amount)
      AND (amount_min IS NULL OR ib.amount >= amount_min)
      AND (amount_max IS NULL OR ib.amount <= amount_max)
      AND (global_semantic_search.currency IS NULL OR ib.currency = global_semantic_search.currency)
    ORDER BY
      CASE WHEN v_has_search THEN ts_rank(ib.fts, v_tsquery) ELSE 0 END DESC,
      ib.created_at DESC
    LIMIT items_per_table_limit
  ) AS inbox_results

  UNION ALL

  -- === Vault (documents) ===
  SELECT * FROM (
    SELECT
      d.id::text,
      'vault'::text AS type,
      COALESCE(d.title, d.name, '') AS title,
      CASE WHEN v_has_search THEN COALESCE(ts_rank(d.fts, v_tsquery), 0)::float ELSE 1.0 END AS relevance,
      d.created_at::text,
      jsonb_build_object(
        'name',        d.name,
        'title',       d.title,
        'path_tokens', to_jsonb(d.path_tokens),
        'metadata',    d.metadata
      ) AS data
    FROM documents d
    WHERE d.team_id = global_semantic_search.team_id
      AND (v_all_types OR 'vault' = ANY(types))
      AND (NOT v_has_search OR d.fts @@ v_tsquery OR d.title ILIKE '%' || search_term || '%' OR d.name ILIKE '%' || search_term || '%')
    ORDER BY
      CASE WHEN v_has_search THEN COALESCE(ts_rank(d.fts, v_tsquery), 0) ELSE 0 END DESC,
      d.created_at DESC
    LIMIT items_per_table_limit
  ) AS vault_results

  -- Final overall limit
  LIMIT max_results;
END;
$$;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION public.global_search TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.global_semantic_search TO authenticated, service_role;

-- ============================================================
-- 12. Grant permissions on renamed tables
-- ============================================================
-- Grants follow the table, so they are automatically inherited after RENAME.
-- No action needed.

COMMIT;
