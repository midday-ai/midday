
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

CREATE SCHEMA IF NOT EXISTS "private";

ALTER SCHEMA "private" OWNER TO "postgres";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "public";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";

CREATE TYPE "public"."account_type" AS ENUM (
    'depository',
    'credit',
    'other_asset',
    'loan',
    'other_liability'
);

ALTER TYPE "public"."account_type" OWNER TO "postgres";

CREATE TYPE "public"."bankProviders" AS ENUM (
    'gocardless',
    'plaid',
    'teller'
);

ALTER TYPE "public"."bankProviders" OWNER TO "postgres";

CREATE TYPE "public"."bank_providers" AS ENUM (
    'gocardless',
    'plaid',
    'teller'
);

ALTER TYPE "public"."bank_providers" OWNER TO "postgres";

CREATE TYPE "public"."inbox_status" AS ENUM (
    'processing',
    'pending',
    'archived',
    'new',
    'deleted'
);

ALTER TYPE "public"."inbox_status" OWNER TO "postgres";

CREATE TYPE "public"."metrics_record" AS (
	"date" "date",
	"value" integer
);

ALTER TYPE "public"."metrics_record" OWNER TO "postgres";

CREATE TYPE "public"."reportTypes" AS ENUM (
    'profit',
    'revenue',
    'burn_rate'
);

ALTER TYPE "public"."reportTypes" OWNER TO "postgres";

CREATE TYPE "public"."teamRoles" AS ENUM (
    'owner',
    'member'
);

ALTER TYPE "public"."teamRoles" OWNER TO "postgres";

CREATE TYPE "public"."trackerStatus" AS ENUM (
    'in_progress',
    'completed'
);

ALTER TYPE "public"."trackerStatus" OWNER TO "postgres";

CREATE TYPE "public"."transactionCategories" AS ENUM (
    'travel',
    'office_supplies',
    'meals',
    'software',
    'rent',
    'income',
    'equipment',
    'transfer',
    'internet_and_telephone',
    'facilities_expenses',
    'activity',
    'uncategorized',
    'taxes',
    'other',
    'salary',
    'fees'
);

ALTER TYPE "public"."transactionCategories" OWNER TO "postgres";

CREATE TYPE "public"."transactionMethods" AS ENUM (
    'payment',
    'card_purchase',
    'card_atm',
    'transfer',
    'other',
    'unknown',
    'ach',
    'interest',
    'deposit',
    'wire',
    'fee'
);

ALTER TYPE "public"."transactionMethods" OWNER TO "postgres";

CREATE TYPE "public"."transactionStatus" AS ENUM (
    'posted',
    'pending',
    'excluded',
    'completed'
);

ALTER TYPE "public"."transactionStatus" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "private"."get_invites_for_authenticated_user"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select team_id
  from user_invites
  where email = auth.jwt() ->> 'email'
$$;

ALTER FUNCTION "private"."get_invites_for_authenticated_user"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "private"."get_teams_for_authenticated_user"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select team_id
  from users_on_team
  where user_id = auth.uid()
$$;

ALTER FUNCTION "private"."get_teams_for_authenticated_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "date" "date" NOT NULL,
    "name" "text" NOT NULL,
    "method" "public"."transactionMethods" NOT NULL,
    "amount" numeric NOT NULL,
    "currency" "text" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "assigned_id" "uuid",
    "note" character varying,
    "bank_account_id" "uuid",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "internal_id" "text" NOT NULL,
    "status" "public"."transactionStatus" DEFAULT 'posted'::"public"."transactionStatus",
    "category" "public"."transactionCategories",
    "balance" numeric,
    "manual" boolean DEFAULT false,
    "currency_rate" numeric,
    "currency_source" "text",
    "description" "text",
    "category_slug" "text"
);

ALTER TABLE "public"."transactions" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."amount_text"("public"."transactions") RETURNS "text"
    LANGUAGE "sql"
    AS $_$
  select ABS($1.amount)::text;
$_$;

ALTER FUNCTION "public"."amount_text"("public"."transactions") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."calculated_vat"("public"."transactions") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $_$
declare
    vat_rate numeric;
    vat_amount numeric;
begin
    if $1.category_slug is null then
        return 0;
    end if;

    select vat into vat_rate
        from transaction_categories as tc
        where $1.category_slug = tc.slug
        and $1.team_id = tc.team_id;

    vat_amount := $1.amount * (vat_rate / 100);

    return abs(round(vat_amount, 2));
end;
$_$;

ALTER FUNCTION "public"."calculated_vat"("public"."transactions") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."create_team"("name" character varying) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    new_team_id uuid;
begin
    insert into teams (name) values (name) returning id into new_team_id;
    insert into users_on_team (user_id, team_id, role) values (auth.uid(), new_team_id, 'owner');

    return new_team_id;
end;
$$;

ALTER FUNCTION "public"."create_team"("name" character varying) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."extract_product_names"("products_json" "json") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
begin
    return (
        select string_agg(value, ',') 
        from json_array_elements_text(products_json) as arr(value)
    );
end;
$$;

