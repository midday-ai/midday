drop trigger if exists "match_transaction" on "public"."transactions";

drop policy "Enable select for authenticated users only" on "public"."teams";

drop policy "Enable select for authenticated users only" on "public"."transaction_enrichments";

drop policy "Users can read members belonging to the same team" on "public"."users";

drop policy "Enable select for authenticated users only" on "public"."users_on_team";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_team(name character varying)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    new_team_id uuid;
begin
    insert into teams (name) values (name) returning id into new_team_id;
    insert into users_on_team (user_id, team_id, role) values (auth.uid(), new_team_id, 'owner');

    return new_team_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_hmac(secret_key text, message text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    hmac_result bytea;
BEGIN
    hmac_result := extensions.hmac(message::bytea, secret_key::bytea, 'sha256');
    RETURN encode(hmac_result, 'base64');
END;
$function$
;

create policy "Users can select users if they are in the same team"
on "public"."users"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM users_on_team
  WHERE ((users_on_team.user_id = ( SELECT auth.uid() AS uid)) AND (users_on_team.team_id = users.team_id)))));


create policy "Enable read access for all users"
on "public"."users_on_team"
as permissive
for select
to public
using (true);


CREATE TRIGGER embed_category AFTER INSERT OR UPDATE ON public.transaction_categories FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://pytddvqiozwrhfbwqazp.supabase.co/functions/v1/generate-category-embedding', 'POST', '{"Content-type":"application/json"}', '{}', '5000');

CREATE TRIGGER match_transaction AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION webhook('webhook/inbox/match');


