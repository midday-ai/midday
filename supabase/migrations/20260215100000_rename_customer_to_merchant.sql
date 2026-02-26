-- Migration: Rename "customer" to "merchant" across all tables
-- This aligns terminology with MCA (Merchant Cash Advance) industry conventions.

BEGIN;

-- ============================================================
-- 1. Rename tables
-- ============================================================
ALTER TABLE "public"."customers" RENAME TO "merchants";
ALTER TABLE "public"."customer_tags" RENAME TO "merchant_tags";

-- ============================================================
-- 2. Rename columns
-- ============================================================

-- merchant_tags (formerly customer_tags)
ALTER TABLE "public"."merchant_tags" RENAME COLUMN "customer_id" TO "merchant_id";

-- invoices
ALTER TABLE "public"."invoices" RENAME COLUMN "customer_id" TO "merchant_id";
ALTER TABLE "public"."invoices" RENAME COLUMN "customer_name" TO "merchant_name";
ALTER TABLE "public"."invoices" RENAME COLUMN "customer_details" TO "merchant_details";

-- invoice_recurring
ALTER TABLE "public"."invoice_recurring" RENAME COLUMN "customer_id" TO "merchant_id";
ALTER TABLE "public"."invoice_recurring" RENAME COLUMN "customer_name" TO "merchant_name";

-- tracker_projects
ALTER TABLE "public"."tracker_projects" RENAME COLUMN "customer_id" TO "merchant_id";

-- mca_deals
ALTER TABLE "public"."mca_deals" RENAME COLUMN "customer_id" TO "merchant_id";

-- merchant_portal_sessions
ALTER TABLE "public"."merchant_portal_sessions" RENAME COLUMN "customer_id" TO "merchant_id";

-- merchant_portal_invites
ALTER TABLE "public"."merchant_portal_invites" RENAME COLUMN "customer_id" TO "merchant_id";

-- merchant_portal_access
ALTER TABLE "public"."merchant_portal_access" RENAME COLUMN "customer_id" TO "merchant_id";

-- payoff_letter_requests
ALTER TABLE "public"."payoff_letter_requests" RENAME COLUMN "customer_id" TO "merchant_id";

-- ============================================================
-- 3. Rename primary key and unique constraints
-- ============================================================
ALTER INDEX "public"."customers_pkey" RENAME TO "merchants_pkey";
ALTER INDEX "public"."customer_tags_pkey" RENAME TO "merchant_tags_pkey";
ALTER INDEX "public"."unique_customer_tag" RENAME TO "unique_merchant_tag";
ALTER INDEX "public"."merchant_invites_email_customer_unique" RENAME TO "merchant_invites_email_merchant_unique";
ALTER INDEX "public"."merchant_access_user_customer_unique" RENAME TO "merchant_access_user_merchant_unique";

-- ============================================================
-- 4. Rename indexes (conditional — some only exist on cloud)
-- ============================================================
DO $$
BEGIN
  -- merchants table (formerly customers)
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'customers_fts') THEN
    ALTER INDEX "public"."customers_fts" RENAME TO "merchants_fts";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_status') THEN
    ALTER INDEX "public"."idx_customers_status" RENAME TO "idx_merchants_status";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_is_archived') THEN
    ALTER INDEX "public"."idx_customers_is_archived" RENAME TO "idx_merchants_is_archived";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_enrichment_status') THEN
    ALTER INDEX "public"."idx_customers_enrichment_status" RENAME TO "idx_merchants_enrichment_status";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_website') THEN
    ALTER INDEX "public"."idx_customers_website" RENAME TO "idx_merchants_website";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_industry') THEN
    ALTER INDEX "public"."idx_customers_industry" RENAME TO "idx_merchants_industry";
  END IF;
END $$;

-- mca_deals
ALTER INDEX "public"."mca_deals_customer_id_idx" RENAME TO "mca_deals_merchant_id_idx";

-- merchant_portal_sessions
ALTER INDEX "public"."merchant_sessions_customer_idx" RENAME TO "merchant_sessions_merchant_idx";

-- merchant_portal_invites
ALTER INDEX "public"."merchant_invites_customer_idx" RENAME TO "merchant_invites_merchant_idx";

-- merchant_portal_access
ALTER INDEX "public"."merchant_access_customer_idx" RENAME TO "merchant_access_merchant_idx";

-- payoff_letter_requests
ALTER INDEX "public"."payoff_requests_customer_idx" RENAME TO "payoff_requests_merchant_idx";

