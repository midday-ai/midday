-- ===== 0002_functions_triggers: run AFTER 0001_baseline (Drizzle tables exist) =====
-- Source: lead-verified on pgvector/pgvector:pg17 against the full generated schema (2026-10-04).
-- Sections B-H, J: ported from 2024 Supabase dumps (git c5ac672f3^:apps/api/supabase/migrations/*).
-- Sections I, K: RECONSTRUCTED (no source exists). Section L: optional invoices.updated_at.
-- Section A (schema fix-ups) intentionally removed: those fixes are done in schema.ts in Phase 02.

-- [B] transaction_categories.slug on insert (20240624104607:878-908, :348-358, trigger :1284)
CREATE OR REPLACE FUNCTION public.slugify(value text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT AS $_$
  with "unaccented" as (select unaccent("value") as "value"),
  "lowercase" as (select lower("value") as "value" from "unaccented"),
  "removed_quotes" as (select regexp_replace("value", '[''"]+', '', 'gi') as "value" from "lowercase"),
  "hyphenated" as (select regexp_replace("value", '[^a-z0-9\\-_]+', '-', 'gi') as "value" from "removed_quotes"),
  "trimmed" as (select regexp_replace(regexp_replace("value", '\-+$', ''), '^\-', '') as "value" from "hyphenated")
  select "value" from "trimmed";
$_$;

CREATE OR REPLACE FUNCTION public.generate_slug_from_name() RETURNS trigger
LANGUAGE plpgsql AS $$
begin
  if new.system is true then return new; end if;
  new.slug := public.slugify(new.name);
  return new;
end
$$;
DROP TRIGGER IF EXISTS generate_category_slug ON public.transaction_categories;
CREATE TRIGGER generate_category_slug BEFORE INSERT ON public.transaction_categories
  FOR EACH ROW EXECUTE FUNCTION public.generate_slug_from_name();

-- [C] category delete -> transactions.category_slug = NULL (20240624104607:945-958, trigger :1292)
CREATE OR REPLACE FUNCTION public.update_transactions_on_category_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
begin
  update transactions set category_slug = null
  where category_slug = old.slug and team_id = old.team_id;
  return old;
end;
$$;
DROP TRIGGER IF EXISTS trigger_update_transactions_category ON public.transaction_categories;
CREATE TRIGGER trigger_update_transactions_category BEFORE DELETE ON public.transaction_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_transactions_on_category_delete();

-- [D] transactions.base_amount/base_currency on insert (trigger 20240917165251:2098).
--     Logic of 20240917165251:512-543 + exception guard of 20241007083408:213-253 (whose body was broken: base_balance).
CREATE OR REPLACE FUNCTION public.calculate_transaction_base_amount() RETURNS trigger
LANGUAGE plpgsql AS $$
declare team_base_currency text; exchange_rate numeric;
begin
  begin
    select base_currency into team_base_currency from teams where id = new.team_id;
    if new.currency = team_base_currency or team_base_currency is null then
      new.base_amount := new.amount;
      new.base_currency := new.currency;
    else
      select rate into exchange_rate from exchange_rates
      where base = new.currency and target = team_base_currency limit 1;
      new.base_amount := round(new.amount * exchange_rate, 2);  -- NULL when no rate
      new.base_currency := team_base_currency;
    end if;
  exception when others then
    raise log 'Error in calculate_transaction_base_amount: %', sqlerrm;
  end;
  return new;
end;
$$;
DROP TRIGGER IF EXISTS trigger_calculate_transaction_base_amount_before_insert ON public.transactions;
CREATE TRIGGER trigger_calculate_transaction_base_amount_before_insert BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.calculate_transaction_base_amount();

-- [E] bank_accounts.base_balance (body 20241007083408:119-161 as-is; triggers 20240917165251:2086,2088)
CREATE OR REPLACE FUNCTION public.calculate_bank_account_base_balance() RETURNS trigger
LANGUAGE plpgsql AS $$
declare team_base_currency text; exchange_rate numeric;
begin
  begin
    select base_currency into team_base_currency from teams where id = new.team_id;
    if new.currency = team_base_currency or team_base_currency is null then
      new.base_balance := new.balance;
      new.base_currency := new.currency;
    else
      select rate into exchange_rate from exchange_rates
      where base = new.currency and target = team_base_currency limit 1;
      if exchange_rate is null then
        raise exception 'Exchange rate not found for % to %', new.currency, team_base_currency;
      end if;
      new.base_balance := round(new.balance * exchange_rate, 2);
      new.base_currency := team_base_currency;
    end if;
    return new;
  exception when others then
    raise log 'Error in calculate_bank_account_base_balance: %', sqlerrm;
    new.base_balance := new.balance;
    new.base_currency := new.currency;
    return new;
  end;
end;
$$;
DROP TRIGGER IF EXISTS trigger_calculate_bank_account_base_balance_before_insert ON public.bank_accounts;
CREATE TRIGGER trigger_calculate_bank_account_base_balance_before_insert BEFORE INSERT ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.calculate_bank_account_base_balance();
DROP TRIGGER IF EXISTS trigger_calculate_bank_account_base_balance_before_update ON public.bank_accounts;
CREATE TRIGGER trigger_calculate_bank_account_base_balance_before_update BEFORE UPDATE OF balance ON public.bank_accounts
  FOR EACH ROW WHEN (old.balance IS DISTINCT FROM new.balance)
  EXECUTE FUNCTION public.calculate_bank_account_base_balance();

-- [F] inbox.base_amount on amount UPDATE only (body 20241007083408:163-211 as-is; trigger 20240917165251:2092)
CREATE OR REPLACE FUNCTION public.calculate_inbox_base_amount() RETURNS trigger
LANGUAGE plpgsql AS $$
declare team_base_currency text; exchange_rate numeric;
begin
  begin
    select base_currency into team_base_currency from teams where id = new.team_id;
    if new.currency = team_base_currency or team_base_currency is null then
      new.base_amount := new.amount;
      new.base_currency := new.currency;
    else
      begin
        select rate into exchange_rate from exchange_rates
        where base = new.currency and target = team_base_currency limit 1;
        if exchange_rate is null then
          raise exception 'Exchange rate not found for % to %', new.currency, team_base_currency;
        end if;
        new.base_amount := round(new.amount * exchange_rate, 2);
        new.base_currency := team_base_currency;
      exception when others then
        raise log 'Error calculating exchange rate: %', sqlerrm;
        new.base_amount := new.amount;
        new.base_currency := new.currency;
      end;
    end if;
  exception when others then
    raise log 'Error in calculate_inbox_base_amount: %', sqlerrm;
    new.base_amount := new.amount;
    new.base_currency := new.currency;
  end;
  return new;
end;
$$;
DROP TRIGGER IF EXISTS trigger_calculate_inbox_base_amount_before_update ON public.inbox;
CREATE TRIGGER trigger_calculate_inbox_base_amount_before_update BEFORE UPDATE ON public.inbox
  FOR EACH ROW WHEN (old.amount IS DISTINCT FROM new.amount)
  EXECUTE FUNCTION public.calculate_inbox_base_amount();

-- [G] learned categorisation (bodies 20241007083408:356-416; triggers 20240917165251:2100, 20240624104607:1290)
CREATE OR REPLACE FUNCTION public.update_enrich_transaction() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if new.category_slug is null then
    begin
      new.category_slug := (
        select te.category_slug
        from transaction_enrichments te
        join transaction_categories tc on tc.slug = te.category_slug and tc.team_id = new.team_id
        where te.name = new.name
          and (te.system = true or te.team_id = new.team_id)
          and te.category_slug != 'income'
        limit 1);
    exception when others then
      new.category_slug := null;
    end;
  end if;
  return new;
end;
$$;
DROP TRIGGER IF EXISTS enrich_transaction ON public.transactions;
CREATE TRIGGER enrich_transaction BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_enrich_transaction();

CREATE OR REPLACE FUNCTION public.upsert_transaction_enrichment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare transaction_name text; system_value boolean;
begin
  begin
    select new.name into transaction_name;
    select system into system_value from transaction_categories as tc
    where tc.slug = new.category_slug and tc.team_id = new.team_id;
    if new.team_id is not null then
      insert into transaction_enrichments(name, category_slug, team_id, system)
      values (transaction_name, new.category_slug, new.team_id, system_value)
      on conflict (team_id, name) do update set category_slug = excluded.category_slug;
    end if;
    return new;
  exception when others then
    raise notice 'Error in upsert_transaction_enrichment: %', sqlerrm;
    return new;
  end;
end;
$$;
DROP TRIGGER IF EXISTS on_updated_transaction_category ON public.transactions;
CREATE TRIGGER on_updated_transaction_category AFTER UPDATE OF category_slug ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.upsert_transaction_enrichment();

-- [H] recurring detection (body 20241007083408:255-354 as-is; trigger 20240917165251:2094)
CREATE OR REPLACE FUNCTION public.detect_recurring_transactions() RETURNS trigger
LANGUAGE plpgsql AS $$
declare last_transaction record; days_diff numeric; frequency_type transaction_frequency; search_query text;
begin
  begin
    search_query := regexp_replace(
      regexp_replace(coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, ''), '[^\w\s]', ' ', 'g'),
      '\s+', ' ', 'g');
    search_query := trim(search_query);
    search_query := (SELECT string_agg(lexeme || ':*', ' & ')
                     FROM unnest(string_to_array(search_query, ' ')) lexeme WHERE length(lexeme) > 0);

    SELECT * INTO last_transaction FROM transactions
    WHERE team_id = NEW.team_id AND id <> NEW.id AND date < NEW.date
      AND category_slug != 'income' AND category_slug != 'transfer'
      AND fts_vector @@ to_tsquery('english', search_query)
    ORDER BY ts_rank(fts_vector, to_tsquery('english', search_query)) DESC, date DESC
    LIMIT 1;

    IF last_transaction.id IS NOT NULL THEN
      IF last_transaction.frequency IS NOT NULL AND last_transaction.recurring = true THEN
        frequency_type := last_transaction.frequency;
        UPDATE transactions SET recurring = true, frequency = frequency_type WHERE id = NEW.id;
      ELSIF last_transaction.recurring = false THEN
        UPDATE transactions SET recurring = false, frequency = NULL WHERE id = NEW.id;
      ELSE
        days_diff := extract(epoch FROM (NEW.date::timestamp - last_transaction.date::timestamp)) / (24 * 60 * 60);
        CASE
          WHEN days_diff BETWEEN 1 AND 16 THEN frequency_type := 'weekly'::transaction_frequency;
          WHEN days_diff BETWEEN 18 AND 80 THEN frequency_type := 'monthly'::transaction_frequency;
          WHEN days_diff BETWEEN 330 AND 370 THEN frequency_type := 'annually'::transaction_frequency;
          ELSE frequency_type := 'irregular'::transaction_frequency;
        END CASE;
        IF frequency_type != 'irregular'::transaction_frequency THEN
          UPDATE transactions SET recurring = true, frequency = frequency_type WHERE id = NEW.id;
        ELSE
          UPDATE transactions SET recurring = false, frequency = NULL WHERE id = NEW.id;
        END IF;
      END IF;
    ELSE
      UPDATE transactions SET recurring = false, frequency = NULL WHERE id = NEW.id;
    END IF;
  exception when others then
    raise notice 'An error occurred: %', sqlerrm;
    RETURN NEW;
  end;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS check_recurring_transactions ON public.transactions;
CREATE TRIGGER check_recurring_transactions AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.detect_recurring_transactions();

-- [I] RECONSTRUCTED (no source exists): documents.fts_simple/fts_english/fts_language
CREATE OR REPLACE FUNCTION public.documents_update_fts() RETURNS trigger
LANGUAGE plpgsql AS $$
declare v_text text; v_cfg regconfig;
begin
  v_text := concat_ws(' ', new.title, new.summary, new.tag,
                      regexp_replace(coalesce(new.name, ''), '^.*/', ''), new.content);
  select c.oid::regconfig into v_cfg from pg_catalog.pg_ts_config c where c.cfgname = new.language limit 1;
  new.fts_simple   := to_tsvector('simple'::regconfig, v_text);
  new.fts_english  := to_tsvector('english'::regconfig, v_text);
  new.fts_language := to_tsvector(coalesce(v_cfg, 'simple'::regconfig), v_text);
  return new;
end;
$$;
DROP TRIGGER IF EXISTS documents_update_fts ON public.documents;
CREATE TRIGGER documents_update_fts
  BEFORE INSERT OR UPDATE OF name, title, summary, tag, content, language ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.documents_update_fts();

-- [J] read functions with surviving bodies
CREATE OR REPLACE FUNCTION public.total_duration(tracker_projects) RETURNS integer   -- 20240624104607:910-921
LANGUAGE sql AS $_$
  select sum(tracker_entries.duration) as total_duration
  from tracker_projects join tracker_entries on tracker_projects.id = tracker_entries.project_id
  where tracker_projects.id = $1.id
  group by tracker_projects.id;
$_$;

CREATE OR REPLACE FUNCTION public.get_project_total_amount(tracker_projects) RETURNS numeric  -- 20241007083408:62-79
LANGUAGE sql AS $function$
  SELECT COALESCE(
    (SELECT CASE WHEN $1.rate IS NOT NULL THEN ROUND(SUM(te.duration) * $1.rate / 3600, 2) ELSE 0 END
     FROM public.tracker_entries te WHERE te.project_id = $1.id), 0);
$function$;

CREATE OR REPLACE FUNCTION public.get_assigned_users_for_project(tracker_projects) RETURNS json  -- 20241007083408:40-60
LANGUAGE sql AS $function$
  SELECT COALESCE(
    (SELECT json_agg(json_build_object('user_id', u.id, 'full_name', u.full_name, 'avatar_url', u.avatar_url))
     FROM (SELECT DISTINCT u.id, u.full_name, u.avatar_url
           FROM public.users u JOIN public.tracker_entries te ON u.id = te.assigned_id
           WHERE te.project_id = $1.id) u),
    '[]'::json);
$function$;

CREATE OR REPLACE FUNCTION public.get_bank_account_currencies(team_id uuid) RETURNS TABLE(currency text)  -- 20240624104607:361-368
LANGUAGE plpgsql AS $$
begin
  return query select distinct bank_accounts.currency from bank_accounts
    where bank_accounts.team_id = get_bank_account_currencies.team_id order by bank_accounts.currency;
end;
$$;

-- [K] RECONSTRUCTED read functions (no body anywhere)
CREATE OR REPLACE FUNCTION public.get_team_bank_accounts_balances(team_id uuid)
RETURNS TABLE(id uuid, currency text, balance double precision, name text, logo_url text)
LANGUAGE sql STABLE AS $$
  select ba.id, ba.currency, coalesce(ba.balance, 0)::double precision, ba.name, bc.logo_url
  from public.bank_accounts ba
  left join public.bank_connections bc on bc.id = ba.bank_connection_id
  where ba.team_id = get_team_bank_accounts_balances.team_id and ba.enabled = true
  order by coalesce(ba.base_balance, ba.balance) desc nulls last;
$$;

CREATE OR REPLACE FUNCTION public.match_similar_documents_by_title(
  source_document_id uuid, p_team_id uuid, match_threshold double precision, match_count integer)
RETURNS TABLE(id uuid, name text, metadata jsonb, path_tokens text[], tag text, title text, summary text,
              title_similarity double precision)
LANGUAGE sql STABLE AS $$
  with src as (select d.title from public.documents d
               where d.id = source_document_id and d.team_id = p_team_id and d.title is not null)
  select d.id, d.name, d.metadata, d.path_tokens, d.tag, d.title, d.summary,
         similarity(d.title, src.title)::double precision as title_similarity
  from public.documents d, src
  where d.team_id = p_team_id and d.id <> source_document_id and d.title is not null
    and coalesce(d.name, '') not like '%.folderPlaceholder'
    and similarity(d.title, src.title) > match_threshold
  order by title_similarity desc, d.created_at desc
  limit match_count;
$$;

CREATE OR REPLACE FUNCTION public.global_search(
  p_search_term text DEFAULT NULL, p_team_id uuid DEFAULT NULL, p_search_lang text DEFAULT 'english',
  p_limit integer DEFAULT 30, p_items_per_table_limit integer DEFAULT 5,
  p_relevance_threshold double precision DEFAULT 0.01)
RETURNS TABLE(id uuid, type text, title text, relevance double precision, created_at timestamptz, data jsonb)
LANGUAGE plpgsql STABLE AS $$
#variable_conflict use_column
declare
  v_term text := nullif(btrim(coalesce(p_search_term, '')), '');
  v_q text; v_tsq tsquery; v_tsq_s tsquery; v_like text;
  v_per int := coalesce(p_items_per_table_limit, 5);
  v_lim int := coalesce(p_limit, 30);
  v_thr double precision := coalesce(p_relevance_threshold, 0.01);
begin
  if p_team_id is null then return; end if;
  if v_term is not null then
    select string_agg(w || ':*', ' & ') into v_q
    from regexp_split_to_table(lower(regexp_replace(v_term, '[^[:alnum:]]+', ' ', 'g')), '\s+') as w where w <> '';
    if v_q is not null then
      v_tsq := to_tsquery('english'::regconfig, v_q);
      v_tsq_s := to_tsquery('simple'::regconfig, v_q);
    end if;
    v_like := '%' || v_term || '%';
  end if;

  return query
  select r.id, r.type, r.title, r.relevance, r.created_at, r.data from (
    (select t.id, 'transaction'::text as type, t.name as title,
            coalesce(ts_rank(t.fts_vector, v_tsq), 0)::double precision as relevance, t.created_at,
            (to_jsonb(t) - 'fts_vector') || jsonb_build_object('url', '/transactions?transactionId=' || t.id) as data
     from public.transactions t
     where t.team_id = p_team_id
       and (v_term is null or (t.fts_vector @@ v_tsq and ts_rank(t.fts_vector, v_tsq) >= v_thr) or t.name ilike v_like)
     order by 4 desc, t.date desc, t.created_at desc limit v_per)
    union all
    (select c.id, 'customer', c.name, coalesce(ts_rank(c.fts, v_tsq), 0)::double precision, c.created_at,
            to_jsonb(c) - 'fts'
     from public.customers c
     where c.team_id = p_team_id
       and (v_term is null or (c.fts @@ v_tsq and ts_rank(c.fts, v_tsq) >= v_thr) or c.name ilike v_like)
     order by 4 desc, c.created_at desc limit v_per)
    union all
    (select i.id, 'invoice', coalesce(i.invoice_number, i.customer_name),
            coalesce(ts_rank(i.fts, v_tsq), 0)::double precision, i.created_at,
            to_jsonb(i) - 'fts' - 'line_items' - 'from_details' - 'customer_details' - 'payment_details'
                        - 'note_details' - 'top_block' - 'bottom_block'
     from public.invoices i
     where i.team_id = p_team_id
       and (v_term is null or (i.fts @@ v_tsq and ts_rank(i.fts, v_tsq) >= v_thr)
            or i.invoice_number ilike v_like or i.customer_name ilike v_like)
     order by 4 desc, i.created_at desc limit v_per)
    union all
    (select p.id, 'tracker_project', p.name, coalesce(ts_rank(p.fts, v_tsq), 0)::double precision, p.created_at,
            to_jsonb(p) - 'fts'
     from public.tracker_projects p
     where p.team_id = p_team_id
       and (v_term is null or (p.fts @@ v_tsq and ts_rank(p.fts, v_tsq) >= v_thr) or p.name ilike v_like)
     order by 4 desc, p.created_at desc limit v_per)
    union all
    (select d.id, 'vault', coalesce(d.title, regexp_replace(coalesce(d.name, ''), '^.*/', '')),
            greatest(coalesce(ts_rank(d.fts_english, v_tsq), 0), coalesce(ts_rank(d.fts_simple, v_tsq_s), 0))::double precision,
            d.created_at,
            to_jsonb(d) - 'fts' - 'fts_simple' - 'fts_english' - 'fts_language' - 'content' - 'body'
     from public.documents d
     where d.team_id = p_team_id and coalesce(d.name, '') not like '%.folderPlaceholder'
       and (v_term is null or d.fts_english @@ v_tsq or d.fts_simple @@ v_tsq_s
            or d.title ilike v_like or d.name ilike v_like)
     order by 4 desc, d.created_at desc limit v_per)
    union all
    (select n.id, 'inbox', coalesce(n.display_name, n.file_name),
            coalesce(ts_rank(n.fts, v_tsq), 0)::double precision, n.created_at, to_jsonb(n) - 'fts'
     from public.inbox n
     where n.team_id = p_team_id and n.status is distinct from 'deleted'
       and (v_term is null or (n.fts @@ v_tsq and ts_rank(n.fts, v_tsq) >= v_thr)
            or n.display_name ilike v_like or n.file_name ilike v_like)
     order by 4 desc, n.created_at desc limit v_per)
  ) r
  order by r.relevance desc, r.created_at desc
  limit v_lim;
end;
$$;

CREATE OR REPLACE FUNCTION public.global_semantic_search(
  team_id uuid, search_term text DEFAULT NULL, start_date text DEFAULT NULL, end_date text DEFAULT NULL,
  types text[] DEFAULT NULL, amount numeric DEFAULT NULL, amount_min numeric DEFAULT NULL,
  amount_max numeric DEFAULT NULL, status text DEFAULT NULL, currency text DEFAULT NULL,
  language text DEFAULT NULL, due_date_start text DEFAULT NULL, due_date_end text DEFAULT NULL,
  max_results integer DEFAULT 20, items_per_table_limit integer DEFAULT 5)
RETURNS TABLE(id uuid, type text, title text, relevance double precision, created_at timestamptz, data jsonb)
LANGUAGE plpgsql STABLE AS $$
#variable_conflict use_column
declare
  v_team uuid := global_semantic_search.team_id;
  v_term text := nullif(btrim(coalesce(global_semantic_search.search_term, '')), '');
  v_from date := nullif(global_semantic_search.start_date, '')::date;
  v_to date := nullif(global_semantic_search.end_date, '')::date;
  v_types text[] := global_semantic_search.types;
  v_amt numeric := global_semantic_search.amount;
  v_min numeric := global_semantic_search.amount_min;
  v_max numeric := global_semantic_search.amount_max;
  v_stat text := global_semantic_search.status;
  v_cur text := upper(nullif(global_semantic_search.currency, ''));
  v_dfrom date := nullif(global_semantic_search.due_date_start, '')::date;
  v_dto date := nullif(global_semantic_search.due_date_end, '')::date;
  v_per int := coalesce(global_semantic_search.items_per_table_limit, 5);
  v_lim int := coalesce(global_semantic_search.max_results, 20);
  v_q text; v_tsq tsquery; v_like text;
begin
  if v_team is null then return; end if;
  if v_term is not null then
    select string_agg(w || ':*', ' | ') into v_q
    from regexp_split_to_table(lower(regexp_replace(v_term, '[^[:alnum:]]+', ' ', 'g')), '\s+') as w where w <> '';
    if v_q is not null then v_tsq := to_tsquery('english'::regconfig, v_q); end if;
    v_like := '%' || v_term || '%';
  end if;

  return query
  select r.id, r.type, r.title, r.relevance, r.created_at, r.data from (
    (select t.id, 'transaction'::text as type, t.name as title,
            coalesce(ts_rank(t.fts_vector, v_tsq), 0)::double precision as relevance, t.created_at,
            (to_jsonb(t) - 'fts_vector') || jsonb_build_object('url', '/transactions?transactionId=' || t.id) as data
     from public.transactions t
     where (v_types is null or 'transactions' = any(v_types)) and t.team_id = v_team
       and (v_term is null or t.fts_vector @@ v_tsq or t.name ilike v_like)
       and (v_from is null or t.date >= v_from) and (v_to is null or t.date <= v_to)
       and (v_amt is null or abs(t.amount) = abs(v_amt))
       and (v_min is null or abs(t.amount) >= v_min) and (v_max is null or abs(t.amount) <= v_max)
       and (v_cur is null or t.currency = v_cur)
     order by 4 desc, t.date desc limit v_per)
    union all
    (select i.id, 'invoice', coalesce(i.invoice_number, i.customer_name),
            coalesce(ts_rank(i.fts, v_tsq), 0)::double precision, i.created_at,
            to_jsonb(i) - 'fts' - 'line_items' - 'from_details' - 'customer_details' - 'payment_details'
                        - 'note_details' - 'top_block' - 'bottom_block'
     from public.invoices i
     where (v_types is null or 'invoices' = any(v_types)) and i.team_id = v_team
       and (v_term is null or i.fts @@ v_tsq or i.invoice_number ilike v_like or i.customer_name ilike v_like)
       and (v_from is null or coalesce(i.issue_date, i.created_at)::date >= v_from)
       and (v_to is null or coalesce(i.issue_date, i.created_at)::date <= v_to)
       and (v_amt is null or i.amount = v_amt)
       and (v_min is null or i.amount >= v_min) and (v_max is null or i.amount <= v_max)
       and (v_stat is null or i.status::text = v_stat) and (v_cur is null or i.currency = v_cur)
       and (v_dfrom is null or i.due_date::date >= v_dfrom) and (v_dto is null or i.due_date::date <= v_dto)
     order by 4 desc, i.created_at desc limit v_per)
    union all
    (select c.id, 'customer', c.name, coalesce(ts_rank(c.fts, v_tsq), 0)::double precision, c.created_at,
            to_jsonb(c) - 'fts'
     from public.customers c
     where (v_types is null or 'customers' = any(v_types)) and c.team_id = v_team
       and (v_term is null or c.fts @@ v_tsq or c.name ilike v_like)
       and (v_from is null or c.created_at::date >= v_from) and (v_to is null or c.created_at::date <= v_to)
     order by 4 desc, c.created_at desc limit v_per)
    union all
    (select p.id, 'tracker_project', p.name, coalesce(ts_rank(p.fts, v_tsq), 0)::double precision, p.created_at,
            to_jsonb(p) - 'fts'
     from public.tracker_projects p
     where (v_types is null or 'tracker_projects' = any(v_types)) and p.team_id = v_team
       and (v_term is null or p.fts @@ v_tsq or p.name ilike v_like)
       and (v_from is null or p.created_at::date >= v_from) and (v_to is null or p.created_at::date <= v_to)
     order by 4 desc, p.created_at desc limit v_per)
    union all
    (select d.id, 'vault', coalesce(d.title, regexp_replace(coalesce(d.name, ''), '^.*/', '')),
            coalesce(ts_rank(d.fts_english, v_tsq), 0)::double precision, d.created_at,
            to_jsonb(d) - 'fts' - 'fts_simple' - 'fts_english' - 'fts_language' - 'content' - 'body'
     from public.documents d
     where (v_types is null or 'documents' = any(v_types)) and d.team_id = v_team
       and coalesce(d.name, '') not like '%.folderPlaceholder'
       and (v_term is null or d.fts_english @@ v_tsq or d.title ilike v_like or d.name ilike v_like)
       and (v_from is null or coalesce(d.date, d.created_at::date) >= v_from)
       and (v_to is null or coalesce(d.date, d.created_at::date) <= v_to)
     order by 4 desc, d.created_at desc limit v_per)
  ) r
  order by r.relevance desc, r.created_at desc
  limit v_lim;
end;
$$;

-- [L] OPTIONAL / UNKNOWN in prod: invoices.updated_at maintenance
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$ begin new.updated_at = now(); return new; end; $$;
DROP TRIGGER IF EXISTS invoices_set_updated_at ON public.invoices;
CREATE TRIGGER invoices_set_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
