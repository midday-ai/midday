drop policy "Enable select for authenticated users only" on "public"."teams";

drop policy "Enable select for authenticated users only" on "public"."transaction_enrichments";

drop policy "Users can read members belonging to the same team" on "public"."users";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_team(name character varying)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
    new_team_id uuid;
begin
    insert into teams (name) values (name) returning id into new_team_id;
    insert into users_on_team (user_id, team_id) values (auth.uid(), new_team_id);

    return new_team_id;
end;
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



