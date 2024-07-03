drop trigger if exists "update_enrich_transaction_trigger" on "public"."transactions";

drop function if exists "public"."get_spending_v2"(team_id uuid, date_from date, date_to date, currency_target text);

create table "public"."total_amount" (
    "sum" numeric
);


CREATE INDEX reports_team_id_idx ON public.reports USING btree (team_id);

CREATE INDEX tracker_entries_team_id_idx ON public.tracker_entries USING btree (team_id);

CREATE INDEX tracker_projects_team_id_idx ON public.tracker_projects USING btree (team_id);

CREATE INDEX tracker_reports_team_id_idx ON public.tracker_reports USING btree (team_id);

CREATE INDEX transaction_categories_team_id_idx ON public.transaction_categories USING btree (team_id);

CREATE INDEX transaction_enrichments_category_slug_team_id_idx ON public.transaction_enrichments USING btree (category_slug, team_id);

CREATE INDEX transactions_assigned_id_idx ON public.transactions USING btree (assigned_id);

CREATE INDEX transactions_bank_account_id_idx ON public.transactions USING btree (bank_account_id);

CREATE INDEX user_invites_team_id_idx ON public.user_invites USING btree (team_id);

CREATE INDEX users_on_team_user_id_idx ON public.users_on_team USING btree (user_id);

CREATE INDEX users_team_id_idx ON public.users USING btree (team_id);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_spending(team_id uuid, date_from date, date_to date, currency_target text)
 RETURNS TABLE(name text, slug text, amount numeric, currency text, color text, percentage numeric)
 LANGUAGE plpgsql
AS $function$declare
    total_amount numeric;
begin
    select sum(t.amount) into total_amount
    from transactions as t
    where t.team_id = get_spending.team_id
        and t.category_slug != 'transfer'
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
end;$function$
;

grant delete on table "public"."total_amount" to "anon";

grant insert on table "public"."total_amount" to "anon";

grant references on table "public"."total_amount" to "anon";

grant select on table "public"."total_amount" to "anon";

grant trigger on table "public"."total_amount" to "anon";

grant truncate on table "public"."total_amount" to "anon";

grant update on table "public"."total_amount" to "anon";

grant delete on table "public"."total_amount" to "authenticated";

grant insert on table "public"."total_amount" to "authenticated";

grant references on table "public"."total_amount" to "authenticated";

grant select on table "public"."total_amount" to "authenticated";

grant trigger on table "public"."total_amount" to "authenticated";

grant truncate on table "public"."total_amount" to "authenticated";

grant update on table "public"."total_amount" to "authenticated";

grant delete on table "public"."total_amount" to "service_role";

grant insert on table "public"."total_amount" to "service_role";

grant references on table "public"."total_amount" to "service_role";

grant select on table "public"."total_amount" to "service_role";

grant trigger on table "public"."total_amount" to "service_role";

grant truncate on table "public"."total_amount" to "service_role";

grant update on table "public"."total_amount" to "service_role";

CREATE TRIGGER enrich_transaction AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_enrich_transaction();