ALTER FUNCTION "public"."extract_product_names"("products_json" "json") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."generate_hmac"("secret_key" "text", "message" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    hmac_result bytea;
BEGIN
    hmac_result := extensions.hmac(message::bytea, secret_key::bytea, 'sha256');
    RETURN encode(hmac_result, 'base64');
END;
$$;

ALTER FUNCTION "public"."generate_hmac"("secret_key" "text", "message" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."generate_id"("size" integer) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  bytes BYTEA := gen_random_bytes(size);
  l INT := length(characters);
  i INT := 0;
  output TEXT := '';
BEGIN
  WHILE i < size LOOP
    output := output || substr(characters, get_byte(bytes, i) % l + 1, 1);
    i := i + 1;
  END LOOP;
  RETURN lower(output);
END;
$$;

ALTER FUNCTION "public"."generate_id"("size" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."generate_inbox"("size" integer) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  bytes BYTEA := extensions.gen_random_bytes(size);
  l INT := length(characters);
  i INT := 0;
  output TEXT := '';
BEGIN
  WHILE i < size LOOP
    output := output || substr(characters, get_byte(bytes, i) % l + 1, 1);
    i := i + 1;
  END LOOP;
  RETURN lower(output);
END;
$$;

ALTER FUNCTION "public"."generate_inbox"("size" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."generate_inbox_fts"("display_name" "text", "products_json" "json") RETURNS "tsvector"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
begin
    return to_tsvector('english', coalesce(display_name, '') || ' ' || (
        select string_agg(value, ',') 
        from json_array_elements_text(products_json) as arr(value)
    ));
end;
$$;

ALTER FUNCTION "public"."generate_inbox_fts"("display_name" "text", "products_json" "json") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."generate_inbox_fts"("display_name_text" "text", "product_names" "text") RETURNS "tsvector"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
begin
    return to_tsvector('english', coalesce(display_name_text, '') || ' ' || coalesce(product_names, ''));
end;
$$;

ALTER FUNCTION "public"."generate_inbox_fts"("display_name_text" "text", "product_names" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."generate_inbox_fts"("display_name_text" "text", "product_names" "text", "amount" numeric, "due_date" "date") RETURNS "tsvector"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
begin
    return to_tsvector('english', coalesce(display_name_text, '') || ' ' || coalesce(product_names, '') || ' ' || coalesce(amount::text, '') || ' ' || due_date);
end;
$$;

ALTER FUNCTION "public"."generate_inbox_fts"("display_name_text" "text", "product_names" "text", "amount" numeric, "due_date" "date") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."generate_slug_from_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$begin
  if new.system is true then
    return new;
  end if;

  new.slug := public.slugify(new.name);
  return new;
end$$;

ALTER FUNCTION "public"."generate_slug_from_name"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_bank_account_currencies"("team_id" "uuid") RETURNS TABLE("currency" "text")
    LANGUAGE "plpgsql"
    AS $$
begin
  return query select distinct bank_accounts.currency from bank_accounts where bank_accounts.team_id = get_bank_account_currencies.team_id order by bank_accounts.currency;
end;
$$;

ALTER FUNCTION "public"."get_bank_account_currencies"("team_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_burn_rate"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") RETURNS TABLE("date" timestamp with time zone, "value" numeric)
    LANGUAGE "plpgsql"
    AS $$begin
  return query
    select 
      date_trunc('month', month_series) as date,
      coalesce(sum(abs(amount)), 0) as value
    from 
      generate_series(
        date_trunc('month', date_from),
        date_trunc('month', date_to),
        interval '1 month'
      ) as month_series
      left join transactions as t on date_trunc('month', t.date) = date_trunc('month', month_series)
                                 and t.team_id = get_burn_rate.team_id
                                 and t.category_slug != 'transfer'
                                 and t.status = 'posted'
                                 and t.amount < 0
                                 and t.currency = get_burn_rate.currency
    group by 
      date_trunc('month', month_series)
    order by 
      date_trunc('month', month_series) asc;
end;$$;

ALTER FUNCTION "public"."get_burn_rate"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_current_burn_rate"("team_id" "uuid", "currency" "text") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$declare
    current_burn_rate numeric;
begin
    select 
        coalesce(sum(abs(amount)), 0) into current_burn_rate
    from 
        transactions AS t
    where 
        date_trunc('month', t.date) = date_trunc('month', current_date)
        and t.team_id = get_current_burn_rate.team_id
        and t.category_slug != 'transfer'
        and t.status = 'posted'
        and t.currency = get_current_burn_rate.currency
        and t.amount < 0;

    return current_burn_rate;
end;$$;

ALTER FUNCTION "public"."get_current_burn_rate"("team_id" "uuid", "currency" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_profit"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") RETURNS TABLE("date" timestamp with time zone, "value" numeric)
    LANGUAGE "plpgsql"
    AS $$begin
  return query
    select
      date_trunc('month', month_series) as date,
      coalesce(sum(amount), 0) as value
    from
      generate_series(
        date_from::date,
        date_to::date,
        interval '1 month'
      ) as month_series
      left join transactions as t on date_trunc('month', t.date) = date_trunc('month', month_series)
      and t.team_id = get_profit.team_id
      and t.category_slug != 'transfer'
      and t.status = 'posted'
      and t.currency = get_profit.currency
    group by
      date_trunc('month', month_series)
    order by
      date_trunc('month', month_series);
end;$$;

ALTER FUNCTION "public"."get_profit"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_revenue"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") RETURNS TABLE("date" timestamp with time zone, "value" numeric)
    LANGUAGE "plpgsql"
    AS $$begin
  return query
    select
      date_trunc('month', month_series) as date,
      coalesce(sum(amount), 0) as value
    from
      generate_series(
        date_from::date,
        date_to::date,
        interval '1 month'
      ) as month_series
      left join transactions as t on date_trunc('month', t.date) = date_trunc('month', month_series)
      and t.team_id = get_revenue.team_id
      and t.category_slug != 'transfer'
      and t.category_slug = 'income'
      and t.status = 'posted'
      and t.currency = get_revenue.currency
    group by
      date_trunc('month', month_series)
    order by
      date_trunc('month', month_series);
end;$$;

ALTER FUNCTION "public"."get_revenue"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_runway"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
declare
    total_balance numeric;
    avg_burn_rate numeric;
    number_of_months numeric;
begin
    select * from get_total_balance(team_id, currency) into total_balance;
    select (extract(year FROM date_to) - extract(year FROM date_from)) * 12 +
           extract(month FROM date_to) - extract(month FROM date_from) into number_of_months;
    select round(avg(value)) from get_burn_rate(team_id, date_from, date_to, currency) into avg_burn_rate;

    return round(total_balance / avg_burn_rate);
end;
$$;

ALTER FUNCTION "public"."get_runway"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_spending"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency_target" "text") RETURNS TABLE("name" "text", "slug" "text", "amount" numeric, "currency" "text", "color" "text", "percentage" numeric)
    LANGUAGE "plpgsql"
    AS $$
declare
    total_amount numeric;
begin
    select sum(t.amount) into total_amount
    from transactions as t
    where t.team_id = get_spending.team_id
        and t.category != 'transfer'
        and t.currency = currency_target
        and t.date >= date_from
        and t.date <= date_to
        and t.amount < 0;

    return query
    select 
        coalesce(category.name, 'Uncategorized') AS name,
        coalesce(category.slug, 'uncategorized') as slug,
        sum(t.amount) as amount,
        t.currency,
        coalesce(category.color, '#606060') as color,
        case 
            when ((sum(t.amount) / total_amount) * 100) > 1 then
                round((sum(t.amount) / total_amount) * 100)
            else
                round((sum(t.amount) / total_amount) * 100, 2)
        end as percentage
    from 
        transactions as t
    left join
        transaction_categories as category on t.team_id = category.team_id and t.category_slug = category.slug
    where 
        t.team_id = get_spending.team_id
        and t.category_slug != 'transfer'
        and t.currency = currency_target
        and t.date >= date_from
        and t.date <= date_to
        and t.amount < 0
    group by
        category.name,
        coalesce(category.slug, 'uncategorized'),
        t.currency,
        category.color
    order by
        sum(t.amount) asc;
end;
$$;

ALTER FUNCTION "public"."get_spending"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency_target" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_spending_v2"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency_target" "text") RETURNS TABLE("name" "text", "slug" "text", "amount" numeric, "currency" "text", "color" "text", "percentage" numeric)
    LANGUAGE "plpgsql"
    AS $$

declare
    total_amount numeric;
begin
    -- Calculate the total amount spent
    select sum(t.amount) into total_amount
    from transactions as t
    where t.team_id = get_spending_v2.team_id
        and t.category != 'transfer'
        and t.currency = currency_target
        and t.date >= date_from
        and t.date <= date_to
        and t.amount < 0;

    return query
    select 
        coalesce(category.name, 'Uncategorized') AS name,
        coalesce(category.slug, 'uncategorized') as slug,
        sum(t.amount) as amount,
        t.currency,
        coalesce(category.color, '#606060') as color,
        case 
            when ((sum(t.amount) / total_amount) * 100) > 1 then
                round((sum(t.amount) / total_amount) * 100)
            else
                round((sum(t.amount) / total_amount) * 100, 2)
        end as percentage
    from 
        transactions as t
    left join
        transaction_categories as category on t.team_id = category.team_id and t.category_slug = category.slug
    where 
        t.team_id = get_spending_v2.team_id
        and t.category_slug != 'transfer'
        and t.currency = currency_target
        and t.date >= date_from
        and t.date <= date_to
        and t.amount < 0
    group by
        category.name,
        coalesce(category.slug, 'uncategorized'),
        t.currency,
        category.color
    order by
        sum(t.amount) asc;
end;
$$;

ALTER FUNCTION "public"."get_spending_v2"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency_target" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_total_balance"("team_id" "uuid", "currency" "text") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
declare
    total_balance numeric;
begin
    select 
        coalesce(sum(abs(balance)), 0) into total_balance
    from 
        bank_accounts AS b
    where 
        enabled = true
        and b.team_id = get_total_balance.team_id
        and b.currency = get_total_balance.currency;

    return total_balance;
end;
$$;

ALTER FUNCTION "public"."get_total_balance"("team_id" "uuid", "currency" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  new_team_id uuid;
begin
  -- insert into public.users
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

  -- insert into public.teams and return the new_team_id
  insert into public.teams (
    name,
    email,
    inbox_email
  )
  values (
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.email
  )
  returning id into new_team_id; -- capture the team_id here

  -- insert into public.users_on_team using the captured team_id
  insert into public.users_on_team (
    user_id,
    team_id,
    role
  )
  values (
    new.id,
    new_team_id, -- use the captured team_id here
    'owner'
  );

  update public.users
  set team_id = new_team_id
  where id = new.id;

  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."inbox" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid",
    "file_path" "text"[],
    "file_name" "text",
    "transaction_id" "uuid",
    "amount" numeric,
    "currency" "text",
    "content_type" "text",
    "size" bigint,
    "attachment_id" "uuid",
    "due_date" "date",
    "forwarded_to" "text",
    "reference_id" "text",
    "meta" "json",
    "status" "public"."inbox_status" DEFAULT 'new'::"public"."inbox_status",
    "website" "text",
    "display_name" "text",
    "fts" "tsvector" GENERATED ALWAYS AS ("public"."generate_inbox_fts"("display_name", "public"."extract_product_names"(("meta" -> 'products'::"text")))) STORED
);

ALTER TABLE "public"."inbox" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."inbox_amount_text"("public"."inbox") RETURNS "text"
    LANGUAGE "sql"
    AS $_$
  select ABS($1.amount)::text;
$_$;

ALTER FUNCTION "public"."inbox_amount_text"("public"."inbox") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."insert_system_categories"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$begin
  insert into public.transaction_categories (name, team_id, color, slug, system, embedding)
  values
    ('Travel', new.id, '#abdd1d', 'travel', true, array[0.014789561741054058,-0.002656542928889394,0.059730164706707,-0.025741375982761383,0.005148091819137335,0.03349106386303902,0.07846752554178238,0.03239711746573448,-0.04226863011717796,-0.019586680456995964,-0.01032069232314825,-0.047265369445085526,0.02405109442770481,0.05976157262921333,0.010248729027807713,-0.005363388918340206,-0.005425749812275171,-0.009911027736961842,-0.0509972870349884,-0.005863883998245001,0.018211951479315758,-0.028684228658676147,-0.015670131891965866,-0.04524487257003784,0.03870223090052605,0.030623584985733032,-0.010679751634597778,-0.01768946461379528,-0.06770598888397217,-0.1268979012966156,-0.015839958563447,-0.06624870747327805,-0.012326289899647236,-0.03984001651406288,-0.04398493468761444,-0.03162575885653496,0.011961325071752071,0.03574452921748161,-0.026658983901143074,0.04015965387225151,0.07415992021560669,0.017952939495444298,-0.015210664831101894,-0.07159902900457382,-0.0301414355635643,-0.0173793938010931,-0.013249515555799007,-0.011197995394468307,0.05605444312095642,-0.055877551436424255,0.037876274436712265,-0.021018946543335915,0.017953453585505486,0.00862615555524826,0.00868828035891056,0.04807009920477867,0.032608360052108765,0.031088216230273247,0.04616282507777214,0.013334018178284168,0.02182369865477085,0.05478975549340248,-0.23732039332389832,0.10073814541101456,0.024430207908153534,0.026288911700248718,-0.047357089817523956,0.012528648599982262,0.02709384635090828,0.008075526915490627,-0.02202317677438259,0.05018104240298271,-0.007809648290276527,0.09677111357450485,0.04725485295057297,-0.0287160687148571,-0.00025389576330780983,-0.005808812100440264,-0.015277464874088764,0.013725928030908108,0.028033729642629623,-0.051082152873277664,-0.0018847368191927671,0.007874179631471634,0.02524220384657383,-0.05623246729373932,-0.027888290584087372,-0.05932224541902542,0.026229310780763626,-0.008817984722554684,-0.018041588366031647,-0.04703105241060257,-0.02061035856604576,0.045977454632520676,-0.06489615887403488,-0.02941157855093479,0.009876735508441925,-0.0010272234212607145,-0.008398732170462608,0.2635882496833801,-0.05918406322598457,0.06406421214342117,0.039604611694812775,0.01805088110268116,-0.04122351109981537,-0.04615747928619385,-0.006425259634852409,-0.016622347757220268,-0.046717964112758636,-0.0009010591893456876,-0.02850426733493805,-0.03445251286029816,0.02880864217877388,-0.03543045371770859,-0.0029058479703962803,0.0306731928139925,0.06598177552223206,0.057762712240219116,-0.057257797569036484,-0.01777218095958233,-0.02861289493739605,-0.0024556354619562626,0.03894802927970886,-0.03285834193229675,-0.0032461765222251415,-0.11732117831707001,0.05810137838125229,0.1341060996055603,0.021236279979348183,0.02720421552658081,0.048741839826107025,-0.009599841199815273,-0.06903841346502304,0.028507249429821968,-0.02117953449487686,-0.00255607976578176,0.02993885427713394,-0.04077291116118431,0.03705935925245285,-0.007336068898439407,-0.03715139627456665,-0.06665199249982834,-0.0008832854800857604,-0.1408444195985794,-0.03542010858654976,0.04630028083920479,0.01473926566541195,0.03293810784816742,-0.04572951793670654,0.0027039714623242617,-0.006481094751507044,0.017748717218637466,-0.012113692238926888,-0.03357858210802078,0.0023315055295825005,0.038248635828495026,0.04947655647993088,0.027702847495675087,-0.03591053932905197,0.032744839787483215,-0.037911880761384964,-0.07717686146497726,-0.04972169175744057,0.11008060723543167,-0.0201900452375412,-0.08335323631763458,0.0004906923277303576,0.0402064211666584,-0.006451285909861326,-0.04363134875893593,0.015071027912199497,0.023703306913375854,-0.05443112552165985,0.0316493958234787,0.08662211149930954,0.02547437511384487,-0.031942445784807205,0.03599072992801666,-0.01792805828154087,-0.028751475736498833,0.01988435536623001,-0.023907514289021492,-0.05221124738454819,0.051718536764383316,0.061880774796009064,-0.035545699298381805,-0.01871666871011257,-0.03319709002971649,0.031860705465078354,0.037737760692834854,0.04688147082924843,0.004273661877959967,0.010067266412079334,-0.046436503529548645,-0.020739203318953514,-0.0277866218239069,-0.028661813586950302,-0.022213082760572433,0.049115054309368134,-0.04065369442105293,0.004691347945481539,-0.021067414432764053,-0.020797807723283768,0.013616529293358326,0.029443349689245224,-0.011701386421918869,-0.017195509746670723,-0.02114950306713581,-0.022912735119462013,0.03220141679048538,0.0017284973291680217,0.02608741633594036,0.08546420931816101,-0.025521567091345787,-0.03218994662165642,-0.004966947250068188,0.045581020414829254,0.03565012663602829,-0.005959560163319111,0.029883146286010742,0.038537319749593735,-0.12093909084796906,-0.02477363497018814,-0.2184862494468689,0.0048062861897051334,-0.004047975409775972,-0.005797299090772867,0.0465516597032547,-0.03541848808526993,0.006456303410232067,-0.02497640624642372,0.05600824952125549,0.04950837045907974,0.05758282542228699,-0.0398247055709362,-0.013674070127308369,0.08330831676721573,-0.018963882699608803,0.04312790185213089,0.002612612210214138,0.05701228603720665,-0.01682918332517147,-0.005479814484715462,0.002953633200377226,0.030584290623664856,-0.026138927787542343,-0.08814044296741486,0.022313600406050682,-0.012044833973050117,0.22665464878082275,0.0076027559116482735,0.010815099813044071,-0.05752404406666756,0.041518572717905045,-0.0032604660373181105,0.04057236760854721,-0.11464865505695343,0.0108933812007308,0.028277330100536346,0.10774607211351395,-0.03565417602658272,-0.028851501643657684,-0.031236352398991585,0.011422672308981419,0.05999588593840599,-0.0074312700890004635,-0.02138115093111992,-0.014039411209523678,-0.018437599763274193,-0.017728928476572037,-0.010555124841630459,-0.01418386586010456,0.005332768429070711,0.03770853206515312,-0.04493290185928345,0.02689475752413273,0.0013541670050472021,-0.006291169673204422,-0.03242715448141098,-0.057367946952581406,-0.00142085540574044,-0.06727977097034454,0.08020462095737457,-0.021240562200546265,-0.05121079087257385,0.023103982210159302,-0.0008905623108148575,0.056649431586265564,0.021511955186724663,-0.046393461525440216,-0.015921197831630707,0.01467752642929554,-0.04742361605167389,-0.056505296379327774,0.10663127154111862,-0.02284705638885498,-0.04338731989264488,0.0992531031370163,-0.0020637260749936104,0.062178004533052444,0.052020419389009476,0.004159511998295784,-0.02291460707783699,0.0554748959839344,-0.04986298084259033,0.027232464402914047,0.024082891643047333,0.010330524295568466,0.021190350875258446,0.05190087854862213,-0.036369722336530685,-0.013088827952742577,-0.04845460504293442,-0.028116025030612946,-0.020151467993855476,-0.0077372887171804905,-0.04803735762834549,-0.0038116758223623037,-0.005622731056064367,-0.2768062949180603,0.035170767456293106,0.008721682243049145,0.005860576871782541,-0.03505948558449745,0.027773460373282433,0.04671623557806015,0.06631679832935333,-0.014092962257564068,0.016493789851665497,0.07791746407747269,-0.013909691013395786,0.05900907143950462,0.02189597114920616,0.019383538514375687,0.07025164365768433,0.06606920063495636,-0.028689583763480186,0.026311105117201805,-0.026743946596980095,0.006058140657842159,0.0584513396024704,0.22175152599811554,-0.008800235576927662,0.0171325895935297,0.006553944665938616,-0.020204635336995125,0.030660662800073624,-0.017084302380681038,0.006564174313098192,0.011326435022056103,-0.0053792912513017654,0.07490716874599457,-0.05503547191619873,0.027575833722949028,0.031140055507421494,-0.06216276437044144,0.03695747256278992,-0.015924984589219093,-0.05155354365706444,-0.05920166149735451,0.06554380804300308,0.0016147507121786475,-0.031047027558088303,0.09191016107797623,-0.0483306460082531,-0.04183190315961838,-0.0424591600894928,0.015921974554657936,0.03847784548997879,0.001908636186271906,0.020571328699588776,-0.026800857856869698,0.004937534220516682,0.07205968350172043,0.007313959766179323,-0.03470170497894287,-0.04549286887049675,-0.026034586131572723,-0.019444474950432777,0.01615981012582779,-0.0552629716694355,-0.0729145035147667,-0.019163642078638077,0.02738776244223118]),
    ('Office Supplies', new.id, '#bb4647', 'office-supplies', true, array[-0.038325365632772446,-0.01769847422838211,0.06828249245882034,-0.040497906506061554,0.04374952241778374,0.030301164835691452,0.0415036678314209,0.05874503403902054,-0.010983149521052837,0.007388439029455185,-0.0017847397830337286,-0.03563510254025459,0.05448518693447113,0.01644933968782425,-0.006760952528566122,-0.03054066374897957,0.0033516231924295425,-0.03587816655635834,-0.036675333976745605,0.05620826408267021,0.01602162979543209,-0.03471849858760834,-0.07298161834478378,-0.04817330092191696,0.022512270137667656,0.04007957875728607,-0.043679170310497284,-0.0027850663755089045,-0.02391132526099682,-0.1665041446685791,-0.03927622362971306,-0.05886474624276161,0.027151839807629585,0.005262123886495829,0.06578207015991211,-0.006926087662577629,-0.0025641927495598793,0.037427373230457306,-0.031802885234355927,0.03721112012863159,0.02017948217689991,-0.028119798749685287,-0.01383375097066164,-0.039005350321531296,-0.03065531700849533,-0.03305509686470032,0.004593439865857363,-0.01368757151067257,0.06302259862422943,-0.0062675634399056435,0.0545135959982872,-0.025032199919223785,0.00012918357970193028,0.028437970206141472,-0.020994536578655243,-0.007593686692416668,0.03411738574504852,0.01709427498281002,0.020792048424482346,0.04581446945667267,0.024058861657977104,0.014882124960422516,-0.2126093953847885,0.08831971138715744,0.007829436101019382,-0.02197341062128544,-0.060013558715581894,0.011105231940746307,-0.012230007909238338,0.05218665674328804,-0.04996715113520622,0.0036843926645815372,0.007313981186598539,0.04082062095403671,0.05085831135511398,-0.004242748487740755,-0.018443897366523743,-0.03407977521419525,0.005785726476460695,0.0075283776968717575,-0.02347683720290661,-0.00749147217720747,-0.011572971008718014,0.009155794978141785,-0.06712204962968826,-0.02224397286772728,0.014388958923518658,-0.038880739361047745,0.060004040598869324,-0.028820034116506577,-0.041797976940870285,0.024344421923160553,-0.0488443560898304,-0.030302679166197777,-0.08009298145771027,-0.07955391705036163,0.02929229475557804,0.039265844970941544,-0.059235673397779465,0.2577892243862152,-0.0684317946434021,-0.011343427933752537,0.09288869053125381,-0.0804683044552803,-0.009277847595512867,-0.06314338743686676,0.0025743397418409586,-0.021339088678359985,-0.04034857079386711,0.03310848027467728,0.0024365081917494535,-0.003373726038262248,0.04145476967096329,-0.04944698512554169,0.01990712434053421,0.013154291547834873,0.007325295824557543,0.013479073531925678,-0.05045904591679573,0.0063544404692947865,-0.009249971248209476,0.0004509707214310765,0.0395120270550251,0.019143741577863693,0.015743721276521683,-0.09334325045347214,0.03048819862306118,0.09761986136436462,0.047795556485652924,0.04843325912952423,0.025513090193271637,-0.0025257898960262537,-0.0014076161896809936,0.01046433299779892,0.015413523651659489,0.037998318672180176,-0.0023573741782456636,0.0225254874676466,0.06289738416671753,0.012676888145506382,-0.015760065987706184,-0.015430484898388386,-0.027504902333021164,-0.09679438918828964,-0.037962451577186584,0.12685717642307281,-0.02708323858678341,0.002701301360502839,-0.047319091856479645,-0.017398079857230186,-0.015059491619467735,0.06084979325532913,-0.020202960819005966,0.02947789430618286,-0.018189065158367157,0.016466647386550903,0.07222291827201843,0.04946069046854973,-0.036919426172971725,0.024540526792407036,-0.025684306398034096,-0.04126208275556564,-0.04896577447652817,0.07825209945440292,-0.026196187362074852,-0.1346631795167923,-0.015309875831007957,0.0186998900026083,0.016023969277739525,-0.0024935181718319654,0.07397652417421341,0.007931520231068134,-0.04681604728102684,0.034394484013319016,0.11501041799783707,0.03726081922650337,-0.021878648549318314,-0.029001891613006592,0.006554843857884407,0.009669434279203415,0.03734361380338669,-0.001256725867278874,-0.06309456378221512,0.010351010598242283,0.0750790536403656,-0.029124407097697258,-0.014499210752546787,-0.01563897170126438,0.03227831795811653,0.09148893505334854,-0.010284083895385265,0.04025338590145111,-0.025430716574192047,-0.0002382067177677527,-0.042067769914865494,-0.03578883409500122,-0.06084642931818962,-0.026714356616139412,0.0156641136854887,-0.022167760878801346,0.07165369391441345,-0.025339074432849884,-0.03162180632352829,0.040767643600702286,0.04520610347390175,0.019426284357905388,0.03120977059006691,-0.04445759579539299,0.055368635803461075,-0.02255062200129032,-0.059282366186380386,0.01639324426651001,0.07201535999774933,0.004856129176914692,-0.03823183849453926,0.016637183725833893,0.017891963943839073,0.003977258689701557,0.0592372864484787,0.01784619316458702,0.062231287360191345,-0.06649386137723923,-0.04712593927979469,-0.24758750200271606,0.05357184261083603,-0.021194932982325554,-0.009221856482326984,0.07350798696279526,0.02615555189549923,0.04968363791704178,-0.0036740123759955168,-0.02561185508966446,0.033892687410116196,0.09434222429990768,-0.02038486860692501,0.010068899020552635,0.04081498086452484,0.009961573407053947,0.05321928858757019,0.02634073980152607,0.02258557640016079,-0.044975727796554565,0.0070078712888062,0.0010840930044651031,0.03427617996931076,-0.016534743830561638,0.003201707499101758,0.05912750959396362,-0.03209460899233818,0.1771358847618103,-0.013577401638031006,0.0038361011538654566,-0.016834108158946037,0.05507836863398552,-0.011810368858277798,-0.037958141416311264,-0.12273433059453964,0.055441562086343765,0.052092257887125015,-0.045903559774160385,-0.01842457614839077,-0.009774468839168549,-0.022463303059339523,-0.060274407267570496,0.07056780904531479,-0.023116329684853554,-0.026219911873340607,0.04892402142286301,-0.04899890720844269,-0.012685505673289299,0.00683840736746788,-0.04277588799595833,0.022833848372101784,-0.005619159433990717,-0.05929974466562271,0.058515142649412155,0.02300892025232315,-0.008185637183487415,-0.07814309746026993,-0.0319252647459507,0.03768828883767128,-0.04027886688709259,-0.013915514573454857,-0.0018974150298163295,-0.052706874907016754,0.0046427142806351185,-0.006663228385150433,0.026295790448784828,0.029423905536532402,0.022122731432318687,-0.03724609687924385,0.055116403847932816,-0.0195572841912508,0.00423869863152504,0.04846617951989174,-0.034605178982019424,0.025967493653297424,0.017350003123283386,-0.014182887971401215,0.04463447257876396,0.011648585088551044,-0.051522061228752136,-0.041434597223997116,0.036711178719997406,0.006260537542402744,0.018107939511537552,0.003951495513319969,0.026027986779808998,0.024258514866232872,0.036626119166612625,0.02862240932881832,0.04293844848871231,-0.057411760091781616,0.004415720235556364,0.012196460738778114,0.02866058237850666,0.019903749227523804,0.06628933548927307,-0.022429335862398148,-0.28404510021209717,0.04309704899787903,0.01945428177714348,0.02461262047290802,-0.07454215735197067,0.020702384412288666,-0.03592805191874504,0.015687590464949608,-0.025346986949443817,0.03139059990644455,0.009886513464152813,0.04557500034570694,-0.023690272122621536,-0.004794524051249027,0.0000748163292882964,0.031528204679489136,0.06410188227891922,-0.04330994188785553,0.05906631797552109,-0.04765573889017105,-0.004435886163264513,0.029539495706558228,0.21953564882278442,0.007651960011571646,-0.007107809651643038,-0.03397633880376816,0.05801483988761902,-0.005039002280682325,0.037627335637807846,-0.025462621822953224,0.05734902620315552,-0.009404030628502369,0.07386902719736099,-0.054442062973976135,0.04187047854065895,0.04352957755327225,-0.048265811055898666,0.07922068983316422,0.017422184348106384,-0.026617353782057762,-0.06114690750837326,-0.03332653269171715,-0.10685956478118896,-0.07147295773029327,0.07439673691987991,-0.06532516330480576,-0.05367875471711159,-0.07201921939849854,0.0038244903553277254,0.004245331976562738,-0.05193018168210983,-0.005315006244927645,-0.010796038433909416,0.012668470852077007,-0.005541631951928139,0.005613196641206741,-0.0628368929028511,-0.02859269455075264,-0.051867518573999405,-0.023952599614858627,0.0056649767793715,-0.07860130071640015,-0.020335234701633453,0.05702003836631775,0.027401410043239594]),
    ('Meals', new.id, '#1ADBDB', 'meals', true, array[-0.01900223083794117,-0.0022117882035672665,0.03192122280597687,-0.015602081082761288,0.017936302348971367,0.030568888410925865,0.018950698897242546,0.017821762710809708,-0.0129733020439744,-0.0350261852145195,-0.010166817344725132,-0.08196692913770676,0.023949187248945236,0.04422793909907341,0.030231589451432228,-0.022358620539307594,0.030382778495550156,0.015215526334941387,-0.049458879977464676,0.02127065509557724,-0.030584746971726418,-0.01940508373081684,-0.017453163862228394,-0.02305767498910427,0.05924008786678314,0.04473106935620308,-0.012835117988288403,-0.00886455923318863,-0.09158632904291153,-0.12534502148628235,0.03967919573187828,-0.06540720164775848,0.01903284154832363,-0.05659953132271767,-0.019908946007490158,-0.029676510021090508,0.02178884483873844,0.05049991235136986,-0.053038209676742554,0.044466469436883926,0.05834614485502243,0.022966232150793076,-0.004310000687837601,-0.06695695221424103,-0.027223454788327217,-0.025683708488941193,-0.05891402065753937,-0.023241734132170677,0.08669670671224594,-0.029505819082260132,-0.011800461448729038,-0.026623455807566643,0.01593703031539917,0.023716352880001068,0.046126589179039,0.03818090632557869,0.06008007004857063,-0.0035353463608771563,0.038026005029678345,0.03340435028076172,-0.021941695362329483,0.06046367064118385,-0.22319185733795166,0.1028253361582756,-0.00577530125156045,0.01820734143257141,-0.025477349758148193,0.012894711457192898,0.024260688573122025,0.019506169483065605,-0.048352133482694626,0.008649048395454884,0.058011244982481,0.06529541313648224,-0.004271809943020344,-0.022341400384902954,0.010813046246767044,-0.06504037976264954,-0.014841632917523384,0.04644656181335449,-0.012937207706272602,0.0212235264480114,0.005457764491438866,-0.0022695616353303194,-0.018800172954797745,-0.048273395746946335,0.0008219477022066712,-0.02868354506790638,0.03953200951218605,-0.022686609998345375,-0.04585346207022667,-0.019699569791555405,-0.009812677279114723,0.03306478634476662,-0.06557992100715637,-0.03730572387576103,-0.020371735095977783,-0.02427268773317337,-0.056869011372327805,0.26645222306251526,-0.0585494190454483,0.03462368622422218,0.06345053762197495,-0.010164014995098114,0.021014226600527763,-0.07496576011180878,-0.01665758341550827,-0.014343587681651115,-0.0414775125682354,0.015409072861075401,-0.04336632415652275,-0.010678088292479515,0.001641894574277103,0.005384443327784538,0.037158768624067307,0.0028657419607043266,0.09296797960996628,0.004514459054917097,-0.011676426976919174,0.011948873288929462,-0.01853063702583313,0.01925811544060707,0.027023615315556526,-0.026833895593881607,0.028595564886927605,-0.09312812983989716,0.01979699172079563,0.09705311059951782,0.02141186222434044,0.04605642706155777,0.05240325629711151,-0.007816911675035954,-0.03641050308942795,-0.03312455490231514,0.004613250959664583,0.03679661452770233,0.05966375395655632,-0.027544021606445312,0.047455303370952606,-0.02058877982199192,-0.030520034953951836,-0.10153767466545105,0.004625702276825905,-0.1616441011428833,0.012258300557732582,0.11046433448791504,-0.010669960640370846,0.044732384383678436,-0.06797247380018234,0.010840551927685738,0.009756471030414104,0.059676457196474075,0.004444161895662546,-0.059114158153533936,0.0011546907480806112,0.04060741886496544,0.015214883722364902,-0.005218234844505787,-0.0041870479471981525,0.009917058050632477,-0.031490109860897064,-0.05949101597070694,-0.039229024201631546,0.056668300181627274,0.007663097232580185,-0.08844864368438721,-0.059806887060403824,0.0285944864153862,0.025394311174750328,-0.0069504654966294765,0.03930303826928139,0.032702282071113586,-0.09286756813526154,0.007271808106452227,0.0947730615735054,0.02403339557349682,-0.014896556735038757,0.008101573213934898,-0.01677233912050724,0.015574164688587189,0.02488058991730213,-0.04752802848815918,-0.03755280002951622,0.043754350394010544,0.05955345556139946,-0.029411012306809425,-0.006644319277256727,-0.05521459877490997,0.04322589561343193,0.007712208665907383,-0.024032587185502052,-0.03494331240653992,-0.034192536026239395,-0.0519418939948082,-0.06958357989788055,-0.052294522523880005,-0.019239282235503197,-0.004646882880479097,0.025417452678084373,-0.04539809003472328,0.04788399487733841,-0.01798807643353939,-0.019873308017849922,0.04824233427643776,0.06090071052312851,-0.04238574206829071,-0.035396333783864975,-0.018543532118201256,0.06655452400445938,0.06132502108812332,-0.03503300994634628,0.0364474356174469,0.061930276453495026,0.03062286600470543,-0.04148048162460327,0.05073133483529091,0.08102656900882721,0.053658463060855865,0.02410503290593624,0.006386857479810715,0.05824530869722366,-0.12305228412151337,-0.05640551075339317,-0.20266464352607727,0.02801954559981823,0.002248382428660989,-0.04769435152411461,0.028367329388856888,-0.03985551744699478,-0.010903666727244854,0.00814503151923418,-0.00898363534361124,0.08201417326927185,0.042258087545633316,-0.021745946258306503,0.005980044603347778,0.04775291308760643,0.012966914102435112,0.06362418085336685,0.0021592897828668356,0.010147545486688614,-0.00557252112776041,0.006185212638229132,-0.01205130573362112,0.0024238387122750282,-0.019534584134817123,-0.032691534608602524,0.0543566569685936,0.03269222006201744,0.19919735193252563,0.02572035603225231,0.03957664221525192,-0.049463193863630295,0.04190392792224884,0.024984439834952354,-0.0018074908293783665,-0.1117246225476265,0.023165300488471985,0.02623973973095417,0.01971594989299774,-0.05822819471359253,-0.017677530646324158,-0.0285622738301754,-0.04063886031508446,0.06424786150455475,-0.033200621604919434,-0.08548789471387863,-0.00741029717028141,-0.00646166643127799,-0.03896220028400421,-0.03245210275053978,-0.005477127619087696,0.012324045412242413,0.006392094772309065,-0.010792246088385582,-0.008595961146056652,0.007052868138998747,0.013069522567093372,-0.04765310883522034,-0.08076146990060806,0.011040067300200462,-0.07038892805576324,0.031164323911070824,-0.028019269928336143,-0.0072141531854867935,-0.020489666610956192,-0.029700947925448418,0.08978737145662308,0.006455467082560062,-0.01751849800348282,-0.0002727233513724059,0.0004551684542093426,-0.03309020400047302,-0.02977372333407402,0.02971678599715233,0.013496889732778072,-0.012191380374133587,0.06924327462911606,0.021091477945446968,0.05826225131750107,-0.014008777216076851,-0.009890845976769924,-0.05683695524930954,0.029256494715809822,-0.027352333068847656,0.03828402981162071,0.04790310189127922,0.039766035974025726,-0.0006842709262855351,0.03346738591790199,0.028054695576429367,0.042671505361795425,-0.0336342491209507,0.010303666815161705,0.030194301158189774,-0.09118882566690445,-0.017662018537521362,0.03839549794793129,0.012758723460137844,-0.27151116728782654,0.07884301990270615,-0.006681504193693399,-0.03071952611207962,0.013186147436499596,0.01282778475433588,-0.023594796657562256,0.06583313643932343,-0.08538852632045746,0.02091372385621071,0.11098506301641464,0.034634463489055634,0.02405637316405773,0.012790958397090435,-0.008417733944952488,0.03517862781882286,0.05224855616688728,-0.007198347244411707,0.00982539914548397,-0.08037617802619934,0.0032916793134063482,0.013266583904623985,0.234315887093544,-0.018468402326107025,-0.008919939398765564,0.033636365085840225,0.002703738631680608,0.04482926055788994,0.004632432013750076,0.03582051768898964,0.055616337805986404,0.023191552609205246,0.0762922465801239,-0.03844214230775833,0.025199230760335922,0.06378793716430664,-0.016195740550756454,0.02190089412033558,0.018201742321252823,-0.029066482558846474,-0.09719998389482498,0.01724071614444256,-0.041917599737644196,-0.04177311807870865,0.061989955604076385,-0.04052861034870148,-0.0006624770467169583,-0.06919632107019424,0.021972214803099632,-0.007930359803140163,-0.012265454046428204,-0.02218327298760414,-0.01084876712411642,0.019745487719774246,0.053677551448345184,-0.010769972577691078,-0.05986538529396057,-0.03729548305273056,-0.01493612490594387,0.008824791759252548,0.02749933861196041,-0.017161257565021515,-0.04398278892040253,0.017740532755851746,-0.019461028277873993]),
    ('Software', new.id, '#0064d9', 'software', true, array[-0.06661754846572876,-0.017912868410348892,0.03440268337726593,-0.07042843103408813,0.013769486919045448,0.0055146971717476845,0.02264634519815445,0.015503639355301857,-0.001445465604774654,-0.04381164535880089,0.008797277696430683,-0.053945429623126984,0.0628214105963707,0.025152431800961494,-0.01019834540784359,0.01265021227300167,0.03178388252854347,0.03976287692785263,-0.021182961761951447,0.001740352250635624,0.033098720014095306,0.0013877152232453227,-0.02334347553551197,-0.05548957735300064,-0.0011675511486828327,0.05458329617977142,-0.06558828800916672,-0.06255369633436203,-0.05001455545425415,-0.10804299265146255,-0.015341013669967651,-0.04594080522656441,0.06035856902599335,-0.03422413021326065,-0.004402738530188799,-0.017449265345931053,-0.01249469630420208,0.010350830852985382,-0.0599287711083889,0.008351565338671207,-0.004933812189847231,0.016262587159872055,-0.045051459223032,-0.0838211253285408,-0.0023807191755622625,-0.04116562753915787,-0.0036869794130325317,-0.009402363561093807,0.049857981503009796,-0.04271234944462776,0.0033843310084193945,-0.020230449736118317,0.02883637323975563,0.05608298256993294,-0.027566565200686455,0.036174215376377106,0.03501080721616745,0.04137727990746498,0.016525326296687126,0.04057099670171738,0.040713682770729065,0.04304935038089752,-0.19961684942245483,0.09529886394739151,0.029102232307195663,0.06284013390541077,-0.05112667381763458,-0.04617369920015335,0.04355338588356972,0.07388012111186981,-0.04594332352280617,0.01809690333902836,-0.00376006867736578,0.06017012149095535,0.051135092973709106,-0.03457160294055939,0.0034961197525262833,-0.030946260318160057,-0.017486022785305977,0.001590299536474049,-0.010150810703635216,-0.04199729487299919,-0.027936894446611404,0.017625730484724045,-0.02202766388654709,-0.022262467071413994,-0.0021996833384037018,-0.034043967723846436,0.07772689312696457,-0.013751483522355556,-0.045700524002313614,0.01653086021542549,-0.009888896718621254,0.015007366426289082,-0.04972827807068825,-0.03400363773107529,0.05323105677962303,-0.0009146463125944138,-0.04117502272129059,0.2708910405635834,-0.05906206741929054,-0.02957867830991745,0.032345034182071686,-0.04270553216338158,0.040245961397886276,-0.021731646731495857,0.007385855074971914,-0.003930359613150358,-0.03947504609823227,0.016782335937023163,0.019889596849679947,-0.02124428004026413,0.024998506531119347,-0.03280923515558243,0.02012120932340622,-0.0374956876039505,0.018466530367732048,0.002757208188995719,0.028218932449817657,-0.02663835883140564,-0.00040348642505705357,0.03665226325392723,0.01998775638639927,-0.020169071853160858,0.020768102258443832,-0.0799737200140953,0.01849338971078396,0.10333673655986786,0.007518363185226917,0.04299623891711235,0.06575173884630203,0.007426356431096792,-0.055770330131053925,0.03412043675780296,0.009432222694158554,0.017672445625066757,-0.02123197354376316,0.0039108749479055405,-0.012736148200929165,-0.003603491000831127,-0.06863424181938171,-0.052908457815647125,0.03110441006720066,-0.11880262941122055,-0.028518591076135635,0.10461217910051346,-0.03640346601605415,0.05137774720788002,-0.06008101627230644,-0.013243786990642548,-0.014941987581551075,0.04038184508681297,0.0012051250087097287,-0.00408482551574707,0.034393180161714554,0.04041966050863266,0.05410201475024223,0.0037717383820563555,-0.05893640220165253,0.021519171074032784,-0.028430774807929993,-0.032536037266254425,-0.03753647580742836,0.11979769170284271,0.010468753054738045,-0.0755787342786789,-0.0029934216290712357,0.08451467752456665,0.006750850938260555,-0.01342407800257206,0.013614756986498833,0.05412249639630318,-0.02874232642352581,0.03125019371509552,0.055627670139074326,0.005660416092723608,-0.020441289991140366,-0.02587379701435566,0.045717138797044754,-0.03677166998386383,0.053773801773786545,-0.0335063710808754,-0.023818407207727432,0.030758420005440712,0.04747621342539787,-0.028492212295532227,-0.009758224710822105,-0.04146488010883331,0.007464645430445671,0.04932720586657524,0.003028047736734152,0.03888358920812607,-0.01064563263207674,-0.018446512520313263,-0.05864585563540459,-0.005353345535695553,-0.06516491621732712,0.005843746475875378,0.0011092376662418246,-0.06688516587018967,0.046458758413791656,-0.002311593620106578,0.019576430320739746,0.03121628426015377,0.02664596401154995,0.012287632562220097,-0.06374093145132065,-0.009876566007733345,0.03602202981710434,0.012938639149069786,-0.061821769922971725,0.02476883865892887,0.06895078718662262,-0.0013759199064224958,-0.03338145837187767,0.018113747239112854,-0.03172292560338974,0.07761875540018082,-0.0017090996261686087,0.07163325697183609,0.007983935065567493,-0.044274624437093735,-0.06415429711341858,-0.2646450400352478,0.017889605835080147,-0.020123429596424103,0.00024625385412946343,0.06925848126411438,-0.03603396192193031,-0.007682290859520435,-0.012481410056352615,0.0007426344673149288,0.061695974320173264,0.0737791657447815,-0.021675439551472664,-0.03177638724446297,0.017109166830778122,-0.013045601546764374,0.02642250992357731,0.022851189598441124,0.01490785926580429,-0.05230076611042023,-0.021700650453567505,-0.019647348672151566,-0.0023548032622784376,-0.015080895274877548,-0.06768915802240372,0.026900863274931908,0.00181567610707134,0.2120850831270218,0.022240206599235535,0.03507478907704353,-0.0044991858303546906,0.03554196655750275,0.00949619710445404,-0.0492156483232975,-0.1333152800798416,0.02614152431488037,0.0940435603260994,0.023359185084700584,-0.0037705712020397186,0.01217717956751585,-0.01366211473941803,-0.045424748212099075,0.04367046803236008,0.0011690551182255149,-0.08444396406412125,-0.0077827321365475655,-0.0224749818444252,-0.029568813741207123,-0.014318185858428478,-0.029794400557875633,0.006293837912380695,0.004842750262469053,-0.032637592405080795,0.005224420689046383,0.022823002189397812,0.0042839329689741135,-0.04842546209692955,-0.10416670143604279,0.010237740352749825,-0.006583233363926411,0.025172945111989975,0.03017735667526722,-0.0905810296535492,0.03630441054701805,-0.05704234540462494,0.049373138695955276,-0.0047965338453650475,0.008370066992938519,-0.035849329084157944,0.04221935570240021,-0.03337772190570831,-0.012881233356893063,0.11565454304218292,-0.022791942581534386,-0.0031876510474830866,0.0658482164144516,0.02341897413134575,0.08262187987565994,-0.01129334419965744,-0.0501861535012722,-0.0242783110588789,-0.004055559169501066,-0.01653672195971012,0.02707839570939541,0.04431875795125961,0.04861411824822426,0.026630600914359093,0.07593025267124176,-0.0028852559626102448,0.008493229746818542,-0.024397198110818863,0.031189171597361565,0.010738094337284565,-0.04236379638314247,-0.023878009989857674,0.021017463877797127,0.008104736916720867,-0.2952691614627838,0.05134296417236328,0.017616992816329002,0.04782705381512642,-0.05856649950146675,0.020565781742334366,0.02557527646422386,0.02251933515071869,-0.03896161541342735,0.024350332096219063,-0.009941580705344677,-0.00503632752224803,0.01397236343473196,-0.028976736590266228,0.013651890680193901,0.055249616503715515,0.08140018582344055,-0.037561479955911636,0.07196186482906342,-0.036916106939315796,-0.017782025039196014,0.07602456957101822,0.22702732682228088,-0.06942787766456604,0.03611953184008598,0.023516256362199783,-0.017702462151646614,0.0256802961230278,0.049120038747787476,0.016110895201563835,0.039514701813459396,0.014250420033931732,0.10024885088205338,-0.010977367870509624,0.01877223514020443,0.04446609318256378,-0.06376214325428009,0.017091186717152596,0.027548575773835182,-0.014399025589227676,-0.04807731509208679,0.01237467024475336,-0.053495701402425766,-0.030034249648451805,0.06427783519029617,-0.01935957930982113,-0.02475588768720627,-0.039942461997270584,-0.009692317806184292,0.044893402606248856,-0.04168178513646126,-0.03601958602666855,-0.03289879113435745,0.02290935069322586,0.06115632876753807,-0.01049218699336052,-0.03333268314599991,-0.009713302366435528,-0.07287706434726715,-0.06686870008707047,0.030030913650989532,-0.0570843443274498,-0.020737847313284874,0.03035241924226284,0.0014699796447530389]),
    ('Income', new.id, '#00c969', 'income', true, array[-0.02655249834060669,-0.02112741768360138,0.012730441056191921,-0.04317561909556389,0.008432912640273571,0.08763720095157623,0.04087591916322708,0.035035304725170135,-0.010656743310391903,0.003952533006668091,0.012886286713182926,-0.0777067020535469,0.01972382888197899,0.04329788312315941,-0.01427499484270811,-0.0017202961025759578,-0.018356608226895332,0.009477751329541206,-0.051325634121894836,0.03668960928916931,0.0578509159386158,-0.060500673949718475,-0.021296480670571327,-0.061406783759593964,0.08146914839744568,0.04502439498901367,-0.05044472590088844,-0.03195294365286827,-0.0589505173265934,-0.12353790551424026,0.03202446922659874,-0.04753955826163292,0.07548268139362335,-0.029775358736515045,-0.0001280750147998333,-0.02857743203639984,-0.04747308790683746,0.08083891868591309,-0.028761137276887894,0.019980480894446373,0.006650528404861689,0.032738640904426575,-0.033451057970523834,-0.06340108066797256,-0.0548146516084671,-0.047866739332675934,-0.021467991173267365,0.006602886598557234,0.05288122594356537,-0.015153761953115463,-0.031050043180584908,-0.02481996640563011,0.01055107731372118,0.06669269502162933,0.022535504773259163,-0.003209157846868038,0.048894308507442474,0.011022469028830528,0.03835996985435486,0.0439261831343174,0.009165500290691853,0.038662463426589966,-0.21905536949634552,0.09197293967008591,0.06748190522193909,0.053884513676166534,-0.06054728105664253,-0.02819131501019001,-0.005878657568246126,-0.02968420460820198,-0.053066570311784744,0.028291616588830948,0.007339966017752886,0.016147056594491005,0.02436710149049759,-0.02187344804406166,0.02216394618153572,-0.031147422268986702,-0.026669839397072792,0.008050896227359772,-0.033580467104911804,-0.03817799314856529,-0.004267911426723003,0.03825794905424118,-0.05213075131177902,-0.03618048131465912,0.02366393804550171,-0.05107362940907478,0.10025186091661453,-0.009376229718327522,-0.011434251442551613,-0.03126009181141853,-0.030121885240077972,0.013594578020274639,-0.043823305517435074,-0.011593968607485294,0.029692767187952995,-0.005718935281038284,-0.05095371976494789,0.2720198631286621,-0.015900935977697372,0.017962250858545303,0.04638780280947685,-0.06673544645309448,0.006694375071674585,-0.0019124203827232122,-0.028947053477168083,0.008237604051828384,-0.026744257658720016,0.05415893346071243,-0.020356765016913414,-0.012805975042283535,-0.002962815575301647,-0.047829173505306244,-0.018995366990566254,0.0031239637173712254,0.007363548967987299,0.049431074410676956,0.04159744083881378,-0.008240371942520142,-0.018208887428045273,0.060034189373254776,0.011994453147053719,0.014301888644695282,0.0370868444442749,-0.0675448626279831,0.05066590756177902,0.13436509668827057,0.024806495755910873,0.06268778443336487,0.017240196466445923,-0.004622253123670816,-0.0420805960893631,0.0030414708890020847,-0.025876512750983238,0.009412619285285473,0.02706771157681942,0.0034340054262429476,0.030926335602998734,0.050588153302669525,-0.004306040238589048,-0.06284646689891815,-0.06453566253185272,-0.11094264686107635,0.02616768702864647,0.08632758259773254,-0.01500304602086544,0.014416465535759926,0.0037193659227341413,-0.00986736360937357,-0.05250225588679314,0.043745506554841995,-0.006235846318304539,-0.04532470926642418,0.0030395800713449717,0.01770702190697193,0.012005449272692204,0.009041366167366505,-0.029541822150349617,-0.02111726813018322,-0.022099977359175682,-0.050422027707099915,-0.07727339118719101,0.11850209534168243,0.003361632814630866,-0.06550255417823792,-0.02829727903008461,0.05183939263224602,-0.028605470433831215,-0.029557358473539352,0.038890354335308075,0.024385470896959305,-0.05692046880722046,0.01868646778166294,0.11298906058073044,-0.002893801312893629,0.0052098785527050495,0.043076083064079285,-0.0006428034976124763,0.050660885870456696,0.08090248703956604,-0.05145183578133583,-0.02802339754998684,0.04438120126724243,0.010639696381986141,-0.011944935657083988,-0.005196441430598497,-0.018288027495145798,0.0010214352514594793,0.02941601723432541,-0.013278914615511894,0.021258503198623657,-0.0663127526640892,-0.03205973654985428,-0.024058174341917038,-0.024993928149342537,-0.013839363120496273,-0.030176347121596336,0.018994178622961044,-0.022474555298686028,0.05484279245138168,-0.011034456081688404,0.0010030793491750956,0.038742437958717346,-0.011482451111078262,0.011254084296524525,0.002930029295384884,-0.0024486142210662365,0.06302214413881302,0.02900405041873455,-0.046103764325380325,-0.01966819353401661,0.0718185231089592,-0.013328655622899532,-0.012234365567564964,-0.0008002813556231558,0.03902873769402504,0.036413006484508514,0.05297791585326195,0.05110437795519829,-0.011402426287531853,-0.08052604645490646,-0.038854025304317474,-0.21687689423561096,0.012390771880745888,-0.0139571288600564,-0.027781277894973755,0.021204141899943352,-0.01688108965754509,-0.0029020875226706266,0.0269424170255661,-0.01828969269990921,0.04873437434434891,0.10037550330162048,-0.029062243178486824,-0.040301863104104996,0.04071107879281044,0.009976320900022984,0.0013901509810239077,0.008561380207538605,0.0041023120284080505,0.013557462953031063,-0.0009110612445510924,-0.012815220281481743,0.010651912540197372,-0.03509698435664177,-0.02484005130827427,0.10926877707242966,-0.03176905959844589,0.2042665034532547,-0.010251425206661224,0.03843977302312851,-0.040448643267154694,0.0316348634660244,0.07180491089820862,0.001601110678166151,-0.13267405331134796,0.03203887864947319,0.022831963375210762,0.030407002195715904,-0.03704071044921875,-0.10140262544155121,-0.04928866773843765,-0.003556441515684128,0.014270885847508907,-0.04914479702711105,-0.031013138592243195,-0.005156088620424271,0.006741760764271021,-0.0710693746805191,0.013732539489865303,-0.0013427763478830457,0.047788504511117935,0.04082292318344116,-0.011727165430784225,0.047922488301992416,0.009669742546975613,0.03600294888019562,-0.048322513699531555,-0.09005105495452881,-0.022656600922346115,-0.021602308377623558,0.02646099030971527,0.02555362693965435,-0.045203376561403275,0.041167136281728745,-0.028979429975152016,0.06757476925849915,0.006842674221843481,-0.020264478400349617,-0.062353529036045074,0.012330438941717148,-0.057340558618307114,-0.008773129433393478,0.0710800439119339,0.0025207858998328447,-0.032031986862421036,0.04936276748776436,0.017148124054074287,0.07856328785419464,-0.024879470467567444,0.010407816618680954,-0.03790128976106644,0.05013348534703255,-0.003567270003259182,0.015445498749613762,0.014973084442317486,0.0431155301630497,-0.002702379133552313,0.06204906851053238,-0.0019410174572840333,0.02387915924191475,-0.04079316556453705,0.004514371044933796,0.02161240205168724,-0.07104715704917908,-0.0619564950466156,-0.020533593371510506,0.01820562407374382,-0.2861956059932709,0.05473725497722626,-0.023390332236886024,-0.0027315716724842787,-0.04529362544417381,-0.00257427291944623,0.01190968882292509,0.04077693447470665,-0.0814783126115799,0.04970112442970276,0.09643144905567169,0.05847847834229469,0.02151298336684704,-0.008462758734822273,0.024527741596102715,0.0019516705069690943,0.007278511766344309,-0.039064131677150726,0.01423924695700407,-0.023101499304175377,0.03842327743768692,0.04207197576761246,0.20523686707019806,-0.042251646518707275,0.0419391430914402,-0.018901372328400612,-0.03878823667764664,0.02032891847193241,0.022785963490605354,-0.002795630367472768,0.03781434893608093,0.0632590502500534,0.07519666850566864,-0.03515864536166191,-0.0012167966924607754,0.05526221916079521,-0.012260445393621922,0.04520750418305397,0.0003746618749573827,0.002573322271928191,-0.050756897777318954,0.012630889192223549,-0.03303683549165726,-0.015601962804794312,0.09400901198387146,-0.039286352694034576,-0.042112797498703,-0.08936697244644165,0.04934469237923622,0.027698474004864693,-0.032027628272771835,-0.019041482359170914,-0.03518414497375488,0.016137560829520226,0.03088614158332348,-0.027177775278687477,-0.10025118291378021,-0.0017290194518864155,-0.004293049219995737,-0.05596147105097771,-0.004844167269766331,-0.03331800550222397,-0.08418215811252594,0.0014808217529207468,-0.010273088701069355]),
    ('Equipment', new.id, '#e9be26', 'equipment', true, array[-0.03489544987678528,-0.0006098966696299613,0.06372195482254028,-0.05019458755850792,0.02131739817559719,0.014705440029501915,0.06009005755186081,0.03841541334986687,-0.0160807054489851,0.0013540383661165833,-0.012843981385231018,-0.1066337302327156,0.032786477357149124,0.03902469947934151,0.018333707004785538,0.00002572136145317927,0.0443674698472023,0.02136090211570263,-0.01788686029613018,0.020335571840405464,0.004955660551786423,-0.03598416596651077,-0.02126581035554409,-0.06437484920024872,-0.009750504046678543,0.026701519265770912,-0.06753899157047272,-0.023023784160614014,-0.04698473960161209,-0.14680500328540802,-0.040959324687719345,-0.07602972537279129,0.032636817544698715,-0.03702530637383461,-0.031036626547574997,-0.041072554886341095,-0.009596898220479488,0.011948646046221256,-0.03403300419449806,0.05184942111372948,0.06010371074080467,0.03386640548706055,-0.0448046550154686,-0.06575559824705124,-0.015094212256371975,-0.018092870712280273,0.0008313040598295629,-0.0453733429312706,0.08101264387369156,-0.03874519094824791,0.036729130893945694,-0.036007754504680634,0.020160404965281487,0.009172004647552967,0.006681420840322971,-0.0008669878006912768,0.049566905945539474,0.03002220392227173,0.02338375523686409,0.03784694895148277,0.02202877216041088,0.033981047570705414,-0.22589458525180817,0.07642368972301483,-0.008856021799147129,0.027399448677897453,-0.007808175403624773,-0.035780198872089386,0.03383253514766693,0.060179829597473145,-0.012843863107264042,0.022183356806635857,0.014993925578892231,0.058828867971897125,0.014400461688637733,-0.030144261196255684,-0.011180602014064789,-0.05895543098449707,-0.003790519433096051,0.012130273506045341,0.01017824187874794,-0.07529561966657639,-0.028786785900592804,-0.004753266926854849,-0.03646906465291977,-0.011051337234675884,0.003537052543833852,-0.055118028074502945,0.046571072190999985,-0.00921700056642294,-0.08445233106613159,0.02493954822421074,-0.038167890161275864,0.03792564198374748,-0.053157102316617966,-0.03231939673423767,0.008534357883036137,-0.023942995816469193,-0.05444701761007309,0.26985183358192444,-0.028888097032904625,-0.0065529681742191315,0.07751064747571945,-0.01805577240884304,0.04089926555752754,-0.04072362557053566,-0.04530470073223114,-0.0029744054190814495,-0.04144518822431564,0.03763178363442421,0.044912565499544144,0.007553603034466505,-0.026759421452879906,0.020178163424134254,0.03717711940407753,-0.009796799160540104,-0.033878911286592484,0.039302848279476166,-0.021270491182804108,-0.03075648471713066,-0.014323909766972065,0.03461680933833122,0.04246608912944794,-0.013178604654967785,-0.006216051988303661,-0.14079907536506653,0.04060475900769234,0.12292420864105225,0.025739025324583054,0.052558835595846176,0.014456836506724358,-0.032182976603507996,-0.03187995031476021,-0.025322116911411285,-0.008029626682400703,0.026509160175919533,0.05577807128429413,-0.020527517423033714,0.035607416182756424,0.014591502025723457,-0.05283986032009125,-0.05924356356263161,0.02159997820854187,-0.10374224185943604,-0.014111412689089775,0.07971523702144623,-0.06017080694437027,0.028518714010715485,-0.016192948445677757,-0.01993238925933838,-0.014139456674456596,0.047068916261196136,0.041778597980737686,-0.012450356036424637,0.02940378710627556,0.05963800475001335,-0.004242443945258856,0.019102804362773895,-0.02142317034304142,0.014425891451537609,-0.02701644040644169,-0.006799761671572924,-0.028695283457636833,0.07318445295095444,-0.016096938401460648,-0.12263371050357819,-0.024835221469402313,0.013091694563627243,0.016774486750364304,-0.03233732655644417,0.020425308495759964,0.02140123024582863,-0.04780839756131172,0.006346837151795626,0.08008570224046707,0.04884500801563263,-0.03090769611299038,0.021405544131994247,-0.022222157567739487,0.00811803713440895,0.025382105261087418,-0.02046302519738674,-0.051989153027534485,0.02835770510137081,0.036056701093912125,0.014088133350014687,-0.010211358778178692,-0.016748329624533653,0.033952392637729645,0.08140230178833008,-0.018717782571911812,0.03043566271662712,-0.01294145081192255,-0.010509324260056019,-0.021949727088212967,-0.0022626984864473343,-0.03585001453757286,0.030692394822835922,0.0002939495607279241,-0.0620284304022789,0.03348676487803459,-0.0010780509328469634,0.01181149110198021,0.051389243453741074,0.01514045987278223,0.018566563725471497,-0.020046638324856758,-0.012127650901675224,0.0015211111167445779,0.054329805076122284,-0.04204461723566055,-0.005695803090929985,0.07138237357139587,-0.023358985781669617,-0.028981436043977737,0.006987180560827255,0.0023225760087370872,0.026074783876538277,0.013106254860758781,0.056989990174770355,0.01872686669230461,-0.057415664196014404,-0.02324201725423336,-0.26117533445358276,0.0525987409055233,0.008851735852658749,0.01422462984919548,0.0991213321685791,-0.014273890294134617,0.02102569118142128,0.02098655514419079,-0.020839126780629158,0.03299069404602051,0.08789357542991638,-0.03928248584270477,-0.028637569397687912,0.002065288135781884,-0.049769479781389236,0.08510826528072357,0.03554230555891991,-0.022440284490585327,-0.04322047531604767,0.024178721010684967,-0.013296197168529034,0.06400499492883682,-0.041508421301841736,-0.019424399361014366,0.03443604335188866,-0.007822207175195217,0.21688811480998993,-0.03865017741918564,0.04844771325588226,-0.028418876230716705,0.024133838713169098,0.018674394115805626,-0.04031013697385788,-0.0687713623046875,0.03329763188958168,0.034259092062711716,0.030067985877394676,0.007512333337217569,0.004006249364465475,-0.03311078995466232,-0.054831068962812424,0.07577385753393173,0.015458989888429642,-0.07788169384002686,0.027482204139232635,-0.048771947622299194,-0.04524090886116028,0.006918114610016346,-0.06485803425312042,-0.03239446133375168,0.0316537469625473,-0.045497648417949677,0.03515620529651642,0.017844308167696,0.0060577974654734135,-0.04204583913087845,-0.08231452852487564,0.037405941635370255,-0.0237626563757658,0.02984028123319149,0.018917124718427658,-0.023335227742791176,0.017931614071130753,-0.04643364995718002,0.08766545355319977,-0.01803983375430107,-0.013198984786868095,-0.027546647936105728,0.03738155961036682,-0.06285358965396881,-0.01444487739354372,0.05135307088494301,0.015043612569570541,0.02012435905635357,0.07687721401453018,-0.010278914123773575,0.030696235597133636,-0.03706153854727745,0.0007836904260329902,-0.015577302314341068,0.04583709314465523,0.00557501008734107,-0.003097980050370097,0.017579203471541405,0.036304451525211334,-0.005744779948145151,0.0388907827436924,0.003541609738022089,0.04384533315896988,-0.026848701760172844,0.0018683193484321237,-0.000986051862128079,-0.020511703565716743,-0.042285870760679245,0.036425407975912094,0.0030037632677704096,-0.3259687125682831,0.03922964632511139,0.03615907207131386,0.019864961504936218,-0.04111821576952934,0.02703947015106678,0.006198990624397993,0.05514281243085861,-0.04873025789856911,0.031060725450515747,0.03257627785205841,0.014376471750438213,0.0031522156205028296,0.01914234645664692,-0.0022128974087536335,0.05577949434518814,0.06665336340665817,-0.05073054879903793,0.03936810418963432,-0.060972344130277634,0.01342837419360876,0.03567765653133392,0.19971686601638794,-0.001801358419470489,0.02795863151550293,0.003991392441093922,-0.0323198027908802,0.014747096225619316,-0.0038342855405062437,0.003649438964203,0.057686205953359604,0.013316437602043152,0.08649227023124695,-0.012624108232557774,0.007199068553745747,0.07100999355316162,-0.038445815443992615,0.014246311970055103,0.01243891753256321,-0.03433355689048767,-0.08553647249937057,-0.009547829627990723,-0.05037490651011467,-0.016818663105368614,0.0962098017334938,-0.028039323166012764,-0.03777356073260307,-0.07764163613319397,-0.01394438836723566,-0.011710326187312603,0.004253108520060778,0.025411490350961685,-0.04406275227665901,0.02381215989589691,0.010690259747207165,-0.0000919010053621605,-0.01875118538737297,-0.004323145374655724,-0.020116467028856277,-0.038294386118650436,0.05201740190386772,-0.05709776654839516,-0.0688428282737732,0.048010315746068954,-0.004038076847791672]),
    ('Salary', new.id, '#d3e500', 'salary', true, array[-0.015003038570284843,-0.008011563681066036,0.04966170713305473,-0.036293890327215195,0.011336826719343662,0.03529863432049751,0.07098012417554855,0.02165718749165535,0.004514095839112997,-0.0013533219462260604,0.04360971227288246,-0.11226873844861984,0.014210417866706848,0.03323187679052353,-0.01660056971013546,-0.03853808343410492,-0.00798858143389225,-0.0005982612492516637,-0.03460003063082695,0.07131923735141754,0.0426020510494709,-0.0522405244410038,-0.007941399700939655,-0.04014258459210396,0.07869419455528259,0.007491719909012318,-0.07995127141475677,-0.03390071168541908,-0.057546619325876236,-0.09841230511665344,-0.014883712865412235,-0.05602900683879852,0.03199939802289009,-0.044026680290699005,-0.023034902289509773,-0.02373100072145462,-0.05892327427864075,0.03858792781829834,0.019673021510243416,0.023096619173884392,0.03742365166544914,0.008223775774240494,-0.03435899689793587,-0.035678546875715256,-0.045316342264413834,-0.05045676231384277,-0.0541193000972271,-0.0327424593269825,-0.003980519715696573,-0.0010205738944932818,0.003783434396609664,-0.05251345783472061,-0.01584041304886341,0.10021308809518814,0.021516118198633194,0.036146145313978195,0.05236898362636566,-0.019317254424095154,-0.014555975794792175,0.04835568368434906,0.012613201513886452,0.009833158925175667,-0.20954276621341705,0.0653809905052185,0.04610965773463249,0.03264842554926872,-0.041170936077833176,-0.047792479395866394,0.001471781637519598,0.01603541150689125,-0.015404421836137772,0.01520706806331873,0.011724311858415604,-0.0035054089967161417,0.05661672726273537,-0.015197200700640678,0.00101388746406883,-0.029890524223446846,0.009630747139453888,0.0373171903192997,-0.005568533670157194,-0.06040005013346672,-0.029004275798797607,0.02621777355670929,-0.0387473925948143,-0.07251550257205963,0.07737604528665543,-0.026015587151050568,0.07913777977228165,0.011950031854212284,0.01949825882911682,-0.023166988044977188,-0.03693019598722458,-0.011594260111451149,-0.07095582783222198,0.010058767162263393,0.040491603314876556,0.006197246257215738,-0.047371186316013336,0.26060736179351807,-0.026895200833678246,0.012454655021429062,0.052171219140291214,-0.07851367443799973,0.060450125485658646,0.0061570219695568085,-0.05213110148906708,-0.001667967764660716,-0.04437215253710747,0.030183987691998482,-0.019828397780656815,-0.013293424621224403,0.012906336225569248,-0.031820815056562424,0.03704014793038368,0.03107406571507454,0.01874922215938568,0.014947121031582355,0.006695596035569906,-0.031484514474868774,0.014680004678666592,0.06038977578282356,-0.002098041120916605,0.026264984160661697,0.013779174536466599,-0.05677376687526703,0.05347047001123428,0.1650608628988266,0.03552071377635002,0.08176425844430923,0.030185233801603317,-0.022885296493768692,-0.03252043575048447,0.003119657514616847,-0.011417667381465435,0.029699226841330528,0.025798050686717033,0.025917913764715195,0.01965194195508957,0.021206462755799294,-0.029893837869167328,-0.11324705928564072,-0.05005478486418724,-0.09050924330949783,-0.03133994713425636,0.09751999378204346,-0.06989764422178268,0.01665751077234745,-0.016792207956314087,0.002712532877922058,-0.061112355440855026,0.03883923590183258,-0.0289365965873003,-0.0036244450602680445,0.03598859906196594,0.014150504022836685,0.011401190422475338,0.04817395657300949,-0.06161459535360336,-0.03551992028951645,0.031366977840662,-0.06320936977863312,-0.06115520000457764,0.0804811418056488,0.00491870054975152,-0.12393034249544144,0.01594719849526882,0.030201951041817665,-0.03306165337562561,-0.032599031925201416,0.03357773274183273,0.014008506201207638,-0.049634240567684174,0.027986282482743263,0.07720085233449936,-0.020535990595817566,0.007515194360166788,0.04703748598694801,-0.0032522042747586966,0.034444570541381836,0.07288064807653427,-0.00528850220143795,-0.028934530913829803,0.04270473122596741,0.027274465188384056,-0.009280834347009659,0.016264410689473152,0.00025746095343492925,0.007896598428487778,0.060138240456581116,-0.010952278971672058,0.04961709305644035,-0.0636790543794632,-0.04968738555908203,-0.04985148459672928,-0.01186668686568737,-0.005841713398694992,0.00836702436208725,0.04318877309560776,-0.0005905610742047429,0.04887790232896805,0.030167240649461746,-0.05130968987941742,0.02631782367825508,0.0067877271212637424,-0.004866817966103554,0.022229382768273354,0.019962556660175323,0.03912569209933281,0.0580550953745842,-0.049792613834142685,-0.009876678697764874,0.06733471155166626,-0.037977054715156555,-0.05054670572280884,0.003012461122125387,0.03702925145626068,0.06887410581111908,0.06720693409442902,0.022197525948286057,-0.01592874526977539,-0.03076435998082161,-0.0035494156181812286,-0.18486401438713074,0.040326979011297226,0.007064971141517162,-0.0388365313410759,0.015613654628396034,-0.0008360287174582481,-0.0050661638379096985,-0.00544651597738266,0.06193698197603226,0.046666841953992844,0.036101385951042175,-0.02944987639784813,-0.04911354184150696,0.01147591881453991,0.010666685178875923,0.02621176280081272,0.04261545091867447,0.03123912774026394,-0.0015730794984847307,-0.037073928862810135,0.029780449345707893,0.003545191837474704,-0.06438212841749191,-0.03464079275727272,0.0821676105260849,-0.028500346466898918,0.18195787072181702,-0.0005710665718652308,0.010029595345258713,-0.05296505615115166,0.018591370433568954,0.06264086067676544,0.01914878375828266,-0.11403285712003708,0.021779851987957954,0.022385936230421066,0.00155682023614645,-0.02940232679247856,-0.08520521223545074,-0.016498718410730362,0.03272971510887146,0.02461676113307476,-0.04784834012389183,-0.04443007707595825,-0.026367684826254845,0.015091551467776299,-0.04806007817387581,-0.0006683201063424349,-0.04663785547018051,0.013525047339498997,0.01167329028248787,-0.00997406430542469,0.016054168343544006,0.012443012557923794,0.06990328431129456,-0.060330599546432495,-0.09725034981966019,0.000012144516404077876,-0.04051455482840538,0.007933719083666801,-0.009522688575088978,-0.05018279328942299,0.012581183575093746,-0.005451777018606663,0.060950249433517456,-0.007945546880364418,-0.02835000306367874,-0.03951677307486534,0.03236402943730354,-0.090728260576725,0.004653075709939003,0.05134843289852142,0.046245139092206955,-0.037576138973236084,0.03808268904685974,0.022558003664016724,0.05017132684588432,-0.0010829935781657696,-0.018580812960863113,-0.00807894766330719,0.07552484422922134,-0.024847958236932755,0.015393105335533619,0.04416938126087189,0.0165781881660223,0.002391623565927148,0.04854530096054077,0.0053530544973909855,0.014004623517394066,-0.01908487267792225,-0.009699343703687191,0.02368934638798237,-0.03138188272714615,-0.08665744960308075,-0.01026457455009222,-0.002947581931948662,-0.3076630234718323,0.044314611703157425,-0.017176158726215363,-0.005510986316949129,-0.03158530220389366,0.0001392340927850455,-0.03180735185742378,0.007901512086391449,-0.05755944550037384,0.031395357102155685,0.07616396993398666,0.05804142355918884,-0.010845660232007504,0.0224008671939373,0.0163448303937912,0.03231910988688469,0.008534310385584831,-0.024509109556674957,0.03404923528432846,0.013898325152695179,0.011586369946599007,0.04034699127078056,0.22017988562583923,-0.064466692507267,0.05544860288500786,-0.0016721070278435946,-0.06133168935775757,0.0313829705119133,0.05968241021037102,-0.02248534932732582,0.028896939009428024,0.03409428149461746,0.06281142681837082,-0.05048326030373573,0.007927564904093742,0.10551082342863083,-0.018843410536646843,0.04241213575005531,-0.024569274857640266,0.035623062402009964,-0.006325806491076946,0.02541922591626644,-0.0038536465726792812,-0.045808449387550354,0.11241550743579865,-0.022666392847895622,-0.019879499450325966,-0.07353926450014114,0.05360489711165428,-0.014825011603534222,-0.07682997733354568,-0.003080541966482997,0.004036754369735718,0.0018255597678944468,0.0062451655976474285,-0.02594154328107834,-0.07022657990455627,-0.039725471287965775,-0.059779033064842224,-0.04973393678665161,-0.0195848997682333,-0.005807270295917988,-0.10180052369832993,0.05096513032913208,0.010937252081930637]),
    ('Transfer', new.id, '#ff902b', 'transfer', true, array[-0.0008543143630959094,-0.03153528645634651,0.01760505512356758,-0.026293914765119553,0.01272718794643879,0.007648353930562735,0.07564494013786316,0.03772610053420067,0.015271421521902084,-0.016962479799985886,0.026640649884939194,-0.10825369507074356,0.025739582255482674,0.02354479394853115,0.009662379510700703,-0.0014317932073026896,-0.024736585095524788,0.05299876630306244,-0.07083386927843094,0.017554454505443573,0.0017582759028300643,-0.027764922007918358,-0.027060896158218384,-0.02542588673532009,0.0514235757291317,0.011386471800506115,-0.03826776519417763,-0.04675815999507904,-0.0984497144818306,-0.15284118056297302,-0.017766857519745827,-0.06248567998409271,-0.0550806000828743,-0.02123795635998249,0.017926232889294624,-0.025932462885975838,-0.00966317392885685,0.035986218601465225,-0.014958341605961323,0.08367782086133957,0.06202347204089165,0.043053578585386276,-0.042949579656124115,-0.07983282953500748,-0.04439800605177879,-0.04999464377760887,-0.030605899170041084,-0.003238353878259659,0.05623544007539749,-0.04655364155769348,0.03191617876291275,-0.024537933990359306,0.022050146013498306,0.062189530581235886,-0.0000717336661182344,0.08844436705112457,0.07898268103599548,0.01516187097877264,0.04961904138326645,0.0522584430873394,0.019825365394353867,0.08598624169826508,-0.22725577652454376,0.08565232157707214,0.04617060720920563,0.021441880613565445,-0.02408774383366108,-0.015510991215705872,0.014945642091333866,0.04409181699156761,-0.09331410378217697,-0.006946165580302477,0.019242845475673676,0.0735829770565033,0.05017184466123581,-0.036011796444654465,0.007825777865946293,-0.020008502528071404,-0.02246994525194168,0.021132733672857285,-0.02158985659480095,-0.012730598449707031,-0.022655202075839043,-0.005269944202154875,-0.04560231417417526,-0.009340166114270687,0.01269378513097763,-0.07818503677845001,0.03094617649912834,0.022114913910627365,-0.017801791429519653,-0.006848735734820366,0.004624348599463701,0.009914114139974117,-0.06219248101115227,-0.033817749470472336,0.03369685262441635,0.007606430444866419,-0.007323497906327248,0.2544237971305847,-0.048102740198373795,0.04305770620703697,0.0379641018807888,0.004266282077878714,0.028736580163240433,-0.00019251480989623815,-0.018206581473350525,-0.02527538873255253,-0.03167889639735222,0.017747066915035248,-0.052168574184179306,0.006308313924819231,0.03528502583503723,-0.0152273029088974,0.04916440322995186,0.03352520987391472,0.02765960991382599,0.043997135013341904,-0.021355586126446724,-0.026963001117110252,-0.026617368683218956,0.04750475287437439,0.027881760150194168,-0.023213200271129608,-0.0016585643170401454,-0.06177769973874092,0.006785930134356022,0.11075790971517563,0.02884555049240589,0.02983400784432888,0.03476027399301529,-0.017461584880948067,-0.07908880710601807,-0.037342604249715805,-0.005426786839962006,0.02309907227754593,0.014784772880375385,-0.06339873373508453,-0.020900888368487358,-0.006779216695576906,0.001295129070058465,-0.10651163756847382,0.014321926049888134,-0.10698329657316208,-0.026116065680980682,0.07858585566282272,-0.014888281002640724,0.011552531272172928,-0.00444214791059494,0.03917452320456505,-0.030379895120859146,0.03907280042767525,-0.014330998994410038,-0.02366684377193451,-0.006990198045969009,0.010537119582295418,0.04120772331953049,0.03469792753458023,-0.011489472351968288,0.018467240035533905,-0.012144253589212894,-0.04929494857788086,-0.06377512961626053,0.09052328765392303,0.02919795550405979,-0.06253138929605484,-0.039126597344875336,-0.014222751371562481,0.016954494640231133,-0.04495842009782791,0.018917782232165337,0.02616211213171482,0.008760746568441391,0.013381610624492168,0.08150001615285873,0.006877322681248188,-0.04010144621133804,-0.03862501680850983,0.016356924548745155,-0.02760302647948265,0.055939268320798874,-0.04027298837900162,-0.03864973410964012,0.02431734837591648,0.08566833287477493,-0.0009630465065129101,-0.039212100207805634,-0.03364334627985954,0.005854328628629446,0.05707200616598129,-0.009896702133119106,0.05721267685294151,-0.03339237719774246,-0.03856464475393295,-0.01968945562839508,-0.011379649862647057,-0.04849076643586159,-0.002179480157792568,0.004671779926866293,-0.026118343695998192,0.04100218787789345,0.021228879690170288,-0.04512745141983032,0.03031277470290661,-0.020705850794911385,0.008647606708109379,-0.0022231475450098515,-0.027456894516944885,0.017490984871983528,0.044727399945259094,-0.030220387503504753,-0.005666628014296293,0.07184796780347824,0.02498616650700569,-0.0729265883564949,0.0080611202865839,0.0030202933121472597,0.05009493604302406,0.06937161833047867,0.023510228842496872,0.019735923036932945,-0.049083858728408813,0.016253096982836723,-0.2600734531879425,0.03599235415458679,0.030024060979485512,-0.02643301524221897,0.07958071678876877,-0.012104818597435951,0.05212191864848137,-0.031232070177793503,0.04368990287184715,0.06432639807462692,0.10439072549343109,-0.020095141604542732,-0.04240092262625694,0.05022053420543671,-0.02372979372739792,0.019027454778552055,-0.013537089340388775,0.06204582378268242,-0.001083000679500401,-0.006400733720511198,-0.020443635061383247,0.017979592084884644,-0.04996618255972862,-0.032700154930353165,0.03393295034766197,-0.04134638234972954,0.22592884302139282,0.032341621816158295,0.06480145454406738,-0.01134257297962904,0.02516205981373787,0.020773831754922867,0.022509459406137466,-0.12904642522335052,0.0378851480782032,0.0002964656741824001,0.023401983082294464,-0.0047979215160012245,0.01457107812166214,-0.03533114120364189,-0.0033697912003844976,0.007791804615408182,-0.01983434148132801,-0.059651173651218414,0.027522074058651924,0.010644551366567612,-0.03491988778114319,-0.01710902340710163,-0.027131536975502968,0.014305789023637772,0.011745303869247437,0.005535806529223919,0.014178495854139328,-0.005290445405989885,-0.015520905144512653,-0.01839447021484375,-0.06854023784399033,0.051917023956775665,0.014690821059048176,0.02182236686348915,-0.029554475098848343,-0.006072724238038063,0.029457170516252518,-0.06849177926778793,0.034020282328128815,-0.007911553606390953,0.0006232524756342173,-0.021174028515815735,0.022382531315088272,-0.03337172418832779,-0.009951073676347733,0.04665275290608406,0.0020705542992800474,0.014837914146482944,0.046703606843948364,0.03374286741018295,0.011114595457911491,0.019847748801112175,-0.03596383333206177,-0.044811077415943146,0.027773680165410042,-0.08527905493974686,0.016339391469955444,0.04409212991595268,0.03201952576637268,0.04380286857485771,0.06959179788827896,-0.02524765022099018,-0.027877843007445335,-0.04366244003176689,-0.007478745188564062,-0.03732597082853317,-0.06668458878993988,-0.021013230085372925,-0.011881548911333084,-0.04462520405650139,-0.3092651963233948,0.0060954918153584,0.04591996595263481,0.037956710904836655,-0.03153209388256073,0.025074146687984467,0.018420737236738205,0.02778208814561367,-0.05589233711361885,0.0287253987044096,0.035200778394937515,-0.03344305604696274,0.06817805767059326,0.01190897822380066,0.025925416499376297,0.031697552651166916,0.06546744704246521,-0.05108226463198662,0.011877680197358131,-0.04836885258555412,-0.006982056424021721,0.007777724880725145,0.2138172835111618,-0.02817639522254467,0.03590787947177887,0.009231507778167725,-0.02106064185500145,0.04177924990653992,0.03781356289982796,-0.013963507488369942,0.02323053404688835,0.056639742106199265,0.07176955789327621,-0.053914863616228104,-0.004050204064697027,0.03930829092860222,-0.04702923819422722,0.06812840700149536,0.0053390320390462875,-0.01370975747704506,-0.041604649275541306,0.0036054374650120735,-0.03572171926498413,-0.007379110436886549,0.10156072676181793,-0.0025610649026930332,-0.022200513631105423,-0.05432230979204178,-0.05594342201948166,0.022215673699975014,-0.01763804629445076,0.030407516285777092,0.0044115567579865456,-0.036764226853847504,0.012394851073622704,0.01694035530090332,-0.03593340143561363,-0.04407426342368126,-0.044478580355644226,-0.04155687615275383,0.02475319802761078,-0.060344479978084564,-0.039798296988010406,-0.0013129989383742213,0.017695607617497444]),
    ('Internet And Telephone', new.id, '#ff8976', 'internet-and-telephone', true, array[-0.055920396000146866,0.009380275383591652,0.04847823828458786,-0.0017814788734540343,-0.009133153595030308,0.0033661937341094017,0.05686885863542557,0.06945410370826721,-0.03154052793979645,-0.04057127609848976,0.00489357253536582,-0.02187531441450119,0.06486200541257858,0.021365342661738396,0.03233778849244118,0.03346562385559082,0.027589136734604836,-0.026339001953601837,-0.03570681810379028,0.06762341409921646,0.0663326233625412,-0.016820812597870827,-0.03218218311667442,-0.038299378007650375,0.06064056605100632,-0.011477180756628513,-0.05796588584780693,-0.04541189596056938,-0.03293547034263611,-0.09737753123044968,0.026075638830661774,-0.007530358154326677,0.04634597525000572,-0.014130957424640656,-0.0319075845181942,-0.06215126812458038,-0.018705449998378754,0.01219598762691021,-0.05900575593113899,0.05371026694774628,0.002418010262772441,0.007184430491179228,-0.01218203455209732,-0.022749457508325577,-0.0611010417342186,-0.05342143401503563,0.00021642429055646062,0.011582158505916595,0.05185617506504059,-0.08912879973649979,0.032464273273944855,0.021821768954396248,0.018219640478491783,0.031487930566072464,0.042593225836753845,0.03919203579425812,0.07516046613454819,0.014121207408607006,0.034272242337465286,0.04515250027179718,0.02744137868285179,0.010079973377287388,-0.24545983970165253,0.1343693882226944,0.023442447185516357,0.0380944088101387,-0.056738268584012985,0.0006462910096161067,0.01746492274105549,0.023025108501315117,-0.062273990362882614,0.03154595568776131,-0.011601096019148827,0.08230224251747131,0.0036356712225824594,0.006734765600413084,-0.008617715910077095,-0.027318473905324936,-0.02150901034474373,0.02927260659635067,0.02290160395205021,-0.01780529133975506,0.015402976423501968,0.002679685363546014,-0.013614538125693798,-0.0585324726998806,0.015940027311444283,-0.034638527780771255,0.005122709088027477,-0.010557996109127998,-0.08127179741859436,0.007421539630740881,-0.017827095463871956,0.03539787977933884,-0.04499223455786705,-0.04372674971818924,-0.001140369102358818,-0.0178621094673872,-0.06382200866937637,0.2612241804599762,-0.06539630144834518,-0.019407158717513084,0.054973479360342026,-0.05417218059301376,0.06241745501756668,-0.027346527203917503,-0.017400791868567467,-0.03302204981446266,-0.012457323260605335,0.040065255016088486,0.012222091667354107,-0.025698060169816017,0.015034587122499943,0.0013174787163734436,0.04403810203075409,0.03413841500878334,0.02936384081840515,0.014637044630944729,0.048680346459150314,-0.030370749533176422,-0.04114050418138504,-0.008619822561740875,0.017325889319181442,-0.03512699156999588,0.036081910133361816,-0.07830527424812317,0.0490647554397583,0.12587447464466095,0.01418114360421896,0.05598122626543045,0.028709758073091507,-0.03405434638261795,-0.005735830403864384,-0.013208922930061817,0.00606866180896759,0.023387400433421135,0.027304047718644142,-0.011135484091937542,0.0017553818179294467,-0.033789265900850296,-0.048629678785800934,-0.1548142433166504,0.0008965331362560391,-0.1043752059340477,-0.00444251112639904,0.11559886485338211,-0.0017028473084792495,0.046292584389448166,-0.018245885148644447,-0.00001937794149853289,-0.017129313200712204,0.06417471915483475,0.04140247404575348,-0.02734479121863842,0.021975120529532433,0.007186640053987503,0.0565517358481884,0.0498882420361042,-0.00878166314214468,-0.01692369021475315,-0.024886222556233406,-0.04517124220728874,-0.057807717472314835,0.12288467586040497,0.0019335206598043442,-0.1254752278327942,-0.05981907248497009,-0.03104272112250328,-0.02498936839401722,0.009239818900823593,0.004820931237190962,0.024362286552786827,-0.050202202051877975,0.0068025351502001286,0.07498939335346222,0.000015077394891704898,-0.059967558830976486,0.010100185871124268,-0.024772949516773224,-0.0010022285860031843,0.010369653813540936,-0.024405619129538536,-0.02790258452296257,0.003482020227238536,0.01965184696018696,-0.04913865029811859,-0.033900078386068344,-0.03841676935553551,0.06048315018415451,0.02037452720105648,0.0022055315785109997,0.020854340866208076,-0.003675322514027357,-0.04103405401110649,-0.029540695250034332,-0.023787640035152435,-0.03745781630277634,-0.011065663769841194,-0.0032420482020825148,-0.05321785807609558,0.10291548073291779,-0.009583127684891224,-0.04081214591860771,0.0380634069442749,0.022360622882843018,0.019129939377307892,0.010584801435470581,-0.020278234034776688,0.06482822448015213,0.031057074666023254,-0.010551146231591702,-0.01091656181961298,0.09970439970493317,-0.01709403097629547,-0.03220866620540619,-0.015483809635043144,0.055450960993766785,0.033798061311244965,0.044700220227241516,0.05458148196339607,0.016529254615306854,-0.028086788952350616,-0.053486645221710205,-0.2163596749305725,-0.04878231883049011,0.004220799542963505,-0.016085505485534668,0.040643226355314255,-0.04221414029598236,0.018525870516896248,-0.03530365601181984,0.0023059870582073927,0.05177241936326027,0.07413801550865173,0.028708359226584435,-0.008757563307881355,0.020577076822519302,-0.028299717232584953,0.04262832552194595,0.018731864169239998,0.022113805636763573,-0.006135824602097273,0.025844767689704895,-0.033988188952207565,0.02706940285861492,-0.02734169363975525,-0.04195841774344444,0.04847626015543938,-0.028065713122487068,0.1921590119600296,-0.007671872153878212,0.022195935249328613,-0.025566548109054565,0.07707156240940094,0.019882643595337868,-0.055432531982660294,-0.1095518246293068,0.07812436670064926,0.03467826917767525,0.03066711500287056,-0.005250564776360989,-0.03277640789747238,-0.03839963674545288,-0.06684130430221558,0.016908183693885803,0.01498446986079216,-0.025197889655828476,-0.015742937102913857,-0.017529524862766266,-0.05382237210869789,0.029706554487347603,-0.0349951833486557,-0.0239269882440567,0.016283521428704262,-0.008531293831765652,0.06691958755254745,0.011298191733658314,-0.010112672112882137,-0.026517808437347412,-0.06252624839544296,0.020884819328784943,-0.04248007386922836,0.031071342527866364,0.008759464137256145,-0.02662479691207409,0.027211401611566544,-0.05019048601388931,0.07753971219062805,0.027994230389595032,-0.033829569816589355,0.004238882567733526,0.021878497675061226,-0.004110707901418209,0.003711596829816699,0.07639172673225403,0.0012934306869283319,0.010576114989817142,-0.0038151137996464968,0.009804417379200459,0.06561310589313507,-0.027170466259121895,-0.0014106251765042543,-0.029243405908346176,0.06247866898775101,-0.03612843155860901,0.06120501458644867,0.01842261664569378,-0.02795107290148735,-0.05719786882400513,0.08445882797241211,-0.0017074965871870518,-0.025146206840872765,-0.013239509426057339,-0.011318295262753963,-0.006659684237092733,-0.02161473035812378,-0.05272034555673599,0.04088747501373291,-0.02544221840798855,-0.28364303708076477,0.0347600020468235,0.000855776306707412,0.03466542065143585,-0.08425328880548477,0.013151461258530617,0.030584853142499924,0.0923861414194107,-0.069706991314888,-0.007630116306245327,0.03840770199894905,-0.025737149640917778,0.02794204093515873,0.006097768433392048,0.007483920082449913,0.05029704421758652,0.0643082782626152,-0.06234203651547432,-0.009950877167284489,-0.018058741465210915,0.01869947463274002,0.03500444069504738,0.19962503015995026,-0.03302517533302307,0.07015204429626465,0.027166634798049927,0.013706334866583347,0.034615837037563324,0.021793711930513382,-0.027381502091884613,0.014352677389979362,-0.0057233357802033424,0.06759880483150482,-0.05242195725440979,0.026339629665017128,-0.03608628734946251,-0.06041654199361801,0.03401048481464386,-0.0029053748585283756,-0.029922043904662132,-0.09644898772239685,0.03220023959875107,-0.058994192630052567,-0.019216354936361313,0.10628505051136017,0.02744751237332821,-0.053607262670993805,-0.039795905351638794,0.03029593825340271,0.03035382181406021,-0.0489751361310482,-0.011262462474405766,-0.002151425927877426,0.016251781955361366,0.018335601314902306,0.01230036560446024,-0.035719823092222214,-0.024815600365400314,-0.061948440968990326,-0.022406205534934998,0.008757386356592178,-0.03351317346096039,-0.05253705009818077,0.023777266964316368,0.017604053020477295]),
    ('Facilities Expenses', new.id, '#a8aabc', 'facilities-expenses', true, array[0.004275830462574959,-0.006641636602580547,0.05772237479686737,0.0018843613797798753,0.06725484877824783,0.021338125690817833,0.03797978535294533,0.004474195651710033,0.011021682992577553,-0.011381293646991253,0.02578745037317276,-0.08453873544931412,0.01764499396085739,0.04506433382630348,0.03137684240937233,-0.04706517606973648,-0.02680211141705513,-0.018866177648305893,-0.015363520942628384,0.037974391132593155,0.04313332214951515,-0.05632782727479935,-0.02255559153854847,-0.04135436192154884,-0.00012081993918400258,0.04955238103866577,-0.04540334641933441,-0.015875283628702164,-0.04434631019830704,-0.14479389786720276,0.010567467659711838,-0.07715226709842682,0.02996048703789711,-0.04914158582687378,0.010806773789227009,-0.03998776897788048,0.02050214633345604,-0.008163741789758205,-0.010777085088193417,0.08526181429624557,0.03869615122675896,0.03139348700642586,-0.00002364617284911219,-0.05092088505625725,-0.02697204053401947,-0.03884578496217728,-0.023215200752019882,-0.03955312445759773,0.04288022965192795,-0.02596510574221611,0.05771062895655632,-0.03789890184998512,0.007782789412885904,0.03197344392538071,0.013503185473382473,0.02596728689968586,0.067023366689682,0.047186560928821564,-0.03407631441950798,-0.013447277247905731,0.025174902752041817,0.018300045281648636,-0.24150344729423523,0.022166689857840538,0.02101529948413372,-0.005716568324714899,-0.04887892305850983,-0.028930941596627235,0.07270562648773193,0.010150302201509476,-0.013079510070383549,0.007952279411256313,0.04904785752296448,-0.01875326968729496,0.07161092013120651,-0.018163442611694336,-0.004275606479495764,0.003995227627456188,0.027487805113196373,-0.00868366751819849,0.03173764422535896,-0.05320081114768982,-0.01998467929661274,0.042357996106147766,-0.033986665308475494,-0.03331184387207031,0.0238127913326025,-0.06346774846315384,0.011465901508927345,-0.023016976192593575,-0.018644824624061584,-0.02331252582371235,-0.013637556694447994,0.009844054467976093,-0.05786402150988579,0.009339693002402782,-0.01663287542760372,0.01359318383038044,-0.05051621422171593,0.26411035656929016,-0.0027847185265272856,0.010737193748354912,0.014006796292960644,0.004072475712746382,0.012595531530678272,-0.05172860622406006,0.007523477077484131,-0.007906845770776272,-0.02260853536427021,0.017075398936867714,-0.03188681602478027,-0.005264786072075367,0.05273156240582466,-0.05005234479904175,0.0009064186015166342,0.0685066282749176,0.05363582447171211,0.017053473740816116,-0.017054259777069092,-0.00895118061453104,0.012785565108060837,0.03308796137571335,-0.010041254572570324,0.029931066557765007,-0.028479870408773422,-0.1059214249253273,0.014906574971973896,0.1120319664478302,0.04370379447937012,0.06594782322645187,0.04138411581516266,-0.04286331683397293,-0.035897284746170044,-0.01341407559812069,0.018279237672686577,0.029104063287377357,0.06286857277154922,-0.0003597319300752133,0.05524326115846634,0.029208842664957047,-0.03564026206731796,-0.08469777554273605,-0.017994290217757225,-0.10549809038639069,-0.05459173023700714,0.16184397041797638,-0.03430217504501343,0.017112109810113907,0.005356206558644772,-0.012786945328116417,0.012374929152429104,0.0535074919462204,0.031162835657596588,-0.0032570441253483295,0.024982856586575508,0.022226769477128983,-0.0007004192448221147,0.04096576198935509,-0.021199099719524384,0.006139046046882868,-0.0020086783915758133,-0.026098020374774933,-0.043128445744514465,0.11988388746976852,-0.015511876903474331,-0.10411915928125381,-0.04214039444923401,0.021579613909125328,-0.005672932602465153,-0.052650563418865204,-0.017270375043153763,0.04981917887926102,-0.03649085387587547,0.03599200025200844,0.12128304690122604,0.001205262029543519,-0.059291064739227295,0.03624553605914116,0.0054040392860770226,0.0012652234872803092,0.029606975615024567,-0.012618490494787693,-0.08481422811746597,0.02603360079228878,0.05282748490571976,-0.045221585780382156,-0.016516897827386856,-0.05319656804203987,0.053115010261535645,0.08277229964733124,-0.07030769437551498,0.0026147603057324886,-0.06920892745256424,-0.02244238369166851,-0.024357199668884277,0.0010330242803320289,-0.025513606145977974,-0.029863733798265457,0.0505034476518631,-0.01824982836842537,0.06480643898248672,-0.0031404574401676655,-0.048592060804367065,0.030821338295936584,0.004327605944126844,0.024494154378771782,0.018160030245780945,0.027076533064246178,0.034297745674848557,-0.010519241914153099,-0.05035842955112457,0.01600419357419014,0.06513761729001999,-0.04157984256744385,-0.030561314895749092,0.04988774657249451,0.036801595240831375,0.03697221353650093,0.056015752255916595,0.03258306533098221,0.048649877309799194,-0.058060649782419205,-0.036672189831733704,-0.22481252253055573,0.05780504643917084,-0.003067810321226716,-0.02877107635140419,0.06121041253209114,-0.014452148228883743,0.021408461034297943,-0.015114028006792068,-0.024345282465219498,0.06481111794710159,0.08155544102191925,-0.06841785460710526,0.002529669553041458,0.036868177354335785,0.000008910953511076514,0.03644350543618202,0.04718957096338272,0.009126519784331322,-0.052024733275175095,-0.03325891122221947,-0.009278876706957817,0.009140897542238235,-0.0002975914685521275,-0.014610893093049526,0.04178968071937561,-0.04209883511066437,0.17970436811447144,-0.04452577605843544,0.0092164883390069,-0.04877888411283493,0.06296122074127197,-0.015122097916901112,-0.0032300164457410574,-0.135610431432724,0.03463483601808548,0.03046640381217003,-0.010840989649295807,-0.019847285002470016,-0.019734974950551987,-0.08171559125185013,-0.022473696619272232,0.03523614630103111,-0.04693000018596649,-0.046203866600990295,0.021771594882011414,-0.0010632111225277185,-0.050965797156095505,-0.007617069408297539,-0.05303855240345001,0.012926511466503143,0.024402929469943047,-0.07971936464309692,0.02748839370906353,0.01842530071735382,0.05540790036320686,-0.03412260860204697,-0.06285902857780457,0.033640943467617035,-0.050261203199625015,0.01864699274301529,0.0341598205268383,-0.03343664109706879,0.055090323090553284,-0.05783271789550781,0.09469728171825409,-0.04349541291594505,-0.019098779186606407,-0.02107405848801136,0.0054799094796180725,-0.010592181235551834,-0.032434456050395966,0.014622785151004791,0.011280985549092293,-0.03345726430416107,0.05277380347251892,-0.04204487055540085,0.05063433200120926,-0.0014401585794985294,-0.025187544524669647,-0.002857066923752427,0.053304921835660934,0.012883585877716541,-0.007181159686297178,0.03549306467175484,-0.011122668161988258,0.0444549061357975,0.02870914340019226,0.010020946152508259,0.021145088598132133,-0.07944177836179733,-0.049912746995687485,0.004976889584213495,-0.05813973769545555,0.018178414553403854,0.020642921328544617,0.00070717534981668,-0.2976996600627899,0.04086926206946373,0.02723039500415325,-0.02015894651412964,-0.015709921717643738,-0.012588534504175186,-0.04278646409511566,0.030069958418607712,-0.010490835644304752,0.0033108952920883894,0.1176171526312828,0.031015655025839806,0.02073775604367256,-0.011329436674714088,0.05072156712412834,0.01886124163866043,0.04076937586069107,-0.01414608396589756,0.034855201840400696,-0.04543246701359749,0.04271187633275986,0.023570118471980095,0.17607620358467102,-0.02651498094201088,0.03236998990178108,-0.0031218978110700846,-0.045707810670137405,0.058396585285663605,0.05276054888963699,0.009157839231193066,0.015039941295981407,0.016051938757300377,0.07859230786561966,-0.05804816260933876,0.017650142312049866,0.028588706627488136,-0.021558716893196106,0.04730820655822754,0.007782311644405127,0.0034032014664262533,-0.04946570098400116,-0.013904338702559471,-0.10397160053253174,-0.018307490274310112,0.08395475149154663,-0.014578983187675476,-0.019496047869324684,-0.08024382591247559,0.039541322737932205,-0.004789774771779776,-0.025631753727793694,0.02717881090939045,0.003022917779162526,-0.01839434541761875,0.011937323957681656,0.028433511033654213,-0.05645868927240372,-0.03926810622215271,-0.006311577744781971,-0.06061180308461189,0.027279658243060112,-0.03989523649215698,-0.04858766123652458,0.037438031286001205,0.010067458264529705]),
    ('Activity', new.id, '#e5e926', 'activity', true, array[0.006132954265922308,-0.03834177926182747,0.061257123947143555,-0.053003136068582535,-0.008463420905172825,0.02591342106461525,0.04921531304717064,0.04525524377822876,0.00638900650665164,-0.0020209818612784147,-0.01866729184985161,-0.09181801974773407,0.055141616612672806,0.037668969482183456,-0.023068418726325035,-0.013150183483958244,-0.006734780967235565,0.007897059433162212,-0.0326068140566349,0.003934602718800306,0.003940459340810776,-0.03213796392083168,-0.014262014999985695,-0.047781217843294144,0.04258362948894501,0.037059683352708817,-0.0660826712846756,-0.03532344847917557,-0.07078646868467331,-0.1406932771205902,0.0002035155048361048,-0.03833300247788429,0.052779827266931534,-0.01746278814971447,-0.020378965884447098,-0.0307454951107502,-0.015776801854372025,0.0539010614156723,-0.07051311433315277,0.05603000521659851,0.05815509334206581,0.00579936383292079,-0.03013996034860611,-0.04834982007741928,-0.033240512013435364,-0.030877482146024704,-0.028548577800393105,-0.013265810906887054,0.009589487686753273,-0.055379468947649,0.031066864728927612,-0.039400335401296616,0.02833055518567562,0.03212432190775871,0.02411641925573349,0.0415414460003376,0.08598381280899048,0.015598705038428307,0.04436210170388222,0.05657529458403587,0.052848558872938156,0.03434630483388901,-0.2277737855911255,0.09080946445465088,0.01724964752793312,0.0020347507670521736,-0.01894395612180233,-0.04370834305882454,0.050356946885585785,0.03629966452717781,-0.019286591559648514,0.04289204999804497,0.031043782830238342,0.10588204860687256,0.03902198746800423,-0.029842127114534378,-0.005432948470115662,-0.03445906192064285,-0.016923388466238976,0.0004958880017511547,-0.04421978443861008,-0.053958576172590256,-0.0042093354277312756,0.051727842539548874,0.017364652827382088,-0.04095239192247391,-0.007857094518840313,-0.053048063069581985,0.0402875654399395,0.028570786118507385,-0.044459693133831024,0.04188649356365204,-0.05063603073358536,0.018337493762373924,-0.06973063200712204,0.0053757308050990105,0.012453336268663406,0.023539971560239792,-0.03198276087641716,0.27065303921699524,-0.08794702589511871,0.022694945335388184,0.01886594295501709,0.002561385976150632,0.013231133110821247,-0.012954006902873516,0.005281178746372461,-0.012418106198310852,-0.047289974987506866,0.01474912092089653,0.03816515579819679,-0.02240421436727047,0.04566759988665581,-0.03619552031159401,-0.0018300251103937626,0.03495687618851662,0.03799228370189667,0.048649970442056656,-0.01731286011636257,-0.01376722939312458,-0.0057369801215827465,0.029371991753578186,0.03581041842699051,-0.029856838285923004,0.01839395985007286,-0.06748919188976288,0.039556026458740234,0.11906419694423676,0.037431322038173676,0.056519363075494766,0.024178238585591316,-0.0021976600401103497,-0.030040934681892395,-0.010463234037160873,0.0019771887455135584,-0.017027229070663452,-0.009951555170118809,-0.011314132250845432,0.04585781693458557,-0.0011445303680375218,-0.02866780012845993,-0.060980767011642456,0.04714192450046539,-0.1518644243478775,-0.012101494707167149,0.07903096079826355,-0.014231173321604729,0.014938157051801682,-0.00107891287188977,0.026101481169462204,-0.01772858016192913,0.04418927803635597,-0.01663323864340782,-0.016153667122125626,0.0459427535533905,0.008856476284563541,0.05490503087639809,0.03265083581209183,-0.054022934287786484,0.00004855250517721288,-0.07258666306734085,-0.08070426434278488,-0.025139495730400085,0.09774854779243469,0.007464342750608921,-0.06323463469743729,0.002945144660770893,0.03112414851784706,-0.015794266015291214,-0.03648817539215088,0.03776967525482178,0.06520383059978485,-0.029410580173134804,-0.004266782198101282,0.08375651389360428,0.02269810438156128,-0.008946959860622883,0.018198896199464798,0.004907743073999882,-0.004017685540020466,0.05658477544784546,-0.048806142061948776,-0.04675326123833656,0.0009328716550953686,-0.0017491334583610296,-0.015953347086906433,-0.017936743795871735,-0.016931641846895218,0.08493860065937042,0.0664893090724945,-0.03992598131299019,0.02618936076760292,-0.008597388863563538,-0.024041349068284035,-0.04253135249018669,-0.048853322863578796,0.010297080501914024,-0.026173245161771774,0.004190581850707531,-0.016648095101118088,0.0847163200378418,-0.015368358232080936,-0.038077451288700104,0.02016315795481205,0.03939744085073471,0.012584773823618889,-0.03831086307764053,-0.006887827534228563,0.029103705659508705,0.018614156171679497,-0.032289110124111176,0.012770061381161213,0.06360830366611481,-0.007540709339082241,-0.0402904711663723,-0.005548703949898481,-0.0031541045755147934,0.02188095822930336,0.01102285273373127,0.03886648267507553,0.014803814701735973,-0.07217111438512802,-0.025047557428479195,-0.24308344721794128,-0.029408901929855347,0.014754005707800388,-0.0649476945400238,0.03511539101600647,-0.0078092277981340885,0.024709133431315422,-0.04061197489500046,0.030693460255861282,0.03356514126062393,0.07350307703018188,-0.03542559593915939,-0.031528327614068985,0.011296873912215233,-0.02330283634364605,0.037035707384347916,0.00046474524424411356,0.0108600789681077,0.018060659989714622,-0.012451152317225933,0.0034388438798487186,-0.02240184135735035,0.0006308124866336584,-0.06724265962839127,0.0443316251039505,-0.018017418682575226,0.18808385729789734,0.07518308609724045,0.037414222955703735,-0.034400444477796555,0.05661550536751747,0.039951372891664505,-0.032671477645635605,-0.16677646338939667,0.022793183103203773,0.015308908186852932,0.04489601030945778,-0.016564149409532547,-0.058453742414712906,-0.038819730281829834,-0.05807950720191002,0.06328292191028595,0.005942734889686108,-0.07518940418958664,-0.002935655415058136,0.008496595546603203,-0.0014110412448644638,-0.014625336043536663,-0.04134855791926384,-0.015888560563325882,0.0169096477329731,-0.03768136724829674,0.06523698568344116,0.006765080615878105,-0.028066473081707954,-0.007470827549695969,-0.027927953749895096,0.009881565347313881,-0.046222932636737823,0.010412875562906265,-0.03330845385789871,-0.010600828565657139,0.024176623672246933,-0.03348006680607796,0.06472949683666229,0.037639129906892776,-0.03292315453290939,-0.0583169050514698,0.04967040941119194,-0.048397909849882126,-0.04475798457860947,0.06833332031965256,-0.027010727673768997,-0.05263814330101013,0.04148965701460838,0.030102482065558434,0.004714162088930607,-0.014204045757651329,0.023781200870871544,-0.004602181725203991,0.025970779359340668,-0.04359355568885803,0.0005560819990932941,-0.03748694434762001,0.017194584012031555,-0.032674726098775864,0.06472340226173401,-0.03191998973488808,0.023456038907170296,-0.07219153642654419,0.03076556883752346,-0.0023477249778807163,-0.028093179687857628,-0.008282897993922234,0.029549922794103622,-0.043529678136110306,-0.31861069798469543,0.011545920744538307,0.013573084957897663,-0.017930369824171066,-0.06896253675222397,0.007560309022665024,0.02872716635465622,0.050126854330301285,-0.06310737878084183,0.022541435435414314,0.036431699991226196,0.04542585462331772,-0.01086363010108471,0.03567640855908394,-0.02148442156612873,0.04270177707076073,0.018674015998840332,-0.031988803297281265,0.03937055543065071,-0.0644490122795105,0.04521184042096138,0.05402807518839836,0.20274469256401062,-0.027081813663244247,0.06805457174777985,0.01729651354253292,-0.020448796451091766,0.032394472509622574,0.03297801688313484,-0.022328626364469528,0.030710997059941292,0.024207934737205505,0.10447714477777481,-0.035724248737096786,0.0320238396525383,0.06050197407603264,-0.02486511506140232,0.0420595146715641,0.020584115758538246,-0.03494517132639885,-0.030156003311276436,0.017170187085866928,-0.04963336139917374,-0.006495217327028513,0.09088395535945892,-0.02533775381743908,-0.023285891860723495,-0.07257838547229767,0.01489465031772852,0.015372240915894508,-0.0027975463308393955,0.005917313974350691,-0.05178713798522949,0.009563462808728218,0.056653764098882675,0.04759736731648445,-0.04290078207850456,-0.013838953338563442,-0.0055465493351221085,-0.033580902963876724,0.004259208682924509,-0.0437779575586319,0.017515327781438828,0.00013475320884026587,0.025485269725322723]),
    ('Fees', new.id, '#40b9fe', 'fees', true, array[-0.02396402880549431,-0.02829921245574951,0.04679616168141365,-0.0264216847717762,-0.011936414055526257,0.0004047313123010099,0.06021416559815407,0.009801547043025494,0.020502394065260887,-0.03269050270318985,-0.004175667185336351,-0.060218099504709244,0.01748662441968918,0.029932493343949318,0.022365309298038483,0.009195842780172825,0.003342369804158807,-0.02804255299270153,-0.03243422880768776,0.06305331736803055,0.045058123767375946,-0.07448292523622513,-0.005331282038241625,-0.023263730108737946,0.008486860431730747,0.05898737534880638,-0.006930977571755648,-0.04782678931951523,-0.08152752369642258,-0.14244168996810913,0.024207191541790962,-0.07845424860715866,-0.007286990527063608,-0.05111822113394737,0.035355158150196075,-0.04227827116847038,-0.009083891287446022,0.013350466266274452,0.009901254437863827,0.08011576533317566,0.02319400943815708,0.04920225217938423,-0.05732560530304909,-0.06385954469442368,-0.035890817642211914,-0.048497509211301804,-0.03223450854420662,-0.04961368814110756,0.02014189027249813,0.023621119558811188,0.03505818918347359,-0.03305515646934509,0.026552729308605194,0.03260347247123718,-0.002516721375286579,0.03223961964249611,0.06016000732779503,0.0171198733150959,0.026146063581109047,0.03391612321138382,-0.03532719612121582,0.020945392549037933,-0.2506234049797058,0.10022687911987305,-0.02608727663755417,0.026288354769349098,-0.02095125988125801,-0.013511180877685547,0.051156386733055115,0.035526372492313385,-0.03623630851507187,0.038070615381002426,0.049273550510406494,0.04581429809331894,0.044374555349349976,-0.020984696224331856,-0.027827784419059753,-0.0430402047932148,-0.0028978832997381687,0.02344661019742489,-0.05108053237199783,-0.010954181663691998,-0.009286749176681042,0.015821224078536034,-0.04347946122288704,-0.030994173139333725,0.01313601154834032,-0.045704279094934464,0.012693683616816998,0.0007516753394156694,0.009149874560534954,-0.03877520561218262,-0.02159452624619007,0.010335719212889671,-0.0885881558060646,-0.023207206279039383,-0.004640973638743162,0.00313839060254395,-0.08659987151622772,0.28284958004951477,-0.03481210395693779,0.020433930680155754,0.03418838605284691,-0.010124988853931427,0.0016285430174320936,-0.03381163626909256,-0.002257250715047121,-0.020759249106049538,-0.03263978660106659,0.0153549425303936,0.018090521916747093,-0.01192814577370882,0.06453551352024078,-0.037880562245845795,-0.005700599867850542,0.06571981310844421,0.03362680971622467,0.01677328161895275,0.008685696870088577,-0.0031878624577075243,-0.009699800983071327,-0.021015439182519913,-0.0006868279888294637,-0.007124645635485649,-0.0032890078146010637,-0.08419542759656906,0.004832832608371973,0.14256040751934052,0.029546493664383888,0.048523206263780594,0.02826080471277237,-0.0318731963634491,-0.06113561987876892,-0.011999600566923618,0.029306333512067795,0.02302663028240204,0.03421951085329056,-0.021482914686203003,0.007591148838400841,0.0033772240858525038,-0.05867186561226845,-0.0949055552482605,-0.024160167202353477,-0.08648038655519485,-0.04569891840219498,0.05982265621423721,-0.0295015387237072,0.06010492518544197,-0.026706065982580185,-0.011711537837982178,-0.00972460862249136,0.02502167783677578,-0.04082527384161949,-0.010766572318971157,0.03862692043185234,0.004695343319326639,0.03028968907892704,0.0024884112644940615,-0.04079267755150795,0.013530832715332508,-0.035389505326747894,-0.02079271711409092,-0.04320639744400978,0.13929444551467896,0.013674210757017136,-0.11266077309846878,-0.04310208186507225,0.011203151196241379,-0.013271382078528404,-0.030836230143904686,-0.030468424782156944,0.01971268467605114,-0.024166472256183624,0.003422457491979003,0.12331271171569824,0.006507187616080046,-0.04441865533590317,0.01333178486675024,-0.001780612743459642,-0.0058268094435334206,0.03432933986186981,-0.0024497052654623985,-0.06037871912121773,0.034623656421899796,0.013144074007868767,-0.0828932672739029,-0.0710841715335846,-0.05479610338807106,0.05967136472463608,0.059798434376716614,-0.04105125367641449,0.014265142381191254,-0.03801798075437546,-0.019706115126609802,-0.018527768552303314,-0.01190025545656681,-0.005555754993110895,-0.041157741099596024,0.00030419850372709334,-0.04909925535321236,0.11013878881931305,0.01723468489944935,0.013017727062106133,0.007386729586869478,0.01821485534310341,0.020219337195158005,-0.001396415289491415,0.0329422689974308,0.032566215842962265,0.009931821376085281,-0.03737901896238327,0.0500282384455204,0.0630040243268013,-0.0103317154571414,-0.07532966881990433,0.03026312217116356,0.028634538874030113,0.020092224702239037,0.04549918323755264,0.06581871211528778,0.03061104007065296,-0.10875475406646729,-0.04378422349691391,-0.20417171716690063,0.035224199295043945,-0.004259161651134491,-0.016283975914120674,0.0916910320520401,-0.01699851267039776,0.04901793971657753,-0.01755913719534874,-0.0022317226976156235,0.08104009181261063,0.08211608976125717,-0.02155546098947525,-0.00907350517809391,0.014560142531991005,0.008633923716843128,0.05783089995384216,0.012586789205670357,0.08510276675224304,0.007145349867641926,-0.003257250413298607,-0.058121081441640854,0.051437195390462875,-0.0033930938225239515,-0.008553525432944298,0.05930770933628082,0.01723240129649639,0.1971602439880371,-0.02308741770684719,-0.0130157470703125,-0.02581840194761753,0.061919908970594406,-0.02278503216803074,0.029494795948266983,-0.10845335572957993,0.006872301455587149,0.020102577283978462,0.002800633432343602,0.03244049474596977,0.017888199537992477,-0.06690885126590729,-0.01591486483812332,0.01111130602657795,-0.01910349540412426,-0.06603699922561646,-0.013492163270711899,0.021749773994088173,-0.01557245384901762,0.04550468921661377,-0.04281115531921387,-0.027361810207366943,-0.00009327743464382365,-0.086065374314785,0.05298822745680809,0.015826858580112457,0.05445363000035286,-0.0525331050157547,-0.09122144430875778,0.004696170333772898,-0.07404770702123642,0.017769495025277138,0.01574586145579815,-0.02691296488046646,0.04885648190975189,-0.04357058182358742,0.05360741913318634,-0.04341130331158638,-0.0015050959773361683,0.000032445535907754675,-0.016056343913078308,-0.0791698694229126,-0.027366042137145996,0.01220267079770565,0.01722651906311512,-0.04358948394656181,0.021927623078227043,-0.007212981581687927,0.0464288666844368,0.010946004651486874,-0.034789878875017166,0.0002546226023696363,0.012935874052345753,-0.013492097146809101,0.00860277097672224,0.06100165471434593,0.027234956622123718,0.03786196559667587,0.04090243950486183,0.0062590125016868114,0.035656630992889404,-0.05996961146593094,-0.015821389853954315,0.026555335149168968,-0.06870424747467041,0.026362843811511993,-0.0033775002229958773,-0.03074413537979126,-0.2699477970600128,0.03560442477464676,0.012608562596142292,0.02399642951786518,-0.025331055745482445,0.005905950907617807,0.004278813023120165,0.029847774654626846,-0.03762522712349892,-0.0070111872628331184,0.08417811244726181,0.04251735284924507,0.008453170768916607,0.026049073785543442,0.0172120351344347,0.053769517689943314,0.0628603994846344,-0.03210647776722908,0.033357519656419754,-0.013232721947133541,0.024440428242087364,0.022018110379576683,0.2101966291666031,-0.04138137027621269,0.012185649946331978,-0.014369496144354343,-0.013363952748477459,0.061784710735082626,0.07181528210639954,0.004098554141819477,0.026901215314865112,0.0433337427675724,0.08281780779361725,-0.049075253307819366,0.05258188769221306,0.039597947150468826,-0.048714570701122284,0.02514396235346794,-0.005871814209967852,-0.03666914626955986,0.0004940903163515031,0.01722368411719799,-0.03417564928531647,-0.015935808420181274,0.0564008466899395,0.002529596909880638,-0.028262143954634666,-0.06570950895547867,0.009428431279957294,0.052344080060720444,-0.011971858330070972,0.015635894611477852,0.007452681660652161,0.020169846713542938,0.07169412076473236,0.03074728697538376,-0.035854265093803406,-0.0281260684132576,-0.02272292785346508,-0.058996204286813736,-0.014633078128099442,-0.04708487540483475,-0.056401364505290985,0.054252199828624725,-0.002884818008169532]),
    ('Taxes', new.id, '#b39cd0', 'taxes', true, array[-0.043564677238464355,0.006416513118892908,0.018610665574669838,-0.011408495716750622,0.027931097894906998,0.03508561849594116,0.06559790670871735,0.029489250853657722,0.03115239366889,0.00982043519616127,0.014708254486322403,-0.048518091440200806,0.009327929466962814,0.07889807969331741,-0.01997588388621807,-0.0011292231502011418,-0.027405718341469765,0.023984190076589584,-0.08609292656183243,0.030406968668103218,0.07534968107938766,-0.05502135306596756,-0.00811286736279726,-0.04054601863026619,0.030110487714409828,0.005573507398366928,-0.06908953934907913,-0.03199486806988716,-0.06451389193534851,-0.1320398449897766,0.0343698151409626,-0.06714332103729248,-0.010970729403197765,-0.028180906549096107,0.03384624049067497,-0.023721713572740555,-0.029175851494073868,0.03836512565612793,0.021969199180603027,0.060854457318782806,0.05288321152329445,0.05898742005228996,-0.04162604361772537,-0.04981645941734314,-0.03858589380979538,-0.03646230697631836,-0.0046072001568973064,0.004110644571483135,0.043685898184776306,0.009792471304535866,-0.001455359742976725,-0.0432601235806942,0.017117200419306755,0.02312307432293892,-0.00493632024154067,0.0019103721715509892,0.03314844146370888,0.033260636031627655,-0.0035861236974596977,0.028935085982084274,0.014573205262422562,0.026744144037365913,-0.25641486048698425,0.07475027441978455,0.05861867591738701,0.05017770826816559,-0.029790565371513367,-0.011270398274064064,0.007462205830961466,0.005051492713391781,-0.04443587362766266,0.016617249697446823,0.05402926355600357,0.03550618514418602,0.05039064958691597,-0.047465190291404724,0.030494369566440582,-0.024412069469690323,-0.0217119213193655,0.032103292644023895,-0.032687652856111526,-0.03600966930389404,-0.002345757093280554,0.030304910615086555,-0.002152237808331847,-0.04763348773121834,-0.002655738964676857,-0.07694609463214874,0.0846806988120079,0.0013919321354478598,-0.011898656375706196,-0.01935550943017006,-0.021558323875069618,0.03673221915960312,-0.09561751782894135,-0.038247279822826385,0.04547370597720146,0.027295850217342377,-0.04567738249897957,0.22397148609161377,-0.02888640947639942,0.022494953125715256,0.03949381411075592,-0.08756085485219955,0.012022259645164013,-0.009767080657184124,-0.026607509702444077,-0.007901385426521301,-0.038987897336483,-0.003586254082620144,-0.004686137195676565,0.0037489323876798153,0.005031846463680267,-0.039525408297777176,-0.01884320192039013,0.025663278996944427,0.05298132449388504,0.025217929854989052,0.004226895049214363,-0.02800852060317993,0.00486375018954277,0.04013336822390556,0.026592636480927467,-0.008261235430836678,0.026699747890233994,-0.06611886620521545,0.04730317369103432,0.1406783163547516,0.036297012120485306,0.07759329676628113,0.019093863666057587,-0.031616006046533585,-0.05980340763926506,-0.002554176142439246,-0.014915741048753262,0.0029855004977434874,0.02667839638888836,0.005581192206591368,0.0374886728823185,0.028588568791747093,-0.04824568331241608,-0.07880666851997375,-0.0504080168902874,-0.11641344428062439,-0.03327551484107971,0.05936115235090256,-0.02776033990085125,0.00873742438852787,-0.0252754595130682,0.05587110295891762,-0.002477755770087242,0.06783906370401382,-0.02217218652367592,-0.03735317662358284,0.00771236652508378,0.022632701322436333,0.021125879138708115,-0.005797518417239189,-0.007267423439770937,-0.01858244091272354,-0.009434325620532036,-0.0031569902785122395,-0.06213700771331787,0.13795380294322968,0.01444365456700325,-0.07042858749628067,-0.04784808307886124,0.034890055656433105,0.003941304981708527,-0.03364088013768196,0.05041641369462013,0.024702774360775948,-0.0386013463139534,-0.005639640148729086,0.1001332700252533,-0.011660910211503506,-0.014466600492596626,0.020276948809623718,-0.009704740718007088,0.009564531035721302,0.09251728653907776,-0.038497671484947205,-0.07154136151075363,0.028217503800988197,0.050898827612400055,-0.03708907216787338,-0.04264220967888832,-0.05260186642408371,0.018712611868977547,0.03188294172286987,-0.028879256919026375,0.026194818317890167,-0.08205856382846832,-0.04877113923430443,0.0007599313394166529,-0.025481924414634705,-0.024095065891742706,-0.03770054504275322,0.013983163051307201,-0.023750238120555878,0.07408139109611511,0.006434332579374313,-0.011145648546516895,0.07468491047620773,0.02567777968943119,-0.014413714408874512,-0.017772816121578217,-0.004726352170109749,0.041808951646089554,-0.002178848022595048,-0.03387323394417763,0.03624406084418297,0.08864456415176392,-0.04394123703241348,-0.062241166830062866,0.016422828659415245,0.03642293065786362,0.051679715514183044,0.034521784633398056,0.05106430500745773,0.03574520722031593,-0.1289549469947815,-0.047444578260183334,-0.18405035138130188,0.06899275630712509,-0.029717879369854927,-0.02393820695579052,0.07311588525772095,-0.04571240767836571,0.01301728468388319,0.018379177898168564,-0.019649028778076172,0.08273763209581375,0.059670813381671906,-0.011477233842015266,-0.01668396405875683,0.013981551863253117,-0.01298566535115242,0.0319204218685627,0.004038330167531967,-0.0162664707750082,0.04558306559920311,0.025702277198433876,-0.011329549364745617,0.0037230788730084896,0.0007541538798250258,-0.06530901789665222,0.09749454259872437,-0.05173041298985481,0.19592270255088806,0.00819733738899231,0.06205995753407478,-0.0024448262993246317,0.03818202391266823,0.040066178888082504,-0.02534891851246357,-0.13554172217845917,0.04870016872882843,0.03788412734866142,-0.0009695276967249811,-0.012465914711356163,-0.021785475313663483,-0.01732104830443859,0.009253555908799171,-0.01555390004068613,-0.09124717861413956,-0.028947513550519943,0.024995066225528717,-0.006253513041883707,-0.04227541387081146,-0.01854080520570278,-0.020546864718198776,-0.013276125304400921,0.04312892258167267,-0.05457783862948418,0.01744488626718521,-0.03437485918402672,0.03538069128990173,-0.05503975600004196,-0.10736974328756332,-0.0012282453244552016,-0.008631858043372631,-0.012434379197657108,0.037281349301338196,-0.046431686729192734,-0.0024112816900014877,-0.019357681274414062,0.04933875426650047,-0.01543900091201067,-0.020337507128715515,-0.01809759996831417,0.007559731602668762,0.00920612271875143,-0.0254632867872715,0.07406646013259888,-0.017229298129677773,-0.0745827704668045,0.026719482615590096,0.025442276149988174,0.04679735004901886,0.010574069805443287,0.018053237348794937,-0.0053840684704482555,0.04419046640396118,0.0057717361487448215,0.053104571998119354,-0.015277672559022903,0.046916354447603226,-0.015031948685646057,0.07582811266183853,0.010898623615503311,0.0038103600963950157,-0.08526428043842316,0.004231802187860012,0.012862076982855797,-0.0028714085929095745,-0.038239579647779465,0.032901231199502945,-0.037632640451192856,-0.26473692059516907,0.050980616360902786,0.025932487100362778,0.04762015864253044,-0.02409948781132698,0.010262100026011467,0.03747674822807312,0.05012230575084686,-0.01694166287779808,0.007462113630026579,0.07603160291910172,0.04591921344399452,0.024325499311089516,-0.032531362026929855,0.020499862730503082,0.0368257574737072,0.06235732138156891,-0.04188276082277298,0.0673532634973526,-0.03334169462323189,0.027137208729982376,-0.008336487226188183,0.21924112737178802,-0.06865368783473969,0.027853164821863174,0.012673084624111652,-0.037004198879003525,0.0335577018558979,0.05407499149441719,0.004620632156729698,0.02042912133038044,0.02971605397760868,0.0910891517996788,-0.05898365005850792,0.0353073850274086,0.05090097710490227,-0.09059780091047287,0.028596913442015648,0.02737094648182392,-0.02722436934709549,-0.07280902564525604,-0.0049832225777208805,-0.03163181245326996,-0.009403168223798275,0.06891553848981857,-0.03474016487598419,-0.0461575873196125,-0.06312651932239532,-0.004904147703200579,0.016778282821178436,-0.004350907634943724,0.008699526078999043,-0.06251388043165207,0.019366659224033356,0.01005689986050129,0.009575411677360535,-0.05070538818836212,-0.07383725792169571,-0.024813039228320122,-0.04851531237363815,-0.012170231901109219,-0.04038909077644348,-0.04568243771791458,0.0031514824368059635,-0.008016325533390045]),
    ('Rent', new.id, '#A843CB', 'rent', true, array[-0.016703804954886436,-0.018768923357129097,0.04425111040472984,-0.019679805263876915,0.035509590059518814,0.03698611259460449,0.054993387311697006,0.03658758103847504,0.01873750053346157,0.007749555166810751,-0.01190358679741621,-0.051266416907310486,0.022799856960773468,0.06658751517534256,0.017099592834711075,-0.022183626890182495,-0.010036994703114033,0.022733107209205627,-0.03237149864435196,0.014700988307595253,0.05246405676007271,-0.06213665381073952,-0.04821912571787834,-0.07324353605508804,0.05136694759130478,0.0029685935005545616,-0.03782779350876808,-0.0386602059006691,-0.07217820733785629,-0.12608830630779266,-0.0037558546755462885,-0.04640340059995651,0.04596491903066635,-0.039800480008125305,0.004988978151232004,-0.03763379529118538,-0.039276156574487686,0.034269530326128006,-0.015091120265424252,0.053332503885030746,0.03923005983233452,0.05175316333770752,-0.027046842500567436,-0.07414267957210541,-0.05325105041265488,-0.02369152568280697,-0.005429051350802183,0.007673213724046946,0.08028801530599594,-0.02691982500255108,0.06530613452196121,-0.04290597513318062,-0.004528527148067951,0.038346536457538605,-0.012352067977190018,-0.00730127515271306,0.05072879046201706,0.013000736944377422,0.041773948818445206,0.03450775146484375,0.052784718573093414,0.036249708384275436,-0.20565731823444366,0.11201508343219757,0.05589072033762932,0.025268081575632095,-0.03893418610095978,-0.04222382605075836,0.031182315200567245,0.03404247388243675,-0.013119153678417206,0.056460823863744736,-0.0068321675062179565,0.07433043420314789,0.06313193589448929,-0.014715665951371193,0.028179094195365906,-0.019338387995958328,0.012374838814139366,-0.017656728625297546,-0.021590838208794594,-0.06883890181779861,-0.013930505141615868,0.0409892238676548,-0.060284167528152466,-0.07233282178640366,0.006758127827197313,-0.05748738348484039,0.03569449856877327,0.011546614579856396,-0.023971401154994965,-0.01301917340606451,-0.03698404133319855,0.002518291352316737,-0.09387931227684021,-0.00525012006983161,0.012087468057870865,0.034386854618787766,-0.04704277962446213,0.26159560680389404,-0.005842812359333038,0.041092004626989365,0.038772981613874435,-0.028876997530460358,0.005779571365565062,-0.029364854097366333,-0.00015825717127881944,0.008762957528233528,-0.038717444986104965,0.027594685554504395,-0.02649124711751938,-0.047239311039447784,0.07108305394649506,-0.0424644835293293,0.009557084180414677,-0.025453871116042137,0.04437525197863579,0.022377870976924896,0.014285420067608356,-0.006140854675322771,-0.02591421641409397,0.02769843302667141,-0.012351196259260178,-0.013912614434957504,0.031393516808748245,-0.10307422280311584,0.0239725299179554,0.10952575504779816,0.039498139172792435,0.03263586014509201,0.026662098243832588,0.006321733817458153,-0.048119571059942245,-0.0010451163398101926,-0.011768179945647717,0.038128796964883804,0.004478800110518932,0.014414732344448566,0.034797124564647675,-0.028456343337893486,-0.021089356392621994,-0.09260358661413193,-0.01677139662206173,-0.09377936273813248,0.010889020748436451,0.02154581993818283,-0.0009371874621137977,0.035079676657915115,-0.024838468059897423,0.02713768742978573,-0.020473314449191093,0.0606037862598896,-0.01217877957969904,-0.03640597686171532,0.014643359929323196,0.01922452077269554,0.043499261140823364,0.07052649557590485,-0.026561224833130836,0.017264138907194138,-0.018608232960104942,-0.024608934298157692,-0.058291349560022354,0.05480658635497093,-0.01580805331468582,-0.05709366872906685,-0.025773026049137115,-0.001308270962908864,-0.019346630200743675,-0.027008935809135437,0.027892952784895897,-0.006496524438261986,-0.061377301812171936,0.02498730644583702,0.10200556367635727,-0.009096945635974407,-0.033676065504550934,0.07194774597883224,-0.012459474615752697,-0.018861014395952225,-0.017239011824131012,-0.01711220294237137,-0.08421850204467773,0.03464658930897713,0.06337404251098633,-0.05464142560958862,-0.004683286417275667,-0.019797660410404205,0.01665005460381508,0.03627556934952736,-0.011557604186236858,0.01505865529179573,-0.018413426354527473,-0.025716926902532578,-0.036714695394039154,-0.003973338752985001,-0.037367649376392365,-0.0044418699108064175,0.020599251613020897,-0.059629108756780624,0.07987628132104874,0.009395553730428219,-0.053537458181381226,0.0238259956240654,0.008418921381235123,0.0309116430580616,0.02075459621846676,0.03434300422668457,0.06027442589402199,0.013825966976583004,-0.007532279007136822,0.04159880429506302,0.062143534421920776,0.001942657632753253,-0.027870474383234978,-0.01325628999620676,0.036069970577955246,0.035658955574035645,0.060107238590717316,0.025884956121444702,0.016998618841171265,-0.10575670748949051,-0.026478001847863197,-0.23341743648052216,0.013963457196950912,-0.02052440494298935,-0.03078516013920307,0.06448622792959213,-0.00716008897870779,0.03432833030819893,-0.001033417764119804,-0.00708666630089283,0.042434245347976685,0.09207828342914581,-0.05364356189966202,-0.033171720802783966,0.0702182948589325,-0.006148672197014093,0.02761189267039299,0.06323765218257904,0.04031550511717796,-0.01461956836283207,-0.023730071261525154,-0.02466503717005253,0.02399093471467495,0.0014637436252087355,-0.012925395742058754,0.1367182433605194,-0.04374685883522034,0.22614052891731262,0.026609625667333603,0.06143257021903992,-0.028734367340803146,0.06078982353210449,0.003091556718572974,-0.027127282693982124,-0.14538784325122833,0.046993471682071686,0.026704683899879456,0.04266636446118355,0.0103534534573555,-0.013656788505613804,-0.056872859597206116,-0.017607012763619423,0.029895707964897156,-0.03365447372198105,-0.05643881857395172,-0.027330856770277023,-0.0033598062582314014,-0.027710197493433952,0.0313648022711277,-0.07637577503919601,-0.026753224432468414,0.021152181550860405,-0.013859448954463005,0.05201980471611023,-0.01870257779955864,0.024684734642505646,-0.011988474987447262,-0.06889404356479645,-0.01997978799045086,0.002821553498506546,0.030210506170988083,0.03060394525527954,-0.01886671595275402,0.05751032754778862,-0.05268825590610504,0.012521755881607533,-0.04448197782039642,-0.019830530509352684,-0.10153335332870483,-0.009090662002563477,-0.009625175036489964,-0.04940098896622658,0.060605473816394806,-0.0162955429404974,-0.013726008124649525,0.040525373071432114,0.0035110025200992823,0.0432155467569828,0.037116020917892456,0.019187133759260178,-0.028607672080397606,0.031773705035448074,-0.04939209669828415,-0.0013321611331775784,-0.003971471916884184,0.03385816887021065,0.03725162521004677,0.04140130430459976,-0.004999130964279175,0.03719732537865639,-0.04295259341597557,-0.03309468552470207,0.014872334897518158,-0.05109347030520439,-0.06511750817298889,-0.03944459930062294,-0.02456975355744362,-0.2905862033367157,0.017991334199905396,-0.009142322465777397,0.022932961583137512,-0.039330195635557175,0.01139330118894577,-0.03424284607172012,0.017016470432281494,-0.06301406025886536,0.008666615933179855,0.09996218234300613,0.041483938694000244,0.03252590820193291,0.009697727859020233,0.01802949607372284,-0.015840165317058563,0.06704020500183105,-0.06731367856264114,-0.004365755245089531,-0.049804285168647766,0.030424242839217186,0.06139998510479927,0.2002735733985901,-0.035928837954998016,0.04153245687484741,0.033069781959056854,-0.006418073549866676,0.063272625207901,-0.013854206539690495,-0.008712648414075375,0.035450953990221024,0.020494965836405754,0.06384475529193878,-0.08131887763738632,-0.016925955191254616,0.031464286148548126,-0.02804534323513508,0.08803464472293854,0.007706079166382551,-0.015065818093717098,-0.06154453009366989,0.013094473630189896,-0.03167492523789406,0.0016444575740024447,0.07389385998249054,0.00643101567402482,-0.0015519642038270831,-0.03516840934753418,0.009884657338261604,0.02659485675394535,-0.061609406024217606,0.009321052581071854,-0.015543696470558643,0.004325096495449543,0.04527555778622627,-0.01435164175927639,-0.08561310917139053,-0.001450679381377995,-0.0319075770676136,-0.028733380138874054,0.011059826239943504,-0.07760260254144669,-0.034077540040016174,-0.033784057945013046,0.015407265163958073]),
    ('Other', new.id, 'hsl(var(--primary))', 'other', true, array[-0.016038237139582634,-0.029635660350322723,0.0552101656794548,-0.02966766245663166,0.004088574089109898,0.04646525904536247,0.04162515327334404,0.0468568429350853,0.0041376701556146145,-0.0700305923819542,0.015760943293571472,-0.1065179854631424,0.016229869797825813,0.02340550720691681,-0.004380081780254841,0.01943296566605568,-0.02728545293211937,0.02649248018860817,-0.08855333179235458,-0.001389984623529017,-0.0035120882093906403,0.016653956845402718,0.001943283248692751,-0.02729872800409794,0.020853649824857712,0.04123387858271599,-0.0518169030547142,-0.03728645667433739,-0.03806275501847267,-0.12230280041694641,0.0031131755094975233,-0.04628312587738037,0.0021556371357291937,-0.007779688108712435,0.009602737613022327,-0.04664081707596779,-0.021287355571985245,0.032303813844919205,-0.050963204354047775,0.06130717322230339,0.04158814996480942,0.008656958118081093,-0.03772655129432678,-0.04675762727856636,-0.027823608368635178,-0.022637199610471725,-0.033783309161663055,0.008571564219892025,0.05185896158218384,-0.03107404336333275,0.034212999045848846,-0.02348235435783863,0.01064260769635439,0.03076563961803913,-0.005979669280350208,-0.007927840575575829,0.05196346342563629,0.03357013314962387,0.027521202340722084,0.007770419120788574,0.017884457483887672,0.027837643399834633,-0.24893254041671753,0.09230556339025497,0.020801395177841187,0.05085219442844391,-0.009705094620585442,-0.006953771226108074,0.0664878785610199,0.05362029746174812,-0.004976385738700628,-0.00547064607962966,0.03214143589138985,0.08563677966594696,0.011336484923958778,-0.04219050332903862,-0.010907702147960663,-0.040721651166677475,-0.027228664606809616,0.026380132883787155,-0.0453735888004303,-0.043119169771671295,-0.01866496540606022,-0.024267567321658134,0.002444261685013771,0.0011260344181209803,-0.012910588644444942,-0.039921846240758896,0.05262403190135956,0.03387255594134331,-0.06591424345970154,-0.008220764808356762,0.011475315317511559,0.02580339089035988,-0.049181561917066574,-0.023883456364274025,0.020132210105657578,-0.03140343725681305,-0.027124330401420593,0.2823719084262848,-0.07465120404958725,0.01545818243175745,0.0754019096493721,-0.022702714428305626,0.04981814697384834,-0.014354678802192211,-0.020464805886149406,-0.04612006992101669,-0.032458219677209854,0.05216376110911369,0.00443628104403615,-0.030673284083604813,0.007759553845971823,-0.03190002962946892,0.023081369698047638,-0.0022053492721170187,0.0512346588075161,0.03858109936118126,-0.018488507717847824,0.003108567325398326,-0.02169857919216156,0.022220604121685028,0.04623791575431824,-0.054168008267879486,0.041117485612630844,-0.07497250288724899,0.003920379094779491,0.10820597410202026,0.02476942539215088,0.041485752910375595,0.05151434242725372,-0.07325959950685501,-0.04023575782775879,0.01316655334085226,-0.013150190003216267,-0.03308451548218727,0.037513360381126404,-0.01965913735330105,0.046310972422361374,0.014074685983359814,-0.003533598966896534,-0.09264829754829407,-0.008515942841768265,-0.1068035215139389,-0.029684478417038918,0.06074381247162819,-0.02880842424929142,0.05665789544582367,-0.04763874411582947,0.058762356638908386,-0.0381779782474041,0.08265583962202072,-0.03863563388586044,0.03852960467338562,0.00832052156329155,-0.011502992361783981,0.03264286369085312,0.021745240315794945,-0.021209605038166046,0.04520263895392418,-0.021159006282687187,-0.04614114761352539,-0.009207709692418575,0.13617223501205444,0.027523765340447426,-0.13026639819145203,-0.03842264786362648,0.01026176754385233,0.023458706215023994,-0.023884549736976624,0.0295390747487545,0.034758903086185455,-0.052678629755973816,0.0076952846720814705,0.09078453481197357,-0.011651048436760902,-0.04799544811248779,0.020827973261475563,-0.028767216950654984,0.04817803204059601,0.025354688987135887,-0.036770693957805634,-0.05542534217238426,0.002648209687322378,0.026828495785593987,-0.03561233729124069,0.022126398980617523,-0.06258320063352585,0.0402095690369606,0.03598105534911156,-0.019931610673666,0.028119361028075218,-0.037152379751205444,-0.004285347182303667,-0.04492371901869774,-0.019544480368494987,-0.025245683267712593,-0.018726099282503128,-0.006253178231418133,-0.03681576997041702,0.02562558278441429,-0.008132285438477993,-0.021573934704065323,0.05093268305063248,0.03305936977267265,0.03483126312494278,-0.002185763558372855,-0.048794616013765335,0.025975815951824188,-0.05176341161131859,-0.07224364578723907,0.015988217666745186,0.08673690259456635,-0.015351559966802597,-0.031193573027849197,0.017472870647907257,0.001099121873266995,0.04909693822264671,-0.0013133174506947398,0.03767244145274162,0.04057091474533081,-0.07273522019386292,-0.03262757882475853,-0.2223435789346695,-0.015198108740150928,-0.005404704250395298,-0.054749198257923126,0.05739732086658478,-0.050060875713825226,0.05028267949819565,0.011125932447612286,-0.029026035219430923,0.09802126884460449,0.06772860884666443,-0.013338249176740646,-0.02274906635284424,0.04763224348425865,0.012918565422296524,0.046649571508169174,0.04009358957409859,-0.0070974682457745075,0.05174730345606804,-0.0015775976935401559,-0.022071296349167824,0.02643255703151226,-0.005175558850169182,-0.007624192163348198,0.02994590252637863,-0.006399694364517927,0.19938503205776215,0.05331771820783615,0.05945196747779846,-0.061543431133031845,0.046169962733983994,0.018232028931379318,-0.007382106967270374,-0.10230959951877594,0.04843439161777496,0.022067904472351074,0.0035502780228853226,-0.047056857496500015,-0.04854818060994148,-0.02754194289445877,-0.0050089661963284016,0.04871530830860138,-0.026200169697403908,-0.06078939884901047,-0.010932995937764645,-0.04794080927968025,-0.023844044655561447,0.0024475741665810347,-0.026567570865154266,0.012260076589882374,0.023290317505598068,-0.04001345857977867,0.01416479516774416,0.0028414514381438494,0.004133264534175396,-0.0375639870762825,-0.05604039877653122,-0.009006530977785587,-0.03865407407283783,0.04582803696393967,-0.018396396189928055,-0.04023846238851547,0.016332263126969337,-0.05053716525435448,0.04586195945739746,-0.019597461447119713,-0.034157801419496536,0.006127615459263325,0.02064480446279049,-0.03693069517612457,-0.020771687850356102,0.0704977959394455,-0.014854833483695984,-0.0360027514398098,0.04250502958893776,0.016088057309389114,0.02805475704371929,0.002843741560354829,-0.0342036597430706,-0.03415150195360184,0.0616958886384964,-0.03855198249220848,0.008797750808298588,0.035957131534814835,0.018066802993416786,-0.022690873593091965,0.02660704217851162,-0.017947059124708176,0.061403170228004456,-0.045113448053598404,0.011476526968181133,0.03331355005502701,0.0035048273857682943,-0.026703886687755585,0.015424499288201332,0.023773079738020897,-0.2798716723918915,0.03675656393170357,0.0038122148253023624,0.014431101270020008,-0.06801043450832367,0.012934847734868526,0.02705204114317894,0.052515409886837006,-0.0268262792378664,0.029099632054567337,0.05045941844582558,0.010791151784360409,0.02616424858570099,0.03125457093119621,-0.013795003294944763,0.040244992822408676,0.06971399486064911,-0.08716171234846115,0.0389789380133152,-0.012466520071029663,0.009698746725916862,0.06395283341407776,0.24043695628643036,-0.01638970524072647,-0.02728034183382988,0.04062063246965408,-0.016985345631837845,0.013145389035344124,-0.024175278842449188,-0.006498829927295446,0.05494659021496773,0.020828992128372192,0.06299994885921478,-0.047579076141119,0.018929963931441307,0.06346216797828674,-0.023079441860318184,0.05586616322398186,0.0061517683789134026,0.0026899222284555435,-0.02217250131070614,0.019602442160248756,-0.09541330486536026,0.00301083130761981,0.1153869703412056,-0.006943837273865938,-0.060351427644491196,-0.041160762310028076,0.031970903277397156,0.0016521798679605126,0.0034226360730826855,-0.009835615754127502,-0.08133038133382797,0.0074858576990664005,0.025633683428168297,-0.009468195028603077,-0.007696307729929686,-0.04234030470252037,-0.041713837534189224,-0.010110685601830482,0.03957059979438782,-0.0463101901113987,-0.08496274054050446,0.03962352126836777,0.049226365983486176]);

   return new;
end$$;

ALTER FUNCTION "public"."insert_system_categories"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_fulfilled"("public"."transactions") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $_$
declare
    attachment_count int;
begin
    select count(*) into attachment_count from transaction_attachments where transaction_id = $1.id;
    return attachment_count > 0 or $1.status = 'completed';
end;
$_$;

ALTER FUNCTION "public"."is_fulfilled"("public"."transactions") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."nanoid"("size" integer DEFAULT 21, "alphabet" "text" DEFAULT '_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'::"text", "additionalbytesfactor" double precision DEFAULT 1.6) RETURNS "text"
    LANGUAGE "plpgsql" PARALLEL SAFE
    AS $$
DECLARE
    alphabetArray  text[];
    alphabetLength int := 64;
    mask           int := 63;
    step           int := 34;
BEGIN
    IF size IS NULL OR size < 1 THEN
        RAISE EXCEPTION 'The size must be defined and greater than 0!';
    END IF;

    IF alphabet IS NULL OR length(alphabet) = 0 OR length(alphabet) > 255 THEN
        RAISE EXCEPTION 'The alphabet can''t be undefined, zero or bigger than 255 symbols!';
    END IF;

    IF additionalBytesFactor IS NULL OR additionalBytesFactor < 1 THEN
        RAISE EXCEPTION 'The additional bytes factor can''t be less than 1!';
    END IF;

    alphabetArray := regexp_split_to_array(alphabet, '');
    alphabetLength := array_length(alphabetArray, 1);
    mask := (2 << cast(floor(log(alphabetLength - 1) / log(2)) as int)) - 1;
    step := cast(ceil(additionalBytesFactor * mask * size / alphabetLength) AS int);

    IF step > 1024 THEN
        step := 1024; -- The step size % can''t be bigger then 1024!
    END IF;

    RETURN nanoid_optimized(size, alphabet, mask, step);
END
$$;

ALTER FUNCTION "public"."nanoid"("size" integer, "alphabet" "text", "additionalbytesfactor" double precision) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."nanoid_optimized"("size" integer, "alphabet" "text", "mask" integer, "step" integer) RETURNS "text"
    LANGUAGE "plpgsql" PARALLEL SAFE
    AS $$
DECLARE
    idBuilder      text := '';
    counter        int  := 0;
    bytes          bytea;
    alphabetIndex  int;
    alphabetArray  text[];
    alphabetLength int  := 64;
BEGIN
    alphabetArray := regexp_split_to_array(alphabet, '');
    alphabetLength := array_length(alphabetArray, 1);

    LOOP
        bytes := extensions.gen_random_bytes(step);
        FOR counter IN 0..step - 1
            LOOP
                alphabetIndex := (get_byte(bytes, counter) & mask) + 1;
                IF alphabetIndex <= alphabetLength THEN
                    idBuilder := idBuilder || alphabetArray[alphabetIndex];
                    IF length(idBuilder) = size THEN
                        RETURN idBuilder;
                    END IF;
                END IF;
            END LOOP;
    END LOOP;
END
$$;

ALTER FUNCTION "public"."nanoid_optimized"("size" integer, "alphabet" "text", "mask" integer, "step" integer) OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."tracker_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "duration" bigint,
    "project_id" "uuid",
    "start" timestamp without time zone,
    "stop" timestamp without time zone,
    "assigned_id" "uuid",
    "team_id" "uuid",
    "description" "text",
    "rate" numeric,
    "currency" "text",
    "billed" boolean DEFAULT false,
    "date" "date" DEFAULT "now"()
);

ALTER TABLE "public"."tracker_entries" OWNER TO "postgres";

COMMENT ON COLUMN "public"."tracker_entries"."duration" IS 'Time entry duration. For running entries should be negative, preferable -1';

COMMENT ON COLUMN "public"."tracker_entries"."start" IS 'Start time in UTC';

COMMENT ON COLUMN "public"."tracker_entries"."stop" IS 'Stop time in UTC, can be null if it''s still running or created with duration';

COMMENT ON COLUMN "public"."tracker_entries"."description" IS 'Time Entry description, null if not provided at creation/update';

CREATE OR REPLACE FUNCTION "public"."project_members"("public"."tracker_entries") RETURNS TABLE("id" "uuid", "avatar_url" "text", "full_name" "text")
    LANGUAGE "sql"
    AS $_$
  select distinct on (users.id) users.id, users.avatar_url, users.full_name
  from tracker_entries
  join users on tracker_entries.user_id = users.id
  where tracker_entries.project_id = $1.project_id;
$_$;

ALTER FUNCTION "public"."project_members"("public"."tracker_entries") OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."tracker_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid",
    "rate" numeric,
    "currency" "text",
    "status" "public"."trackerStatus" DEFAULT 'in_progress'::"public"."trackerStatus" NOT NULL,
    "description" "text",
    "name" "text" NOT NULL,
    "billable" boolean DEFAULT false,
    "estimate" bigint
);

ALTER TABLE "public"."tracker_projects" OWNER TO "postgres";

COMMENT ON COLUMN "public"."tracker_projects"."rate" IS 'Custom rate for project';

CREATE OR REPLACE FUNCTION "public"."project_members"("public"."tracker_projects") RETURNS TABLE("id" "uuid", "avatar_url" "text", "full_name" "text")
    LANGUAGE "sql"
    AS $$
  select distinct on (users.id) users.id, users.avatar_url, users.full_name
  from tracker_projects
  left join tracker_entries on tracker_projects.id = tracker_entries.project_id
  left join users on tracker_entries.user_id = users.id;
$$;

ALTER FUNCTION "public"."project_members"("public"."tracker_projects") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."slugify"("value" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $_$
  -- removes accents (diacritic signs) from a given string --
  with "unaccented" as (
    select unaccent("value") as "value"
  ),
  -- lowercases the string
  "lowercase" as (
    select lower("value") as "value"
    from "unaccented"
  ),
  -- remove single and double quotes
  "removed_quotes" as (
    select regexp_replace("value", '[''"]+', '', 'gi') as "value"
    from "lowercase"
  ),
  -- replaces anything that's not a letter, number, hyphen('-'), or underscore('_') with a hyphen('-')
  "hyphenated" as (
    select regexp_replace("value", '[^a-z0-9\\-_]+', '-', 'gi') as "value"
    from "removed_quotes"
  ),
  -- trims hyphens('-') if they exist on the head or tail of the string
  "trimmed" as (
    select regexp_replace(regexp_replace("value", '\-+$', ''), '^\-', '') as "value"
    from "hyphenated"
  )
  select "value" from "trimmed";
$_$;

ALTER FUNCTION "public"."slugify"("value" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."total_duration"("public"."tracker_projects") RETURNS integer
    LANGUAGE "sql"
    AS $_$
  select sum(tracker_entries.duration) as total_duration
  from
    tracker_projects
    join tracker_entries on tracker_projects.id = tracker_entries.project_id
  where
    tracker_projects.id = $1.id
  group by
    tracker_projects.id;
$_$;

ALTER FUNCTION "public"."total_duration"("public"."tracker_projects") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_enrich_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare
  enrichment_category text;
begin
  if new.category_slug is null then
    select category_slug into enrichment_category
    from transaction_enrichments te
    where te.name = new.name
    and (te.system = true or new.team_id = te.team_id)
    limit 1;
    
    new.category_slug := enrichment_category;
  end if;

  return new;
end;$$;

ALTER FUNCTION "public"."update_enrich_transaction"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_transactions_on_category_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    update transactions
    set category_slug = null
    where category_slug = old.slug
    and team_id = old.team_id;

    return old;
end;
$$;

ALTER FUNCTION "public"."update_transactions_on_category_delete"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."upsert_transaction_enrichment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$declare
    transaction_name text;
    system_value boolean;
begin
    select new.name into transaction_name;

    select system into system_value
    from transaction_categories as tc
    where tc.slug = new.category_slug and tc.team_id = new.team_id;
    
    insert into transaction_enrichments(name, category_slug, team_id, system)
    values (transaction_name, new.category_slug, new.team_id, system_value)
    on conflict (team_id, name) do update
    set category_slug = excluded.category_slug;

    return new;
end;$$;

ALTER FUNCTION "public"."upsert_transaction_enrichment"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."webhook"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    url text;
    secret text;
    payload jsonb;
    request_id bigint;
    signature text;
    path text;
BEGIN
    -- Extract the first item from TG_ARGV as path
    path = TG_ARGV[0];

    -- Get the webhook URL and secret from the vault
    SELECT decrypted_secret INTO url FROM vault.decrypted_secrets WHERE name = 'WEBHOOK_ENDPOINT' LIMIT 1;
    SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = 'WEBHOOK_SECRET' LIMIT 1;

    -- Generate the payload
    payload = jsonb_build_object(
        'old_record', old,
        'record', new,
        'type', tg_op,
        'table', tg_table_name,
        'schema', tg_table_schema
    );

    -- Generate the signature
    signature = generate_hmac(secret, payload::text);

    -- Send the webhook request
    SELECT http_post
    INTO request_id
    FROM
        net.http_post(
                url :=  url || '/' || path,
                body := payload,
                headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'X-Supabase-Signature', signature
                ),
               timeout_milliseconds := 3000
        );

    -- Insert the request ID into the Supabase hooks table
    INSERT INTO supabase_functions.hooks
        (hook_table_id, hook_name, request_id)
    VALUES (tg_relid, tg_name, request_id);

    RETURN new;
END;
$$;

ALTER FUNCTION "public"."webhook"() OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "last_accessed" timestamp with time zone,
    "name" "text",
    "currency" "text",
    "bank_connection_id" "uuid",
    "enabled" boolean DEFAULT true NOT NULL,
    "account_id" "text" NOT NULL,
    "balance" numeric DEFAULT '0'::numeric,
    "manual" boolean DEFAULT false,
    "type" "public"."account_type"
);

ALTER TABLE "public"."bank_accounts" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."bank_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "institution_id" "text" NOT NULL,
    "expires_at" timestamp with time zone,
    "team_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "access_token" "text",
    "enrollment_id" "text",
    "provider" "public"."bank_providers"
);

ALTER TABLE "public"."bank_connections" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "link_id" "text",
    "team_id" "uuid",
    "short_link" "text",
    "from" timestamp with time zone,
    "to" timestamp with time zone,
    "type" "public"."reportTypes",
    "expire_at" timestamp with time zone,
    "currency" "text",
    "created_by" "uuid"
);

