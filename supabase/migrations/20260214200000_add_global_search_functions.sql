-- Migration: Add global_search and global_semantic_search functions
-- These are called by the application but were never created in local SQL.

--------------------------------------------------------------------------------
-- global_search
--
-- A lightweight full-text search across the main entity tables.
-- Called from packages/db/src/queries/search.ts -> globalSearchQuery
--
-- Parameters:
--   p_search_term         – text to search for (prefix-matched via tsquery)
--   p_team_id             – restricts results to a single team
--   p_language            – PostgreSQL text search config name (e.g. 'english')
--   p_limit               – maximum total results
--   p_items_per_table     – maximum results per entity type
--   p_relevance_threshold – minimum ts_rank score to include
--------------------------------------------------------------------------------
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
           OR i.customer_name ILIKE '%' || p_search_term || '%')
      AND (NOT v_has_search OR ts_rank(i.fts, v_tsquery) >= p_relevance_threshold
           OR i.invoice_number ILIKE '%' || p_search_term || '%'
           OR i.customer_name ILIKE '%' || p_search_term || '%')
    ORDER BY
      CASE WHEN v_has_search THEN ts_rank(i.fts, v_tsquery) ELSE 0 END DESC,
      i.created_at DESC
    LIMIT p_items_per_table
  ) AS inv_results

  UNION ALL

  -- === Customers (no fts column — use ILIKE) ===
  SELECT * FROM (
    SELECT
      c.id::text,
      'customer'::text AS type,
      c.name           AS title,
      CASE WHEN v_has_search THEN 0.5::float ELSE 1.0 END AS relevance,
      c.created_at::text,
      jsonb_build_object(
        'name',  c.name,
        'email', c.email
      ) AS data
    FROM customers c
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


--------------------------------------------------------------------------------
-- global_semantic_search
--
-- Advanced search with date/amount/status/currency filters and per-type filtering.
-- Called from packages/db/src/queries/search.ts -> globalSemanticSearchQuery
--------------------------------------------------------------------------------
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

  -- === Customers (no fts column — use ILIKE) ===
  SELECT * FROM (
    SELECT
      c.id::text,
      'customer'::text AS type,
      c.name           AS title,
      CASE WHEN v_has_search THEN 0.5::float ELSE 1.0 END AS relevance,
      c.created_at::text,
      jsonb_build_object(
        'name',  c.name,
        'email', c.email
      ) AS data
    FROM customers c
    WHERE c.team_id = global_semantic_search.team_id
      AND (v_all_types OR 'customer' = ANY(types))
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


-- Grant execute to authenticated users (needed since SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.global_search TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.global_semantic_search TO authenticated, service_role;