-- ============================================================
-- 5. Rename foreign key constraints (conditional — some only exist on cloud)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customers_team_id_fkey') THEN
    ALTER TABLE "public"."merchants" RENAME CONSTRAINT "customers_team_id_fkey" TO "merchants_team_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customer_tags_customer_id_fkey') THEN
    ALTER TABLE "public"."merchant_tags" RENAME CONSTRAINT "customer_tags_customer_id_fkey" TO "merchant_tags_merchant_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customer_tags_tag_id_fkey') THEN
    ALTER TABLE "public"."merchant_tags" RENAME CONSTRAINT "customer_tags_tag_id_fkey" TO "merchant_tags_tag_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customer_tags_team_id_fkey') THEN
    ALTER TABLE "public"."merchant_tags" RENAME CONSTRAINT "customer_tags_team_id_fkey" TO "merchant_tags_team_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoices_customer_id_fkey') THEN
    ALTER TABLE "public"."invoices" RENAME CONSTRAINT "invoices_customer_id_fkey" TO "invoices_merchant_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoice_recurring_customer_id_fkey') THEN
    ALTER TABLE "public"."invoice_recurring" RENAME CONSTRAINT "invoice_recurring_customer_id_fkey" TO "invoice_recurring_merchant_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tracker_projects_customer_id_fkey') THEN
    ALTER TABLE "public"."tracker_projects" RENAME CONSTRAINT "tracker_projects_customer_id_fkey" TO "tracker_projects_merchant_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'mca_deals_customer_id_fkey') THEN
    ALTER TABLE "public"."mca_deals" RENAME CONSTRAINT "mca_deals_customer_id_fkey" TO "mca_deals_merchant_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'merchant_portal_sessions_customer_id_fkey') THEN
    ALTER TABLE "public"."merchant_portal_sessions" RENAME CONSTRAINT "merchant_portal_sessions_customer_id_fkey" TO "merchant_portal_sessions_merchant_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'merchant_portal_invites_customer_id_fkey') THEN
    ALTER TABLE "public"."merchant_portal_invites" RENAME CONSTRAINT "merchant_portal_invites_customer_id_fkey" TO "merchant_portal_invites_merchant_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'merchant_portal_access_customer_id_fkey') THEN
    ALTER TABLE "public"."merchant_portal_access" RENAME CONSTRAINT "merchant_portal_access_customer_id_fkey" TO "merchant_portal_access_merchant_id_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payoff_letter_requests_customer_id_fkey') THEN
    ALTER TABLE "public"."payoff_letter_requests" RENAME CONSTRAINT "payoff_letter_requests_customer_id_fkey" TO "payoff_letter_requests_merchant_id_fkey";
  END IF;
END $$;

-- ============================================================
-- 6. Update RLS policies (conditional — private schema only exists on cloud)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'private') THEN
    -- Drop and recreate policies on merchants table (formerly customers)
    DROP POLICY IF EXISTS "Customers can be handled by members of the team" ON "public"."merchants";
    EXECUTE 'CREATE POLICY "Merchants can be handled by members of the team"
      ON "public"."merchants"
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';

    -- Drop and recreate policies on merchant_tags (formerly customer_tags)
    DROP POLICY IF EXISTS "Tags can be handled by a member of the team" ON "public"."merchant_tags";
    EXECUTE 'CREATE POLICY "Tags can be handled by a member of the team"
      ON "public"."merchant_tags"
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy update — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================================
-- 7. Update global search functions to use new table/column names
-- ============================================================
-- The global search functions reference customers table and customer_name column.
-- We must drop and recreate with the SAME signatures to avoid stale overloads.

-- Drop the old overloads so they don't linger with stale `customers` references
DROP FUNCTION IF EXISTS public.global_search(text, uuid, text, integer, integer, numeric);
DROP FUNCTION IF EXISTS public.global_semantic_search(uuid, text, text, text, text[], numeric, numeric, numeric, text, text, text, text, text, integer, integer);

-- Recreate global_search with the SAME 6-param signature (matches TypeScript caller)
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

  -- === Invoices ===
  SELECT * FROM (
    SELECT
      i.id::text,
      'invoice'::text      AS type,
      COALESCE(i.invoice_number, 'Invoice') AS title,
      CASE WHEN v_has_search THEN ts_rank(i.fts, v_tsquery)::float ELSE 1.0 END AS relevance,
      i.created_at::text,
      jsonb_build_object(
        'invoice_number', i.invoice_number,
        'status',         i.status,
        'amount',         i.amount,
        'currency',       i.currency,
        'template',       jsonb_build_object('size', i.template->>'size')
      ) AS data
    FROM invoices i
    WHERE i.team_id = p_team_id
      AND (NOT v_has_search OR i.fts @@ v_tsquery
           OR i.invoice_number ILIKE '%' || p_search_term || '%'
           OR i.merchant_name ILIKE '%' || p_search_term || '%')
      AND (NOT v_has_search OR ts_rank(i.fts, v_tsquery) >= p_relevance_threshold
           OR i.invoice_number ILIKE '%' || p_search_term || '%'
           OR i.merchant_name ILIKE '%' || p_search_term || '%')
    ORDER BY
      CASE WHEN v_has_search THEN ts_rank(i.fts, v_tsquery) ELSE 0 END DESC,
      i.created_at DESC
    LIMIT p_items_per_table
  ) AS inv_results

  UNION ALL

  -- === Merchants (no fts column, use ILIKE) ===
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

-- Recreate global_semantic_search with updated table/column references
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

  -- === Invoices ===
  SELECT * FROM (
    SELECT
      i.id::text,
      'invoice'::text      AS type,
      COALESCE(i.invoice_number, 'Invoice') AS title,
      CASE WHEN v_has_search THEN ts_rank(i.fts, v_tsquery)::float ELSE 1.0 END AS relevance,
      i.created_at::text,
      jsonb_build_object(
        'invoice_number', i.invoice_number,
        'status',         i.status,
        'amount',         i.amount,
        'currency',       i.currency,
        'template',       jsonb_build_object('size', i.template->>'size')
      ) AS data
    FROM invoices i
    WHERE i.team_id = global_semantic_search.team_id
      AND (v_all_types OR 'invoice' = ANY(types))
      AND (NOT v_has_search OR i.fts @@ v_tsquery OR i.invoice_number ILIKE '%' || search_term || '%')
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
  ) AS inv_results

  UNION ALL

  -- === Merchants (no fts column, use ILIKE) ===
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

-- Re-grant execute permissions after dropping and recreating
GRANT EXECUTE ON FUNCTION public.global_search TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.global_semantic_search TO authenticated, service_role;

-- ============================================================
-- 8. Grant permissions on renamed tables
-- ============================================================
-- Grants follow the table, so they are automatically inherited after RENAME.
-- No action needed.

COMMIT;