ALTER TABLE "public"."reports" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "logo_url" "text",
    "inbox_id" "text" DEFAULT "public"."generate_inbox"(10),
    "email" "text",
    "inbox_email" "text",
    "inbox_forwarding" boolean DEFAULT true
);

ALTER TABLE "public"."teams" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."tracker_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "link_id" "text",
    "short_link" "text",
    "team_id" "uuid" DEFAULT "gen_random_uuid"(),
    "project_id" "uuid" DEFAULT "gen_random_uuid"(),
    "created_by" "uuid"
);

ALTER TABLE "public"."tracker_reports" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."transaction_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text",
    "transaction_id" "uuid",
    "team_id" "uuid",
    "size" bigint,
    "name" "text",
    "path" "text"[]
);

ALTER TABLE "public"."transaction_attachments" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."transaction_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "team_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "system" boolean DEFAULT false,
    "slug" "text" NOT NULL,
    "vat" numeric,
    "description" "text",
    "embedding" "extensions"."vector"(384)
);

ALTER TABLE "public"."transaction_categories" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."transaction_enrichments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "team_id" "uuid",
    "category_slug" "text",
    "system" boolean DEFAULT true
);

ALTER TABLE "public"."transaction_enrichments" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."user_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid",
    "email" "text",
    "role" "public"."teamRoles",
    "code" "text" DEFAULT "public"."nanoid"(24),
    "invited_by" "uuid"
);

