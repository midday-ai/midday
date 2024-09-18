create type "public"."connection_status" as enum ('disconnected', 'connected', 'unknown');

create type "public"."inbox_type" as enum ('invoice', 'expense');

create type "public"."transaction_frequency" as enum ('weekly', 'biweekly', 'monthly', 'semi_monthly', 'annually', 'irregular', 'unknown');

drop trigger if exists "match_transaction" on "public"."transactions";

drop trigger if exists "enrich_transaction" on "public"."transactions";

revoke delete on table "public"."total_amount" from "anon";

revoke insert on table "public"."total_amount" from "anon";

revoke references on table "public"."total_amount" from "anon";

revoke select on table "public"."total_amount" from "anon";

revoke trigger on table "public"."total_amount" from "anon";

revoke truncate on table "public"."total_amount" from "anon";

revoke update on table "public"."total_amount" from "anon";

revoke delete on table "public"."total_amount" from "authenticated";

revoke insert on table "public"."total_amount" from "authenticated";

revoke references on table "public"."total_amount" from "authenticated";

revoke select on table "public"."total_amount" from "authenticated";

revoke trigger on table "public"."total_amount" from "authenticated";

revoke truncate on table "public"."total_amount" from "authenticated";

revoke update on table "public"."total_amount" from "authenticated";

revoke delete on table "public"."total_amount" from "service_role";

revoke insert on table "public"."total_amount" from "service_role";

revoke references on table "public"."total_amount" from "service_role";

revoke select on table "public"."total_amount" from "service_role";

revoke trigger on table "public"."total_amount" from "service_role";

revoke truncate on table "public"."total_amount" from "service_role";

revoke update on table "public"."total_amount" from "service_role";

drop table "public"."total_amount";

alter type "public"."reportTypes" rename to "reportTypes__old_version_to_be_dropped";

create type "public"."reportTypes" as enum ('profit', 'revenue', 'burn_rate', 'expense');

create table "public"."documents" (
    "id" uuid not null default gen_random_uuid(),
    "name" text,
    "created_at" timestamp with time zone default now(),
    "metadata" jsonb,
    "path_tokens" text[],
    "team_id" uuid,
    "parent_id" text,
    "object_id" uuid,
    "owner_id" uuid,
    "tag" text,
    "title" text,
    "body" text,
    "fts" tsvector generated always as (to_tsvector('english'::regconfig, ((title || ' '::text) || body))) stored
);


alter table "public"."documents" enable row level security;

create table "public"."exchange_rates" (
    "id" uuid not null default gen_random_uuid(),
    "base" text,
    "rate" numeric,
    "target" text,
    "updated_at" timestamp with time zone
);


alter table "public"."exchange_rates" enable row level security;

alter table "public"."reports" alter column type type "public"."reportTypes" using type::text::"public"."reportTypes";

drop type "public"."reportTypes__old_version_to_be_dropped";

alter table "public"."bank_accounts" drop column "last_accessed";

alter table "public"."bank_accounts" add column "base_balance" numeric;

alter table "public"."bank_accounts" add column "base_currency" text;

alter table "public"."bank_connections" add column "error_details" text;

alter table "public"."bank_connections" add column "last_accessed" timestamp with time zone;

alter table "public"."bank_connections" add column "reference_id" text;

alter table "public"."bank_connections" add column "status" connection_status default 'connected'::connection_status;

alter table "public"."inbox" drop column "due_date";

alter table "public"."inbox" add column "base_amount" numeric;

alter table "public"."inbox" add column "base_currency" text;

alter table "public"."inbox" add column "date" date;

alter table "public"."inbox" add column "description" text;

alter table "public"."inbox" add column "type" inbox_type;

alter table "public"."teams" add column "base_currency" text;

alter table "public"."teams" add column "document_classification" boolean default false;

alter table "public"."transaction_enrichments" alter column "system" set default false;

alter table "public"."transactions" drop column "currency_rate";

alter table "public"."transactions" drop column "currency_source";

alter table "public"."transactions" add column "base_amount" numeric;

alter table "public"."transactions" add column "base_currency" text;

alter table "public"."transactions" add column "frequency" transaction_frequency;

alter table "public"."transactions" add column "fts_vector" tsvector generated always as (to_tsvector('english'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)))) stored;

alter table "public"."transactions" add column "recurring" boolean;

alter table "public"."transactions" add column "updated_at" timestamp with time zone;

alter table "public"."users" add column "timezone" text;

CREATE UNIQUE INDEX currencies_pkey ON public.exchange_rates USING btree (id);

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE INDEX documents_team_id_idx ON public.documents USING btree (team_id);

CREATE INDEX documents_team_id_parent_id_idx ON public.documents USING btree (team_id, parent_id);

CREATE INDEX exchange_rates_base_target_idx ON public.exchange_rates USING btree (base, target);

CREATE INDEX idx_transactions_date ON public.transactions USING btree (date);

CREATE INDEX idx_transactions_fts ON public.transactions USING gin (fts_vector);

CREATE INDEX idx_transactions_fts_vector ON public.transactions USING gin (fts_vector);

CREATE INDEX idx_transactions_id ON public.transactions USING btree (id);

CREATE INDEX idx_transactions_name ON public.transactions USING btree (name);

CREATE INDEX idx_transactions_name_trigram ON public.transactions USING gin (name gin_trgm_ops);

CREATE INDEX idx_transactions_team_id_date_name ON public.transactions USING btree (team_id, date, name);

CREATE INDEX idx_transactions_team_id_name ON public.transactions USING btree (team_id, name);

CREATE INDEX idx_trgm_name ON public.transactions USING gist (name gist_trgm_ops);

CREATE UNIQUE INDEX unique_rate ON public.exchange_rates USING btree (base, target);

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."exchange_rates" add constraint "currencies_pkey" PRIMARY KEY using index "currencies_pkey";

alter table "public"."documents" add constraint "documents_created_by_fkey" FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."documents" validate constraint "documents_created_by_fkey";

alter table "public"."documents" add constraint "storage_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE not valid;

alter table "public"."documents" validate constraint "storage_team_id_fkey";

alter table "public"."exchange_rates" add constraint "unique_rate" UNIQUE using index "unique_rate";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_amount_similarity(transaction_currency text, inbox_currency text, transaction_amount numeric, inbox_amount numeric)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
  similarity_score numeric := 0;
  relative_difference numeric;
  abs_transaction_amount numeric;
  abs_inbox_amount numeric;
begin
  if transaction_currency = inbox_currency then
    abs_transaction_amount := abs(transaction_amount);
    abs_inbox_amount := abs(inbox_amount);
    
    relative_difference := abs(abs_transaction_amount - abs_inbox_amount) / greatest(abs_transaction_amount, abs_inbox_amount, 1);
    
    if relative_difference < 0.02 then -- Further relaxed threshold for exact matches
      similarity_score := 1;
    elsif relative_difference < 0.08 then -- Further relaxed threshold for very close matches
      similarity_score := 0.9;
    elsif relative_difference < 0.15 then -- Added an intermediate tier
      similarity_score := 0.8;
    else
      similarity_score := 1 - least(relative_difference, 1);
      similarity_score := similarity_score * similarity_score * 0.9; -- Increased quadratic scaling factor for more leniency
    end if;
  else
    -- Add a small similarity score even if currencies don't match
    similarity_score := 0.1;
  end if;

  return round(least(similarity_score, 1), 2);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_bank_account_base_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
    team_base_currency text;
    exchange_rate numeric;
