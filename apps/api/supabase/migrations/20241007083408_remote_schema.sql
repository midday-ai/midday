drop policy "Entries can be updated by a member of the team" on "public"."tracker_entries";

create table "public"."apps" (
    "id" uuid not null default gen_random_uuid(),
    "team_id" uuid default gen_random_uuid(),
    "config" jsonb,
    "created_at" timestamp with time zone default now(),
    "app_id" text not null,
    "created_by" uuid default gen_random_uuid(),
    "settings" jsonb
);


alter table "public"."apps" enable row level security;

alter table "public"."tracker_entries" alter column "start" set data type timestamp with time zone using "start"::timestamp with time zone;

alter table "public"."tracker_entries" alter column "stop" set data type timestamp with time zone using "stop"::timestamp with time zone;

alter table "public"."users" add column "time_format" numeric default '24'::numeric;

CREATE UNIQUE INDEX integrations_pkey ON public.apps USING btree (id);

CREATE UNIQUE INDEX unique_app_id_team_id ON public.apps USING btree (app_id, team_id);

alter table "public"."apps" add constraint "integrations_pkey" PRIMARY KEY using index "integrations_pkey";

alter table "public"."apps" add constraint "apps_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."apps" validate constraint "apps_created_by_fkey";

alter table "public"."apps" add constraint "integrations_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE not valid;

alter table "public"."apps" validate constraint "integrations_team_id_fkey";

alter table "public"."apps" add constraint "unique_app_id_team_id" UNIQUE using index "unique_app_id_team_id";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_assigned_users_for_project(tracker_projects)
 RETURNS json
 LANGUAGE sql
AS $function$
  SELECT COALESCE(
    (SELECT json_agg(
      json_build_object(
        'user_id', u.id,
        'full_name', u.full_name,
        'avatar_url', u.avatar_url
      )
    )
    FROM (
      SELECT DISTINCT u.id, u.full_name, u.avatar_url
      FROM public.users u
      JOIN public.tracker_entries te ON u.id = te.assigned_id
      WHERE te.project_id = $1.id
    ) u
  ), '[]'::json);
$function$
;

CREATE OR REPLACE FUNCTION public.get_project_total_amount(tracker_projects)
 RETURNS numeric
 LANGUAGE sql
AS $function$
  SELECT COALESCE(
    (SELECT 
      CASE 
        WHEN $1.rate IS NOT NULL THEN 
          ROUND(SUM(te.duration) * $1.rate / 3600, 2)
        ELSE 
          0
      END
    FROM public.tracker_entries te
    WHERE te.project_id = $1.id
    ), 0
  );
$function$
;

CREATE OR REPLACE FUNCTION public.get_runway_v4(team_id text, date_from date, date_to date, base_currency text DEFAULT NULL::text)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
    target_currency text;
    total_balance numeric;
    avg_burn_rate numeric;
    number_of_months numeric;
begin
    if get_runway_v4.base_currency is not null then
        target_currency := get_runway_v4.base_currency;
    else
        select teams.base_currency into target_currency
        from teams
        where teams.id = get_runway_v4.team_id;
    end if;

    select * from get_total_balance_v3(team_id, target_currency) into total_balance;
    
    select (extract(year FROM date_to) - extract(year FROM date_from)) * 12 +
           extract(month FROM date_to) - extract(month FROM date_from) 
    into number_of_months;
    
    select round(avg(value)) 
    from get_burn_rate_v3(team_id, date_from, date_to, target_currency) 
    into avg_burn_rate;

    if avg_burn_rate = 0 then
        return null;
    else
        return round(total_balance / avg_burn_rate);
    end if;
end;

$function$
;

CREATE OR REPLACE FUNCTION public.calculate_bank_account_base_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
    team_base_currency text;
    exchange_rate numeric;
begin
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

            if exchange_rate is null then
                raise exception 'Exchange rate not found for % to %', new.currency, team_base_currency;
            end if;

            new.base_balance := round(new.balance * exchange_rate, 2);
            new.base_currency := team_base_currency;
        end if;

        return new;
    exception
        when others then
            -- Log the error
            raise log 'Error in calculate_bank_account_base_balance: %', sqlerrm;
            -- Set default values in case of error
            new.base_balance := new.balance;
            new.base_currency := new.currency;
            return new;
    end;
end;$function$
;

CREATE OR REPLACE FUNCTION public.calculate_inbox_base_amount()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
    team_base_currency text;
    exchange_rate numeric;