ALTER TABLE "public"."user_invites" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "email" "text",
    "team_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "locale" "text" DEFAULT 'en'::"text",
    "week_starts_on_monday" boolean DEFAULT false
);

ALTER TABLE "public"."users" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."users_on_team" (
    "user_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "public"."teamRoles",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."users_on_team" OWNER TO "postgres";

ALTER TABLE ONLY "public"."transaction_attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bank_connections"
    ADD CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."inbox"
    ADD CONSTRAINT "inbox_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."inbox"
    ADD CONSTRAINT "inbox_reference_id_key" UNIQUE ("reference_id");

ALTER TABLE ONLY "public"."users_on_team"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("user_id", "team_id", "id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tracker_reports"
    ADD CONSTRAINT "project_reports_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_inbox_id_key" UNIQUE ("inbox_id");

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tracker_projects"
    ADD CONSTRAINT "tracker_projects_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tracker_entries"
    ADD CONSTRAINT "tracker_records_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."transaction_categories"
    ADD CONSTRAINT "transaction_categories_pkey" PRIMARY KEY ("team_id", "slug");

ALTER TABLE ONLY "public"."transaction_enrichments"
    ADD CONSTRAINT "transaction_enrichments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_internal_id_key" UNIQUE ("internal_id");

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."bank_connections"
    ADD CONSTRAINT "unique_bank_connections" UNIQUE ("team_id", "institution_id");

ALTER TABLE ONLY "public"."user_invites"
    ADD CONSTRAINT "unique_team_invite" UNIQUE ("email", "team_id");

ALTER TABLE ONLY "public"."transaction_enrichments"
    ADD CONSTRAINT "unique_team_name" UNIQUE ("team_id", "name");

ALTER TABLE ONLY "public"."transaction_categories"
    ADD CONSTRAINT "unique_team_slug" UNIQUE ("team_id", "slug");

ALTER TABLE ONLY "public"."user_invites"
    ADD CONSTRAINT "user_invites_code_key" UNIQUE ("code");

ALTER TABLE ONLY "public"."user_invites"
    ADD CONSTRAINT "user_invites_pkey" PRIMARY KEY ("id");

CREATE INDEX "bank_accounts_bank_connection_id_idx" ON "public"."bank_accounts" USING "btree" ("bank_connection_id");

CREATE INDEX "bank_accounts_created_by_idx" ON "public"."bank_accounts" USING "btree" ("created_by");

CREATE INDEX "bank_accounts_team_id_idx" ON "public"."bank_accounts" USING "btree" ("team_id");

CREATE INDEX "bank_connections_team_id_idx" ON "public"."bank_connections" USING "btree" ("team_id");

CREATE INDEX "inbox_attachment_id_idx" ON "public"."inbox" USING "btree" ("attachment_id");

CREATE INDEX "inbox_team_id_idx" ON "public"."inbox" USING "btree" ("team_id");

CREATE INDEX "inbox_transaction_id_idx" ON "public"."inbox" USING "btree" ("transaction_id");

CREATE INDEX "transaction_attachments_team_id_idx" ON "public"."transaction_attachments" USING "btree" ("team_id");

CREATE INDEX "transaction_attachments_transaction_id_idx" ON "public"."transaction_attachments" USING "btree" ("transaction_id");

CREATE INDEX "transactions_category_slug_idx" ON "public"."transactions" USING "btree" ("category_slug");

CREATE INDEX "transactions_team_id_date_currency_bank_account_id_category_idx" ON "public"."transactions" USING "btree" ("team_id", "date", "currency", "bank_account_id", "category");

CREATE INDEX "transactions_team_id_idx" ON "public"."transactions" USING "btree" ("team_id");

CREATE INDEX "users_on_team_team_id_idx" ON "public"."users_on_team" USING "btree" ("team_id");

CREATE OR REPLACE TRIGGER "embed_category" AFTER INSERT OR UPDATE ON "public"."transaction_categories" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://pytddvqiozwrhfbwqazp.supabase.co/functions/v1/generate-category-embedding', 'POST', '{"Content-type":"application/json"}', '{}', '5000');

CREATE OR REPLACE TRIGGER "generate_category_slug" BEFORE INSERT ON "public"."transaction_categories" FOR EACH ROW EXECUTE FUNCTION "public"."generate_slug_from_name"();

CREATE OR REPLACE TRIGGER "insert_system_categories_trigger" AFTER INSERT ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."insert_system_categories"();

CREATE OR REPLACE TRIGGER "match_transaction" AFTER INSERT ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."webhook"('webhook/inbox/match');

CREATE OR REPLACE TRIGGER "on_updated_transaction_category" AFTER UPDATE OF "category_slug" ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."upsert_transaction_enrichment"();

CREATE OR REPLACE TRIGGER "trigger_update_transactions_category" BEFORE DELETE ON "public"."transaction_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_transactions_on_category_delete"();

CREATE OR REPLACE TRIGGER "update_enrich_transaction_trigger" BEFORE INSERT ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_enrich_transaction"();

ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_bank_connection_id_fkey" FOREIGN KEY ("bank_connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."bank_connections"
    ADD CONSTRAINT "bank_connections_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."inbox"
    ADD CONSTRAINT "inbox_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "public"."transaction_attachments"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "public_bank_accounts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."inbox"
    ADD CONSTRAINT "public_inbox_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."inbox"
    ADD CONSTRAINT "public_inbox_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "public_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tracker_reports"
    ADD CONSTRAINT "public_tracker_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tracker_reports"
    ADD CONSTRAINT "public_tracker_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."tracker_projects"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."transaction_attachments"
    ADD CONSTRAINT "public_transaction_attachments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."transaction_attachments"
    ADD CONSTRAINT "public_transaction_attachments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "public_transactions_assigned_id_fkey" FOREIGN KEY ("assigned_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "public_transactions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_invites"
    ADD CONSTRAINT "public_user_invites_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."tracker_entries"
    ADD CONSTRAINT "tracker_entries_assigned_id_fkey" FOREIGN KEY ("assigned_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."tracker_entries"
    ADD CONSTRAINT "tracker_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."tracker_projects"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tracker_entries"
    ADD CONSTRAINT "tracker_entries_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tracker_projects"
    ADD CONSTRAINT "tracker_projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tracker_reports"
    ADD CONSTRAINT "tracker_reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."transaction_categories"
    ADD CONSTRAINT "transaction_categories_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."transaction_enrichments"
    ADD CONSTRAINT "transaction_enrichments_category_slug_team_id_fkey" FOREIGN KEY ("category_slug", "team_id") REFERENCES "public"."transaction_categories"("slug", "team_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."transaction_enrichments"
    ADD CONSTRAINT "transaction_enrichments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_slug_team_id_fkey" FOREIGN KEY ("category_slug", "team_id") REFERENCES "public"."transaction_categories"("slug", "team_id");

ALTER TABLE ONLY "public"."user_invites"
    ADD CONSTRAINT "user_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."users_on_team"
    ADD CONSTRAINT "users_on_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."users_on_team"
    ADD CONSTRAINT "users_on_team_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL;

CREATE POLICY "Bank Accounts can be created by a member of the team" ON "public"."bank_accounts" FOR INSERT WITH CHECK (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Bank Accounts can be deleted by a member of the team" ON "public"."bank_accounts" FOR DELETE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Bank Accounts can be selected by a member of the team" ON "public"."bank_accounts" FOR SELECT USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Bank Accounts can be updated by a member of the team" ON "public"."bank_accounts" FOR UPDATE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Bank Connections can be created by a member of the team" ON "public"."bank_connections" FOR INSERT WITH CHECK (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Bank Connections can be deleted by a member of the team" ON "public"."bank_connections" FOR DELETE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Bank Connections can be selected by a member of the team" ON "public"."bank_connections" FOR SELECT USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Bank Connections can be updated by a member of the team" ON "public"."bank_connections" FOR UPDATE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Enable insert for authenticated users only" ON "public"."teams" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."transaction_enrichments" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."users_on_team" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."users_on_team" FOR SELECT USING (true);

CREATE POLICY "Enable select for users based on email" ON "public"."user_invites" FOR SELECT USING ((("auth"."jwt"() ->> 'email'::"text") = "email"));

CREATE POLICY "Enable update for authenticated users only" ON "public"."transaction_enrichments" FOR UPDATE TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable updates for users on team" ON "public"."users_on_team" FOR UPDATE TO "authenticated" USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user"))) WITH CHECK (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Entries can be created by a member of the team" ON "public"."tracker_entries" FOR INSERT TO "authenticated" WITH CHECK (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Entries can be deleted by a member of the team" ON "public"."tracker_entries" FOR DELETE TO "authenticated" USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Entries can be selected by a member of the team" ON "public"."tracker_entries" FOR SELECT TO "authenticated" USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Entries can be updated by a member of the team" ON "public"."tracker_entries" FOR UPDATE TO "authenticated" WITH CHECK (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Inbox can be deleted by a member of the team" ON "public"."inbox" FOR DELETE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Inbox can be selected by a member of the team" ON "public"."inbox" FOR SELECT USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Inbox can be updated by a member of the team" ON "public"."inbox" FOR UPDATE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Invited users can select team if they are invited." ON "public"."teams" FOR SELECT USING (("id" IN ( SELECT "private"."get_invites_for_authenticated_user"() AS "get_invites_for_authenticated_user")));

CREATE POLICY "Projects can be created by a member of the team" ON "public"."tracker_projects" FOR INSERT TO "authenticated" WITH CHECK (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Projects can be deleted by a member of the team" ON "public"."tracker_projects" FOR DELETE TO "authenticated" USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Projects can be selected by a member of the team" ON "public"."tracker_projects" FOR SELECT TO "authenticated" USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Projects can be updated by a member of the team" ON "public"."tracker_projects" FOR UPDATE TO "authenticated" USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Reports can be created by a member of the team" ON "public"."reports" FOR INSERT WITH CHECK (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Reports can be deleted by a member of the team" ON "public"."reports" FOR DELETE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Reports can be handled by a member of the team" ON "public"."tracker_reports" USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Reports can be selected by a member of the team" ON "public"."reports" FOR SELECT USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Reports can be updated by member of team" ON "public"."reports" FOR UPDATE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Teams can be deleted by a member of the team" ON "public"."teams" FOR DELETE USING (("id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Teams can be selected by a member of the team" ON "public"."teams" FOR SELECT USING (("id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Teams can be updated by a member of the team" ON "public"."teams" FOR UPDATE USING (("id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Transaction Attachments can be created by a member of the team" ON "public"."transaction_attachments" FOR INSERT WITH CHECK (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Transaction Attachments can be deleted by a member of the team" ON "public"."transaction_attachments" FOR DELETE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Transaction Attachments can be selected by a member of the team" ON "public"."transaction_attachments" FOR SELECT USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Transaction Attachments can be updated by a member of the team" ON "public"."transaction_attachments" FOR UPDATE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Transactions can be created by a member of the team" ON "public"."transactions" FOR INSERT WITH CHECK (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Transactions can be deleted by a member of the team" ON "public"."transactions" FOR DELETE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Transactions can be selected by a member of the team" ON "public"."transactions" FOR SELECT USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Transactions can be updated by a member of the team" ON "public"."transactions" FOR UPDATE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "User Invites can be created by a member of the team" ON "public"."user_invites" FOR INSERT WITH CHECK (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "User Invites can be deleted by a member of the team" ON "public"."user_invites" FOR DELETE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "User Invites can be deleted by invited email" ON "public"."user_invites" FOR DELETE USING ((("auth"."jwt"() ->> 'email'::"text") = "email"));

CREATE POLICY "User Invites can be selected by a member of the team" ON "public"."user_invites" FOR SELECT USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "User Invites can be updated by a member of the team" ON "public"."user_invites" FOR UPDATE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Users can insert their own profile." ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));

CREATE POLICY "Users can select their own profile." ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));

CREATE POLICY "Users can select users if they are in the same team" ON "public"."users" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users_on_team"
  WHERE (("users_on_team"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("users_on_team"."team_id" = "users"."team_id")))));

CREATE POLICY "Users can update own profile." ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));

CREATE POLICY "Users on team can be deleted by a member of the team" ON "public"."users_on_team" FOR DELETE USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

CREATE POLICY "Users on team can manage categories" ON "public"."transaction_categories" USING (("team_id" IN ( SELECT "private"."get_teams_for_authenticated_user"() AS "get_teams_for_authenticated_user")));

ALTER TABLE "public"."bank_accounts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."bank_connections" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inbox" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tracker_entries" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tracker_projects" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tracker_reports" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."transaction_attachments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."transaction_categories" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."transaction_enrichments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_invites" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."users_on_team" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."inbox";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";

GRANT ALL ON FUNCTION "public"."amount_text"("public"."transactions") TO "anon";
GRANT ALL ON FUNCTION "public"."amount_text"("public"."transactions") TO "authenticated";
GRANT ALL ON FUNCTION "public"."amount_text"("public"."transactions") TO "service_role";

GRANT ALL ON FUNCTION "public"."calculated_vat"("public"."transactions") TO "anon";
GRANT ALL ON FUNCTION "public"."calculated_vat"("public"."transactions") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculated_vat"("public"."transactions") TO "service_role";

GRANT ALL ON FUNCTION "public"."create_team"("name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."create_team"("name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_team"("name" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."extract_product_names"("products_json" "json") TO "anon";
GRANT ALL ON FUNCTION "public"."extract_product_names"("products_json" "json") TO "authenticated";
GRANT ALL ON FUNCTION "public"."extract_product_names"("products_json" "json") TO "service_role";

GRANT ALL ON FUNCTION "public"."generate_hmac"("secret_key" "text", "message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_hmac"("secret_key" "text", "message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_hmac"("secret_key" "text", "message" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."generate_id"("size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_id"("size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_id"("size" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."generate_inbox"("size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_inbox"("size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_inbox"("size" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."generate_inbox_fts"("display_name" "text", "products_json" "json") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_inbox_fts"("display_name" "text", "products_json" "json") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_inbox_fts"("display_name" "text", "products_json" "json") TO "service_role";

GRANT ALL ON FUNCTION "public"."generate_inbox_fts"("display_name_text" "text", "product_names" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_inbox_fts"("display_name_text" "text", "product_names" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_inbox_fts"("display_name_text" "text", "product_names" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."generate_inbox_fts"("display_name_text" "text", "product_names" "text", "amount" numeric, "due_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_inbox_fts"("display_name_text" "text", "product_names" "text", "amount" numeric, "due_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_inbox_fts"("display_name_text" "text", "product_names" "text", "amount" numeric, "due_date" "date") TO "service_role";

GRANT ALL ON FUNCTION "public"."generate_slug_from_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug_from_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug_from_name"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_bank_account_currencies"("team_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bank_account_currencies"("team_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bank_account_currencies"("team_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_burn_rate"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_burn_rate"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_burn_rate"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_current_burn_rate"("team_id" "uuid", "currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_burn_rate"("team_id" "uuid", "currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_burn_rate"("team_id" "uuid", "currency" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_profit"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profit"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profit"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_revenue"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_revenue"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_revenue"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_runway"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_runway"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_runway"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_spending"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency_target" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_spending"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency_target" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_spending"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency_target" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_spending_v2"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency_target" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_spending_v2"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency_target" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_spending_v2"("team_id" "uuid", "date_from" "date", "date_to" "date", "currency_target" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_total_balance"("team_id" "uuid", "currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_balance"("team_id" "uuid", "currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_balance"("team_id" "uuid", "currency" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON TABLE "public"."inbox" TO "anon";
GRANT ALL ON TABLE "public"."inbox" TO "authenticated";
GRANT ALL ON TABLE "public"."inbox" TO "service_role";

GRANT ALL ON FUNCTION "public"."inbox_amount_text"("public"."inbox") TO "anon";
GRANT ALL ON FUNCTION "public"."inbox_amount_text"("public"."inbox") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inbox_amount_text"("public"."inbox") TO "service_role";

GRANT ALL ON FUNCTION "public"."insert_system_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_system_categories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_system_categories"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_fulfilled"("public"."transactions") TO "anon";
GRANT ALL ON FUNCTION "public"."is_fulfilled"("public"."transactions") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_fulfilled"("public"."transactions") TO "service_role";

GRANT ALL ON FUNCTION "public"."nanoid"("size" integer, "alphabet" "text", "additionalbytesfactor" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."nanoid"("size" integer, "alphabet" "text", "additionalbytesfactor" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."nanoid"("size" integer, "alphabet" "text", "additionalbytesfactor" double precision) TO "service_role";

GRANT ALL ON FUNCTION "public"."nanoid_optimized"("size" integer, "alphabet" "text", "mask" integer, "step" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."nanoid_optimized"("size" integer, "alphabet" "text", "mask" integer, "step" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."nanoid_optimized"("size" integer, "alphabet" "text", "mask" integer, "step" integer) TO "service_role";

GRANT ALL ON TABLE "public"."tracker_entries" TO "anon";
GRANT ALL ON TABLE "public"."tracker_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."tracker_entries" TO "service_role";

GRANT ALL ON FUNCTION "public"."project_members"("public"."tracker_entries") TO "anon";
GRANT ALL ON FUNCTION "public"."project_members"("public"."tracker_entries") TO "authenticated";
GRANT ALL ON FUNCTION "public"."project_members"("public"."tracker_entries") TO "service_role";

GRANT ALL ON TABLE "public"."tracker_projects" TO "anon";
GRANT ALL ON TABLE "public"."tracker_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."tracker_projects" TO "service_role";

GRANT ALL ON FUNCTION "public"."project_members"("public"."tracker_projects") TO "anon";
GRANT ALL ON FUNCTION "public"."project_members"("public"."tracker_projects") TO "authenticated";
GRANT ALL ON FUNCTION "public"."project_members"("public"."tracker_projects") TO "service_role";

GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";

GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";

GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";

GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."slugify"("value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."slugify"("value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."slugify"("value" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."total_duration"("public"."tracker_projects") TO "anon";
GRANT ALL ON FUNCTION "public"."total_duration"("public"."tracker_projects") TO "authenticated";
GRANT ALL ON FUNCTION "public"."total_duration"("public"."tracker_projects") TO "service_role";

GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "service_role";

GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."update_enrich_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_enrich_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_enrich_transaction"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_transactions_on_category_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_transactions_on_category_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transactions_on_category_delete"() TO "service_role";

GRANT ALL ON FUNCTION "public"."upsert_transaction_enrichment"() TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_transaction_enrichment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_transaction_enrichment"() TO "service_role";

GRANT ALL ON FUNCTION "public"."webhook"() TO "anon";
GRANT ALL ON FUNCTION "public"."webhook"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."webhook"() TO "service_role";

GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";

GRANT ALL ON TABLE "public"."bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_accounts" TO "service_role";

GRANT ALL ON TABLE "public"."bank_connections" TO "anon";
GRANT ALL ON TABLE "public"."bank_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_connections" TO "service_role";

GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";

GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";

GRANT ALL ON TABLE "public"."tracker_reports" TO "anon";
GRANT ALL ON TABLE "public"."tracker_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."tracker_reports" TO "service_role";

GRANT ALL ON TABLE "public"."transaction_attachments" TO "anon";
GRANT ALL ON TABLE "public"."transaction_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_attachments" TO "service_role";

GRANT ALL ON TABLE "public"."transaction_categories" TO "anon";
GRANT ALL ON TABLE "public"."transaction_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_categories" TO "service_role";

GRANT ALL ON TABLE "public"."transaction_enrichments" TO "anon";
GRANT ALL ON TABLE "public"."transaction_enrichments" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_enrichments" TO "service_role";

GRANT ALL ON TABLE "public"."user_invites" TO "anon";
GRANT ALL ON TABLE "public"."user_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."user_invites" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";

GRANT ALL ON TABLE "public"."users_on_team" TO "anon";
GRANT ALL ON TABLE "public"."users_on_team" TO "authenticated";
GRANT ALL ON TABLE "public"."users_on_team" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