begin
    select base_currency into team_base_currency
    from teams
    where id = new.team_id;

    -- If the account currency is the same as the team's base currency or the team's base currency is null
    if new.currency = team_base_currency or team_base_currency is null then
        new.base_balance := new.balance;
        new.base_currency := new.currency;
    else
        select rate into exchange_rate
        from exchange_rates
        where base = new.currency
        and target = team_base_currency
        limit 1;

        new.base_balance := round(new.balance * exchange_rate, 2);
        new.base_currency := team_base_currency;
    end if;

    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_base_amount_score(transaction_base_currency text, inbox_base_currency text, transaction_base_amount numeric, inbox_base_amount numeric)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
  final_score numeric := 0;
  relative_amount_difference numeric;
begin
  if transaction_base_currency = inbox_base_currency then
    -- Normalize amounts by taking their absolute values
    declare
      abs_transaction_amount numeric := abs(transaction_base_amount);
      abs_inbox_amount numeric := abs(inbox_base_amount);
    begin
      -- Calculate the relative difference between normalized base amounts
      relative_amount_difference := abs(abs_transaction_amount - abs_inbox_amount) / greatest(abs_transaction_amount, abs_inbox_amount, 1);
      
      -- Calculate score based on the similarity of amounts
      final_score := 1 - least(relative_amount_difference, 1);
      
      -- Apply quadratic scaling to give more weight to very close matches
      final_score := final_score * final_score * 0.5;
      
      -- Add a bonus for very close matches, but ensure it doesn't reach 1
      if relative_amount_difference < 0.1 then
        final_score := final_score + 0.3;
      end if;
    end;
  end if;

  -- Ensure the score never exceeds 0.8 and round to two decimal places
  return round(least(final_score, 0.8), 2);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_date_proximity_score(t_date date, i_date date)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
  v_date_diff integer;
  v_score numeric := 0;
begin
  -- Calculate the absolute difference in days
  v_date_diff := abs(t_date - i_date);
  
  -- Calculate score based on date proximity
  -- We give higher score for dates that are closer
  if v_date_diff = 0 then
    v_score := 0.8;  -- Increased from 0.5 to 0.8 for exact matches
  elsif v_date_diff <= 3 then
    -- Higher score for dates within 3 days
    v_score := round(0.7 * (1 - (v_date_diff / 3.0))::numeric, 2);
  elsif v_date_diff <= 7 then
    -- Moderate score for dates within a week
    v_score := round(0.5 * (1 - ((v_date_diff - 3) / 4.0))::numeric, 2);
  elsif v_date_diff <= 30 then
    -- Lower score for dates within a month
    v_score := round(0.3 * (1 - ln(v_date_diff - 6) / ln(25))::numeric, 2);
  end if;

  return v_score;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_date_similarity(transaction_date date, inbox_date date)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
  date_difference integer;
begin
  date_difference := abs(transaction_date - inbox_date);
  
  return case
    when date_difference = 0 then 1
    when date_difference <= 3 then 0.9 -- Increased score for 1-3 day difference
    when date_difference <= 7 then 0.7 -- Increased score for 4-7 day difference
    when date_difference <= 14 then 0.5 -- Increased score for 8-14 day difference
    when date_difference <= 30 then 0.3 -- Added score for 15-30 day difference
    else 0.1 -- Small base score for any match
  end;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_inbox_base_amount()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
    team_base_currency text;
    exchange_rate numeric;
begin
    select base_currency into team_base_currency
    from teams
    where id = new.team_id;

    -- if the inbox item currency is the same as the team's base currency or the team's base currency is null
    if new.currency = team_base_currency or team_base_currency is null then
        new.base_amount := new.amount;
        new.base_currency := new.currency;
    else
        select rate into exchange_rate
        from exchange_rates
        where base = new.currency
        and target = team_base_currency
        limit 1;

        new.base_amount := round(new.amount * exchange_rate, 2);
        new.base_currency := team_base_currency;
    end if;

    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_match_score(t_record record, i_record record)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
  v_score numeric := 0;
  v_date_diff integer;
  v_name_similarity numeric;
  v_amount_diff numeric;
begin
  -- Exact currency and amount match
  if t_record.currency = i_record.currency and abs(t_record.abs_amount - i_record.amount) < 0.01 then
    v_score := 1;
  else
    -- Base amount and currency similarity
    v_score := v_score + calculate_base_amount_score(
      t_record.base_currency,
      i_record.base_currency,
      t_record.base_amount,
      i_record.base_amount
    );
  end if;

  -- Only proceed with additional scoring if the score is below 1
  if v_score < 1 then
    -- Date proximity
    v_score := v_score + calculate_date_proximity_score(t_record.date, i_record.date);
  end if;

  if v_score < 0.9 then
    -- Name similarity
    v_score := v_score + calculate_name_similarity_score(t_record.name, i_record.display_name);
  end if;

  -- Ensure the score never exceeds 1
  return least(v_score, 1);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_name_similarity_score(transaction_name text, inbox_name text)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
  name_similarity numeric;
  similarity_score numeric := 0;
begin
  if transaction_name is null or inbox_name is null then
    return 0;
  end if;

  name_similarity := similarity(lower(transaction_name), lower(inbox_name));
  similarity_score := 0.7 * name_similarity; -- Increased base score to 70% of calculated similarity
  
  if name_similarity > 0.8 then -- Lowered threshold for bonus points
    similarity_score := similarity_score + 0.3;
  end if;
  
  return round(least(similarity_score, 1), 2); -- Increased cap to 1
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_overall_similarity(transaction_record record, inbox_record record)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
  overall_score numeric := 0;
  amount_score numeric;
  date_score numeric;
  name_score numeric;
begin
  -- Calculate individual scores
  amount_score := calculate_amount_similarity(
    transaction_record.currency,
    inbox_record.currency,
    transaction_record.amount,
    inbox_record.amount
  );
  date_score := calculate_date_similarity(transaction_record.date, inbox_record.date);
  name_score := calculate_name_similarity_score(transaction_record.name, inbox_record.display_name);

  -- Adjusted weighted combination of scores (70% amount, 20% date, 10% name)
  overall_score := (amount_score * 0.70) + (date_score * 0.20) + (name_score * 0.10);

  -- Bonus for very good amount match
  if amount_score >= 0.9 then
    overall_score := overall_score + 0.1;
  end if;

  -- Bonus for good name match
  if name_score >= 0.5 then
    overall_score := overall_score + 0.05;
  end if;

  return least(overall_score, 1);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_total_sum(target_currency text)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
    total_sum numeric := 0;
    currency_rate numeric;
    currency_sum record;