begin
    begin
        select base_currency into team_base_currency
        from teams
        where id = new.team_id;

        -- if the inbox item currency is the same as the team's base currency or the team's base currency is null
        if new.currency = team_base_currency or team_base_currency is null then
            new.base_amount := new.amount;
            new.base_currency := new.currency;
        else
            begin
                select rate into exchange_rate
                from exchange_rates
                where base = new.currency
                and target = team_base_currency
                limit 1;

                if exchange_rate is null then
                    raise exception 'Exchange rate not found for % to %', new.currency, team_base_currency;
                end if;

                new.base_amount := round(new.amount * exchange_rate, 2);
                new.base_currency := team_base_currency;
            exception
                when others then
                    raise log 'Error calculating exchange rate: %', sqlerrm;
                    -- Set default values in case of error
                    new.base_amount := new.amount;
                    new.base_currency := new.currency;
            end;
        end if;
    exception
        when others then
            raise log 'Error in calculate_inbox_base_amount: %', sqlerrm;
            -- Set default values in case of error
            new.base_amount := new.amount;
            new.base_currency := new.currency;
    end;

    return new;
end;$function$
;

CREATE OR REPLACE FUNCTION public.calculate_transaction_base_amount()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
    team_base_currency text;
    exchange_rate numeric;
begin
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

            if exchange_rate is null then
                raise exception 'Exchange rate not found for % to %', new.currency, team_base_currency;
            end if;

            new.base_balance := round(new.balance * exchange_rate, 2);
            new.base_currency := team_base_currency;
        end if;

        return new;
    exception
        when others then
            -- Log the error
            raise notice 'Error in calculate_bank_account_base_balance: %', sqlerrm;
            -- Return the original record without modification
            return new;
    end;
end;$function$
;

CREATE OR REPLACE FUNCTION public.detect_recurring_transactions()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
    last_transaction record;
    days_diff numeric;
    frequency_type transaction_frequency;
    search_query text;
begin
    -- Wrap the entire function in a try-catch block
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

    exception
        when others then
            -- Log the error
            raise notice 'An error occurred: %', sqlerrm;
            
            -- Ensure we still return NEW even if an error occurs
            RETURN NEW;
    end;

    RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.update_enrich_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$begin
  if new.category_slug is null then
    -- Find matching category_slug from transaction_enrichments and transaction_categories in one query
    begin
      new.category_slug := (
        select te.category_slug
        from transaction_enrichments te
        join transaction_categories tc on tc.slug = te.category_slug and tc.team_id = new.team_id
        where te.name = new.name
          and (te.system = true or te.team_id = new.team_id)
          and te.category_slug != 'income'
        limit 1
      );
    exception
      when others then
        new.category_slug := null; -- or set to a default value
    end;
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
    exception
        when others then
            -- Log the error
            raise notice 'Error in upsert_transaction_enrichment: %', sqlerrm;
            
            -- Return the original NEW record without modifications
            return new;
    end;
end;$function$
;

grant delete on table "public"."apps" to "anon";

grant insert on table "public"."apps" to "anon";

grant references on table "public"."apps" to "anon";

grant select on table "public"."apps" to "anon";

grant trigger on table "public"."apps" to "anon";

grant truncate on table "public"."apps" to "anon";

grant update on table "public"."apps" to "anon";

grant delete on table "public"."apps" to "authenticated";

grant insert on table "public"."apps" to "authenticated";

grant references on table "public"."apps" to "authenticated";

grant select on table "public"."apps" to "authenticated";

grant trigger on table "public"."apps" to "authenticated";

grant truncate on table "public"."apps" to "authenticated";

grant update on table "public"."apps" to "authenticated";

grant delete on table "public"."apps" to "service_role";

grant insert on table "public"."apps" to "service_role";

grant references on table "public"."apps" to "service_role";

grant select on table "public"."apps" to "service_role";

grant trigger on table "public"."apps" to "service_role";

grant truncate on table "public"."apps" to "service_role";

grant update on table "public"."apps" to "service_role";

create policy "Apps can be deleted by a member of the team"
on "public"."apps"
as permissive
for delete
to public
using ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));


create policy "Apps can be inserted by a member of the team"
on "public"."apps"
as permissive
for insert
to public
with check ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));


create policy "Apps can be selected by a member of the team"
on "public"."apps"
as permissive
for select
to public
using ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));


create policy "Apps can be updated by a member of the team"
on "public"."apps"
as permissive
for update
to public
using ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));


create policy "Entries can be updated by a member of the team"
on "public"."tracker_entries"
as permissive
for update
to authenticated
using ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)))
with check ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));