begin
    for currency_sum in
        select currency, sum(abs(amount)) as sum_amount
        from transactions
        group by currency
    loop
        select rate into currency_rate
        from exchange_rates
        where base = currency_sum.currency
          and target = target_currency
        limit 1;

        if currency_rate is null then
            raise notice 'no exchange rate found for currency % to target currency %', currency_sum.currency, target_currency;
            continue;
        end if;

        total_sum := total_sum + (currency_sum.sum_amount * currency_rate);
    end loop;

    return round(total_sum, 2);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_transaction_base_amount()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
    team_base_currency text;
    exchange_rate numeric;
begin
    select base_currency into team_base_currency
    from teams
    where id = new.team_id;

    -- if the transaction currency is the same as the team's base currency or the team's base currency is null
    if new.currency = team_base_currency or team_base_currency is null then
        new.base_amount := new.amount;
        new.base_currency := new.currency;
    else
        select rate into exchange_rate
        from exchange_rates
        where base = new.currency
        and target = team_base_currency
        limit 1;

        new.base_amount := round(new.amount * exchange_rate, 2);
        new.base_currency := team_base_currency;
    end if;

    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_transaction_differences_v2(p_team_id uuid)
 RETURNS TABLE(transaction_group text, date date, team_id uuid, recurring boolean, frequency transaction_frequency, days_diff double precision)
 LANGUAGE plpgsql
AS $function$
begin
    return query
    select 
        gt.transaction_group,
        gt.date,
        gt.team_id,
        gt.recurring,
        gt.frequency,
        extract(epoch from (gt.date::timestamp - lag(gt.date::timestamp) over w))::float / (24 * 60 * 60) as days_diff
    from group_transactions_v2(p_team_id) gt
    where gt.team_id = p_team_id -- Ensure filtering on team_id is done as early as possible
    window w as (partition by gt.transaction_group, gt.team_id order by gt.date);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_transaction_frequency(p_transaction_group text, p_team_id uuid, p_new_date date)
 RETURNS TABLE(avg_days_between double precision, transaction_count integer, is_recurring boolean, latest_frequency text)
 LANGUAGE plpgsql
AS $function$
declare
    v_avg_days_between float;
    v_transaction_count int;
    v_is_recurring boolean;
    v_latest_frequency text;
begin
    -- Optimize the query by avoiding subqueries and using more efficient aggregations
    select 
        coalesce(avg(extract(epoch from (p_new_date::timestamp - t.date::timestamp)) / (24 * 60 * 60)), 0),
        count(*) + 1,
        coalesce(bool_or(t.recurring), false),
        coalesce(max(case when t.recurring then t.frequency else null end), 'unknown')
    into v_avg_days_between, v_transaction_count, v_is_recurring, v_latest_frequency
    from transactions t
    where t.team_id = p_team_id
      and t.name in (p_transaction_group, identify_transaction_group(p_transaction_group, p_team_id))
      and t.date < p_new_date;

    return query select v_avg_days_between, v_transaction_count, v_is_recurring, v_latest_frequency;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.classify_frequency_v2(p_team_id uuid)
 RETURNS TABLE(transaction_group text, team_id uuid, transaction_count bigint, avg_days_between double precision, stddev_days_between double precision, frequency transaction_frequency)
 LANGUAGE plpgsql
AS $function$
begin
    return query
    select 
        td.transaction_group,
        td.team_id,
        count(*) as transaction_count,
        avg(td.days_diff) as avg_days_between,
        stddev(td.days_diff) as stddev_days_between,
        case 
            when bool_or(td.recurring) and max(td.frequency) != 'unknown' then max(td.frequency)
            when avg(td.days_diff) between 1 and 8 then 'weekly'::transaction_frequency
            when avg(td.days_diff) between 9 and 16 then 'biweekly'::transaction_frequency
            when avg(td.days_diff) between 18 and 40 then 'monthly'::transaction_frequency
            when avg(td.days_diff) between 60 and 80 then 'semi_monthly'::transaction_frequency
            when avg(td.days_diff) between 330 and 370 then 'annually'::transaction_frequency
            when count(*) < 2 then 'unknown'::transaction_frequency
            else 'irregular'::transaction_frequency
        end as frequency
    from calculate_transaction_differences_v2(p_team_id) td
    group by td.transaction_group, td.team_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_from_documents()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM public.documents
    WHERE object_id = OLD.id;
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.detect_recurring_transactions()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
    last_transaction record;
    days_diff numeric;
    frequency_type transaction_frequency;
    search_query text;
begin
    -- Prepare the search query
    search_query := regexp_replace(
        regexp_replace(coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, ''), '[^\w\s]', ' ', 'g'),
        '\s+', ' ', 'g'
    );
    search_query := trim(search_query);
 
    -- Convert to tsquery format with prefix matching
    search_query := (
        SELECT string_agg(lexeme || ':*', ' & ')
        FROM unnest(string_to_array(search_query, ' ')) lexeme
        WHERE length(lexeme) > 0
    );
  
    -- Find the last similar transaction using ts_query
    SELECT * INTO last_transaction
    FROM transactions
    WHERE team_id = NEW.team_id
      AND id <> NEW.id -- exclude the current transaction
      AND date < NEW.date -- ensure we're looking at previous transactions
      AND category_slug != 'income' -- exclude income transactions
      AND category_slug != 'transfer' -- exclude transfer transactions
      AND fts_vector @@ to_tsquery('english', search_query)
    ORDER BY ts_rank(fts_vector, to_tsquery('english', search_query)) DESC, date DESC
    LIMIT 1;

    -- If at least one similar transaction exists, calculate frequency
    IF last_transaction.id IS NOT NULL THEN
        IF last_transaction.frequency IS NOT NULL AND last_transaction.recurring = true THEN
            frequency_type := last_transaction.frequency;
            -- Save recurring if last_transaction is true
            UPDATE transactions SET
                recurring = true,
                frequency = frequency_type
            WHERE id = NEW.id;
        ELSIF last_transaction.recurring = false THEN
            -- Set as non-recurring if last_transaction is false
            UPDATE transactions SET
                recurring = false,
                frequency = NULL
            WHERE id = NEW.id;
        ELSE
            days_diff := extract(epoch FROM (NEW.date::timestamp - last_transaction.date::timestamp)) / (24 * 60 * 60);
            
            CASE
                WHEN days_diff BETWEEN 1 AND 16 THEN
                    frequency_type := 'weekly'::transaction_frequency;
                WHEN days_diff BETWEEN 18 AND 80 THEN
                    frequency_type := 'monthly'::transaction_frequency;
                WHEN days_diff BETWEEN 330 AND 370 THEN
                    frequency_type := 'annually'::transaction_frequency;
                ELSE
                    frequency_type := 'irregular'::transaction_frequency;
            END CASE;

            -- Update the recurring flag and frequency only if not irregular
            IF frequency_type != 'irregular'::transaction_frequency THEN
                UPDATE transactions SET
                    recurring = true,
                    frequency = frequency_type
                WHERE id = NEW.id;
            ELSE
                -- Mark as non-recurring if irregular
                UPDATE transactions SET
                    recurring = false,
                    frequency = NULL
                WHERE id = NEW.id;
            END IF;
        END IF;
    ELSE
        -- No similar transaction found, mark as non-recurring
        UPDATE transactions SET
            recurring = false,
            frequency = NULL
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.determine_transaction_frequency(p_avg_days_between double precision, p_transaction_count integer)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN CASE 
        WHEN p_avg_days_between BETWEEN 1 AND 8 THEN 'WEEKLY'
        WHEN p_avg_days_between BETWEEN 9 AND 16 THEN 'BIWEEKLY'
        WHEN p_avg_days_between BETWEEN 18 AND 40 THEN 'MONTHLY'
        WHEN p_avg_days_between BETWEEN 60 AND 80 THEN 'SEMI_MONTHLY'
        WHEN p_avg_days_between BETWEEN 330 AND 370 THEN 'ANNUALLY'
        WHEN p_transaction_count < 2 THEN 'UNKNOWN'
        ELSE 'IRREGULAR'
    END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.determine_transaction_frequency(p_avg_days_between double precision, p_transaction_count integer, p_is_recurring boolean, p_latest_frequency text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
begin
    if p_is_recurring and p_latest_frequency != 'unknown' then
        return p_latest_frequency;
    else
        return case 
            when p_avg_days_between between 1 and 8 then 'weekly'
            when p_avg_days_between between 9 and 16 then 'biweekly'
            when p_avg_days_between between 18 and 40 then 'monthly'
            when p_avg_days_between between 60 and 80 then 'semi_monthly'
            when p_avg_days_between between 330 and 370 then 'annually'
            when p_transaction_count < 2 then 'unknown'
            else 'irregular'
        end;
    end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.find_matching_inbox_item(input_transaction_id uuid, specific_inbox_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(inbox_id uuid, transaction_id uuid, transaction_name text, similarity_score numeric, file_name text)
 LANGUAGE plpgsql
AS $function$
declare
  transaction_data record;
  inbox_data record;
  calculated_score numeric;
  similarity_threshold numeric := 0.90; -- Lowered threshold for more matches
begin
  -- Fetch transaction data
  select t.* 
  into transaction_data 
  from transactions t
  where t.id = input_transaction_id;

  if specific_inbox_id is not null then
    -- Check for a specific inbox item
    select * 
    into inbox_data 
    from inbox 
    where id = specific_inbox_id
      and team_id = transaction_data.team_id
      and status = 'pending';
    
    if inbox_data.id is not null then
      calculated_score := calculate_overall_similarity(transaction_data, inbox_data);
      
      if calculated_score >= similarity_threshold then
        return query select specific_inbox_id, input_transaction_id, transaction_data.name, calculated_score, inbox_data.file_name;
      end if;
    end if;
  else
    -- Find best matching inbox item
    return query
    select 
      i.id as inbox_id, 
      transaction_data.id as transaction_id, 
      transaction_data.name as transaction_name,
      calculate_overall_similarity(transaction_data, i.*) as similarity_score,
      i.file_name
    from inbox i
    where 
      i.team_id = transaction_data.team_id 
      and i.status = 'pending'
      and calculate_overall_similarity(transaction_data, i.*) >= similarity_threshold
    order by 
      calculate_overall_similarity(transaction_data, i.*) desc,
      abs(i.date - transaction_data.date) asc
    limit 1; -- Return only the best match
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_transactions_by_account(account_id uuid)
 RETURNS SETOF transactions
 LANGUAGE sql
AS $function$
  select * from transactions where bank_account_id = $1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_burn_rate_v2(team_id uuid, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS TABLE(date timestamp with time zone, value numeric, currency text)
 LANGUAGE plpgsql
AS $function$
declare
    target_currency text;
begin
    if get_burn_rate_v2.base_currency is not null then
        target_currency := get_burn_rate_v2.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_burn_rate_v2.team_id;
    end if;

  return query
    select
      date_trunc('month', month_series) as date,
      coalesce(sum(abs(base_amount)), 0) as value,
      target_currency as currency
    from
      generate_series(
        date_trunc('month', date_from),
        date_trunc('month', date_to),
        interval '1 month'
      ) as month_series
      left join transactions as t
        on date_trunc('month', t.date) = date_trunc('month', month_series)
        and t.team_id = get_burn_rate_v2.team_id
        and t.category_slug != 'transfer'
        and t.status = 'posted'
        and t.base_amount < 0
        and t.base_currency = target_currency
    group by
      date_trunc('month', month_series)
    order by
      date_trunc('month', month_series) asc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_burn_rate_v3(team_id uuid, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS TABLE(date timestamp with time zone, value numeric, currency text)
 LANGUAGE plpgsql
AS $function$
declare
    target_currency text;
begin
    if get_burn_rate_v3.base_currency is not null then
        target_currency := get_burn_rate_v3.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_burn_rate_v3.team_id;
    end if;

  return query
    select
      date_trunc('month', month_series) as date,
      coalesce(abs(sum(
        case
          when get_burn_rate_v3.base_currency is not null then t.amount
          else t.base_amount
        end
      )), 0) as value,
      target_currency as currency
    from
      generate_series(
        date_trunc('month', date_from),
        date_trunc('month', date_to),
        interval '1 month'
      ) as month_series
      left join transactions as t
        on date_trunc('month', t.date) = date_trunc('month', month_series)
        and t.team_id = get_burn_rate_v3.team_id
        and t.category_slug != 'transfer'
        and t.status = 'posted'
        and (
          case
            when get_burn_rate_v3.base_currency is not null then t.amount
            else t.base_amount
          end
        ) < 0
        and (
          (get_burn_rate_v3.base_currency is not null and t.currency = target_currency) or
          (get_burn_rate_v3.base_currency is null and t.base_currency = target_currency)
        )
    group by
      date_trunc('month', month_series)
    order by
      date_trunc('month', month_series) asc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_burn_rate_v2(team_id uuid, base_currency text DEFAULT NULL::text)
 RETURNS TABLE(currency text, value numeric)
 LANGUAGE plpgsql
AS $function$
declare
  current_burn_rate numeric;
  target_currency text;
begin
    if get_current_burn_rate_v2.base_currency is not null then
        target_currency := get_current_burn_rate_v2.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_current_burn_rate_v2.team_id;
    end if;

  select
    coalesce(sum(abs(base_amount)), 0) into current_burn_rate
  from
    transactions as t
  where
    date_trunc('month', t.date) = date_trunc('month', current_date)
    and t.team_id = get_current_burn_rate_v2.team_id
    and t.category_slug != 'transfer'
    and t.status = 'posted'
    and t.base_currency = target_currency
    and t.base_amount < 0;

  return query
    select
      target_currency as currency,
      current_burn_rate as value;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_burn_rate_v3(team_id uuid, base_currency text DEFAULT NULL::text)
 RETURNS TABLE(currency text, value numeric)
 LANGUAGE plpgsql
AS $function$
declare
  current_burn_rate numeric;
  target_currency text;
begin
    if get_current_burn_rate_v3.base_currency is not null then
        target_currency := get_current_burn_rate_v3.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_current_burn_rate_v3.team_id;
    end if;
  
  select
    coalesce(abs(sum(
        case
          when get_current_burn_rate_v3.base_currency is not null then t.amount
          else t.base_amount
        end
      )), 0) into current_burn_rate
  from
    transactions as t
  where
    date_trunc('month', t.date) = date_trunc('month', current_date)
    and t.team_id = get_current_burn_rate_v3.team_id
    and t.category_slug != 'transfer'
    and t.status = 'posted'
    and (
      (get_current_burn_rate_v3.base_currency is not null and t.currency = target_currency) or
      (get_current_burn_rate_v3.base_currency is null and t.base_currency = target_currency)
    )
    and (
          case
            when get_current_burn_rate_v3.base_currency is not null then t.amount
            else t.base_amount
          end
        ) < 0;

  return query
    select
      target_currency as currency,
      current_burn_rate as value;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_expenses(team_id uuid, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS TABLE(date timestamp without time zone, value numeric, recurring_value numeric, currency text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    target_currency text;
BEGIN
    IF base_currency IS NOT NULL THEN
        target_currency := base_currency;
    ELSE
        SELECT teams.base_currency INTO target_currency
        FROM teams
        WHERE teams.id = team_id;
    END IF;

    RETURN QUERY
    SELECT
        date_trunc('month', month_series)::timestamp without time zone AS date,
        COALESCE(SUM(
            CASE
                WHEN get_expenses.base_currency IS NOT NULL AND (t.recurring = false OR t.recurring IS NULL) THEN abs(t.amount)
                WHEN get_expenses.base_currency IS NULL AND (t.recurring = false OR t.recurring IS NULL) THEN abs(t.base_amount)
                ELSE 0
            END
        ), 0) AS value,
        COALESCE(SUM(
            CASE
                WHEN get_expenses.base_currency IS NOT NULL AND t.recurring = true THEN abs(t.amount)
                WHEN get_expenses.base_currency IS NULL AND t.recurring = true THEN abs(t.base_amount)
                ELSE 0
            END
        ), 0) AS recurring_value,
        target_currency AS currency
    FROM
        generate_series(
            date_from::date,
            date_to::date,
            interval '1 month'
        ) AS month_series
    LEFT JOIN transactions AS t ON date_trunc('month', t.date) = date_trunc('month', month_series)
        AND t.team_id = get_expenses.team_id
        AND (t.category_slug IS NULL OR t.category_slug != 'transfer')
        AND t.status = 'posted'
        AND (
            (get_expenses.base_currency IS NOT NULL AND t.currency = target_currency AND t.amount < 0) OR
            (get_expenses.base_currency IS NULL AND t.base_currency = target_currency AND t.base_amount < 0)
        )
    GROUP BY
        date_trunc('month', month_series)
    ORDER BY
        date_trunc('month', month_series);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_profit_v2(team_id uuid, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS TABLE(date timestamp with time zone, value numeric, currency text)
 LANGUAGE plpgsql
AS $function$
declare
    target_currency text;
begin
    if get_profit_v2.base_currency is not null then
        target_currency := get_profit_v2.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_profit_v2.team_id;
    end if;

  return query
    select
      date_trunc('month', month_series) as date,
      coalesce(sum(base_amount), 0) as value,
      target_currency as currency
    from
      generate_series(
        date_from::date,
        date_to::date,
        interval '1 month'
      ) as month_series
    left join transactions as t on date_trunc('month', t.date) = date_trunc('month', month_series)
      and t.team_id = get_profit_v2.team_id
      and t.category_slug != 'transfer'
      and t.status = 'posted'
      and t.base_currency = target_currency
    group by
      date_trunc('month', month_series)
    order by
      date_trunc('month', month_series);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_profit_v3(team_id uuid, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS TABLE(date timestamp with time zone, value numeric, currency text)
 LANGUAGE plpgsql
AS $function$
declare
    target_currency text;
begin
    if get_profit_v3.base_currency is not null then
        target_currency := get_profit_v3.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_profit_v3.team_id;
    end if;

  return query
    select
      date_trunc('month', month_series) as date,
      coalesce(sum(
        case
          when get_profit_v3.base_currency is not null then t.amount
          else t.base_amount
        end
      ), 0) as value,
      target_currency as currency
    from
      generate_series(
        date_from::date,
        date_to::date,
        interval '1 month'
      ) as month_series
    left join transactions as t on date_trunc('month', t.date) = date_trunc('month', month_series)
      and t.team_id = get_profit_v3.team_id
      and t.category_slug != 'transfer'
      and t.status = 'posted'
      and (
        (get_profit_v3.base_currency is not null and t.currency = target_currency) or
        (get_profit_v3.base_currency is null and t.base_currency = target_currency)
      )
    group by
      date_trunc('month', month_series)
    order by
      date_trunc('month', month_series);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_revenue_v2(team_id uuid, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS TABLE(date timestamp with time zone, value numeric, currency text)
 LANGUAGE plpgsql
AS $function$
declare
    target_currency text;
begin
    if get_revenue_v2.base_currency is not null then
        target_currency := get_revenue_v2.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_revenue_v2.team_id;
    end if;
  return query
    select
      date_trunc('month', month_series) as date,
      coalesce(sum(base_amount), 0) as value,
      target_currency as currency
    from
      generate_series(
        date_from::date,
        date_to::date,
        interval '1 month'
      ) as month_series
      left join transactions as t on date_trunc('month', t.date) = date_trunc('month', month_series)
      and t.team_id = get_revenue_v2.team_id
      and t.category_slug != 'transfer'
      and t.category_slug = 'income'
      and t.status = 'posted'
      and t.base_currency = target_currency
    group by
      date_trunc('month', month_series)
    order by
      date_trunc('month', month_series);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_revenue_v3(team_id uuid, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS TABLE(date timestamp with time zone, value numeric, currency text)
 LANGUAGE plpgsql
AS $function$
declare
    target_currency text;
begin
    if get_revenue_v3.base_currency is not null then
        target_currency := get_revenue_v3.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_revenue_v3.team_id;
    end if;
  return query
    select
      date_trunc('month', month_series) as date,
      coalesce(sum(
        case
          when get_revenue_v3.base_currency is not null then t.amount
          else t.base_amount
        end
      ), 0) as value,
      target_currency as currency
    from
      generate_series(
        date_from::date,
        date_to::date,
        interval '1 month'
      ) as month_series
      left join transactions as t on date_trunc('month', t.date) = date_trunc('month', month_series)
      and t.team_id = get_revenue_v3.team_id
      and t.category_slug != 'transfer'
      and t.category_slug = 'income'
      and t.status = 'posted'
      and (
        (get_revenue_v3.base_currency is not null and t.currency = target_currency) or
        (get_revenue_v3.base_currency is null and t.base_currency = target_currency)
      )
    group by
      date_trunc('month', month_series)
    order by
      date_trunc('month', month_series);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_runway_v2(team_id uuid, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
    target_currency text;
    total_balance numeric;
    avg_burn_rate numeric;
    number_of_months numeric;
begin
    if get_runway_v2.base_currency is not null then
        target_currency := get_runway_v2.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_runway_v2.team_id;
    end if;

    select * from get_total_balance_v2(team_id, target_currency) into total_balance;
    
    select (extract(year FROM date_to) - extract(year FROM date_from)) * 12 +
           extract(month FROM date_to) - extract(month FROM date_from) 
    into number_of_months;
    
    select round(avg(value)) 
    from get_burn_rate_v2(team_id, date_from, date_to, target_currency) 
    into avg_burn_rate;

    return round(total_balance / avg_burn_rate);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_runway_v3(team_id uuid, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
    target_currency text;
    total_balance numeric;
    avg_burn_rate numeric;
    number_of_months numeric;
begin
    if get_runway_v3.base_currency is not null then
        target_currency := get_runway_v3.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_runway_v3.team_id;
    end if;

    select * from get_total_balance_v3(team_id, target_currency) into total_balance;
    
    select (extract(year FROM date_to) - extract(year FROM date_from)) * 12 +
           extract(month FROM date_to) - extract(month FROM date_from) 
    into number_of_months;
    
    select round(avg(value)) 
    from get_burn_rate_v3(team_id, date_from, date_to, target_currency) 
    into avg_burn_rate;

    return round(total_balance / avg_burn_rate);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_spending_v2(team_id uuid, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS TABLE(name text, slug text, amount numeric, currency text, color text, percentage numeric)
 LANGUAGE plpgsql
AS $function$
declare
    target_currency text;
    total_amount numeric;
begin
    if get_spending_v2.base_currency is not null then
        target_currency := get_spending_v2.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_spending_v2.team_id;
    end if;

    select sum(t.base_amount) into total_amount
    from transactions as t
    where t.team_id = get_spending_v2.team_id
        and t.category_slug != 'transfer'
        and t.base_currency = target_currency
        and t.date >= date_from
        and t.date <= date_to
        and t.base_amount < 0;

    return query
    select 
        coalesce(category.name, 'Uncategorized') AS name,
        coalesce(category.slug, 'uncategorized') as slug,
        sum(t.base_amount) as amount,
        t.base_currency,
        coalesce(category.color, '#606060') as color,
        case 
            when ((sum(t.base_amount) / total_amount) * 100) > 1 then
                round((sum(t.base_amount) / total_amount) * 100)
            else
                round((sum(t.base_amount) / total_amount) * 100, 2)
        end as percentage
    from 
        transactions as t
    left join
        transaction_categories as category on t.team_id = category.team_id and t.category_slug = category.slug
    where 
        t.team_id = get_spending_v2.team_id
        and t.category_slug != 'transfer'
        and t.base_currency = target_currency
        and t.date >= date_from
        and t.date <= date_to
        and t.base_amount < 0
    group by
        category.name,
        coalesce(category.slug, 'uncategorized'),
        t.base_currency,
        category.color
    order by
        sum(t.base_amount) asc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_spending_v3(team_id uuid, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS TABLE(name text, slug text, amount numeric, currency text, color text, percentage numeric)
 LANGUAGE plpgsql
AS $function$

declare
    target_currency text;
    total_amount numeric;
begin
    if get_spending_v3.base_currency is not null then
        target_currency := get_spending_v3.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_spending_v3.team_id;
    end if;

    select sum(case
            when get_spending_v3.base_currency is not null then t.amount
            else t.base_amount
        end) into total_amount
    from transactions as t
    where t.team_id = get_spending_v3.team_id
        and t.category_slug != 'transfer'
        and (t.base_currency = target_currency or t.currency = target_currency)
        and t.date >= date_from
        and t.date <= date_to
        and t.base_amount < 0;

    return query
    select 
        coalesce(category.name, 'Uncategorized') AS name,
        coalesce(category.slug, 'uncategorized') as slug,
        sum(case
            when get_spending_v3.base_currency is not null then t.amount
            else t.base_amount
        end) as amount,
        target_currency as currency,
        coalesce(category.color, '#606060') as color,
        case 
            when ((sum(case
                when get_spending_v3.base_currency is not null then t.amount
                else t.base_amount
            end) / total_amount) * 100) > 1 then
                round((sum(case
                    when get_spending_v3.base_currency is not null then t.amount
                    else t.base_amount
                end) / total_amount) * 100)
            else
                round((sum(case
                    when get_spending_v3.base_currency is not null then t.amount
                    else t.base_amount
                end) / total_amount) * 100, 2)
        end as percentage
    from 
        transactions as t
    left join
        transaction_categories as category on t.team_id = category.team_id and t.category_slug = category.slug
    where 
        t.team_id = get_spending_v3.team_id
        and t.category_slug != 'transfer'
        and (t.base_currency = target_currency or t.currency = target_currency)
        and t.date >= date_from
        and t.date <= date_to
        and t.base_amount < 0
    group by
        category.name,
        coalesce(category.slug, 'uncategorized'),
        category.color
    order by
        sum(case
            when get_spending_v3.base_currency is not null then t.amount
            else t.base_amount
        end) asc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_total_balance_v2(team_id uuid, currency text)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
    total_balance numeric;
begin
    select coalesce(sum(abs(base_balance)), 0) into total_balance
    from bank_accounts as b
    where enabled = true
        and b.team_id = get_total_balance_v2.team_id
        and b.base_currency = get_total_balance_v2.currency;

    return total_balance;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_total_balance_v3(team_id uuid, currency text)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
    total_balance numeric;
begin
    select coalesce(sum(abs(case when b.base_currency = get_total_balance_v3.currency then base_balance else balance end)), 0) into total_balance
    from bank_accounts as b
    where enabled = true
        and b.team_id = get_total_balance_v3.team_id
        and (b.base_currency = get_total_balance_v3.currency or b.currency = get_total_balance_v3.currency);

    return total_balance;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.group_transactions_v2(p_team_id uuid)
 RETURNS TABLE(transaction_group text, date date, team_id uuid, recurring boolean, frequency transaction_frequency)
 LANGUAGE plpgsql
AS $function$
begin
    return query
    select 
        coalesce(st.similar_transaction_name, t.name) as transaction_group,
        t.date,
        t.team_id,
        t.recurring,
        t.frequency
    from transactions t
    left join identify_similar_transactions_v2(p_team_id) st
    on t.name = st.original_transaction_name
    where t.team_id = p_team_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_empty_folder_placeholder()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Check if the name does not end with '.folderPlaceholder'
    IF NEW.bucket_id = 'vault' AND NEW.name NOT LIKE '%/.folderPlaceholder' THEN

        -- Create a modified name with '.folderPlaceholder' at the end
        DECLARE
            modified_name TEXT;
        BEGIN
            modified_name := regexp_replace(NEW.name, '([^/]+)$', '.folderPlaceholder');

            -- Check if the modified name already exists in the table
            IF NOT EXISTS (
                SELECT 1 
                FROM storage.objects 
                WHERE bucket_id = NEW.bucket_id 
                AND name = modified_name
            ) THEN
                -- Insert the new row with the modified name
                INSERT INTO storage.objects (
                    bucket_id, 
                    name, 
                    owner, 
                    owner_id, 
                    team_id, 
                    parent_path, 
                    depth
                )
                VALUES (
                    NEW.bucket_id, 
                    modified_name, 
                    NEW.owner, 
                    NEW.owner_id, 
                    NEW.team_id, 
                    NEW.parent_path, 
                    NEW.depth
                );
            END IF;
        END;
    END IF;

    -- Allow the original row to be inserted without modifying NEW.name
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.identify_similar_transactions_v2(p_team_id uuid)
 RETURNS TABLE(original_transaction_name text, similar_transaction_name text, team_id uuid)
 LANGUAGE plpgsql
AS $function$
begin
    return query
    select 
        t1.name as original_transaction_name,
        t2.name as similar_transaction_name,
        t1.team_id
    from transactions t1
    join transactions t2 on t1.team_id = t2.team_id
    where t1.team_id = p_team_id
      and t1.name <> t2.name
      and similarity(t1.name, t2.name) > 0.8
      and t1.name ILIKE t2.name || '%'; -- Example of limiting comparisons
end;
$function$
;

CREATE OR REPLACE FUNCTION public.identify_transaction_group(p_name text, p_team_id uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
    v_transaction_group text;
begin
    -- Use a more efficient similarity check with trigram index and lateral join
    -- Add a LIMIT clause to prevent excessive processing
    select coalesce(similar_name, p_name) into v_transaction_group
    from (
        select p_name as original_name
    ) as original
    left join lateral (
        select t.name as similar_name
        from transactions t
        where t.team_id = p_team_id
          and t.name <> p_name
          and similarity(t.name, p_name) > 0.8  -- Use similarity function with a threshold
        order by similarity(t.name, p_name) desc
    ) as similar_transactions on true;

    return v_transaction_group;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_into_documents()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
    modified_name TEXT;
    team_id UUID;
    parent_id TEXT;
BEGIN
    team_id := NEW.path_tokens[1];

    BEGIN
        -- Extract parent_id from path_tokens
        IF array_length(NEW.path_tokens, 1) > 1 THEN
            IF NEW.path_tokens[array_length(NEW.path_tokens, 1)] = '.emptyFolderPlaceholder' THEN
                -- If the last token is '.folderPlaceholder', take the second to last token
                parent_id := NEW.path_tokens[array_length(NEW.path_tokens, 1) - 2];
            ELSE
                -- Otherwise, take the last token
                parent_id := NEW.path_tokens[array_length(NEW.path_tokens, 1) - 1];
            END IF;
        ELSE
            -- If there's only one token, set parent_id to null
            parent_id := null;
        END IF;
    END;

    IF NOT NEW.name LIKE '%.emptyFolderPlaceholder' THEN
        INSERT INTO documents (
            id,
            name,
            created_at,
            metadata,
            path_tokens,
            team_id,
            parent_id,
            object_id,
            owner_id
        )
        VALUES (
            NEW.id,
            NEW.name,
            NEW.created_at,
            NEW.metadata,
            NEW.path_tokens,
            team_id,
            parent_id,
            NEW.id,
            NEW.owner_id::uuid
        );
    END IF;

    BEGIN
        IF array_length(NEW.path_tokens, 1) > 2 AND parent_id NOT IN ('inbox', 'transactions', 'exports', 'imports') THEN
            -- Create a modified name with '.folderPlaceholder' at the end
            modified_name := regexp_replace(NEW.name, '([^/]+)$', '.folderPlaceholder');
            
            -- Check if the modified name already exists in the table
            IF NOT EXISTS (
                SELECT 1 
                FROM documents 
                WHERE name = modified_name
            ) THEN
                -- Insert the new row with the modified name
                INSERT INTO documents (
                    name, 
                    team_id,
                    path_tokens,
                    parent_id,
                    object_id
                )
                VALUES (
                    modified_name, 
                    team_id, 
                    string_to_array(modified_name, '/'),
                    parent_id,
                    NEW.id
                );
            END IF;
        END IF;
    END;

    RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.match_transaction_with_inbox(p_transaction_id uuid, p_inbox_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(inbox_id uuid, transaction_id uuid, transaction_name text, score numeric, file_name text)
 LANGUAGE plpgsql
AS $function$
declare
  v_transaction record;
  v_inbox record;
  v_score numeric;
  v_threshold numeric := 0.9; -- 90% threshold
begin
  -- fetch transaction details
  select t.*, 
         abs(t.amount) as abs_amount,
         abs(t.base_amount) as abs_base_amount
  into v_transaction 
  from transactions t
  where t.id = p_transaction_id;

  -- if p_inbox_id is provided, match only with that specific inbox item
--   if p_inbox_id is not null then
--     select *, abs(amount) as abs_amount, abs(base_amount) as abs_base_amount 
--     into v_inbox 
--     from inbox 
--     where id = p_inbox_id
--       and team_id = v_transaction.team_id
--       and status = 'pending';
    
--     if v_inbox.id is not null then
--       v_score := calculate_match_score(v_transaction, v_inbox);
      
--       if v_score >= v_threshold then
--         return query select p_inbox_id, p_transaction_id, v_transaction.name, v_score, v_inbox.file_name;
--       end if;
--     end if;
--   else
    -- Find potential matches for the transaction
    return query
    select 
      i.id as inbox_id, 
      v_transaction.id as transaction_id, 
      v_transaction.name as transaction_name,
      calculate_match_score(v_transaction, i.*) as score,
      i.file_name
    from inbox i
    where 
      i.team_id = v_transaction.team_id 
      and i.status = 'pending'
      and calculate_match_score(v_transaction, i.*) >= v_threshold
    order by 
      calculate_match_score(v_transaction, i.*) desc,
      abs(i.date - v_transaction.date) asc
    limit 1;
--   end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_transaction_frequency()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
    v_transaction_group text;
    v_frequency transaction_frequency;
    v_recurring boolean;
begin
    -- optimize the query by adding limits and using more efficient date comparisons
    with transaction_data as (
        select 
            identify_transaction_group(new.name, new.team_id) as group_name,
            coalesce(avg(extract(epoch from (new.date::timestamp - t.date::timestamp)) / (24 * 60 * 60)), 0) as avg_days_between,
            count(*) + 1 as transaction_count,
            coalesce(bool_or(t.recurring), false) as is_recurring,
            coalesce(max(case when t.recurring then t.frequency else null end), 'unknown'::transaction_frequency) as latest_frequency
        from transactions t
        where t.team_id = new.team_id
          and t.name in (new.name, identify_transaction_group(new.name, new.team_id))
          and t.date < new.date
          and t.date > (new.date - interval '13 months')  -- limit to transactions within the last 13 months
    )
    select 
        td.group_name,
        case
            when td.is_recurring and td.latest_frequency != 'unknown' then td.latest_frequency
            when td.avg_days_between between 1 and 8 then 'weekly'::transaction_frequency
            when td.avg_days_between between 9 and 16 then 'biweekly'::transaction_frequency
            when td.avg_days_between between 18 and 40 then 'monthly'::transaction_frequency
            when td.avg_days_between between 60 and 80 then 'semi_monthly'::transaction_frequency
            when td.avg_days_between between 330 and 370 then 'annually'::transaction_frequency
            when td.transaction_count < 2 then 'unknown'::transaction_frequency
            else 'irregular'::transaction_frequency
        end as frequency,
        case
            when td.is_recurring then true
            when td.transaction_count >= 2 then true
            else false
        end as recurring
    into v_transaction_group, v_frequency, v_recurring
    from transaction_data td;

    -- update the frequency and recurring status on the transaction
    update transactions
    set frequency = v_frequency,
        recurring = v_recurring
    where id = new.id;

    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_transaction_frequency_v2()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
    v_transaction_group text;
    v_frequency transaction_frequency;
    v_recurring boolean;
begin
    -- Get the transaction group and update frequency and recurring flag
    select 
        cf.transaction_group, 
        cf.frequency, 
        cf.transaction_count >= 2
    into 
        v_transaction_group, 
        v_frequency, 
        v_recurring
    from classify_frequency_v2(new.team_id) cf
    where cf.transaction_group = (select transaction_group from group_transactions_v2(new.team_id) where date = new.date limit 1);

    -- Update the frequency and recurring status on the transaction
    update transactions
    set frequency = coalesce(v_frequency, 'unknown'::transaction_frequency),
        recurring = coalesce(v_recurring, false)
    where id = new.id;

    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_transaction_frequency_v3()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
    v_transaction_group text;
    v_frequency transaction_frequency;
    v_recurring boolean;
    v_transaction_count bigint;
    v_avg_days_between float;
begin
    -- Get the transaction group for the new transaction
    select coalesce(st.similar_transaction_name, new.name)
    into v_transaction_group
    from identify_similar_transactions_v2(new.team_id) st
    where st.original_transaction_name = new.name
    limit 1;

    -- If no similar transaction found, use the new transaction name
    v_transaction_group := coalesce(v_transaction_group, new.name);

    -- Calculate frequency only for the affected transaction group
    with group_stats as (
        select 
            count(*) as transaction_count,
            avg(extract(epoch from (date::timestamp - lag(date::timestamp) over (order by date)))::float / (24 * 60 * 60)) as avg_days_between
        from transactions
        where team_id = new.team_id and coalesce(similar_transaction_name, name) = v_transaction_group
    )
    select
        transaction_count,
        avg_days_between,
        case 
            when transaction_count >= 2 and avg_days_between between 1 and 8 then 'weekly'::transaction_frequency
            when transaction_count >= 2 and avg_days_between between 9 and 16 then 'biweekly'::transaction_frequency
            when transaction_count >= 2 and avg_days_between between 18 and 40 then 'monthly'::transaction_frequency
            when transaction_count >= 2 and avg_days_between between 60 and 80 then 'semi_monthly'::transaction_frequency
            when transaction_count >= 2 and avg_days_between between 330 and 370 then 'annually'::transaction_frequency
            when transaction_count < 2 then 'unknown'::transaction_frequency
            else 'irregular'::transaction_frequency
        end,
        transaction_count >= 2
    into
        v_transaction_count,
        v_avg_days_between,
        v_frequency,
        v_recurring
    from group_stats;

    -- Update the frequency and recurring status on the new transaction
    update transactions
    set 
        frequency = v_frequency,
        recurring = v_recurring,
        similar_transaction_name = v_transaction_group
    where id = new.id;

    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$begin
  insert into public.users (
    id,
    full_name,
    avatar_url,
    email
  )
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );

  return new;
end;$function$
;

CREATE OR REPLACE FUNCTION public.update_enrich_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$begin
  if new.category_slug is null then
    -- Find matching category_slug from transaction_enrichments and transaction_categories in one query
    new.category_slug := (
      select te.category_slug
      from transaction_enrichments te
      join transaction_categories tc on tc.slug = te.category_slug and tc.team_id = new.team_id
      where te.name = new.name
        and (te.system = true or te.team_id = new.team_id)
      limit 1
    );
  end if;

  return new;
end;$function$
;

CREATE OR REPLACE FUNCTION public.upsert_transaction_enrichment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$declare
    transaction_name text;
    system_value boolean;
begin

    select new.name into transaction_name;

    select system into system_value
    from transaction_categories as tc
    where tc.slug = new.category_slug and tc.team_id = new.team_id;
    
    if new.team_id is not null then
        insert into transaction_enrichments(name, category_slug, team_id, system)
        values (transaction_name, new.category_slug, new.team_id, system_value)
        on conflict (team_id, name) do update
        set category_slug = excluded.category_slug;
    end if;

    return new;
end;$function$
;

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant references on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant trigger on table "public"."documents" to "anon";

grant truncate on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant references on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant trigger on table "public"."documents" to "authenticated";

grant truncate on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant references on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant trigger on table "public"."documents" to "service_role";

grant truncate on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

grant delete on table "public"."exchange_rates" to "anon";

grant insert on table "public"."exchange_rates" to "anon";

grant references on table "public"."exchange_rates" to "anon";

grant select on table "public"."exchange_rates" to "anon";

grant trigger on table "public"."exchange_rates" to "anon";

grant truncate on table "public"."exchange_rates" to "anon";

grant update on table "public"."exchange_rates" to "anon";

grant delete on table "public"."exchange_rates" to "authenticated";

grant insert on table "public"."exchange_rates" to "authenticated";

grant references on table "public"."exchange_rates" to "authenticated";

grant select on table "public"."exchange_rates" to "authenticated";

grant trigger on table "public"."exchange_rates" to "authenticated";

grant truncate on table "public"."exchange_rates" to "authenticated";

grant update on table "public"."exchange_rates" to "authenticated";

grant delete on table "public"."exchange_rates" to "service_role";

grant insert on table "public"."exchange_rates" to "service_role";

grant references on table "public"."exchange_rates" to "service_role";

grant select on table "public"."exchange_rates" to "service_role";

grant trigger on table "public"."exchange_rates" to "service_role";

grant truncate on table "public"."exchange_rates" to "service_role";

grant update on table "public"."exchange_rates" to "service_role";

create policy "Documents can be deleted by a member of the team"
on "public"."documents"
as permissive
for all
to public
using ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));


create policy "Documents can be selected by a member of the team"
on "public"."documents"
as permissive
for all
to public
using ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));


create policy "Documents can be updated by a member of the team"
on "public"."documents"
as permissive
for update
to public
using ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));


create policy "Enable insert for authenticated users only"
on "public"."documents"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for authenticated users"
on "public"."exchange_rates"
as permissive
for select
to public
using (true);


CREATE TRIGGER trigger_calculate_bank_account_base_balance_before_insert BEFORE INSERT ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION calculate_bank_account_base_balance();

CREATE TRIGGER trigger_calculate_bank_account_base_balance_before_update BEFORE UPDATE OF balance ON public.bank_accounts FOR EACH ROW WHEN ((old.balance IS DISTINCT FROM new.balance)) EXECUTE FUNCTION calculate_bank_account_base_balance();

CREATE TRIGGER embed_document AFTER INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://pytddvqiozwrhfbwqazp.supabase.co/functions/v1/generate-document-embedding', 'POST', '{"Content-type":"application/json"}', '{}', '5000');

CREATE TRIGGER trigger_calculate_inbox_base_amount_before_update BEFORE UPDATE ON public.inbox FOR EACH ROW WHEN ((old.amount IS DISTINCT FROM new.amount)) EXECUTE FUNCTION calculate_inbox_base_amount();

CREATE TRIGGER check_recurring_transactions AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION detect_recurring_transactions();

CREATE TRIGGER on_update_set_set_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_calculate_transaction_base_amount_before_insert BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION calculate_transaction_base_amount();

CREATE TRIGGER enrich_transaction BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_enrich_transaction();


